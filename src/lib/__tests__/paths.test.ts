import type fs from 'fs';
import type path from 'path';

import type paths from '../paths';

const original = jest.requireActual<{ default : typeof paths }>('../paths').default;
jest.mock<typeof paths>('../paths', () => ({
	getProfilesFile    : jest.fn().mockImplementation(() => profilesFile),
	getScopesFile      : jest.fn().mockImplementation(() => scopesFile),
	getSecretsFile     : jest.fn().mockImplementation(() => secretsFile),
	getCredentialsFile : jest.fn().mockImplementation(() => credentialsFile),
	getTemplateFile    : jest.fn().mockImplementation(() => templateFile),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	mkdirSync     : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => exists),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...args: string[]) => args.join('/')),
}));

const profile      = 'username';
const templateName = 'auth';

const profilesFile    = 'input/profiles.json';
const scopesFile      = 'scopes.json';
const secretsFile     = 'secrets/username.json';
const credentialsFile = 'secrets/username.credentials.json';
const templateFile    = 'node_modules/@anmiles/google-api-wrapper/dist/templates/auth.html';

let exists: boolean;

describe('src/lib/paths', () => {
	describe('getProfilesFile', () => {
		it('should return profiles file', () => {
			const result = original.getProfilesFile();

			expect(result).toEqual(profilesFile);
		});
	});

	describe('getScopesFile', () => {
		it('should return scopes file', () => {
			const result = original.getScopesFile();

			expect(result).toEqual(scopesFile);
		});
	});

	describe('getSecretsFile', () => {
		it('should return secrets file', () => {
			const result = original.getSecretsFile(profile);

			expect(result).toEqual(secretsFile);
		});
	});

	describe('getCredentialsFile', () => {
		it('should return credentials file', () => {
			const result = original.getCredentialsFile(profile);

			expect(result).toEqual(credentialsFile);
		});
	});

	describe('getTemplateFile', () => {

		it('should return credentials file', () => {
			const result = original.getTemplateFile(templateName);

			expect(result).toEqual(templateFile);
		});
	});
});
