# google-api-wrapper

Provides quick interface for getting google API data

----

## Usage

``` bash
> $ npm install @anmiles/google-api-wrapper
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
	const youtube = getYoutubeAPI(profile); // auth is persisted by login() function from `auth.js`
	const videos = await youtube.getPlaylistItems(profile, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```

### Example with non-persisted auth
``` js
/* videos.js */

import { getProfiles, getYoutubeAPI } from '@anmiles/google-api-wrapper';

getProfiles().map(async (profile) => {
	const youtube = getYoutubeAPI(profile, { persist: false }); // false by default
	const videos = await youtube.getPlaylistItems(profile, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```
