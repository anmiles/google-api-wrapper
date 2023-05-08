import fs from 'fs';
import path from 'path';

import paths from '../paths';
const original = jest.requireActual('../paths').default as typeof paths;
jest.mock<typeof paths>('../paths', () => ({
	getProfilesFile    : jest.fn().mockImplementation(() => profilesFile),
	getScopesFile      : jest.fn().mockImplementation(() => scopesFile),
	getSecretsFile     : jest.fn().mockImplementation(() => secretsFile),
	getCredentialsFile : jest.fn().mockImplementation(() => credentialsFile),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	mkdirSync     : jest.fn(),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => exists),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join    : jest.fn().mockImplementation((...args) => args.join('/')),
	dirname : jest.fn().mockImplementation((arg) => arg.split('/').slice(0, -1).join('/')),
}));

const profile         = 'username';
const profilesFile    = 'input/profiles.json';
const scopesFile      = 'scopes.json';
const secretsFile     = 'secrets/username.json';
const credentialsFile = 'secrets/username.credentials.json';

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
});
