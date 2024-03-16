import fs from 'fs';
import http from 'http';
import { open } from 'out-url';
import enableDestroy from 'server-destroy';
import type GoogleApis from 'googleapis';
import { warn } from '@anmiles/logger';
import type { Secrets } from '../types/secrets';
import type { AuthOptions } from '../types/options';
import '@anmiles/prototypes';
import { getScopesFile, getSecretsFile, getCredentialsFile } from './paths';
import { renderAuth, renderDone } from './renderer';

import secrets from './secrets';

const port                = 6006;
const host                = `localhost:${port}`;
const startURI            = `http://${host}/`;
const callbackURI         = `http://${host}/oauthcallback`;
const tokenExpiration     = 7 * 24 * 60 * 60 * 1000;
const serverRetryInterval = 1000;

function getScopes(): string[] {
	const scopesFile = getScopesFile();
	const scopes     = fs.getJSON<string[]>(scopesFile, () => {
		throw new Error(secrets.getScopesError(scopesFile));
	});
	return scopes;
}

function getSecrets(profile: string): Secrets {
	const secretsFile   = getSecretsFile(profile);
	const secretsObject = fs.getJSON<Secrets>(secretsFile, () => {
		throw new Error(secrets.getSecretsError(profile, secretsFile));
	});
	secrets.checkSecrets(profile, secretsObject, secretsFile);
	return secretsObject;
}

async function getCredentials(profile: string, auth: GoogleApis.Common.OAuth2Client, options?: AuthOptions): Promise<GoogleApis.Auth.Credentials> {
	const credentialsFile = getCredentialsFile(profile);

	if (options?.temporary) {
		return secrets.createCredentials(profile, auth, options);
	}

	return fs.getJSONAsync(credentialsFile, async () => {
		const refreshToken = fs.existsSync(credentialsFile) ? fs.readJSON<GoogleApis.Auth.Credentials>(credentialsFile).refresh_token : undefined;
		const credentials  = await secrets.createCredentials(profile, auth, options, refreshToken ? undefined : 'consent');
		return { refresh_token : refreshToken, ...credentials };
	}, secrets.validateCredentials);
}

// eslint-disable-next-line @typescript-eslint/require-await -- pass sync function into async context
async function validateCredentials(credentials: GoogleApis.Auth.Credentials): Promise<{ isValid : boolean; validationError? : string }> {
	if (!credentials.access_token) {
		return { isValid : false, validationError : 'Credentials does not have access_token' };
	}

	if (!credentials.refresh_token) {
		return { isValid : false, validationError : 'Credentials does not have refresh_token' };
	}

	if (!credentials.expiry_date) {
		return { isValid : false, validationError : 'Credentials does not have expiry_date' };
	}

	if (new Date().getTime() - credentials.expiry_date >= tokenExpiration) {
		return { isValid : false, validationError : 'Credentials expired' };
	}

	return { isValid : true };
}

async function createCredentials(profile: string, auth: GoogleApis.Auth.OAuth2Client, options?: AuthOptions, prompt?: GoogleApis.Auth.GenerateAuthUrlOpts['prompt']): Promise<GoogleApis.Auth.Credentials> {
	const scope = options?.scopes ?? secrets.getScopes();

	return new Promise((resolve) => {
		const authUrl = auth.generateAuthUrl({
			access_type : 'offline',
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

function deleteCredentials(profile: string): void {
	const credentialsFile = getCredentialsFile(profile);

	if (fs.existsSync(credentialsFile)) {
		fs.rmSync(credentialsFile);
	}
}

function checkSecrets(profile: string, secretsObject: Secrets, secretsFile: string): true {
	if (secretsObject.web.redirect_uris[0] === callbackURI) {
		return true;
	}
	throw new Error(`Error in credentials file: redirect URI should be ${callbackURI}.\n${secrets.getSecretsError(profile, secretsFile)}`);
}

function getScopesError(scopesFile: string): string {
	return [
		`File ${scopesFile} not found!`,
		`This application had to have pre-defined file ${scopesFile} that will declare needed scopes`,
	].join('\n');
}

function getSecretsError(profile: string, secretsFile: string): string {
	return [
		`File ${secretsFile} not found!`,
		'Here is how to obtain it:',
		'\tGo to https://console.cloud.google.com/projectcreate',
		'\t\tChoose project name',
		'\t\tClick "CREATE" and wait for project to become created',
		'\tGo to https://console.cloud.google.com/apis/dashboard',
		'\t\tSelect just created project in the top left dropdown list',
		'\t\tClick "ENABLE APIS AND SERVICES"',
		'\t\t\tClick API you need',
		'\t\t\tClick "ENABLE" and wait for API to become enabled',
		'\t\tClick "Credentials" tab on the left sidebar',
		'\t\t\tClick "CONFIGURE CONSENT SCREEN" on the right',
		'\t\t\t\tChoose "External"',
		'\t\t\t\tClick "CREATE"',
		'\t\t\t\tChoose app name, i.e. "NodeJS"',
		'\t\t\t\tSpecify your email as user support email and as developer contact information on the very bottom',
		'\t\t\t\tClick "Save and continue"',
		'\t\t\tClick "Add or remove scopes"',
		`\t\t\t\tAdd scopes: ${secrets.getScopes().join(',')}`,
		'\t\t\t\tClick "Save and continue"',
		'\t\t\tClick "Add users"',
		'\t\t\t\tAdd your email',
		'\t\t\t\tClick "Save and continue"',
		'\t\t\tClick "Back to dashboard" on the very bottom',
		'\t\tClick "Credentials" on the left sidebar',
		'\t\t\tClick "CREATE CREDENTIALS" and choose "OAuth client ID"',
		'\t\t\t\tSelect application type "Web application"',
		'\t\t\t\tSpecify app name, i.e. "NodeJS"',
		`\t\t\t\tAdd authorized redirect URI: ${callbackURI}`,
		'\t\t\t\tClick "CREATE"',
		`\t\t\t\tClick "DOWNLOAD JSON" and download credentials to ./secrets/${profile}.json`,
		'Then start this script again',
	].join('\n');
}

export { getSecrets, getCredentials, deleteCredentials };
export default { getScopes, getSecrets, getCredentials, validateCredentials, createCredentials, deleteCredentials, checkSecrets, getSecretsError, getScopesError };
