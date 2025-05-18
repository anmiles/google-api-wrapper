import '@anmiles/prototypes';
import mockFs from 'mock-fs';

import type { Secrets } from '../../types/secrets';
import { getScopes } from '../scopes';
import { getSecrets } from '../secrets';
import { getSecretsFile } from '../utils/paths';

jest.mock('../scopes');

const profile = 'username1';

const secretsFile = getSecretsFile(profile);

function createSecrets(callbackURI: string): Secrets {
	return {
		web: {
			client_id                  : 'client_id.apps.googleusercontent.com',
			project_id                 : 'project_id',
			auth_uri                   : 'https://accounts.google.com/o/oauth2/auth',
			token_uri                  : 'https://oauth2.googleapis.com/token',
			auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
			client_secret              : 'client_secret',
			redirect_uris              : [ callbackURI ],
		},
	};
}

const port = 6006;
const host = `localhost:${port}`;

const secrets          = createSecrets(`http://${host}/oauthcallback`);
const incorrectSecrets = createSecrets('wrong_redirect_uri');

const scopes = [ 'scope1', 'scope2' ];

jest.mocked(getScopes).mockReturnValue(scopes);

beforeEach(() => {
	mockFs({
		[secretsFile]: JSON.stringify(secrets),
	});
});

afterAll(() => {
	mockFs.restore();
});

describe('src/lib/secrets', () => {
	describe('getSecrets', () => {
		it('should return secrets', () => {
			const result = getSecrets(profile);

			expect(result).toEqual(secrets);
		});

		it('should throw if no secrets file', () => {
			mockFs({});

			const func = (): Secrets => getSecrets(profile);

			expect(func).toThrowErrorMatchingSnapshot();
		});

		it('should throw if callbackURI is incorrect', () => {
			mockFs({
				[secretsFile]: JSON.stringify(incorrectSecrets),
			});

			const func = (): Secrets => getSecrets(profile);

			expect(func).toThrowErrorMatchingSnapshot();
		});
	});
});
