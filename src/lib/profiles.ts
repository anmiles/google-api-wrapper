import { getJSON, writeJSON } from './jsonLib';
import { error } from './logger';
import { getProfilesFile } from './paths';

import profiles from './profiles';

export { getProfiles, setProfiles, createProfile };
export default { getProfiles, setProfiles, createProfile };

function getProfiles(): string[] {
	const profilesFile = getProfilesFile();
	return getJSON(profilesFile, () => []);
}

function setProfiles(profiles: string[]): void {
	const profilesFile = getProfilesFile();
	writeJSON(profilesFile, profiles);
}

function createProfile(profile: string): void {
	if (!profile) {
		error('Usage: `npm run create <profile>` where `profile` - is any profile name you want');
	}

	const existingProfiles = profiles.getProfiles();

	if (existingProfiles.includes(profile)) {
		return;
	}

	existingProfiles.push(profile);
	profiles.setProfiles(existingProfiles);
}
