interface Secrets {
	web: {
		client_id                   : `${string}.apps.googleusercontent.com`;
		project_id                  : string;
		auth_uri                    : 'https://accounts.google.com/o/oauth2/auth';
		token_uri                   : 'https://oauth2.googleapis.com/token';
		auth_provider_x509_cert_url : 'https://www.googleapis.com/oauth2/v1/certs';
		client_secret               : string;
		redirect_uris               : string[];
	};
}

export type { Secrets };
