import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import profiles from '../profiles';
import secrets from '../secrets';

import auth from '../auth';
const original = jest.requireActual('../auth').default as typeof auth;
jest.mock<typeof auth>('../auth', () => ({
	login   : jest.fn(),
	getAuth : jest.fn().mockImplementation(async () => googleAuth),
}));

jest.mock<Partial<typeof profiles>>('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => allProfiles),
}));

jest.mock<Partial<typeof secrets>>('../secrets', () => ({
	getSecrets     : jest.fn().mockImplementation(async () => secretsObject),
	getCredentials : jest.fn().mockImplementation(async () => credentials),
}));

jest.mock('googleapis', () => ({
	google : {
		auth : {
			OAuth2 : jest.fn().mockImplementation(() => googleAuth),
		},
	},
}));

const profile     = 'username';
const allProfiles = [ 'username1', 'username2' ];
const credentials = 'credentials' as GoogleApis.Auth.Credentials;

const googleAuth = {
	setCredentials : jest.fn(),
};

const secretsObject = {
	web : {
		/* eslint-disable camelcase */
		client_id     : 'client_id',
		client_secret : 'client_secret',
		redirect_uris : [ 'redirect_uri' ],
		/* eslint-enable camelcase */
	},
};

describe('src/lib/auth', () => {
	describe('login', () => {
		it('should get profiles', async () => {
			await original.login();
			expect(profiles.getProfiles).toBeCalledWith();
		});

		it('should auth all profiles', async () => {
			await original.login();

			allProfiles.forEach((profile) => {
				expect(auth.getAuth).toBeCalledWith(profile);
			});
		});

		it('should auth only specified profile', async () => {
			await original.login('username1');

			expect(auth.getAuth).toBeCalledWith('username1');
			expect(auth.getAuth).not.toBeCalledWith('username2');
		});
	});

	describe('getAuth', () => {
		it('should get secrets', async () => {
			await original.getAuth(profile);
			expect(secrets.getSecrets).toBeCalledWith(profile);
		});

		it('should get credentials', async () => {
			await original.getAuth(profile);
			expect(secrets.getCredentials).toBeCalledWith(profile, googleAuth);
		});

		it('should create OAuth2 instance', async () => {
			await original.getAuth(profile);
			expect(google.auth.OAuth2).toBeCalledWith(secretsObject.web.client_id, secretsObject.web.client_secret, secretsObject.web.redirect_uris[0]);
		});

		it('should set credentials', async () => {
			await original.getAuth(profile);
			expect(googleAuth.setCredentials).toBeCalledWith(credentials);
		});

		it('should return google auth', async () => {
			const result = await original.getAuth(profile);
			expect(result).toEqual(googleAuth);
		});
	});
});
