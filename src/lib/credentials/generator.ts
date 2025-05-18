import http from 'http';

import { warn } from '@anmiles/logger';
import type GoogleApis from 'googleapis';
import { open } from 'out-url';
import enableDestroy from 'server-destroy';

import type { AuthOptions } from '../../types/options';
import { renderAuth, renderDone } from '../renderer';
import { getScopes } from '../scopes';

const port                = 6006;
const host                = `localhost:${port}`;
const startURI            = `http://${host}/`;
const serverRetryInterval = 1000;

export async function generateCredentials(
	profile: string,
	auth: GoogleApis.Auth.OAuth2Client,
	options?: AuthOptions,
	prompt?: GoogleApis.Auth.GenerateAuthUrlOpts['prompt'],
): Promise<GoogleApis.Auth.Credentials> {
	const scope = options?.scopes ?? getScopes();

	return new Promise((resolve) => {
		const authUrl = auth.generateAuthUrl({
			access_type: 'offline',
			prompt,
			scope,
		});

		const server = http.createServer();
		enableDestroy(server);

		server.on('request', (request, response) => {
			if (!request.url) {
				response.end('');
				return;
			}

			const url  = new URL(`http://${request.headers.host}${request.url}`);
			const code = url.searchParams.get('code');

			if (!code) {
				response.end(renderAuth({ profile, authUrl, scope }));
				return;
			}

			response.end(renderDone({ profile }));
			server.destroy();

			void (async () => {
				const { tokens } = await auth.getToken(code);
				resolve(tokens);
			})();
		});
		server.on('error', (error: NodeJS.ErrnoException) => {
			if (error.code === 'EADDRINUSE') {
				setTimeout(() => server.listen(port), serverRetryInterval);
			} else {
				throw error;
			}
		});
		server.once('listening', () => {
			warn('Please check your browser for further actions');
			void open(startURI);
		});
		server.listen(port);
	});
}
