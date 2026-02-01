import EventEmitter from 'events';
import http from 'http';

import logger from '@anmiles/logger';
import '@anmiles/prototypes';
import type GoogleApis from 'googleapis';
import mockFs from 'mock-fs';
import { open } from 'out-url';

import { renderAuth, renderDone } from '../../renderer';
import { getScopes } from '../../scopes';
import { getCredentialsFile } from '../../utils/paths';
import { generateCredentials } from '../generator';

jest.mock('http');
jest.mock('@anmiles/logger');
jest.mock('out-url');
jest.mock('../../renderer');
jest.mock('../../scopes');

jest.mock<Partial<typeof http>>('http', () => ({
	createServer: jest.fn().mockImplementation(() => server),
}));

let server: http.Server;
let response: http.ServerResponse;

function makeRequest(url: string | undefined): void {
	server.emit('request', { // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
		url,
		headers: {
			host,
		},
	} as http.IncomingMessage, response);
}

const port = 6006;
const host = `localhost:${port}`;

const profile         = 'username1';
const credentialsFile = getCredentialsFile(profile);

const credentials: GoogleApis.Auth.Credentials = {
	access_token: 'access_token_123',
};

const code = 'code';

const authUrl = 'https://authUrl';
const auth    = { // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
	generateAuthUrl: jest.fn().mockReturnValue(authUrl),
	getToken       : jest.fn().mockResolvedValue({ tokens: credentials }),
} as unknown as GoogleApis.Common.OAuth2Client;

server = new EventEmitter() as typeof server; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

jest.mocked(http.createServer).mockImplementation(() => server);
// eslint-disable-next-line @typescript-eslint/require-await
jest.mocked(open).mockImplementation(async (url: string) => makeRequest(url.replace('http://localhost:6006', '')));

jest.useFakeTimers();

jest.mocked(renderAuth).mockImplementation((
	{ profile, authUrl, scope }: { profile: string; authUrl: string; scope: string[] },
) => `content = profile = ${profile} authUrl = ${authUrl} scope = ${scope.join('|')}`);

jest.mocked(renderDone).mockReturnValue('content = done');

jest.mocked(getScopes).mockReturnValue([ 'scope1', 'scope2' ]);

