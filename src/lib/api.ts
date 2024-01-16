import type GoogleApis from 'googleapis';
import { log, warn } from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import type { AuthOptions, CommonOptions } from '../types';
import { getAuth } from './auth';
import { deleteCredentials } from './secrets';

const requestInterval = 300;

type CommonAPI<TItem> = {
	list: {
		(params?: { pageToken: string | undefined }, options?: GoogleApis.Common.MethodOptions): Promise<GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>>;
		(callback: (err: Error | null, res?: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>> | null) => void): void;
	}
};

type CommonResponse<TItem> = {
	items?: TItem[],
	pageInfo?: {
		totalResults?: number | null | undefined
	},
	nextPageToken?: string | null | undefined
};

class API<TGoogleAPI> {
	private auth: GoogleApis.Common.OAuth2Client | undefined;
	api: TGoogleAPI | undefined;

	constructor(
		private getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI,
		private profile: string,
		private authOptions?: AuthOptions,
	) {	}

	async init() {
		this.auth = await getAuth(this.profile, this.authOptions);
		this.api  = this.getter(this.auth);
	}

	async getItems<TItem>(selectAPI: (api: TGoogleAPI) => CommonAPI<TItem>, params: any, options?: CommonOptions): Promise<TItem[]> {
		const items: TItem[] = [];

		let pageToken: string | null | undefined = undefined;

		do {
			let response: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>;

			try {
				if (!this.api) {
					throw 'API is not initialized. Call `init` before getting items.';
				}

				const selectedAPI = selectAPI(this.api);

				response = await selectedAPI.list({ ...params, pageToken });
			} catch (ex) {
				const message = ex instanceof Error ? ex.message : ex as string;

				if ((message === 'invalid_grant' || message === 'Invalid credentials') && !this.authOptions?.temporary) {
					warn('Access token stored is invalid, re-creating...');
					deleteCredentials(this.profile);
					await this.init();
					return this.getItems(selectAPI, params, options);
				} else {
					throw ex;
				}
			}

			response.data.items?.forEach((item) => items.push(item));

			if (!options?.hideProgress) {
				log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
			}

			await sleep(requestInterval);
			pageToken = response.data.nextPageToken;
		} while (pageToken);

		return items;
	}
}

async function getAPI<TGoogleAPI>(getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI, profile: string, authOptions?: AuthOptions): Promise<API<TGoogleAPI>> {
	if (!authOptions?.temporary) {
		const writableScopes = authOptions?.scopes?.filter((scope) => !scope.endsWith('.readonly')) || [];

		if (writableScopes.length > 0) {
			warn(`WARNING: trying to create permanent credentials using non-readonly scopes (${writableScopes}). Permanent credentials will be stored in the file and potentially might be re-used to modify your data`);
		}
	}

	const instance = new API<TGoogleAPI>(getter, profile, authOptions);
	await instance.init();
	return instance;
}

export { getAPI };
export default { getAPI, API };
