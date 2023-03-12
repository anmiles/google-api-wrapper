import fs from 'fs';
import { google } from 'googleapis';
import auth from '../../auth';
import youtube from '../youtube';
import shared from '../shared';
import apiHelpers from './apiHelpers';

const original = jest.requireActual('../youtube').default as typeof youtube;
jest.mock<Partial<typeof youtube>>('../youtube', () => ({
	getAPI : jest.fn().mockImplementation(async () => ({ playlistItems : api })),
}));

jest.mock<Partial<typeof shared>>('../shared', () => ({
	getItems : jest.fn().mockImplementation(async () => playlistItems),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock('googleapis', () => ({
	google : {
		youtube : jest.fn().mockImplementation(() => ({ playlistItems : api })),
	},
}));

jest.mock<Partial<typeof auth>>('../../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

const profile = 'username';

const googleAuth = {
	setCredentials : jest.fn(),
};

const playlistItems: Array<{ snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ snippet : { title : undefined, resourceId : undefined } },
	{ snippet : undefined },
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

const api  = apiHelpers.getAPI(playlistItemsResponse, pageTokens);
const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

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

			expect(result).toEqual({ playlistItems : api });
		});
	});

	describe('getPlaylistItems', () => {
		it('should get api', async () => {
			await original.getPlaylistItems(profile, args);

			expect(youtube.getAPI).toBeCalledWith(profile);
		});

		it('should call getItems', async () => {
			await original.getPlaylistItems(profile, args);

			expect(shared.getItems).toBeCalledWith(api, args);
		});

		it('should return videos', async () => {
			const result = await original.getPlaylistItems(profile, args);

			expect(result).toEqual(playlistItems);
		});
	});
});