beforeEach(() => {
	mockFs({
		[credentialsFile]: JSON.stringify(credentials),
	});
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/credentials/generator', () => {
	describe('generateCredentials', () => {
		const tokenUrl = `/request.url?code=${code}`;

		const connections = [
			{ remoteAddress: 'server', remotePort: '1001', on: jest.fn(), destroy: jest.fn() },
			{ remoteAddress: 'server', remotePort: '1002', on: jest.fn(), destroy: jest.fn() },
			{ remoteAddress: 'server', remotePort: '1003', on: jest.fn(), destroy: jest.fn() },
		];

		let endSpy: jest.SpyInstance;

		beforeEach(() => {
			server         = new EventEmitter() as typeof server; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
			server.listen  = jest.fn().mockImplementation(() => {
				// always simulate opening several connections once connections are meant to be listened
				connections.forEach((connection) => server.emit('connection', connection));
			});
			server.close   = jest.fn();
			server.destroy = jest.fn();

			response     = new EventEmitter() as typeof response; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
			response.end = jest.fn();

			endSpy = jest.spyOn(response, 'end');
		});

		afterAll(() => {
			endSpy.mockRestore();
		});

		it('should generate authUrl', async () => {
			void generateCredentials(profile, auth);
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({ // eslint-disable-line @typescript-eslint/unbound-method
				access_type: 'offline',
				prompt     : undefined,
				scope     	: [ 'scope1', 'scope2' ],
			});
		});

		it('should generate authUrl and require consent if explicitly asked', async () => {
			void generateCredentials(profile, auth, { temporary: true }, 'consent');
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({ // eslint-disable-line @typescript-eslint/unbound-method
				access_type: 'offline',
				prompt     : 'consent',
				scope     	: [ 'scope1', 'scope2' ],
			});
		});

		it('should generate authUrl with custom scopes', async () => {
			void generateCredentials(profile, auth, { scopes: [ 'scope1', 'scope2' ] });
			await Promise.resolve();

			expect(auth.generateAuthUrl).toHaveBeenCalledWith({ // eslint-disable-line @typescript-eslint/unbound-method
				access_type: 'offline',
				prompt     : undefined,
				scope     	: [ 'scope1', 'scope2' ],
			});
		});

		it('should create server on 6006 port', async () => {
			void generateCredentials(profile, auth);
			await Promise.resolve();

			expect(http.createServer).toHaveBeenCalled();
			expect(server.listen).toHaveBeenCalledWith(6006); // eslint-disable-line @typescript-eslint/unbound-method
		});

		it('should open browser page and warn about it once listening', async () => {
			void generateCredentials(profile, auth);
			await Promise.resolve();

			server.emit('listening');

			expect(open).toHaveBeenCalledWith('http://localhost:6006/');
			expect(logger.warn).toHaveBeenCalledWith('Please check your browser for further actions');
		});

		it('should not open browser page and warn about it until listening', async () => {
			void generateCredentials(profile, auth);
			await Promise.resolve();

			expect(open).not.toHaveBeenCalled();
			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('should show nothing on the browser page if request.url is empty', async () => {
			void generateCredentials(profile, auth);
			makeRequest('');
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('');
		});

		it('should show opening instructions if opened the home page', async () => {
			void generateCredentials(profile, auth);
			makeRequest('/');
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('content = profile = username1 authUrl = https://authUrl scope = scope1|scope2');
		});

		it('should ask to close webpage', async () => {
			void generateCredentials(profile, auth);
			makeRequest(tokenUrl);
			await Promise.resolve();

			expect(endSpy).toHaveBeenCalledWith('content = done');
		});

		it('should close server and destroy all connections if request.url is truthy', async () => {
			void generateCredentials(profile, auth);
			makeRequest(tokenUrl);
			await Promise.resolve();

			expect(server.close).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method

			connections.forEach((connection) => {
				expect(connection.destroy).toHaveBeenCalled();
			});
		});

		it('should close server and resolve if request.url is truthy', async () => {
			const promise = generateCredentials(profile, auth);
			makeRequest(tokenUrl);
			const result = await Promise.resolve(promise);
			expect(result).toEqual(credentials);
			expect(server.close).toHaveBeenCalledTimes(1); // eslint-disable-line @typescript-eslint/unbound-method
		});

		it('should not close server if request.url is falsy', async () => {
			void generateCredentials(profile, auth);
			makeRequest(undefined);
			await Promise.resolve();

			expect(server.close).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
		});

		it('should re-throw a server error if error is not EADDRINUSE', () => {
			const error = { code: 'RANDOM', message: 'random error' } as NodeJS.ErrnoException; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

			void generateCredentials(profile, auth);
			expect(() => server.emit('error', error)).toThrow(error.message);
		});

		it('should not re-throw a server error and try to listen again in 1000 seconds if error is EADDRINUSE', () => {
			const error = { code: 'EADDRINUSE' } as NodeJS.ErrnoException; // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

			void generateCredentials(profile, auth);
			expect(server.listen).toHaveBeenCalledTimes(1); // eslint-disable-line @typescript-eslint/unbound-method
			expect(() => server.emit('error', error)).not.toThrow();
			expect(server.listen).toHaveBeenCalledTimes(1); // eslint-disable-line @typescript-eslint/unbound-method
			jest.advanceTimersByTime(1000);
			expect(server.listen).toHaveBeenCalledTimes(2); // eslint-disable-line @typescript-eslint/unbound-method
		});

		it('should return credentials JSON', async () => {
			const promise = generateCredentials(profile, auth);
			makeRequest(tokenUrl);
			const result = await promise;

			expect(result).toEqual(credentials);
		});
	});
});
