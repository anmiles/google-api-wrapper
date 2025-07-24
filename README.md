# @anmiles/google-api-wrapper

Wrapper around googleapis for getting data shortly
- provides quick interface for getting google API data
- encapsulates auth process
- combines getting paged items in one call
----

## Installation

`npm install @anmiles/google-api-wrapper`

## Usage

### Authorization
``` js
/* auth.js */

import { createProfile, login } from '@anmiles/google-api-wrapper';

createProfile("username");

// Persistent credentials will be generated and stored to credentials file.
// Next `login` call will re-use persistent credentials without showing oauth window
login("username");

```

### Example with persisted auth
``` js
/* calendar.js */

import { calendar } from 'googleapis/build/src/apis/calendar';
import { getProfiles, getAPI } from '@anmiles/google-api-wrapper';

require('./auth');

getProfiles().map(async (profile) => {
	// Persistent credentials will be generated and stored to credentials file.
	// Next `getAPI` call will re-use persistent credentials without showing oauth window
	const calendarAPI = getAPI((auth) => calendar({ version : 'v3', auth }), profile);
	const events = await calendarAPI.getItems((api) => api.events, { timeMax: new Date().toISOString() });
	events.forEach((event) => console.log(`Event: ${event.summary}`));
});

```

### Example with temporary auth
``` js
/* videos.js */

import { youtube } from 'googleapis/build/src/apis/youtube';
import { getProfiles, getAPI } from '@anmiles/google-api-wrapper';

getProfiles().map(async (profile) => {
	// Temporary credentials will be generated and not stored to credentials file
	// Next `getAPI` will start authorization again with showing oauth window
	const youtubeAPI = getAPI((auth) => youtube({ version : 'v3', auth }), profile, { temporary: true });
	const videos = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```

### Live examples
- [youtube-likes-downloader](https://www.npmjs.com/package/youtube-likes-downloader) - download all liked videos from youtube
- [google-calendar-entries](https://www.npmjs.com/package/google-calendar-entries) - view and manage google calendar entries
- [school-schedule-sync](https://www.npmjs.com/package/school-schedule-sync) - synchronization between JSON schedule and Google Calendar
