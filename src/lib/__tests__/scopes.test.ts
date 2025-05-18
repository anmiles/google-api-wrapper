import '@anmiles/prototypes';
import mockFs from 'mock-fs';

import { getScopes } from '../scopes';
import { getScopesFile } from '../utils/paths';

const scopesFile = getScopesFile();

const scopes = [
	'https://www.googleapis.com/auth/calendar.calendars.readonly',
	'https://www.googleapis.com/auth/calendar.events',
];

beforeEach(() => {
	mockFs({
		[scopesFile]: JSON.stringify(scopes),
	});
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/scopes', () => {
	describe('getScopes', () => {

		it('should return scopes', () => {
			const result = getScopes();

			expect(result).toEqual(scopes);
		});

		it('should throw if scopes file does not exist', () => {
			mockFs({});

			const func = (): string[] => getScopes();

			expect(func).toThrowErrorMatchingSnapshot();
		});
	});
});
