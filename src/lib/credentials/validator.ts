import type GoogleApis from 'googleapis';

const tokenExpiration = 7 * 24 * 60 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/require-await -- pass sync function into async context
export async function validateCredentials(credentials: GoogleApis.Auth.Credentials): Promise<{ isValid: boolean; validationError?: string }> {
	if (!credentials.access_token) {
		return { isValid: false, validationError: 'Credentials does not have access_token' };
	}

	if (!credentials.refresh_token) {
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
