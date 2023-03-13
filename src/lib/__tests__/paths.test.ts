import fs from 'fs';
import path from 'path';

import paths from '../paths';
const original = jest.requireActual('../paths').default as typeof paths;
jest.mock<typeof paths>('../paths', () => ({
	ensureDir          : jest.fn().mockImplementation((dirPath) => dirPath),
	ensureFile         : jest.fn().mockImplementation((filePath) => filePath),
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

const profile  = 'username';
const dirPath  = 'dirPath';
const filePath = 'parentDir/filePath';

const profilesFile    = 'input/profiles.json';
const scopesFile      = 'scopes.json';
const secretsFile     = 'secrets/username.json';
const credentialsFile = 'secrets/username.credentials.json';

let exists: boolean;

describe('src/lib/paths', () => {

	describe('ensureDir', () => {
		it('should create empty dir if not exists', () => {
			exists = false;

			original.ensureDir(dirPath);

			expect(fs.mkdirSync).toBeCalledWith(dirPath, { recursive : true });
		});

		it('should not create empty dir if already exists', () => {
			exists = true;

			original.ensureDir(dirPath);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return dirPath', () => {
			const result = original.ensureDir(dirPath);

			expect(result).toEqual(dirPath);
		});
	});

	describe('ensureFile', () => {
		it('should ensure parent dir', () => {
			exists = false;

			original.ensureFile(filePath);

			expect(paths.ensureDir).toBeCalledWith('parentDir');
		});

		it('should create empty file if not exists', () => {
			exists = false;

			original.ensureFile(filePath);

			expect(fs.writeFileSync).toBeCalledWith(filePath, '');
		});

		it('should not create empty file if already exists', () => {
			exists = true;

			original.ensureFile(filePath);

			expect(fs.writeFileSync).not.toBeCalled();
		});

		it('should return filePath', () => {
			const result = original.ensureFile(filePath);

			expect(result).toEqual(filePath);
		});
	});

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
