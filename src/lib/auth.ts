import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { info, warn } from '@anmiles/logger';
import type { CommonOptions, AuthOptions } from '../types';
import { getProfiles } from './profiles';
import { getCredentials, getSecrets } from './secrets';

import auth from './auth';

export { login, getAuth };
export default { login, getAuth };

async function login(profile?: string, options?: CommonOptions & AuthOptions): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	for (const profile of profiles) {
		if (!options?.hideProgress) {
			warn(`${profile} - logging in...`);
		}

		await auth.getAuth(profile, options);

		if (!options?.hideProgress) {
			info(`${profile} - logged in successfully`);
		}
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
	google.options({ auth : googleAuth });
	return googleAuth;
}
