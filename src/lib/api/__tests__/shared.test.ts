import logger from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import shared from '../shared';

const original = jest.requireActual('../shared').default as typeof shared;
jest.mock<Partial<typeof shared>>('../shared', () => ({
	getItems : jest.fn().mockImplementation(async () => items),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log : jest.fn(),
}));

jest.mock<Partial<typeof sleep>>('@anmiles/sleep', () => jest.fn());

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

const api  = getAPI(response, pageTokens);
const args = { key : 'value' };

describe('src/lib/api/shared', () => {
	describe('getItems', () => {
		it('should call API list method for each page', async () => {
			await original.getItems(api, args);

			pageTokens.forEach((pageToken) => {
				expect(api.list).toHaveBeenCalledWith({ ...args, pageToken });
			});
		});

		it('should output progress by default', async () => {
			await original.getItems(api, args);

			expect(logger.log).toHaveBeenCalledTimes(response.length);
			expect(logger.log).toHaveBeenCalledWith('Getting items (2 of 4)...');
			expect(logger.log).toHaveBeenCalledWith('Getting items (2 of many)...');
			expect(logger.log).toHaveBeenCalledWith('Getting items (4 of 4)...');
		});

		it('should not output progress if hidden', async () => {
			await original.getItems(api, args, { hideProgress : true });

			expect(logger.log).not.toHaveBeenCalled();
		});

		it('should sleep after reach request', async () => {
			await original.getItems(api, args);

			expect(sleep).toHaveBeenCalledTimes(response.length);
			expect(sleep).toHaveBeenCalledWith(300);
		});

		it('should return items data', async () => {
			const items = await original.getItems(api, args);

			expect(items).toEqual(items);
		});
	});
});
