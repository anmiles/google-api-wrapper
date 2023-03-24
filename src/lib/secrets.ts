import http from 'http';
import * as colorette from 'colorette';
import type GoogleApis from 'googleapis';
import type { Secrets, AuthOptions } from '../types';
import { getJSON, getJSONAsync } from './jsonLib';
import { info, error } from './logger';
import { getScopesFile, getSecretsFile, getCredentialsFile } from './paths';

import secrets from './secrets';

export { getSecrets, getCredentials };
export default { getScopes, getSecrets, getCredentials, createCredentials, checkSecrets, getSecretsError, getScopesError };

const callbackPort = 6006;
const callbackURI  = `http://localhost:${callbackPort}/oauthcallback`;

function getScopes(): string[] {
	const scopesFile = getScopesFile();
	const scopes     = getJSON<string[]>(scopesFile, () => error(secrets.getScopesError(scopesFile)) as never);
	return scopes;
}

function getSecrets(profile: string): Secrets {
	const secretsFile   = getSecretsFile(profile);
	const secretsObject = getJSON<Secrets>(secretsFile, () => error(secrets.getSecretsError(profile, secretsFile)) as never);
	secrets.checkSecrets(profile, secretsObject, secretsFile);
	return secretsObject;
}

async function getCredentials(profile: string, auth: GoogleApis.Common.OAuth2Client, options?: AuthOptions): Promise<GoogleApis.Auth.Credentials> {
	const credentialsFile = getCredentialsFile(profile);

	return options?.temporary
		? secrets.createCredentials(profile, auth, options)
		: getJSONAsync(credentialsFile, () => secrets.createCredentials(profile, auth, options));
}

async function createCredentials(profile: string, auth: GoogleApis.Auth.OAuth2Client, options?: AuthOptions): Promise<GoogleApis.Auth.Credentials> {
	const scope = options?.scopes || secrets.getScopes();

	return new Promise((resolve) => {
		const authUrl = auth.generateAuthUrl({
			// eslint-disable-next-line camelcase
			access_type : 'offline',
			scope,
		});

		const server = http.createServer(async (request, response) => {
			response.end('<h1>Please close this page and return to application. Wait for application to be finished automatically.</h1>');

			if (request.url) {
				const url  = new URL(`http://${request.headers.host}${request.url}`);
				const code = url.searchParams.get('code');

				if (!code) {
					return;
				}

				server.close();
				const { tokens } = await auth.getToken(code);
				resolve(tokens);
			}
		});

		server.listen(callbackPort);
		info(`Please open ${colorette.yellow(authUrl)} in your browser using google profile for ${colorette.yellow(profile)} and allow access to ${colorette.yellow(scope.join(','))}`);
	});
}

function checkSecrets(profile: string, secretsObject: Secrets, secretsFile: string): true | void {
	if (secretsObject.web.redirect_uris[0] === callbackURI) {
		return true;
	}
	error(`Error in credentials file: redirect URI should be ${callbackURI}.\n${secrets.getSecretsError(profile, secretsFile)}`);
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
