import type GoogleApis from 'googleapis';
import type { CommonOptions } from '../../types';
import { log } from '../logger';
import { sleep } from '../sleep';

export { getItems };
export default { getItems };

const requestInterval = 300;

type CommonApi<TItem> = {
	list: (
		params?: { pageToken: string | undefined },
		options?: GoogleApis.Common.MethodOptions
	) => Promise<GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>>
} & {
	list: (callback: (err: Error | null, res?: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>> | null) => void) => void
};

type CommonResponse<TItem> = {
	items?: TItem[],
	pageInfo?: {
		totalResults?: number | null | undefined
	},
	nextPageToken?: string | null | undefined
};

async function getItems<TItem>(api: CommonApi<TItem>, params: any, options?: CommonOptions): Promise<TItem[]> {
	const items: TItem[] = [];

	let pageToken: string | null | undefined = undefined;

	do {
		const response: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>> = await api.list({ ...params, pageToken });
		response.data.items?.forEach((item) => items.push(item));

		if (!options?.hideProgress) {
			log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
		}

		await sleep(requestInterval);
		pageToken = response.data.nextPageToken;
	} while (pageToken);

	return items;
}
