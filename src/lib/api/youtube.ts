import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import type { GetItemsOptions } from '../../types';
import { getAuth } from '../auth';
import { getItems } from './shared';
import youtube from './youtube';

export { getAPI, getPlaylistItems };
export default { getAPI, getPlaylistItems };

async function getAPI(profile: string): Promise<GoogleApis.youtube_v3.Youtube> {
	const googleAuth = await getAuth(profile);

	return google.youtube({
		version : 'v3',
		auth    : googleAuth,
	});
}

async function getPlaylistItems(profile: string, args: GoogleApis.youtube_v3.Params$Resource$Playlistitems$List, options?: GetItemsOptions): Promise<GoogleApis.youtube_v3.Schema$PlaylistItem[]> {
	const api = await youtube.getAPI(profile);
	return getItems(api.playlistItems, args, options);
}
