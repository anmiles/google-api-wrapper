import { google } from 'googleapis';
import type GoogleApis from 'googleapis';

import type { Secrets } from '../../types/secrets';
import { getAuth } from '../auth';
import { getCredentials } from '../credentials';
import { getSecrets } from '../secrets';

jest.mock('googleapis');
jest.mock('@anmiles/logger');
jest.mock('../credentials');
jest.mock('../secrets');

const profile     = 'username';
const credentials = 'credentials' as GoogleApis.Auth.Credentials; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const googleAuth = {
	setCredentials: jest.fn(),
} as unknown as GoogleApis.Common.OAuth2Client;

const secrets: Secrets = {
	web: {
		client_id                  : 'client_id.apps.googleusercontent.com',
		project_id                 : 'project_id',
		auth_uri                   : 'https://accounts.google.com/o/oauth2/auth',
		token_uri                  : 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
		client_secret              : 'client_secret',
		redirect_uris              : [ 'redirect_uri' ],
	},
};

jest.mocked(getCredentials).mockResolvedValue(credentials);
jest.mocked(getSecrets).mockReturnValue(secrets);
jest.mocked(google.auth.OAuth2).mockReturnValue(googleAuth);

describe('src/lib/auth', () => {
	describe('getAuth', () => {
		it('should get secrets', async () => {
			await getAuth(profile);
			expect(getSecrets).toHaveBeenCalledWith(profile);
		});

		it('should get credentials', async () => {
			await getAuth(profile);
			expect(getCredentials).toHaveBeenCalledWith(profile, googleAuth, undefined);
		});

		it('should create OAuth2 instance', async () => {
			await getAuth(profile);
			expect(google.auth.OAuth2).toHaveBeenCalledWith(secrets.web.client_id, secrets.web.client_secret, secrets.web.redirect_uris[0]);
		});

		it('should set credentials', async () => {
			await getAuth(profile);
			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(googleAuth.setCredentials).toHaveBeenCalledWith(credentials);
		});

		it('should pass temporariness', async () => {
			await getAuth(profile, { temporary: true });

			expect(getCredentials).toHaveBeenCalledWith(profile, googleAuth, { temporary: true });
		});

		it('should set google auth', async () => {
			await getAuth(profile);

			expect(google.options).toHaveBeenCalledWith({ auth: googleAuth }); // eslint-disable-line @typescript-eslint/unbound-method
		});
	});
});
