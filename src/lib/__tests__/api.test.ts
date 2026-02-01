import logger from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import type GoogleApis from 'googleapis';
import { calendar } from 'googleapis/build/src/apis/calendar';

import { getAPI } from '../api';
import type { API, CommonResponse } from '../api';
import { getAuth } from '../auth';
import { deleteCredentials } from '../credentials';

jest.mock('@anmiles/logger');
jest.mock('@anmiles/sleep');
jest.mock('googleapis/build/src/apis/calendar');

jest.mock('../auth');
jest.mock('../credentials');

const items: Array<{ data: string }> = [
	{ data: 'first' },
	{ data: 'second' },
	{ data: 'third' },
	{ data: 'forth' },
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

const getCalendarAPI = <T>(items: Array<Array<T> | null>, pageTokens: Array<string | undefined>): {
	list: jest.Mock;
	update: jest.Mock;
} => ({
	list: jest.fn().mockImplementation(({ pageToken }: { pageToken?: string }): Pick<GoogleApis.Common.GaxiosResponse<CommonResponse<unknown>>, 'data'> => {
		const listException = getListException();

		if (listException) {
			throw listException;
		}

		const index = pageTokens.indexOf(pageToken);

		return {
			data: {
				items        : items[index]!,
				nextPageToken: pageTokens[index + 1],
				pageInfo     : {
					totalResults: !items[index]
						? null
						: items.reduce((sum, list) => sum + (list?.length ?? 0), 0),
				},
			},
		};
	}),
	update: jest.fn(),
});

const params = { key: 'value' };

const profile      = 'username1';
const calendarList = getCalendarAPI(response, pageTokens);
const calendarApis = {
	calendarList,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const googleAuth = {} as GoogleApis.Common.OAuth2Client;

const scopes = [ 'scope1', 'scope2' ];

const getListException = jest.mocked(jest.fn());

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
jest.mocked(calendar).mockReturnValue(calendarApis as unknown as GoogleApis.calendar_v3.Calendar);
jest.mocked(getAuth).mockResolvedValue(googleAuth);

beforeEach(() => {
	getListException.mockReturnValue(undefined);
});

describe('src/lib/api', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await getAPI((auth) => calendar({ version: 'v3', auth }), profile);

			expect(getAuth).toHaveBeenCalledWith(profile, undefined);
		});

		it('should pass temporariness and scopes', async () => {
			await getAPI((auth) => calendar({ version: 'v3', auth }), profile, { scopes, temporary: true });

			expect(getAuth).toHaveBeenCalledWith(profile, { scopes, temporary: true });
		});

		it('should warn when creating permanent credentials using non-readonly scopes', async () => {
			await getAPI((auth) => calendar({ version: 'v3', auth }), profile, { scopes });

			expect(logger.warn).toHaveBeenCalledWith('\
WARNING: trying to create permanent credentials using non-readonly scopes (scope1, scope2). \
Permanent credentials will be stored in the file and potentially might be re-used to modify your data');
		});

		it('should not warn when creating temporary credentials using non-readonly scopes', async () => {
			await getAPI((auth) => calendar({ version: 'v3', auth }), profile, { scopes, temporary: true });

			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('should not warn when creating permanent credentials using readonly scopes only', async () => {
			await getAPI((auth) => calendar({ version: 'v3', auth }), profile, { scopes: [ 'scope1.readonly', 'scope2.readonly' ], temporary: true });

			expect(logger.warn).not.toHaveBeenCalled();
		});
	});

	describe('API', () => {
		let instance: API<GoogleApis.calendar_v3.Calendar>;

		beforeEach(async () => {
			instance = await getAPI((auth) => calendar({ version: 'v3', auth }), profile);
		});

		describe('getItems', () => {
			it('should call API list method for each page', async () => {
				await instance.getItems(() => calendarList, params);

				pageTokens.forEach((pageToken) => {
					expect(calendarApis.calendarList.list).toHaveBeenCalledWith({ ...params, pageToken });
				});
			});

			it('should output progress by default', async () => {
				await instance.getItems(() => calendarList, params);

				expect(logger.log).toHaveBeenCalledTimes(response.length);
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of 4)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (2 of many)...');
				expect(logger.log).toHaveBeenCalledWith('Getting items (4 of 4)...');
			});

			it('should not output progress if hidden', async () => {
				await instance.getItems(() => calendarList, params, { hideProgress: true });

				expect(logger.log).not.toHaveBeenCalled();
			});

			it('should sleep after reach request', async () => {
				await instance.getItems(() => calendarList, params);

				expect(sleep).toHaveBeenCalledTimes(response.length);
				expect(sleep).toHaveBeenCalledWith(300);
			});

			it('should be initialized and called once if no API error', async () => {
				const getItemsSpy = jest.spyOn(instance, 'getItems');

				await instance.getItems(() => calendarList, params);

				expect(getAuth).toHaveBeenCalledTimes(1);
				expect(getItemsSpy).toHaveBeenCalledTimes(1);
			});

			it('should delete credentials, re-initialize api and retry if API exception is invalid_grant or Invalid credentials', async () => {
				for (const message of [ 'invalid_grant', 'Invalid credentials' ]) {
					const error = new Error(message);
					// fail twice
					getListException.mockReturnValueOnce(error).mockReturnValueOnce(error);

					const getItemsSpy = jest.spyOn(instance, 'getItems');
					jest.mocked(getAuth).mockClear();
					getItemsSpy.mockClear();

					await instance.getItems(() => calendarList, params);

					expect(logger.warn).toHaveBeenCalledWith('Access token stored is invalid, re-creating...');
					expect(deleteCredentials).toHaveBeenCalledWith(profile);
					expect(getAuth).toHaveBeenCalledTimes(2);
					expect(getItemsSpy).toHaveBeenCalledTimes(3);
				}
			});

			it('should re-throw if credentials are just created but API exception is invalid_grant or Invalid credentials', async () => {
				for (const message of [ 'invalid_grant', 'Invalid credentials' ]) {
					const error = new Error(message);
					// fail twice
					getListException.mockReturnValueOnce(error);

					const instance = await getAPI((auth) => calendar({ version: 'v3', auth }), profile, { temporary: true });
					await expect(instance.getItems(() => calendarList, params))
						.rejects.toEqual(error);
				}
			});

			it('should re-throw API exception if not invalid_grant or Invalid credentials', async () => {
				const error = new Error('random exception');
				getListException.mockReturnValueOnce(error);
				await expect(instance.getItems(() => calendarList, params))
					.rejects.toEqual(error);
			});

			it('should return items data', async () => {
				const returnedItems = await instance.getItems(() => calendarList, params);

				expect(returnedItems).toEqual(items);
			});
		});
	});
});
