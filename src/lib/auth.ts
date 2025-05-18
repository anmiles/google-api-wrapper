import { google } from 'googleapis';
import type GoogleApis from 'googleapis';

import type { AuthOptions } from '../types/options';

import { getCredentials } from './credentials';
import { getSecrets } from './secrets';

export async function getAuth(profile: string, options?: AuthOptions): Promise<GoogleApis.Common.OAuth2Client> {
	const secrets = getSecrets(profile);

	const googleAuth = new google.auth.OAuth2(
		secrets.web.client_id,
		secrets.web.client_secret,
		secrets.web.redirect_uris[0],
	);

	const tokens = await getCredentials(profile, googleAuth, options);
	googleAuth.setCredentials(tokens);
	google.options({ auth: googleAuth });
	return googleAuth;
}
