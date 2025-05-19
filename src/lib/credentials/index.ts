import fs from 'fs';

import type GoogleApis from 'googleapis';

import type { AuthOptions } from '../../types/options';
import { getCredentialsFile } from '../utils/paths';

import { generateCredentials } from './generator';
import { validateCredentials } from './validator';

export async function getCredentials(profile: string, auth: GoogleApis.Common.OAuth2Client, options?: AuthOptions): Promise<GoogleApis.Auth.Credentials> {
	const credentialsFile = getCredentialsFile(profile);

	if (options?.temporary) {
		const credentials      = await generateCredentials(profile, auth, options);
		const validationResult = validateCredentials(credentials, options);

		if (!validationResult.isValid) {
			throw new Error(validationResult.validationError);
		}

		return credentials;
	}

	return fs.getJSONAsync(credentialsFile, async () => {
		const refreshToken = fs.existsSync(credentialsFile)
			? fs.readJSON<GoogleApis.Auth.Credentials>(credentialsFile).refresh_token
			: undefined;

		const credentials = await generateCredentials(profile, auth, options,
			refreshToken
				? undefined
				: 'consent',
		);

		return {
			refresh_token: refreshToken,
			...credentials,
		};
	// eslint-disable-next-line @typescript-eslint/require-await
	}, async (credentials) => validateCredentials(credentials));
}

export function deleteCredentials(profile: string): void {
	const credentialsFile = getCredentialsFile(profile);

	if (fs.existsSync(credentialsFile)) {
		fs.rmSync(credentialsFile);
	}
}
