import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import type { AuthOptions } from '../../types';
import { getAuth } from '../auth';

export async function getAPI(profile: string, options?: AuthOptions): Promise<GoogleApis.youtube_v3.Youtube> {
	const googleAuth = await getAuth(profile, options);

	return google.youtube({
		version : 'v3',
		auth    : googleAuth,
	});
}
