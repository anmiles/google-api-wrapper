import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import logger from '../logger';
import profiles from '../profiles';
import secrets from '../secrets';

import auth from '../auth';
const original = jest.requireActual('../auth').default as typeof auth;
jest.mock<typeof auth>('../auth', () => ({
	login   : jest.fn(),
	getAuth : jest.fn().mockImplementation(async () => googleAuth),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	info : jest.fn(),
	warn : jest.fn(),
}));

jest.mock<Partial<typeof profiles>>('../profiles', () => ({
	getProfiles : jest.fn().mockImplementation(() => allProfiles),
}));

jest.mock<Partial<typeof secrets>>('../secrets', () => ({
	getSecrets     : jest.fn().mockImplementation(() => secretsObject),
	getCredentials : jest.fn().mockImplementation(async () => credentials),
}));

jest.mock('googleapis', () => ({
	google : {
		auth : {
			OAuth2 : jest.fn().mockImplementation(() => googleAuth),
		},
		options : jest.fn(),
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
				expect(auth.getAuth).toBeCalledWith(profile, undefined);
			});
		});

		it('should auth only specified profile', async () => {
			await original.login('username1');

			expect(auth.getAuth).toBeCalledWith('username1', undefined);
			expect(auth.getAuth).not.toBeCalledWith('username2', undefined);
		});

		it('should pass temporariness for all profiles', async () => {
			await original.login(undefined, { temporary : true });

			expect(auth.getAuth).toBeCalledWith('username1', { temporary : true });
			expect(auth.getAuth).toBeCalledWith('username2', { temporary : true });

		});

		it('should pass temporariness only for specified profile', async () => {
			await original.login('username1', { temporary : true });

			expect(auth.getAuth).toBeCalledWith('username1', { temporary : true });
			expect(auth.getAuth).not.toBeCalledWith('username2', { temporary : true });

		});

		it('should show auth progress for all profiles by default', async () => {
			await original.login();

			expect(logger.warn).toBeCalledWith('username1 - logging in...');
			expect(logger.warn).toBeCalledWith('username2 - logging in...');
			expect(logger.info).toBeCalledWith('username1 - logged in successfully');
			expect(logger.info).toBeCalledWith('username2 - logged in successfully');
		});

		it('should show auth progress for specified profile by default', async () => {
			await original.login('username1');

			expect(logger.warn).toBeCalledWith('username1 - logging in...');
			expect(logger.info).toBeCalledWith('username1 - logged in successfully');
		});

		it('should not show auth progress if hidden', async () => {
			await original.login(undefined, { hideProgress : true });
			await original.login('username1', { hideProgress : true });

			expect(logger.info).not.toBeCalled();
		});
	});

	describe('getAuth', () => {
		it('should get secrets', async () => {
			await original.getAuth(profile);
			expect(secrets.getSecrets).toBeCalledWith(profile);
		});

		it('should get credentials', async () => {
			await original.getAuth(profile);
			expect(secrets.getCredentials).toBeCalledWith(profile, googleAuth, undefined);
		});

		it('should create OAuth2 instance', async () => {
			await original.getAuth(profile);
			expect(google.auth.OAuth2).toBeCalledWith(secretsObject.web.client_id, secretsObject.web.client_secret, secretsObject.web.redirect_uris[0]);
		});

		it('should set credentials', async () => {
			await original.getAuth(profile);
			expect(googleAuth.setCredentials).toBeCalledWith(credentials);
		});

		it('should pass temporariness', async () => {
			await original.getAuth(profile, { temporary : true });

			expect(secrets.getCredentials).toBeCalledWith(profile, googleAuth, { temporary : true });
		});

		it('should set google auth', async () => {
			await original.getAuth(profile);

			expect(google.options).toBeCalledWith({ auth : googleAuth });
		});
	});
});
