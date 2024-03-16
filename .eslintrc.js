module.exports = {
	root : true,

	extends : [
		'./node_modules/@anmiles/eslint-config/src/base.preset.js',
		'./node_modules/@anmiles/eslint-config/src/ts.preset.js',
		'./node_modules/@anmiles/eslint-config/src/jest.preset.js',
	],

	globals : {
		NodeJS : true,
	},

	rules : {
		camelcase : [ 'error', { allow : [
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
};
