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
const calendarAPI = {
	calendarList : getAPI(response, pageTokens),
};

const googleAuth = 'googleAuth';

const scopes = [ 'scope1', 'scope2' ];

const getListException: jest.Mock<Error | undefined> = jest.fn();

beforeEach(() => {
	getListException.mockReturnValue(undefined);
});

jest.mock('googleapis', () => ({
	google : {
		calendar : jest.fn().mockImplementation(() => calendarAPI),
	},
}));

jest.mock<Partial<typeof auth>>('../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

jest.mock<Partial<typeof secrets>>('../secrets', () => ({
	deleteCredentials : jest.fn(),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log  : jest.fn(),
	warn : jest.fn(),
}));

jest.mock<Partial<typeof sleep>>('@anmiles/sleep', () => jest.fn());

describe('src/lib/api', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await api.getAPI('calendar', profile);

			expect(auth.getAuth).toHaveBeenCalledWith(profile, undefined);
		});

		it('should pass temporariness and scopes', async () => {
			await api.getAPI('calendar', profile, { scopes, temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith(profile, { scopes, temporary : true });
		});

		it('should get google api', async () => {
			await api.getAPI('calendar', profile);

			expect(google.calendar).toHaveBeenCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return instance wrapper for google api', async () => {
			const instance = await api.getAPI('calendar', profile, { scopes, temporary : true });

			expect(instance).toEqual({ apiName : 'calendar', profile, authOptions : { scopes, temporary : true }, api : calendarAPI });
		});

		it('should warn when creating permanent credentials using non-readonly scopes', async () => {
			await api.getAPI('calendar', profile, { scopes });

			expect(logger.warn).toHaveBeenCalledWith('WARNING: trying to create permanent credentials using non-readonly scopes (scope1,scope2). Permanent credentials will be stored in the file and potentially might be re-used to modify your data');
		});

		it('should not warn when creating temporary credentials using non-readonly scopes', async () => {
			await api.getAPI('calendar', profile, { scopes, temporary : true });

			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('should not warn when creating permanent credentials using readonly scopes only', async () => {
			await api.getAPI('calendar', profile, { scopes : [ 'scope1.readonly', 'scope2.readonly' ], temporary : true });

			expect(logger.warn).not.toHaveBeenCalled();
		});
	});

	describe('API', () => {
		let instance: InstanceType<typeof api.API<'calendar'>>;

		beforeEach(async () => {
			instance = await api.getAPI('calendar', profile);
		});

		describe('constructor', () => {
			it('should return instance', async () => {
				const instance = new api.API('calendar', profile, { scopes, temporary : true });

				expect(instance).toEqual({ apiName : 'calendar', profile, authOptions : { scopes, temporary : true } });
			});
		});

		describe('getItems', () => {
			it('should call API list method for each page', async () => {
				await instance.getItems((api) => api.calendarList, args);

				pageTokens.forEach((pageToken) => {
					expect(calendarAPI.calendarList.list).toHaveBeenCalledWith({ ...args, pageToken });
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
				const getAuthSpy  = jest.spyOn(auth, 'getAuth');
				const getItemsSpy = jest.spyOn(instance, 'getItems');

				await instance.getItems((api) => api.calendarList, args);

				expect(getAuthSpy).toHaveBeenCalledTimes(1);
				expect(getItemsSpy).toHaveBeenCalledTimes(1);
			});

			it('should delete credentials, re-initialize api and retry if API exception is invalid_grant or Invalid credentials', async () => {
				for (const message of [ 'invalid_grant', 'Invalid credentials' ]) {
					const error = new Error(message);
					// fail twice
					getListException.mockReturnValueOnce(error).mockReturnValueOnce(error);

					const getAuthSpy  = jest.spyOn(auth, 'getAuth');
					const getItemsSpy = jest.spyOn(instance, 'getItems');
					getAuthSpy.mockClear();
					getItemsSpy.mockClear();

					await instance.getItems((api) => api.calendarList, args);

					expect(logger.warn).toHaveBeenCalledWith('Access token stored is invalid, re-creating...');
					expect(secrets.deleteCredentials).toHaveBeenCalledWith(profile);
					expect(getAuthSpy).toHaveBeenCalledTimes(2);
					expect(getItemsSpy).toHaveBeenCalledTimes(3);
				}
			});

			it('should re-throw if credentials are just created but API exception is invalid_grant or Invalid credentials', async () => {
				for (const message of [ 'invalid_grant', 'Invalid credentials' ]) {
					const error = new Error(message);
					// fail twice
					getListException.mockReturnValueOnce(error);

					const instance = await api.getAPI('calendar', profile, { temporary : true });
					await expect(instance.getItems((api) => api.calendarList, args)).rejects.toEqual(error);
				}
			});

			it('should re-throw API exception if not invalid_grant or Invalid credentials', async () => {
				const error = new Error('random exception');
				getListException.mockReturnValueOnce(error);
				await expect(instance.getItems((api) => api.calendarList, args)).rejects.toEqual(error);
			});

			it('should return items data', async () => {
				const items = await instance.getItems((api) => api.calendarList, args);

				expect(items).toEqual(items);
			});

			it('should throw if api was not initialized before getting items', async () => {
				instance = new api.API('calendar', profile);

				await expect(() => instance.getItems((api) => api.calendarList, args)).rejects.toEqual('API is not initialized. Call `init` before getting items.');
			});
		});
	});
});
