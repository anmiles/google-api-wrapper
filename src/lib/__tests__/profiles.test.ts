import fs from 'fs';
import logger from '@anmiles/logger';
import paths from '../paths';

import profiles from '../profiles';
const original = jest.requireActual('../profiles').default as typeof profiles;
jest.mock<typeof profiles>('../profiles', () => ({
	getProfiles    : jest.fn().mockImplementation(() => existingProfiles),
	setProfiles    : jest.fn(),
	createProfile  : jest.fn(),
	filterProfiles : jest.fn(),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	mkdirSync     : jest.fn(),
	renameSync    : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation((file) => existingFiles.includes(file)),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	log  : jest.fn(),
	warn : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getProfilesFile : jest.fn().mockImplementation(() => profilesFile),
}));

const json         = { key : 'value' };
const profilesFile = 'profilesFile';
const profile1     = 'username1';
const profile2     = 'username2';
const allProfiles  = [ profile1, profile2 ];

let existingProfiles: string[];
let existingFiles: string[] = [];

let getJSONSpy: jest.SpyInstance;
let writeJSONSpy: jest.SpyInstance;

beforeAll(() => {
	getJSONSpy   = jest.spyOn(fs, 'getJSON');
	writeJSONSpy = jest.spyOn(fs, 'writeJSON');
});

beforeEach(() => {
	getJSONSpy.mockImplementation(() => json);
	writeJSONSpy.mockImplementation();

	existingFiles    = [];
	existingProfiles = [ 'username1', 'username2' ];
});

afterAll(() => {
	getJSONSpy.mockRestore();
	writeJSONSpy.mockRestore();
});

describe('src/lib/profiles', () => {

	describe('getProfiles', () => {
		it('should get json from profiles file', () => {
			original.getProfiles();

			expect(getJSONSpy).toHaveBeenCalled();
			expect(getJSONSpy.mock.calls[0][0]).toEqual(profilesFile);
		});

		it('should fallback to empty profiles array', () => {
			original.getProfiles();

			const fallback = getJSONSpy.mock.calls[0][1];

			expect(fallback()).toEqual([]);
		});

		it('should return JSON', () => {
			const result = original.getProfiles();

			expect(result).toEqual(json);
		});
	});

	describe('setProfiles', () => {
		it('should write json to profiles file', () => {
			original.setProfiles(allProfiles);

			expect(writeJSONSpy).toHaveBeenCalledWith(profilesFile, allProfiles);
		});
	});

	describe('createProfile', () => {
		it('should output error and do nothing if profile is falsy', () => {
			const func = () => original.createProfile('');

			expect(func).toThrow('Usage: `npm run create <profile>` where `profile` - is any profile name you want');
		});

		it('should get profiles', () => {
			const newProfile = 'username1';

			original.createProfile(newProfile);

			expect(profiles.getProfiles).toHaveBeenCalledWith();
		});

		it('should not save profiles if profile already exists', () => {
			const newProfile = 'username1';

			original.createProfile(newProfile);

			expect(profiles.setProfiles).not.toHaveBeenCalled();
		});

		it('should add new profile if not exists', () => {
			const newProfile = 'newProfile';

			original.createProfile(newProfile);

			expect(profiles.setProfiles).toHaveBeenCalledWith([ 'username1', 'username2', 'newProfile' ]);
		});
	});

	describe('filterProfiles', () => {
		it('should get profiles', () => {
			original.filterProfiles();

			expect(profiles.getProfiles).toHaveBeenCalled();
		});

		it('should output error if no profiles', () => {
			existingProfiles = [];

			const func = () => original.filterProfiles();

			expect(func).toThrow('Please `npm run create` at least one profile');
		});

		it('should output error if profile does not exist', () => {
			const newProfile = 'newProfile';

			const func = () => original.filterProfiles(newProfile);

			expect(func).toThrow(`Profile '${newProfile}' does not exist`);
		});

		it('should return array with requested profile if it exists', () => {
			const found = original.filterProfiles(profile1);

			expect(found).toEqual([ profile1 ]);
		});

		it('should return all profiles if nothing requested', () => {
			const found = original.filterProfiles();

			expect(found).toEqual(existingProfiles);
		});
	});
});
