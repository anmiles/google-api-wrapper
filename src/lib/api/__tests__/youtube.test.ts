import fs from 'fs';
import { google } from 'googleapis';
import auth from '../../auth';
import youtube from '../youtube';
import shared from '../shared';
import apiHelpers from './apiHelpers';

const original = jest.requireActual('../youtube').default as typeof youtube;
jest.mock<Partial<typeof youtube>>('../youtube', () => ({
	getAPI : jest.fn().mockImplementation(async () => ({ playlistItems : playlistItemsAPI })),
}));

jest.mock<Partial<typeof shared>>('../shared', () => ({
	getItems : jest.fn(),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock('googleapis', () => ({
	google : {
		youtube : jest.fn().mockImplementation(() => ({ playlistItems : playlistItemsAPI })),
	},
}));

jest.mock<Partial<typeof auth>>('../../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

const getItemsSpy = jest.spyOn(shared, 'getItems');

const profile         = 'username';
const getItemsOptions = { showProgress : true };

const googleAuth = {
	setCredentials : jest.fn(),
};

const playlistItems: Array<{ id?: string | null | undefined, snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ id : 'id1', snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ id : null, snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ id : 'id3', snippet : { title : undefined, resourceId : undefined } },
	{ id : 'id4', snippet : undefined },
];

const playlistItemsResponse = [
	[ playlistItems[0], playlistItems[1] ],
	null,
	[ playlistItems[2], playlistItems[3] ],
];

const pageTokens = [
	undefined,
	'token1',
	'token2',
];

const playlistItemsAPI = apiHelpers.getAPI(playlistItemsResponse, pageTokens);

describe('src/lib/api/youtube', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await original.getAPI(profile);

			expect(auth.getAuth).toBeCalledWith(profile);
		});

		it('should get youtube api', async () => {
			await original.getAPI(profile);

			expect(google.youtube).toBeCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return youtube api', async () => {
			const result = await original.getAPI(profile);

			expect(result).toEqual({ playlistItems : playlistItemsAPI });
		});
	});

	describe('getPlaylistItems', () => {
		const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

		beforeEach(() => {
			getItemsSpy.mockResolvedValue(playlistItems);
		});

		it('should get api', async () => {
			await original.getPlaylistItems(profile, args, getItemsOptions);

			expect(youtube.getAPI).toBeCalledWith(profile);
		});

		it('should call getItems', async () => {
			await original.getPlaylistItems(profile, args, getItemsOptions);

			expect(getItemsSpy).toBeCalledWith(playlistItemsAPI, args, getItemsOptions);
		});

		it('should return videos', async () => {
			const result = await original.getPlaylistItems(profile, args, getItemsOptions);

			expect(result).toEqual(playlistItems);
		});
	});
});
