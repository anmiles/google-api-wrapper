import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import type { AuthOptions } from '../../types';
import { getAuth } from '../auth';

export async function getAPI(profile: string, options?: AuthOptions): Promise<GoogleApis.calendar_v3.Calendar> {
	const googleAuth = await getAuth(profile, options);

	return google.calendar({
		version : 'v3',
		auth    : googleAuth,
	});
}
