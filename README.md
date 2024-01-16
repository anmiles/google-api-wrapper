# @anmiles/google-api-wrapper

Provides quick interface for getting google API data. Support all google APIs as per May 31, 2023.

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
// Persistent credentials will be generated and stored to credentials file.
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
	const youtubeAPI = getAPI((auth) => youtube({ version : 'v3', auth }), profile, { temporary: true });
	const videos = await youtubeAPI.getItems((api) => api.playlistItems, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```
