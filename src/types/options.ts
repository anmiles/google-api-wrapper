interface CommonOptions {
	hideProgress? : boolean;
}

interface AuthOptions {
	temporary? : boolean;
	scopes?    : string[];
}

export type { CommonOptions, AuthOptions };
