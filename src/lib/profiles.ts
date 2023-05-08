import fs from 'fs';
import '@anmiles/prototypes';
import { getProfilesFile } from './paths';

import profiles from './profiles';

export { getProfiles, setProfiles, createProfile };
export default { getProfiles, setProfiles, createProfile };

function getProfiles(): string[] {
	const profilesFile = getProfilesFile();
	return fs.getJSON(profilesFile, () => []);
}

function setProfiles(profiles: string[]): void {
	const profilesFile = getProfilesFile();
	fs.writeJSON(profilesFile, profiles);
}

function createProfile(profile: string): void {
	if (!profile) {
		throw 'Usage: `npm run create <profile>` where `profile` - is any profile name you want';
	}

	const existingProfiles = profiles.getProfiles();

	if (existingProfiles.includes(profile)) {
		return;
	}

	existingProfiles.push(profile);
	profiles.setProfiles(existingProfiles);
}
