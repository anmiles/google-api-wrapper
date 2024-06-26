import fs from 'fs';
import http from 'http';
import type path from 'path';
import EventEmitter from 'events';
import { open } from 'out-url';
import type GoogleApis from 'googleapis';
import logger from '@anmiles/logger';
import type renderer from '../renderer';
import type paths from '../paths';
import type { Secrets } from '../../types/secrets';
import '@anmiles/prototypes';

import secrets from '../secrets';

const original = jest.requireActual<{ default : typeof secrets }>('../secrets').default;
jest.mock<typeof secrets>('../secrets', () => ({
	getScopes           : jest.fn().mockImplementation(() => scopesJSON),
	getSecrets          : jest.fn().mockImplementation(() => secretsJSON),
	getCredentials      : jest.fn(),
	validateCredentials : jest.fn(),
	createCredentials   : jest.fn().mockImplementation(() => credentialsJSON),
	deleteCredentials   : jest.fn(),
	checkSecrets        : jest.fn(),
	getScopesError      : jest.fn().mockImplementation(() => scopesError),
	getSecretsError     : jest.fn().mockImplementation(() => secretsError),
}));

jest.mock<Partial<typeof renderer>>('../renderer', () => ({
	renderAuth : jest.fn().mockImplementation(({ profile, authUrl, scope } : { profile : string; authUrl : string; scope : string[] }) => `content = profile = ${profile} authUrl = ${authUrl} scope = ${scope.join('|')}`),
	renderDone : jest.fn().mockImplementation(() => 'content = done'),
}));

jest.mock<Partial<typeof http>>('http', () => ({
	createServer : jest.fn().mockImplementation(() => server),
}));

let server: http.Server;
let response: http.ServerResponse;

function makeRequest(url: string | undefined): void {
	server.emit('request', {
		url,
		headers : {
			host,
		},
	} as http.IncomingMessage, response);
}

jest.mock<Partial<typeof fs>>('fs', () => ({
	existsSync : jest.fn().mockImplementation(() => exists),
	rmSync     : jest.fn(),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...paths: string[]) => paths.join('/')),
}));

jest.mock<{ open : typeof open }>('out-url', () => ({
	open : jest.fn().mockImplementation((url: string) => {
		makeRequest(url.replace('http://localhost:6006', ''));
	}),
}));

jest.mock<Partial<typeof logger>>('@anmiles/logger', () => ({
	warn : jest.fn(),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getScopesFile      : jest.fn().mockImplementation(() => scopesFile),
	getSecretsFile     : jest.fn().mockImplementation(() => secretsFile),
	getCredentialsFile : jest.fn().mockImplementation(() => credentialsFile),
	getTemplateFile    : jest.fn().mockImplementation(() => templateFile),
}));

jest.useFakeTimers();

const port        = 6006;
const host        = `localhost:${port}`;
const callbackURI = `http://${host}/oauthcallback`;

const profile          = 'username1';
const scopesFile       = 'scopes.json';
const secretsFile      = 'secrets/username1.json';
const credentialsFile  = 'secrets/username1.credentials.json';
const templateFile     = 'templates/template.json';
const wrongRedirectURI = 'wrong_redirect_uri';

const scopesError  = 'scopesError';
const secretsError = 'secretsError';

const scopesJSON: string[] = [
	'https://www.googleapis.com/auth/calendar.calendars.readonly',
	'https://www.googleapis.com/auth/calendar.events',
];

const secretsJSON: Secrets = {
	web : {
		client_id                   : 'client_id.apps.googleusercontent.com',
		project_id                  : 'project_id',
		auth_uri                    : 'https://accounts.google.com/o/oauth2/auth',
		token_uri                   : 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url : 'https://www.googleapis.com/oauth2/v1/certs',
		client_secret               : 'client_secret',
		redirect_uris               : [ callbackURI ],
	},
};

const credentialsJSON: GoogleApis.Auth.Credentials = {
	access_token : 'access_token222',
};

let json: unknown;

const code    = 'code';
const authUrl = 'https://authUrl';
const auth    = {
	generateAuthUrl : jest.fn().mockReturnValue(authUrl),
	getToken        : jest.fn().mockResolvedValue({ tokens : credentialsJSON }),
} as unknown as GoogleApis.Common.OAuth2Client;

