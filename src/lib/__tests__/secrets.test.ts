import http from 'http';
import path from 'path';
import * as colorette from 'colorette';
import open from 'open';
import type GoogleApis from 'googleapis';
import jsonLib from '../jsonLib';
import logger from '../logger';
import paths from '../paths';
import type { Secrets } from '../../types';

import secrets from '../secrets';
const original = jest.requireActual('../secrets').default as typeof secrets;
jest.mock<typeof secrets>('../secrets', () => ({
	getScopes           : jest.fn().mockImplementation(() => scopesJSON),
	getSecrets          : jest.fn().mockImplementation(() => secretsJSON),
	getCredentials      : jest.fn(),
	validateCredentials : jest.fn(),
	createCredentials   : jest.fn().mockImplementation(() => credentialsJSON),
	checkSecrets        : jest.fn(),
	getScopesError      : jest.fn().mockImplementation(() => scopesError),
	getSecretsError     : jest.fn().mockImplementation(() => secretsError),
}));

jest.mock<Partial<typeof http>>('http', () => ({
	createServer : jest.fn().mockImplementation((callback) => {
		serverCallback = callback;

		return {
			on,
			listen,
			close,
			destroy,
		};
	}),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock<Partial<typeof colorette>>('colorette', () => ({
	yellow : jest.fn().mockImplementation((text) => `yellow:${text}`),
}));

jest.mock('open', () => jest.fn().mockImplementation((url: string) => {
	willOpen(url.replace('http://localhost:6006', ''));
}));

jest.mock<Partial<typeof jsonLib>>('../jsonLib', () => ({
	getJSON      : jest.fn().mockImplementation(() => json),
	getJSONAsync : jest.fn().mockImplementation(async () => json),
	readJSON     : jest.fn().mockImplementation(async () => json),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	warn  : jest.fn(),
	error : jest.fn().mockImplementation((error) => {
		throw error;
	}) as jest.Mock<never, any>,
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getScopesFile      : jest.fn().mockImplementation(() => scopesFile),
	getSecretsFile     : jest.fn().mockImplementation(() => secretsFile),
	getCredentialsFile : jest.fn().mockImplementation(() => credentialsFile),
	ensureFile         : jest.fn().mockImplementation(() => fileExists),
}));

const profile          = 'username1';
const scopesFile       = 'scopes.json';
const secretsFile      = 'secrets/username1.json';
const credentialsFile  = 'secrets/username1.credentials.json';
const wrongRedirectURI = 'wrong_redirect_uri';

const scopesError  = 'scopesError';
const secretsError = 'secretsError';

const scopesJSON: string[] = [
	'https://www.googleapis.com/auth/calendar.calendars.readonly',
	'https://www.googleapis.com/auth/calendar.events.readonly',
];

const secretsJSON: Secrets = {
	web : {
		/* eslint-disable camelcase */
		client_id                   : 'client_id.apps.googleusercontent.com',
		project_id                  : 'project_id',
		auth_uri                    : 'https://accounts.google.com/o/oauth2/auth',
		token_uri                   : 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url : 'https://www.googleapis.com/oauth2/v1/certs',
		client_secret               : 'client_secret',
		redirect_uris               : [ 'http://localhost:6006/oauthcallback' ],
		/* eslint-enable camelcase */
	},
};

const credentialsJSON: GoogleApis.Auth.Credentials = {
	// eslint-disable-next-line camelcase
	access_token : 'access_token222',
};

let json: any;

const code    = 'code';
const authUrl = 'https://authUrl';
const auth    = {
	generateAuthUrl : jest.fn().mockReturnValue(authUrl),
	getToken        : jest.fn().mockResolvedValue({ tokens : credentialsJSON }),
} as unknown as GoogleApis.Common.OAuth2Client;

const response = {
	end : jest.fn(),
} as unknown as http.ServerResponse;

let serverCallback: (
	request: http.IncomingMessage,
	response: http.ServerResponse
) => Promise<typeof credentialsJSON>;

function willOpen(url: string | undefined, timeout?: number) {
	setTimeout(async () => {
		await serverCallback({
			url,
			headers : {
				host : 'localhost:6006',
			},
		} as http.IncomingMessage, response);
	}, timeout || 0);
}
let closedTime: number;

const on = jest.fn().mockImplementation((event: string, listener: (...args: any[]) => void) => {
	if (event === 'connection') {
		// always simulate opening several connections once connections are meant to be listened
		connections.forEach((connection) => listener(connection));
	}
});

const listen = jest.fn();
const close  = jest.fn().mockImplementation(() => {
	closedTime = new Date().getTime();
});
const destroy = jest.fn();

const connections = [
	{ remoteAddress : 'server', remotePort : '1001', on : jest.fn(), destroy : jest.fn() },
	{ remoteAddress : 'server', remotePort : '1002', on : jest.fn(), destroy : jest.fn() },
	{ remoteAddress : 'server', remotePort : '1003', on : jest.fn(), destroy : jest.fn() },
];

let fileExists: boolean;

describe('src/lib/secrets', () => {
	describe('getScopes', () => {
		const getJSONSpy = jest.spyOn(jsonLib, 'getJSON');

		beforeEach(() => {
			json = scopesJSON;
		});

		it('should get json from scopes file', async () => {
			await original.getScopes();

			expect(getJSONSpy).toBeCalled();
			expect(getJSONSpy.mock.calls[0][0]).toEqual(scopesFile);
		});

		it('should fallback to error', async () => {
			await original.getScopes();

			expect(getJSONSpy.mock.calls[0][1]).toThrowError(scopesError);
		});

		it('should return scopes', async () => {
			const result = await original.getScopes();

			expect(result).toEqual(scopesJSON);
		});
	});

	describe('getSecrets', () => {
		const getJSONSpy = jest.spyOn(jsonLib, 'getJSON');

		beforeEach(() => {
			json = secretsJSON;
		});

		it('should get json from secrets file', async () => {
			await original.getSecrets(profile);

			expect(getJSONSpy).toBeCalled();
			expect(getJSONSpy.mock.calls[0][0]).toEqual(secretsFile);
		});

		it('should fallback to error', async () => {
			await original.getSecrets(profile);

			expect(getJSONSpy.mock.calls[0][1]).toThrowError(secretsError);
		});

		it('should check secrets', async () => {
			await original.getSecrets(profile);

			expect(secrets.checkSecrets).toBeCalledWith(profile, json, secretsFile);
		});

		it('should return secrets', async () => {
			const result = await original.getSecrets(profile);

			expect(result).toEqual(secretsJSON);
		});
	});

	describe('getCredentials', () => {
		const getJSONAsyncSpy = jest.spyOn(jsonLib, 'getJSONAsync');

		beforeEach(() => {
			json       = credentialsJSON;
			fileExists = false;
		});

		it('should get json from credentials file by default', async () => {
			await original.getCredentials(profile, auth);

			expect(getJSONAsyncSpy).toBeCalled();
			expect(getJSONAsyncSpy.mock.calls[0][0]).toEqual(credentialsFile);
		});

		it('should get json from credentials file if temporariness not set', async () => {
			await original.getCredentials(profile, auth, { temporary : false });

			expect(getJSONAsyncSpy).toBeCalled();
			expect(getJSONAsyncSpy.mock.calls[0][0]).toEqual(credentialsFile);
		});

		it('should not get json from credentials file if temporariness set', async () => {
			await original.getCredentials(profile, auth, { temporary : true });

			expect(getJSONAsyncSpy).not.toBeCalled();
		});

		it('should call createCredentials in fallback', async () => {
			await original.getCredentials(profile, auth);

			expect(secrets.createCredentials).not.toBeCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			await fallback();

			expect(secrets.createCredentials).toBeCalledWith(profile, auth, undefined);
		});

		it('should call createCredentials in fallback if temporariness not set', async () => {
			await original.getCredentials(profile, auth, { temporary : false });

			expect(secrets.createCredentials).not.toBeCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			await fallback();

			expect(secrets.createCredentials).toBeCalledWith(profile, auth, { temporary : false });
		});

		it('should call createCredentials directly if temporariness set', async () => {
			await original.getCredentials(profile, auth, { temporary : true });

			expect(secrets.createCredentials).toBeCalledWith(profile, auth, { temporary : true });
		});

		it('should return credentials in fallback', async () => {
			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			const result   = await fallback();

			expect(result).toEqual(credentialsJSON);
		});

		it('should return credentials in fallback and copy existing refresh token from existing file if created credentials do not have refresh token', async () => {
			fileExists = true;
			// eslint-disable-next-line camelcase
			jest.spyOn(jsonLib, 'readJSON').mockReturnValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token' });

			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			const result   = await fallback();

			expect(jsonLib.readJSON).toBeCalledWith(credentialsFile);
			// eslint-disable-next-line camelcase
			expect(result).toEqual({ ...credentialsJSON, refresh_token : 'refresh_token' });
		});

		it('should return credentials in fallback and leave refresh_token undefined if there is no existing file', async () => {
			fileExists = false;
			// eslint-disable-next-line camelcase
			jest.spyOn(jsonLib, 'readJSON').mockReturnValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token' });

			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			const result   = await fallback();

			expect(jsonLib.readJSON).not.toBeCalled();
			// eslint-disable-next-line camelcase
			expect(result).toEqual(credentialsJSON);
		});

		it('should return credentials in fallback and leave refresh_token as is if it is set from createCredentials', async () => {
			fileExists = true;
			// eslint-disable-next-line camelcase
			jest.spyOn(secrets, 'createCredentials').mockResolvedValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token_1' });
			// eslint-disable-next-line camelcase
			jest.spyOn(jsonLib, 'readJSON').mockReturnValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token_2' });

			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0][1];
			const result   = await fallback();

			expect(jsonLib.readJSON).toBeCalledWith(credentialsFile);
			// eslint-disable-next-line camelcase
			expect(result).toEqual({ ...credentialsJSON, refresh_token : 'refresh_token_1' });
		});
	});

	describe('validateCredentials', () => {
		it('should return false if no access token', async () => {
			expect(await original.validateCredentials({})).toEqual(false);
		});

		it('should return true if no refresh token', async () => {
			// eslint-disable-next-line camelcase
			expect(await original.validateCredentials({ access_token : 'token' })).toEqual(false);
		});

		it('should return true if no expiration', async () => {
			// eslint-disable-next-line camelcase
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token' })).toEqual(true);
		});

		it('should return true if credentials are not more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 6);
			// eslint-disable-next-line camelcase
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token', expiry_date : expiryDate.getTime() })).toEqual(true);
		});

		it('should return true if credentials are more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 8);
			// eslint-disable-next-line camelcase
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token', expiry_date : expiryDate.getTime() })).toEqual(false);
		});
	});

	describe('createCredentials', () => {
		const tokenUrl = `/request.url?code=${code}`;

		it('should generate authUrl', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth);

			expect(auth.generateAuthUrl).toBeCalledWith({
				// eslint-disable-next-line camelcase
				access_type : 'offline',
				prompt      : 'consent',
				scope      	: [
					'https://www.googleapis.com/auth/calendar.calendars.readonly',
					'https://www.googleapis.com/auth/calendar.events.readonly',
				],
			});
		});

		it('should generate authUrl and do not require consent if credentials are temporary because refresh token is not required in credentials JSON', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth, { temporary : true });

			expect(auth.generateAuthUrl).toBeCalledWith({
				// eslint-disable-next-line camelcase
				access_type : 'offline',
				scope      	: [
					'https://www.googleapis.com/auth/calendar.calendars.readonly',
					'https://www.googleapis.com/auth/calendar.events.readonly',
				],
			});
		});

		it('should generate authUrl with custom scopes', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth, { scopes : [ 'scope1', 'scope2' ] });

			expect(auth.generateAuthUrl).toBeCalledWith({
				// eslint-disable-next-line camelcase
				access_type : 'offline',
				prompt      : 'consent',
				scope      	: [ 'scope1', 'scope2' ],
			});
		});

		it('should create server on 6006 port', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth);

			expect(http.createServer).toBeCalled();
			expect(listen).toBeCalledWith(6006);
		});

		it('should open browser page and warn about it', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth);

			expect(open).toBeCalledWith('http://localhost:6006/');
			expect(logger.warn).toBeCalledWith('Please check your browser for further actions');
		});

		it('should show nothing on the browser page if request.url is empty', async () => {
			willOpen('', 100);
			willOpen(tokenUrl, 200);

			await original.createCredentials(profile, auth);

			expect(response.end).toBeCalledWith('');
		});

		it('should show opening instructions if opened the home page', async () => {
			willOpen('/', 100);
			willOpen(tokenUrl, 200);

			await original.createCredentials(profile, auth);

			expect(response.end).toBeCalledWith(`<div style="margin: 1em auto; padding: 0 1em; border: 1px solid black; max-width: 600px; text-align: center; font-family: Arial, sans-serif">\n<p>Please open <a href="${authUrl}">this link</a> in a browser that belongs to <strong>${profile}</strong> google profile</p>\n</div>`);
		});

		it('should ask to close webpage', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth);

			expect(response.end).toBeCalledWith('<div style="margin: 1em auto; padding: 0 1em; border: 1px solid black; max-width: 600px; text-align: center; font-family: Arial, sans-serif">\n<p>Please close this page and return to application</p>\n</div>');
		});

		it('should close server and destroy all connections if request.url is truthy', async () => {
			willOpen(tokenUrl, 100);

			await original.createCredentials(profile, auth);

			expect(close).toBeCalled();

			connections.forEach((connection) => expect(connection.destroy).toBeCalled());
		});

		it('should only resolve when request.url is truthy', async () => {
			const emptyRequestTime = 100;
			const requestTime      = 200;

			const before = new Date().getTime();
			willOpen(undefined, emptyRequestTime);
			willOpen(tokenUrl, requestTime);

			const result = await original.createCredentials(profile, auth);
			const after  = new Date().getTime();

			expect(close).toBeCalledTimes(1);
			expect(closedTime - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(after - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(result).toEqual(credentialsJSON);
		});

		it('should only resolve when request.url contains no code', async () => {
			const noCodeRequestTime = 100;
			const requestTime       = 200;

			const before = new Date().getTime();
			willOpen('/request.url?param=value', noCodeRequestTime);
			willOpen(tokenUrl, requestTime);

			const result = await original.createCredentials(profile, auth);
			const after  = new Date().getTime();

			expect(close).toBeCalledTimes(1);
			expect(closedTime - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(after - before).toBeGreaterThanOrEqual(requestTime - 1);
			expect(result).toEqual(credentialsJSON);
		});

		it('should return credentials JSON', async () => {
			willOpen(tokenUrl, 100);

			const result = await original.createCredentials(profile, auth);

			expect(result).toEqual(credentialsJSON);
		});
	});

	describe('checkSecrets', () => {
		it('should return true if redirect_uri is correct', () => {
			const result = original.checkSecrets(profile, secretsJSON, secretsFile);

			expect(result).toBe(true);
		});

		it('should output error if redirect_uri is incorrect', () => {
			const wrongSecretsJSON                = { ...secretsJSON };
			wrongSecretsJSON.web.redirect_uris[0] = wrongRedirectURI;
			const func                            = () => original.checkSecrets(profile, wrongSecretsJSON, secretsFile);

			expect(func).toThrowError('Error in credentials file: redirect URI should be http://localhost:6006/oauthcallback.\nsecretsError');
		});
	});

	describe('getScopesError', () => {
		it('should return error message with instructions', () => {
			const result = original.getScopesError(scopesFile);
			expect(result).toEqual(`File ${scopesFile} not found!\n\
This application had to have pre-defined file ${scopesFile} that will declare needed scopes`);
		});
	});

	describe('getSecretsError', () => {
		it('should return error message with instructions', () => {
			const result = original.getSecretsError(profile, secretsFile);
			expect(result).toEqual(`File ${secretsFile} not found!\n\
Here is how to obtain it:\n\
	Go to https://console.cloud.google.com/projectcreate\n\
		Choose project name\n\
		Click "CREATE" and wait for project to become created\n\
	Go to https://console.cloud.google.com/apis/dashboard\n\
		Select just created project in the top left dropdown list\n\
		Click "ENABLE APIS AND SERVICES"\n\
			Click API you need\n\
			Click "ENABLE" and wait for API to become enabled\n\
		Click "Credentials" tab on the left sidebar\n\
			Click "CONFIGURE CONSENT SCREEN" on the right\n\
				Choose "External"\n\
				Click "CREATE"\n\
				Choose app name, i.e. "NodeJS"\n\
				Specify your email as user support email and as developer contact information on the very bottom\n\
				Click "Save and continue"\n\
			Click "Add or remove scopes"\n\
				Add scopes: https://www.googleapis.com/auth/calendar.calendars.readonly,https://www.googleapis.com/auth/calendar.events.readonly\n\
				Click "Save and continue"\n\
			Click "Add users"\n\
				Add your email\n\
				Click "Save and continue"\n\
			Click "Back to dashboard" on the very bottom\n\
		Click "Credentials" on the left sidebar\n\
			Click "CREATE CREDENTIALS" and choose "OAuth client ID"\n\
				Select application type "Web application"\n\
				Specify app name, i.e. "NodeJS"\n\
				Add authorized redirect URI: http://localhost:6006/oauthcallback\n\
				Click "CREATE"\n\
				Click "DOWNLOAD JSON" and download credentials to ./secrets/${profile}.json\n\
Then start this script again`);
		});
	});
});
