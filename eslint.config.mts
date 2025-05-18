import { configs } from '@anmiles/eslint-config';
import type { Linter } from 'eslint';

export default [
	...configs.base,
	...configs.ts,
	...configs.jest,

	{
		ignores: [
			'coverage/*',
			'dist/*',
		],
	},

	{
		languageOptions: {
			globals: {
				NodeJS: true,
			},
		},
	},

	{
		rules: {
			camelcase: [ 'error', { allow: [
				'access_token',
				'access_type',
				'auth_provider_x509_cert_url',
				'auth_uri',
				'calendar_v3',
				'client_id',
				'client_secret',
				'expiry_date',
				'project_id',
				'redirect_uris',
				'refresh_token',
				'token_uri',
			] } ],
		},
	},
] as Linter.Config[];

