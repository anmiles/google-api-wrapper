import fs from 'fs';

import '@anmiles/prototypes';

import type { Secrets } from '../types/secrets';

import { getScopes } from './scopes';
import { getSecretsFile } from './utils/paths';

const port        = 6006;
const host        = `localhost:${port}`;
const callbackURI = `http://${host}/oauthcallback`;

function checkSecrets(secretsObject: Secrets): true {
	if (secretsObject.web.redirect_uris[0] === callbackURI) {
		return true;
	}
	throw new Error(`Error in credentials file: redirect URI should be ${callbackURI}`);
}

export function getSecrets(profile: string): Secrets {
	const secretsFile   = getSecretsFile(profile);
	const secretsObject = fs.getJSON<Secrets>(secretsFile, () => {
		throw new Error(getSecretsError(profile, secretsFile));
	});
	checkSecrets(secretsObject);
	return secretsObject;
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
		`\t\t\t\tAdd scopes: ${getScopes().join(',')}`,
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
