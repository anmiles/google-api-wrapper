import fs from 'fs';

import '@anmiles/prototypes';

import { getProfilesFile } from './utils/paths';

export function getProfiles(): string[] {
	const profilesFile = getProfilesFile();
	return fs.getJSON(profilesFile, () => []);
}

export function setProfiles(profiles: string[]): void {
	const profilesFile = getProfilesFile();
	fs.writeJSON(profilesFile, profiles);
}

export function createProfile(profile?: string): void {
	if (!profile) {
		throw new Error('Usage: `npm run create <profile>` where `profile` - is any profile name you want');
	}

	const existingProfiles = getProfiles();

	if (existingProfiles.includes(profile)) {
		return;
	}

	existingProfiles.push(profile);
	setProfiles(existingProfiles);
}

export function filterProfiles(profile?: string): string[] {
	const existingProfiles = getProfiles();

	if (existingProfiles.length === 0) {
		throw new Error('Please `npm run create` at least one profile');
	}

	if (!profile) {
		return existingProfiles;
	}

	if (existingProfiles.includes(profile)) {
		return [ profile ];
	}

	throw new Error(`Profile '${profile}' does not exist`);
}