let exists: boolean;

const getJSONSpy      = jest.spyOn(fs, 'getJSON').mockReturnValue(json);
const getJSONAsyncSpy = jest.spyOn(fs, 'getJSONAsync').mockResolvedValue(json);
const readJSONSpy     = jest.spyOn(fs, 'readJSON').mockReturnValue(json);

beforeEach(() => {
	getJSONSpy.mockReturnValue(json);
	getJSONAsyncSpy.mockResolvedValue(json);
	readJSONSpy.mockReturnValue(json);
});

describe('src/lib/secrets', () => {
	describe('getScopes', () => {
		beforeEach(() => {
			json = scopesJSON;
		});

		it('should get json from scopes file', () => {
			original.getScopes();

			expect(getJSONSpy).toHaveBeenCalled();
			expect(getJSONSpy.mock.calls[0]?.[0]).toEqual(scopesFile);
		});

		it('should fallback to error', () => {
			original.getScopes();

			expect(getJSONSpy.mock.calls[0]?.[1]).toThrow(scopesError);
		});

		it('should return scopes', () => {
			const result = original.getScopes();

			expect(result).toEqual(scopesJSON);
		});
	});

	describe('getSecrets', () => {
		beforeEach(() => {
			json = secretsJSON;
		});

		it('should get json from secrets file', () => {
			original.getSecrets(profile);

			expect(getJSONSpy).toHaveBeenCalled();
			expect(getJSONSpy.mock.calls[0]?.[0]).toEqual(secretsFile);
		});

		it('should fallback to error', () => {
			original.getSecrets(profile);

			expect(getJSONSpy.mock.calls[0]?.[1]).toThrow(secretsError);
		});

		it('should check secrets', () => {
			original.getSecrets(profile);

			expect(secrets.checkSecrets).toHaveBeenCalledWith(profile, json, secretsFile);
		});

		it('should return secrets', () => {
			const result = original.getSecrets(profile);

			expect(result).toEqual(secretsJSON);
		});
	});

	describe('getCredentials', () => {
		beforeEach(() => {
			json   = credentialsJSON;
			exists = false;
		});

		it('should get json from credentials file by default', async () => {
			await original.getCredentials(profile, auth);

			expect(getJSONAsyncSpy).toHaveBeenCalled();
			expect(getJSONAsyncSpy.mock.calls[0]?.[0]).toEqual(credentialsFile);
		});

		it('should get json from credentials file if temporariness not set', async () => {
			await original.getCredentials(profile, auth, { temporary : false });

			expect(getJSONAsyncSpy).toHaveBeenCalled();
			expect(getJSONAsyncSpy.mock.calls[0]?.[0]).toEqual(credentialsFile);
		});

		it('should not get json from credentials file if temporariness set', async () => {
			await original.getCredentials(profile, auth, { temporary : true });

			expect(getJSONAsyncSpy).not.toHaveBeenCalled();
		});

		it('should call createCredentials with consent in fallback if no existing credentials', async () => {
			exists = false;

			await original.getCredentials(profile, auth);

			expect(secrets.createCredentials).not.toHaveBeenCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0]?.[1];
			const result   = await fallback?.();

			expect(readJSONSpy).not.toHaveBeenCalled();
			expect(secrets.createCredentials).toHaveBeenCalledWith(profile, auth, undefined, 'consent');
			expect(result).toEqual(credentialsJSON);
		});

		it('should call createCredentials with consent in fallback if no existing credentials and pass temporariness', async () => {
			exists = false;

			await original.getCredentials(profile, auth, { temporary : false });

			expect(secrets.createCredentials).not.toHaveBeenCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0]?.[1];
			const result   = await fallback?.();

			expect(readJSONSpy).not.toHaveBeenCalled();
			expect(secrets.createCredentials).toHaveBeenCalledWith(profile, auth, { temporary : false }, 'consent');
			expect(result).toEqual(credentialsJSON);
		});

		it('should call createCredentials with consent in fallback if existing credentials do not have refresh token', async () => {
			exists = true;

			await original.getCredentials(profile, auth);

			expect(secrets.createCredentials).not.toHaveBeenCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0]?.[1];
			const result   = await fallback?.();

			expect(readJSONSpy).toHaveBeenCalledWith(credentialsFile);
			expect(secrets.createCredentials).toHaveBeenCalledWith(profile, auth, undefined, 'consent');
			expect(result).toEqual(credentialsJSON);
		});

		it('should call createCredentials without consent in fallback and replace refresh_token if existing credentials have refresh token', async () => {
			exists = true;
			readJSONSpy.mockReturnValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token' });

			await original.getCredentials(profile, auth);

			expect(secrets.createCredentials).not.toHaveBeenCalled();

			const fallback = getJSONAsyncSpy.mock.calls[0]?.[1];
			const result   = await fallback?.();

			expect(readJSONSpy).toHaveBeenCalledWith(credentialsFile);
			expect(result).toEqual({ ... credentialsJSON, refresh_token : 'refresh_token' });
		});

		it('should call createCredentials without consent in fallback and leave refresh token if existing credentials have refresh token', async () => {
			exists = true;
			readJSONSpy.mockReturnValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token' });
			jest.spyOn(secrets, 'createCredentials').mockResolvedValueOnce({ ...credentialsJSON, refresh_token : 'refresh_token_exists' });

			await original.getCredentials(profile, auth);

			const fallback = getJSONAsyncSpy.mock.calls[0]?.[1];
			const result   = await fallback?.();

			expect(readJSONSpy).toHaveBeenCalledWith(credentialsFile);
			expect(secrets.createCredentials).toHaveBeenCalledWith(profile, auth, undefined, undefined);
			expect(result).toEqual({ ...credentialsJSON, refresh_token : 'refresh_token_exists' });
		});
	});

	describe('validateCredentials', () => {
		it('should return false if no access token', async () => {
			expect(await original.validateCredentials({})).toEqual({ isValid : false, validationError : 'Credentials does not have access_token' });
		});

		it('should return false if no refresh token', async () => {
			expect(await original.validateCredentials({ access_token : 'token' })).toEqual({ isValid : false, validationError : 'Credentials does not have refresh_token' });
		});

		it('should return false if no expiration date', async () => {
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token' })).toEqual({ isValid : false, validationError : 'Credentials does not have expiry_date' });
		});

		it('should return true if credentials are not more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 6);
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token', expiry_date : expiryDate.getTime() })).toEqual({ isValid : true });
		});

		it('should return false if credentials are more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 8);
			expect(await original.validateCredentials({ access_token : 'token', refresh_token : 'token', expiry_date : expiryDate.getTime() })).toEqual({ isValid : false, validationError : 'Credentials expired' });
		});
	});

	describe('createCredentials', () => {
		const tokenUrl = `/request.url?code=${code}`;

		const connections = [
			{ remoteAddress : 'server', remotePort : '1001', on : jest.fn(), destroy : jest.fn() },
			{ remoteAddress : 'server', remotePort : '1002', on : jest.fn(), destroy : jest.fn() },
			{ remoteAddress : 'server', remotePort : '1003', on : jest.fn(), destroy : jest.fn() },
		];

		let endSpy: jest.SpyInstance;

		beforeEach(() => {
			server         = new EventEmitter() as typeof server;
			server.listen  = jest.fn().mockImplementation(() => {
				// always simulate opening several connections once connections are meant to be listened
				connections.forEach((connection) => server.emit('connection', connection));
			});
			server.close   = jest.fn();
			server.destroy = jest.fn();

			response     = new EventEmitter() as typeof response;
			response.end = jest.fn();

			endSpy = jest.spyOn(response, 'end');
		});

		afterAll(() => {
			endSpy.mockRestore();
		});

		it('should generate authUrl', async () => {
			void original.createCredentials(profile, auth);
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({
				access_type : 'offline',
				prompt      : undefined,
				scope      	: [
					'https://www.googleapis.com/auth/calendar.calendars.readonly',
					'https://www.googleapis.com/auth/calendar.events',
				],
			});
		});

		it('should generate authUrl and require consent if explicitly asked', async () => {
			void original.createCredentials(profile, auth, { temporary : true }, 'consent');
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({
				access_type : 'offline',
				prompt      : 'consent',
				scope      	: [
					'https://www.googleapis.com/auth/calendar.calendars.readonly',
					'https://www.googleapis.com/auth/calendar.events',
				],
			});
		});

		it('should generate authUrl with custom scopes', async () => {
			void original.createCredentials(profile, auth, { scopes : [ 'scope1', 'scope2' ] });
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({
				access_type : 'offline',
				prompt      : undefined,
				scope      	: [ 'scope1', 'scope2' ],
			});
		});

		it('should create server on 6006 port', async () => {
			void original.createCredentials(profile, auth);
			await Promise.resolve();

			expect(http.createServer).toHaveBeenCalled();
			expect(server.listen).toHaveBeenCalledWith(6006);
		});

		it('should open browser page and warn about it once listening', async () => {
			void original.createCredentials(profile, auth);
			await Promise.resolve();

			server.emit('listening');

			expect(open).toHaveBeenCalledWith('http://localhost:6006/');
			expect(logger.warn).toHaveBeenCalledWith('Please check your browser for further actions');
		});

		it('should not open browser page and warn about it until listening', async () => {
			void original.createCredentials(profile, auth);
			await Promise.resolve();

			expect(open).not.toHaveBeenCalled();
			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('should show nothing on the browser page if request.url is empty', async () => {
			void original.createCredentials(profile, auth);
			makeRequest('');
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('');
		});

		it('should show opening instructions if opened the home page', async () => {
			void original.createCredentials(profile, auth);
			makeRequest('/');
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('content = profile = username1 authUrl = https://authUrl scope = https://www.googleapis.com/auth/calendar.calendars.readonly|https://www.googleapis.com/auth/calendar.events');
		});

		it('should ask to close webpage', async () => {
			void original.createCredentials(profile, auth);
			makeRequest(tokenUrl);
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('content = done');
		});

		it('should close server and destroy all connections if request.url is truthy', async () => {
			void original.createCredentials(profile, auth);
			makeRequest(tokenUrl);
			await Promise.resolve();

			expect(server.close).toHaveBeenCalled();

			connections.forEach((connection) => {
				expect(connection.destroy).toHaveBeenCalled();
			});
		});

		it('should close server and resolve if request.url is truthy', async () => {
			const promise = original.createCredentials(profile, auth);
			makeRequest(tokenUrl);
			const result = await Promise.resolve(promise);
			expect(result).toEqual(credentialsJSON);
			expect(server.close).toHaveBeenCalledTimes(1);
		});

		it('should not close server if request.url is falsy', async () => {
			void original.createCredentials(profile, auth);
			makeRequest(undefined);
			await Promise.resolve();

			expect(server.close).not.toHaveBeenCalled();
		});

		it('should re-throw a server error if error is not EADDRINUSE', () => {
			const error = { code : 'RANDOM', message : 'random error' } as NodeJS.ErrnoException;

			void original.createCredentials(profile, auth);
			expect(() => server.emit('error', error)).toThrow(error.message);
		});

		it('should not re-throw a server error and try to listen again in 1000 seconds if error is EADDRINUSE', () => {
			const error = { code : 'EADDRINUSE' } as NodeJS.ErrnoException;

			void original.createCredentials(profile, auth);
			expect(server.listen).toHaveBeenCalledTimes(1);
			expect(() => server.emit('error', error)).not.toThrow();
			expect(server.listen).toHaveBeenCalledTimes(1);
			jest.advanceTimersByTime(1000);
			expect(server.listen).toHaveBeenCalledTimes(2);
		});

		it('should return credentials JSON', async () => {
			const promise = original.createCredentials(profile, auth);
			makeRequest(tokenUrl);
			const result = await promise;

			expect(result).toEqual(credentialsJSON);
		});
	});

	describe('deleteCredentials', () => {
		it('should delete credentials file if exists', () => {
			exists = true;
			original.deleteCredentials(profile);
			expect(fs.rmSync).toHaveBeenCalledWith(credentialsFile);
		});

		it('should not do anything if credentials file does not exist', () => {
			exists = false;
			original.deleteCredentials(profile);
			expect(fs.rmSync).not.toHaveBeenCalled();
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
			const func                            = (): true => original.checkSecrets(profile, wrongSecretsJSON, secretsFile);

			expect(func).toThrow('Error in credentials file: redirect URI should be http://localhost:6006/oauthcallback.\nsecretsError');
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
				Add scopes: https://www.googleapis.com/auth/calendar.calendars.readonly,https://www.googleapis.com/auth/calendar.events\n\
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
