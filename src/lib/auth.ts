import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import type { AuthOptions } from '../types';
import { info, warn } from './logger';
import { getProfiles } from './profiles';
import { getCredentials, getSecrets } from './secrets';

import auth from './auth';

export { login, getAuth };
export default { login, getAuth };

async function login(profile?: string): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	for (const profile of profiles) {
		warn(`${profile} - logging in...`);
		await auth.getAuth(profile, { persist : true });
		info(`${profile} - logged in successfully`);
	}
}

async function getAuth(profile: string, options?: AuthOptions): Promise<GoogleApis.Common.OAuth2Client> {
	const secrets = getSecrets(profile);

	const googleAuth = new google.auth.OAuth2(
		secrets.web.client_id,
		secrets.web.client_secret,
		secrets.web.redirect_uris[0],
	);

	const tokens = await getCredentials(profile, googleAuth, options);
	googleAuth.setCredentials(tokens);
	return googleAuth;
}
