import fs from 'fs';

import '@anmiles/prototypes';
import type GoogleApis from 'googleapis';
import mockFs from 'mock-fs';

import { getCredentialsFile } from '../../utils/paths';
import { generateCredentials } from '../generator';
import { deleteCredentials, getCredentials } from '../index';
import { validateCredentials } from '../validator';

jest.mock('../generator');
jest.mock('../validator');

const profile         = 'username1';
const credentialsFile = getCredentialsFile(profile);

const credentials: GoogleApis.Auth.Credentials = {
	access_token: 'access_token_123',
};

const generatedCredentials: GoogleApis.Auth.Credentials = {
	access_token : 'access_token_new',
	refresh_token: 'refresh_token_new',
};

const scopes = [ 'scope1', 'scope2' ];

const authUrl = 'https://authUrl';
const auth    = { // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
	generateAuthUrl: jest.fn().mockReturnValue(authUrl),
	getToken       : jest.fn().mockResolvedValue({ tokens: credentials }),
} as unknown as GoogleApis.Common.OAuth2Client;

const generateCredentialsMock = jest.mocked(generateCredentials);
const validateCredentialsMock = jest.mocked(validateCredentials);

beforeEach(() => {
	mockFs({
		[credentialsFile]: JSON.stringify(credentials),
	});

	generateCredentialsMock.mockResolvedValue(generatedCredentials);
	validateCredentialsMock.mockReturnValue({ isValid: true });
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/credentials/index', () => {
	describe('getCredentials', () => {
		describe('on existing file', () => {
			it('should return saved credentials', async () => {
				const result = await getCredentials(profile, auth);

				expect(result).toEqual(credentials);
			});

			it('should not generate credentials', async () => {
				await getCredentials(profile, auth);

				expect(generateCredentialsMock).not.toHaveBeenCalled();
			});

			it('should call validation on saved credentials', async () => {
				await getCredentials(profile, auth);

				expect(validateCredentialsMock).toHaveBeenCalledWith(credentials);
			});
		});

		describe('on missing file', () => {
			beforeEach(() => {
				mockFs({});
			});

			it('should return generated credentials', async () => {
				const result = await getCredentials(profile, auth);

				expect(result).toEqual(generatedCredentials);
			});

			it('should generate credentials with consent', async () => {
				await getCredentials(profile, auth);

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, undefined, 'consent');
			});
			it('should generate credentials with consent and scopes', async () => {
				await getCredentials(profile, auth, { scopes });

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, { scopes }, 'consent');
			});

			it('should call validation on generated credentials', async () => {
				await getCredentials(profile, auth);

				expect(validateCredentialsMock).toHaveBeenCalledWith(generatedCredentials);
			});

			it('should throw if saved credentials do not pass validation', async () => {
				validateCredentialsMock.mockReturnValueOnce({ isValid: false, validationError: 'Test error' });

				const promise = getCredentials(profile, auth);

				await expect(promise).rejects.toEqual(new Error(`JSON created for ${credentialsFile} is not valid: Test error`));
			});
		});

		describe('on existing file with failed validation', () => {
			beforeEach(() => {
				validateCredentialsMock.mockReturnValueOnce({ isValid: false });
			});

			it('should return generated credentials', async () => {
				const result = await getCredentials(profile, auth);

				expect(result).toEqual(generatedCredentials);
			});

			it('should generate credentials with consent', async () => {
				await getCredentials(profile, auth);

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, undefined, 'consent');
			});

			it('should generate credentials with consent and scopes', async () => {
				await getCredentials(profile, auth, { scopes });

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, { scopes }, 'consent');
			});

			it('should generate credentials with no consent if existing credentials have refresh token', async () => {
				mockFs({
					[credentialsFile]: JSON.stringify({
						...credentials,
						refresh_token: 'refresh_token_123',
					}),
				});

				await getCredentials(profile, auth);

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, undefined, undefined);
			});

			it('should call validation on generated credentials', async () => {
				await getCredentials(profile, auth);

				expect(validateCredentialsMock).toHaveBeenCalledWith(generatedCredentials);
			});

			it('should throw if generated credentials do not pass validation', async () => {
				validateCredentialsMock.mockReturnValueOnce({ isValid: false, validationError: 'Test error' });

				const promise = getCredentials(profile, auth);

				await expect(promise).rejects.toEqual(new Error(`JSON created for ${credentialsFile} is not valid: Test error`));
			});
		});

		describe('temporary', () => {
			it('should return generated credentials', async () => {
				const result = await getCredentials(profile, auth, { temporary: true });

				expect(result).toEqual(generatedCredentials);
			});

			it('should generate credentials with no consent', async () => {
				await getCredentials(profile, auth, { temporary: true });

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, { temporary: true });
			});

			it('should generate credentials with scopes', async () => {
				await getCredentials(profile, auth, { scopes, temporary: true });

				expect(generateCredentialsMock).toHaveBeenCalledWith(profile, auth, { scopes, temporary: true });
			});

			it('should call validation on generated credentials', async () => {
				await getCredentials(profile, auth, { temporary: true });

				expect(validateCredentialsMock).toHaveBeenCalledWith(generatedCredentials, { temporary: true });
			});

			it('should throw if generated credentials do not pass validation', async () => {
				validateCredentialsMock.mockReturnValueOnce({ isValid: false, validationError: 'Test error' });

				const promise = getCredentials(profile, auth, { temporary: true });

				await expect(promise).rejects.toEqual(new Error('Test error'));
			});
		});
	});

	describe('deleteCredentials', () => {
		it('should delete credentials file if exists', () => {
			expect(fs.existsSync(credentialsFile)).toEqual(true);

			deleteCredentials(profile);

			expect(fs.existsSync(credentialsFile)).toEqual(false);
		});

		it('should do nothing if credentials file does not exist', () => {
			mockFs({});

			deleteCredentials(profile);

			expect(fs.existsSync(credentialsFile)).toEqual(false);
		});
	});
});
