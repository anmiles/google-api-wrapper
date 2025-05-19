import type GoogleApis from 'googleapis';

import type { AuthOptions } from '../../types/options';

const tokenExpiration = 7 * 24 * 60 * 60 * 1000;

export function validateCredentials(
	credentials: GoogleApis.Auth.Credentials,
	options?: AuthOptions,
): { isValid: boolean; validationError?: string } {

	if (!credentials.access_token) {
		return { isValid: false, validationError: 'Credentials does not have access_token' };
	}

	if (!credentials.refresh_token && !options?.temporary) {
		return { isValid: false, validationError: 'Credentials does not have refresh_token' };
	}

	if (!credentials.expiry_date) {
		return { isValid: false, validationError: 'Credentials does not have expiry_date' };
	}

	if (new Date().getTime() - credentials.expiry_date >= tokenExpiration) {
		return { isValid: false, validationError: 'Credentials expired' };
	}

	return { isValid: true };
}
