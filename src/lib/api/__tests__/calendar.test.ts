import fs from 'fs';
import { google } from 'googleapis';
import auth from '../../auth';
import calendar from '../calendar';
import shared from '../shared';
import apiHelpers from './apiHelpers';

const original = jest.requireActual('../calendar').default as typeof calendar;
jest.mock<Partial<typeof calendar>>('../calendar', () => ({
	getAPI : jest.fn().mockImplementation(async () => ({ events : api })),
}));

jest.mock<Partial<typeof shared>>('../shared', () => ({
	getItems : jest.fn().mockImplementation(async () => events),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	writeFileSync : jest.fn(),
}));

jest.mock('googleapis', () => ({
	google : {
		calendar : jest.fn().mockImplementation(() => ({ events : api })),
	},
}));

jest.mock<Partial<typeof auth>>('../../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

const profile = 'username';

const googleAuth = {
	setCredentials : jest.fn(),
};

const events: Array<{ summary?: string, source?: { url?: string, title?: string} }> = [
	{ summary : 'event 1', source : { title : 'source 1', url : 'https://example.com' } },
	{ summary : 'event 2', source : { title : 'source 2', url : undefined } },
	{ summary : 'event 3', source : { title : undefined, url : undefined } },
	{ summary : 'event 4', source : undefined },
];

const eventsResponse = [
	[ events[0], events[1] ],
	null,
	[ events[2], events[3] ],
];

const pageTokens = [
	undefined,
	'token1',
	'token2',
];

const api  = apiHelpers.getAPI(eventsResponse, pageTokens);
const args = { timeMin : '2010-01-01T00:00:00', timeMax : '2019-12-31T23:59:59' };

describe('src/lib/api/calendar', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await original.getAPI(profile);

			expect(auth.getAuth).toBeCalledWith(profile);
		});

		it('should get calendar api', async () => {
			await original.getAPI(profile);

			expect(google.calendar).toBeCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return calendar api', async () => {
			const result = await original.getAPI(profile);

			expect(result).toEqual({ events : api });
		});
	});

	describe('getEvents', () => {
		it('should get api', async () => {
			await original.getEvents(profile, args);

			expect(calendar.getAPI).toBeCalledWith(profile);
		});

		it('should get items', async () => {
			await original.getEvents(profile, args);

			expect(shared.getItems).toBeCalledWith(api, args);
		});

		it('should return events', async () => {
			const result = await original.getEvents(profile, args);

			expect(result).toEqual(events);
		});
	});

	describe('setEvent', () => {
		const eventId    = 'eventId';
		const updateArgs = { requestBody : { summary : 'summary' } };

		it('should get api', async () => {
			await original.setEvent(profile, eventId, updateArgs);

			expect(calendar.getAPI).toBeCalledWith(profile);
		});

		it('should set items', async () => {
			await original.setEvent(profile, eventId, updateArgs);

			expect(api.update).toBeCalledWith({ eventId, ...updateArgs });
		});
	});
});
