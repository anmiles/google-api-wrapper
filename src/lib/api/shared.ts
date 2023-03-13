import type GoogleApis from 'googleapis';
import { log } from '../logger';
import { sleep } from '../sleep';

export { getItems };
export default { getItems };

type CommonApi<TArgs, TResponse> = {
	list: (
		params: TArgs & {pageToken: string | undefined},
		options?: GoogleApis.Common.MethodOptions | undefined
	) => Promise<GoogleApis.Common.GaxiosResponse<TResponse>>
};

type CommonResponse<TItem> = {
	items?: TItem[],
	pageInfo?: {
		totalResults?: number | null | undefined
	},
	nextPageToken?: string | null | undefined
};

const requestInterval = 300;

async function getItems<
	TApi extends CommonApi<TArgs, TResponse>,
	TItem,
	TArgs,
	TResponse extends CommonResponse<TItem>
>(api: TApi, args: TArgs, showProgress: boolean = false): Promise<TItem[]> {
	const items: TItem[] = [];

	let pageToken: string | null | undefined = undefined;

	do {
		const response: GoogleApis.Common.GaxiosResponse<TResponse> = await api.list({ ...args, pageToken });
		response.data.items?.forEach((item) => items.push(item));

		if (showProgress) {
			log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
		}

		pageToken = response.data.nextPageToken;
		await sleep(requestInterval);
	} while (pageToken);

	return items;
}
