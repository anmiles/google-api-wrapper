import http from 'http';
import enableDestroy from 'server-destroy';
import open from 'open';
import type GoogleApis from 'googleapis';
import { warn } from '@anmiles/logger';
import type { Secrets, AuthOptions } from '../types';
import { getJSON, getJSONAsync, readJSON } from './jsonLib';
import { getScopesFile, getSecretsFile, getCredentialsFile, ensureFile } from './paths';

import secrets from './secrets';

export { getSecrets, getCredentials };
export default { getScopes, getSecrets, getCredentials, validateCredentials, createCredentials, checkSecrets, getSecretsError, getScopesError };

const callbackPort    = 6006;
const startURI        = `http://localhost:${callbackPort}/`;
const callbackURI     = `http://localhost:${callbackPort}/oauthcallback`;
const tokenExpiration = 7 * 24 * 60 * 60 * 1000;

function getScopes(): string[] {
	const scopesFile = getScopesFile();
	const scopes     = getJSON<string[]>(scopesFile, () => {
		throw secrets.getScopesError(scopesFile);
	});
	return scopes;
}

function getSecrets(profile: string): Secrets {
	const secretsFile   = getSecretsFile(profile);
	const secretsObject = getJSON<Secrets>(secretsFile, () => {
		throw secrets.getSecretsError(profile, secretsFile);
	});
	secrets.checkSecrets(profile, secretsObject, secretsFile);
	return secretsObject;
}

async function getCredentials(profile: string, auth: GoogleApis.Common.OAuth2Client, options?: AuthOptions): Promise<GoogleApis.Auth.Credentials> {
	const credentialsFile = getCredentialsFile(profile);

	if (options?.temporary) {
		return secrets.createCredentials(profile, auth, options);
	}

	return getJSONAsync(credentialsFile, async () => {
		// eslint-disable-next-line camelcase
		const refresh_token = ensureFile(credentialsFile) ? readJSON<GoogleApis.Auth.Credentials>(credentialsFile).refresh_token : undefined;
		// eslint-disable-next-line camelcase
		const credentials = await secrets.createCredentials(profile, auth, options, refresh_token ? undefined : 'consent');
		// eslint-disable-next-line camelcase
		return { refresh_token, ...credentials };
	}, secrets.validateCredentials);
}

async function validateCredentials(credentials: GoogleApis.Auth.Credentials): Promise<boolean> {
	if (!credentials.access_token) {
		return false;
	}

	if (!credentials.refresh_token) {
		return false;
	}

	if (!credentials.expiry_date) {
		return true;
	}

	return new Date().getTime() - credentials.expiry_date < tokenExpiration;
}

async function createCredentials(profile: string, auth: GoogleApis.Auth.OAuth2Client, options?: AuthOptions, prompt?: GoogleApis.Auth.GenerateAuthUrlOpts['prompt']): Promise<GoogleApis.Auth.Credentials> {
	const scope = options?.scopes || secrets.getScopes();

	return new Promise((resolve) => {
		const authUrl = auth.generateAuthUrl({
			// eslint-disable-next-line camelcase
			access_type : 'offline',
			prompt,
			scope,
		});

		const server = http.createServer(async (request, response) => {
			if (!request.url) {
				response.end('');
				return;
			}

			const url  = new URL(`http://${request.headers.host}${request.url}`);
			const code = url.searchParams.get('code');

			if (!code) {
				const scopesList = scope.map((s) => `<li>${s}</li>`).join('');
				response.end(formatMessage(`<p>Please open <a href="${authUrl}">auth page</a> using <strong>${profile}</strong> google profile</p>\n<p>Required scopes:</p>\n<ul>${scopesList}</ul>`));
				return;
			}

			response.end(formatMessage('<p>Please close this page and return to application</p>'));
			server.destroy();
			const { tokens } = await auth.getToken(code);
			resolve(tokens);
		});

		enableDestroy(server);
		server.listen(callbackPort);
		warn('Please check your browser for further actions');
		open(startURI);
	});
}

function formatMessage(message: string): string {
	return [
		'<div style="width: 100%;height: 100%;display: flex;align-items: start;justify-content: center">',
		'<div style="padding: 0 1em;border: 1px solid black;font-family: Arial, sans-serif;margin: 1em;">',
		message,
		'</div>',
		'</div>',
	].join('\n');
}

function checkSecrets(profile: string, secretsObject: Secrets, secretsFile: string): true | void {
	if (secretsObject.web.redirect_uris[0] === callbackURI) {
		return true;
	}
	throw `Error in credentials file: redirect URI should be ${callbackURI}.\n${secrets.getSecretsError(profile, secretsFile)}`;
}

function getScopesError(scopesFile: string) {
	return [
		`File ${scopesFile} not found!`,
		`This application had to have pre-defined file ${scopesFile} that will declare needed scopes`,
	].join('\n');
}

function getSecretsError(profile: string, secretsFile: string) {
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
