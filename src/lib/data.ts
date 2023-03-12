import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { getAuth } from './auth';
import data from './data';
import { log } from './logger';
import { sleep } from './sleep';

export { getEvents, getVideos };
export default { getData, getEvents, getVideos };

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

async function getData<
	TApi extends CommonApi<TArgs, TResponse>,
	TItem,
	TArgs,
	TResponse extends CommonResponse<TItem>
>(api: TApi, args: TArgs): Promise<TItem[]> {
	const items: TItem[] = [];

	let pageToken: string | null | undefined = undefined;

	do {
		const response: GoogleApis.Common.GaxiosResponse<TResponse> = await api.list({ ...args, pageToken });
		response.data.items?.forEach((item) => items.push(item));
		log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
		pageToken = response.data.nextPageToken;

		await sleep(requestInterval);
	} while (pageToken);

	return items;
}

async function getEvents(profile: string, args: GoogleApis.calendar_v3.Params$Resource$Events$List): Promise<GoogleApis.calendar_v3.Schema$Event[]> {
	const googleAuth = await getAuth(profile);

	const { events } = google.calendar({
		version : 'v3',
		auth    : googleAuth,
	});

	return data.getData(events, args);
}

async function getVideos(profile: string, args: GoogleApis.youtube_v3.Params$Resource$Playlistitems$List): Promise<GoogleApis.youtube_v3.Schema$PlaylistItem[]> {
	const googleAuth = await getAuth(profile);

	const { playlistItems } = google.youtube({
		version : 'v3',
		auth    : googleAuth,
	});

	return data.getData(playlistItems, args);
}
