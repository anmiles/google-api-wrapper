import fs from 'fs';
import auth from '../auth';
import data from '../data';
import logger from '../logger';
import sleep from '../sleep';

const original = jest.requireActual('../data').default as typeof data;
jest.mock<Partial<typeof data>>('../data', () => ({
	getData : jest.fn().mockImplementation(async () => videosList),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock('googleapis', () => ({
	google : {
		calendar : jest.fn().mockImplementation(() => ({ events : eventsAPI })),
		youtube  : jest.fn().mockImplementation(() => ({ playlistItems : videosAPI })),
	},
}));

jest.mock<Partial<typeof auth>>('../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	log : jest.fn(),
}));

jest.mock<Partial<typeof sleep>>('../sleep', () => ({
	sleep : jest.fn(),
}));

const profile = 'username';

const googleAuth = {
	setCredentials : jest.fn(),
};

const videosList: Array<{ snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ snippet : { title : undefined, resourceId : undefined } },
	{ snippet : undefined },
];

const videos = [
	[ videosList[0], videosList[1] ],
	null,
	[ videosList[2], videosList[3] ],
];

const eventsList: Array<{ snippet?: { title?: string, resourceId?: { videoId?: string } } }> = [
	{ snippet : { title : 'video1', resourceId : { videoId : 'video1Id' } } },
	{ snippet : { title : 'video2', resourceId : { videoId : undefined } } },
	{ snippet : { title : undefined, resourceId : undefined } },
	{ snippet : undefined },
];

const events = [
	[ eventsList[0], eventsList[1] ],
	null,
	[ eventsList[2], eventsList[3] ],
];

const pageTokens = [
	undefined,
	'token1',
	'token2',
];

const getAPI = <T>(items: Array<Array<T> | null>) => ({
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
});

const eventsAPI = getAPI(events);
const videosAPI = getAPI(videos);

const args = { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 };

describe('src/lib/data', () => {
	describe('getData', () => {
		it('should call API list method for each page', async () => {
			await original.getData(videosAPI, args);

			pageTokens.forEach((pageToken) => {
				expect(videosAPI.list).toBeCalledWith({ ...args, pageToken });
			});
		});

		it('should output progress', async () => {
			await original.getData(videosAPI, args);

			expect(logger.log).toBeCalledTimes(videos.length);
			expect(logger.log).toBeCalledWith('Getting items (2 of 4)...');
			expect(logger.log).toBeCalledWith('Getting items (2 of many)...');
			expect(logger.log).toBeCalledWith('Getting items (4 of 4)...');
		});

		it('should sleep after reach request', async () => {
			await original.getData(videosAPI, args);

			expect(sleep.sleep).toBeCalledTimes(videos.length);
			expect(sleep.sleep).toBeCalledWith(300);
		});

		it('should return items data', async () => {
			const items = await original.getData(videosAPI, args);

			expect(items).toEqual(videosList);
		});
	});

	describe('getEvents', () => {
		it('should call getData', async () => {
			await original.getEvents(profile, args);

			expect(data.getData).toBeCalledWith(eventsAPI, args);
		});

		it('should return events', async () => {
			const events = await original.getEvents(profile, args);

			expect(events).toEqual(eventsList);
		});
	});

	describe('getVideos', () => {
		it('should call getData', async () => {
			await original.getVideos(profile, args);

			expect(data.getData).toBeCalledWith(videosAPI, args);
		});

		it('should return videos', async () => {
			const videos = await original.getVideos(profile, args);

			expect(videos).toEqual(videosList);
		});
	});
});
