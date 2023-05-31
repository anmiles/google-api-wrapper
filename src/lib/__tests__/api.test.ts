import { google } from 'googleapis';
import logger from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import auth from '../auth';
import secrets from '../secrets';
import api from '../api';

const items: Array<{ data: string}> = [
	{ data : 'first' },
	{ data : 'second' },
	{ data : 'third' },
	{ data : 'forth' },
];

const response = [
	[ items[0], items[1] ],
	null,
	[ items[2], items[3] ],
];

const pageTokens = [
	undefined,
	'token1',
	'token2',
];

const getAPI = <T>(items: Array<Array<T> | null>, pageTokens: Array<string | undefined>) => ({
	list : jest.fn().mockImplementation(async ({ pageToken }: {pageToken?: string}) => {
		const listException = getListException();

		if (listException) {
			throw listException;
		}

		const index = pageTokens.indexOf(pageToken);

		return {
			data : {
				items         : items[index],
				nextPageToken : pageTokens[index + 1],
				pageInfo      : !items[index] ? null : {
					totalResults : items.reduce((sum, list) => sum + (list?.length || 0), 0),
				},
			},
		};
	}),
	update : jest.fn(),
});

const args = { key : 'value' };

const profile     = 'username1';
const calendarApi = {
	calendarList : getAPI(response, pageTokens),
};

const googleAuth = {
	revokeCredentials : jest.fn(),
};

const scopes = [ 'scope1', 'scope2' ];

const getListException: jest.Mock<Error | undefined> = jest.fn();

beforeEach(() => {
	getListException.mockReturnValue(undefined);
});

jest.mock('googleapis', () => ({
	google : {
		calendar : jest.fn().mockImplementation(() => calendarApi),
	},
}));

jest.mock<Partial<typeof auth>>('../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

jest.mock<Partial<typeof secrets>>('../secrets', () => ({
	deleteCredentials : jest.fn(),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log : jest.fn(),
}));

jest.mock<Partial<typeof sleep>>('@anmiles/sleep', () => jest.fn());

describe('src/lib/api', () => {
	describe('getApi', () => {
		it('should call getAuth', async () => {
			await api.getApi('calendar', profile);

			expect(auth.getAuth).toHaveBeenCalledWith(profile, undefined);
		});

		it('should pass temporariness and scopes', async () => {
			await api.getApi('calendar', profile, { scopes, temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith(profile, { scopes, temporary : true });
		});

		it('should get google api', async () => {
			await api.getApi('calendar', profile);

			expect(google.calendar).toHaveBeenCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return instance wrapper for google api', async () => {
			const instance = await api.getApi('calendar', profile, { scopes, temporary : true });

			expect(instance).toEqual({ apiName : 'calendar', profile, authOptions : { scopes, temporary : true }, api : calendarApi, auth : googleAuth });
		});
	});

	describe('Api', () => {
		let instance: InstanceType<typeof api.Api<'calendar'>>;

		beforeEach(async () => {
			instance = await api.getApi('calendar', profile);
		});

		describe('constructor', () => {
			it('should return instance', async () => {
				const instance = new api.Api('calendar', profile, { scopes, temporary : true });

				expect(instance).toEqual({ apiName : 'calendar', profile, authOptions : { scopes, temporary : true } });
			});
		});

		describe('getItems', () => {
			it('should call API list method for each page', async () => {
				await instance.getItems((api) => api.calendarList, args);

				pageTokens.forEach((pageToken) => {
					expect(calendarApi.calendarList.list).toHaveBeenCalledWith({ ...args, pageToken });
				});
			});

			it('should output progress by default', async () => {
				await instance.getItems((api) => api.calendarList, args);

				expect(logger.log).toHaveBeenCalledTimes(response.length);
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of 4)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of many)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (4 of 4)...');
			});

			it('should not output progress if hidden', async () => {
				await instance.getItems((api) => api.calendarList, args, { hideProgress : true });

				expect(logger.log).not.toHaveBeenCalled();
			});

			it('should sleep after reach request', async () => {
				await instance.getItems((api) => api.calendarList, args);

				expect(sleep).toHaveBeenCalledTimes(response.length);
				expect(sleep).toHaveBeenCalledWith(300);
			});

			it('should be initialized and called once if no API error', async () => {
				const getItemsSpy = jest.spyOn(instance, 'getItems');
				await instance.getItems((api) => api.calendarList, args);
				expect(auth.getAuth).toHaveBeenCalledTimes(1);
				expect(getItemsSpy).toHaveBeenCalledTimes(1);
			});

			it('should delete credentials, re-initialize api and retry while API exception is invalid_grant', async () => {
				const error = new Error('invalid_grant');
				// fail twice
				getListException.mockReturnValueOnce(error).mockReturnValueOnce(error);

				const getItemsSpy = jest.spyOn(instance, 'getItems');
				await instance.getItems((api) => api.calendarList, args);
				expect(secrets.deleteCredentials).toHaveBeenCalledWith(profile);
				expect(auth.getAuth).toHaveBeenCalledTimes(3);
				expect(getItemsSpy).toHaveBeenCalledTimes(3);
			});

			it('should re-throw API exception if not invalid_grant', async () => {
				const error = new Error('random exception');
				getListException.mockReturnValueOnce(error);
				await expect(instance.getItems((api) => api.calendarList, args)).rejects.toEqual(error);
			});

			it('should return items data', async () => {
				const items = await instance.getItems((api) => api.calendarList, args);

				expect(items).toEqual(items);
			});
		});

		describe('revoke', () => {
			it('should delete credentials file for current profile', async () => {
				await instance.revoke();
				expect(secrets.deleteCredentials).toHaveBeenCalledWith(profile);
			});

			it('should revoke credentials in google API', async () => {
				await instance.revoke();
				expect(googleAuth.revokeCredentials).toHaveBeenCalledWith();
			});
		});
	});
});
