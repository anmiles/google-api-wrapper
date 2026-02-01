import { log, warn } from '@anmiles/logger';
import '@anmiles/prototypes';
import sleep from '@anmiles/sleep';
import type GoogleApis from 'googleapis';

import type { AuthOptions, CommonOptions } from '../types/options';

import { getAuth } from './auth';
import { deleteCredentials } from './credentials';

const requestInterval = 300;

type ListParams = Record<string, unknown> & {
	pageToken: string | undefined;
};

interface CommonAPI<TItem> {
	list: {
		(
			params?: ListParams,
			options?: GoogleApis.Common.MethodOptions
		): Promise<GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>>;
		(
			callback: (err: Error | null, res?: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>> | null) => void
		): void;
	};
}

export interface CommonResponse<TItem> {
	items?: TItem[];
	pageInfo?: {
		totalResults?: number | null | undefined;
	};
	nextPageToken?: string | null | undefined;
}

export class API<TGoogleAPI> {
	private constructor(
		public api: TGoogleAPI,
		private auth: GoogleApis.Common.OAuth2Client,
		private readonly getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI,
		private readonly profile: string,
		private readonly authOptions?: AuthOptions,
	) {	}

	static async init<TGoogleAPI>(
		getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI,
		profile: string,
		authOptions?: AuthOptions,
	): Promise<API<TGoogleAPI>> {
		const { api, auth } = await resetAuth(getter, profile, authOptions);
		return new API<TGoogleAPI>(api, auth, getter, profile, authOptions);
	}

	async getItems<TItem>(selectAPI: (api: TGoogleAPI) => CommonAPI<TItem>, params: object, options?: CommonOptions): Promise<TItem[]> {
		const items: TItem[] = [];

		let pageToken: string | null | undefined = undefined;

		do {
			let response: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>;

			try {
				const selectedAPI = selectAPI(this.api);

				response = await selectedAPI.list({ ...params, pageToken });
			} catch (ex) {
				const { message } = Error.parse(ex);

				if ((message === 'invalid_grant' || message === 'Invalid credentials') && !this.authOptions?.temporary) {
					warn('Access token stored is invalid, re-creating...');
					deleteCredentials(this.profile);
					const { api, auth } = await resetAuth(this.getter, this.profile, this.authOptions);

					this.api  = api;
					this.auth = auth;
					return this.getItems(selectAPI, params, options);
				} else {
					throw ex;
				}
			}

			response.data.items?.forEach((item) => items.push(item));

			if (!options?.hideProgress) {
				log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults ?? 'many'})...`);
			}

			await sleep(requestInterval);
			pageToken = response.data.nextPageToken;
		} while (pageToken);

		return items;
	}
}

export async function getAPI<TGoogleAPI>(
	getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI,
	profile: string,
	authOptions?: AuthOptions,
): Promise<API<TGoogleAPI>> {
	if (!authOptions?.temporary) {
		const writableScopes = authOptions?.scopes?.filter((scope) => !scope.endsWith('.readonly')) ?? [];

		if (writableScopes.length > 0) {
			warn(`WARNING: trying to create permanent credentials using non-readonly scopes (${writableScopes.join(', ')}). Permanent credentials will be stored in the file and potentially might be re-used to modify your data`);
		}
	}

	return API.init<TGoogleAPI>(getter, profile, authOptions);
}

async function resetAuth<TGoogleAPI>(
	getter: (auth: GoogleApis.Common.OAuth2Client) => TGoogleAPI,
	profile: string,
	authOptions?: AuthOptions,
): Promise<{
	api: TGoogleAPI;
	readonly auth: GoogleApis.Common.OAuth2Client;
}> {
	const auth = await getAuth(profile, authOptions);
	const api  = getter(auth);
	return { api, auth };
}
