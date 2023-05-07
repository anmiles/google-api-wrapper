# @anmiles/google-api-wrapper

Provides quick interface for getting google API data

----

## Installation

`npm install @anmiles/google-api-wrapper`

## Usage

``` bash
> $ node ./auth.js
> $ node ./videos.js
```

### Authorization
``` js
/* auth.js */

import { createProfile, login } from '@anmiles/google-api-wrapper';

createProfile("username");
login("username");

```

### Example with persisted auth
``` js
/* calendar.js */

import { getProfiles, getCalendarAPI } from '@anmiles/google-api-wrapper';

require('./auth');

getProfiles().map(async (profile) => {
	const calendarAPI = getCalendarAPI(profile); // auth is persisted by login() function from `auth.js`
	const events = await getItems<GoogleApis.calendar_v3.Schema$Event, GoogleApis.calendar_v3.Params$Resource$Events$List>(calendarAPI.events, { timeMax: new Date().toISOString() });
	events.forEach((event) => console.log(`Event: ${event.summary}`));
});

```

### Example with temporary auth
``` js
/* videos.js */

import { getProfiles, getYoutubeAPI } from '@anmiles/google-api-wrapper';

getProfiles().map(async (profile) => {
	const youtubeAPI = getYoutubeAPI(profile, { temporary: true });
	const videos = await getItems<GoogleApis.youtube_v3.Schema$PlaylistItem, GoogleApis.youtube_v3.Params$Resource$Playlistitems$List>(youtubeAPI.playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```
