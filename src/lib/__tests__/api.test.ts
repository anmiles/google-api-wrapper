import type GoogleApis from 'googleapis';
import type { calendar_v3 } from 'googleapis/build/src/apis/calendar';
import { calendar } from 'googleapis/build/src/apis/calendar';
import logger from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import auth from '../auth';
import secrets from '../secrets';
import type { CommonResponse } from '../api';
import api from '../api';

const items: Array<{ data : string }> = [
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

const getAPI = <T>(items: Array<Array<T> | null>, pageTokens: Array<string | undefined>): {
	list   : jest.Mock;
	update : jest.Mock;
} => ({
	list : jest.fn().mockImplementation(({ pageToken }: { pageToken? : string }): Pick<GoogleApis.Common.GaxiosResponse<CommonResponse<unknown>>, 'data'> => {
		const listException = getListException();

		if (listException) {
			throw listException;
		}

		const index = pageTokens.indexOf(pageToken);

		return {
			data : {
				items         : items[index]!,
				nextPageToken : pageTokens[index + 1],
				pageInfo      : {
					totalResults : !items[index]
						? null
						: items.reduce((sum, list) => sum + (list?.length ?? 0), 0),
				},
			},
		};
	}),
	update : jest.fn(),
});

const params = { key : 'value' };

const profile = 'username1';
const apis    = {
	calendarList : getAPI(response, pageTokens),
};

const googleAuth = 'googleAuth';

const scopes = [ 'scope1', 'scope2' ];

const getListException = jest.fn() as jest.Mock<Error | undefined>;

beforeEach(() => {
	getListException.mockReturnValue(undefined);
});

jest.mock<{ calendar : typeof calendar }>('googleapis/build/src/apis/calendar', () => ({
	calendar : jest.fn().mockImplementation(() => apis),
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
			await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile);

			expect(auth.getAuth).toHaveBeenCalledWith(profile, undefined);
		});

		it('should pass temporariness and scopes', async () => {
			await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile, { scopes, temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith(profile, { scopes, temporary : true });
		});

		it('should warn when creating permanent credentials using non-readonly scopes', async () => {
			await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile, { scopes });

			expect(logger.warn).toHaveBeenCalledWith('WARNING: trying to create permanent credentials using non-readonly scopes (scope1, scope2). Permanent credentials will be stored in the file and potentially might be re-used to modify your data');
		});

		it('should not warn when creating temporary credentials using non-readonly scopes', async () => {
			await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile, { scopes, temporary : true });

			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('should not warn when creating permanent credentials using readonly scopes only', async () => {
			await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile, { scopes : [ 'scope1.readonly', 'scope2.readonly' ], temporary : true });

			expect(logger.warn).not.toHaveBeenCalled();
		});
	});

	describe('API', () => {
		let instance: InstanceType<typeof api.API<calendar_v3.Calendar>>;

		beforeEach(async () => {
			instance = await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile);
		});

		describe('getItems', () => {
			it('should call API list method for each page', async () => {
				await instance.getItems((api) => api.calendarList, params);

				pageTokens.forEach((pageToken) => {
					expect(apis.calendarList.list).toHaveBeenCalledWith({ ...params, pageToken });
				});
			});

			it('should output progress by default', async () => {
				await instance.getItems((api) => api.calendarList, params);

				expect(logger.log).toHaveBeenCalledTimes(response.length);
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of 4)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of many)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (4 of 4)...');
			});

			it('should not output progress if hidden', async () => {
				await instance.getItems((api) => api.calendarList, params, { hideProgress : true });

				expect(logger.log).not.toHaveBeenCalled();
			});

			it('should sleep after reach request', async () => {
				await instance.getItems((api) => api.calendarList, params);

				expect(sleep).toHaveBeenCalledTimes(response.length);
				expect(sleep).toHaveBeenCalledWith(300);
			});

			it('should be initialized and called once if no API error', async () => {
				const getAuthSpy  = jest.spyOn(auth, 'getAuth');
				const getItemsSpy = jest.spyOn(instance, 'getItems');

				await instance.getItems((api) => api.calendarList, params);

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

					await instance.getItems((api) => api.calendarList, params);

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

					const instance = await api.getAPI((auth) => calendar({ version : 'v3', auth }), profile, { temporary : true });
					await expect(instance.getItems((api) => api.calendarList, params)).rejects.toEqual(error);
				}
			});

			it('should re-throw API exception if not invalid_grant or Invalid credentials', async () => {
				const error = new Error('random exception');
				getListException.mockReturnValueOnce(error);
				await expect(instance.getItems((api) => api.calendarList, params)).rejects.toEqual(error);
			});

			it('should return items data', async () => {
				const returnedItems = await instance.getItems((api) => api.calendarList, params);

				expect(returnedItems).toEqual(items);
			});

			it('should throw if api was not initialized before getting items', async () => {
				instance = new api.API((auth) => calendar({ version : 'v3', auth }), profile);

				await expect(async () => instance.getItems((api) => api.calendarList, params)).rejects.toEqual(new Error('API is not initialized. Call `init` before getting items.'));
			});
		});
	});
});
