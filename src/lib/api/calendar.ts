import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { getAuth } from '../auth';
import { getItems } from './shared';
import calendar from './calendar';

export { getAPI, getEvents, getCalendars, setEvent };
export default { getAPI, getEvents, getCalendars, setEvent };

async function getAPI(profile: string): Promise<GoogleApis.calendar_v3.Calendar> {
	const googleAuth = await getAuth(profile);

	return google.calendar({
		version : 'v3',
		auth    : googleAuth,
	});
}

async function getCalendars(profile: string, args: GoogleApis.calendar_v3.Params$Resource$Calendarlist$List) {
	const api = await calendar.getAPI(profile);
	return getItems(api.calendarList, args);
}

async function getEvents(profile: string, args: GoogleApis.calendar_v3.Params$Resource$Events$List) {
	const api = await calendar.getAPI(profile);
	return getItems(api.events, args);
}

async function setEvent(profile: string, eventId: string | undefined, args: GoogleApis.calendar_v3.Params$Resource$Events$Update) {
	const api = await calendar.getAPI(profile);
	api.events.update({ eventId, ...args });
}
