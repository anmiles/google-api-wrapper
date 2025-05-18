import fs from 'fs';

import '@anmiles/prototypes';
import mockFs from 'mock-fs';

import { createProfile, filterProfiles, getProfiles, setProfiles } from '../profiles';
import { getProfilesFile } from '../utils/paths';

jest.mock('@anmiles/logger');

const profilesFile = getProfilesFile();

const profile1 = 'username1';
const profile2 = 'username2';
const profiles = [ profile1, profile2 ];

beforeEach(() => {
	mockFs({
		[profilesFile]: JSON.stringify(profiles),
	});
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/profiles', () => {

	describe('getProfiles', () => {
		it('should return profiles', () => {
			const result = getProfiles();

			expect(result).toEqual(profiles);
		});

		it('should return empty array and create profiles file if not exists', () => {
			mockFs({});

			const result = getProfiles();

			expect(result).toEqual([]);
			expect(fs.existsSync(profilesFile)).toBe(true);
		});
	});

	describe('setProfiles', () => {
		it('should write json to profiles file', () => {
			setProfiles(profiles);

			expect(fs.getJSON(profilesFile, () => [])).toEqual([ 'username1', 'username2' ]);
		});
	});

	describe('createProfile', () => {
		it('should output error and do nothing if profile is falsy', () => {
			const func = (): void => createProfile('');

			expect(func).toThrow('Usage: `npm run create <profile>` where `profile` - is any profile name you want');
		});

		it('should add new profile if not exists', () => {
			const newProfile = 'newProfile';

			createProfile(newProfile);

			expect(fs.getJSON(profilesFile, () => [])).toEqual([ 'username1', 'username2', 'newProfile' ]);
		});

		it('should not add duplicate', () => {
			const newProfile = 'username1';

			createProfile(newProfile);

			expect(fs.getJSON(profilesFile, () => [])).toEqual([ 'username1', 'username2' ]);
		});
	});

	describe('filterProfiles', () => {
		it('should return all profiles', () => {
			const result = filterProfiles();

			expect(result).toEqual([ 'username1', 'username2' ]);
		});

		it('should return array with requested profile if exists', () => {
			const result = filterProfiles(profile1);

			expect(result).toEqual([ profile1 ]);
		});

		it('should output error if profile does not exist', () => {
			const newProfile = 'newProfile';

			const func = (): string[] => filterProfiles(newProfile);

			expect(func).toThrow(new Error(`Profile '${newProfile}' does not exist`));
		});

		it('should output error if no profiles', () => {
			mockFs({});

			const func = (): string[] => filterProfiles();

			expect(func).toThrow(new Error('Please `npm run create` at least one profile'));
		});
	});
});
