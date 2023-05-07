import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import logger from '@anmiles/logger';
import profiles from '../profiles';
import secrets from '../secrets';

import auth from '../auth';
const original = jest.requireActual('../auth').default as typeof auth;
jest.mock<typeof auth>('../auth', () => ({
	login   : jest.fn(),
	getAuth : jest.fn().mockImplementation(async () => googleAuth),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
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
			expect(profiles.getProfiles).toHaveBeenCalledWith();
		});

		it('should auth all profiles', async () => {
			await original.login();

			allProfiles.forEach((profile) => {
				expect(auth.getAuth).toHaveBeenCalledWith(profile, undefined);
			});
		});

		it('should auth only specified profile', async () => {
			await original.login('username1');

			expect(auth.getAuth).toHaveBeenCalledWith('username1', undefined);
			expect(auth.getAuth).not.toHaveBeenCalledWith('username2', undefined);
		});

		it('should pass temporariness for all profiles', async () => {
			await original.login(undefined, { temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith('username1', { temporary : true });
			expect(auth.getAuth).toHaveBeenCalledWith('username2', { temporary : true });

		});

		it('should pass temporariness only for specified profile', async () => {
			await original.login('username1', { temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith('username1', { temporary : true });
			expect(auth.getAuth).not.toHaveBeenCalledWith('username2', { temporary : true });

		});

		it('should show auth progress for all profiles by default', async () => {
			await original.login();

			expect(logger.warn).toHaveBeenCalledWith('username1 - logging in...');
			expect(logger.warn).toHaveBeenCalledWith('username2 - logging in...');
			expect(logger.info).toHaveBeenCalledWith('username1 - logged in successfully');
			expect(logger.info).toHaveBeenCalledWith('username2 - logged in successfully');
		});

		it('should show auth progress for specified profile by default', async () => {
			await original.login('username1');

			expect(logger.warn).toHaveBeenCalledWith('username1 - logging in...');
			expect(logger.info).toHaveBeenCalledWith('username1 - logged in successfully');
		});

		it('should not show auth progress if hidden', async () => {
			await original.login(undefined, { hideProgress : true });
			await original.login('username1', { hideProgress : true });

			expect(logger.info).not.toHaveBeenCalled();
		});
	});

	describe('getAuth', () => {
		it('should get secrets', async () => {
			await original.getAuth(profile);
			expect(secrets.getSecrets).toHaveBeenCalledWith(profile);
		});

		it('should get credentials', async () => {
			await original.getAuth(profile);
			expect(secrets.getCredentials).toHaveBeenCalledWith(profile, googleAuth, undefined);
		});

		it('should create OAuth2 instance', async () => {
			await original.getAuth(profile);
			expect(google.auth.OAuth2).toHaveBeenCalledWith(secretsObject.web.client_id, secretsObject.web.client_secret, secretsObject.web.redirect_uris[0]);
		});

		it('should set credentials', async () => {
			await original.getAuth(profile);
			expect(googleAuth.setCredentials).toHaveBeenCalledWith(credentials);
		});

		it('should pass temporariness', async () => {
			await original.getAuth(profile, { temporary : true });

			expect(secrets.getCredentials).toHaveBeenCalledWith(profile, googleAuth, { temporary : true });
		});

		it('should set google auth', async () => {
			await original.getAuth(profile);

			expect(google.options).toHaveBeenCalledWith({ auth : googleAuth });
		});
	});
});
