# google-api-wrapper

Provides quick interface for getting google API data

----

## Usage

``` bash
> $ npm install @anmiles/google-api-wrapper
> $ node ./auth.js
> $ node ./videos.js
```

``` js
/* auth.js */

import { createProfile, login } from '@anmiles/google-api-wrapper';

createProfile("username");
login("username");

```

``` js
/* videos.js */

import { getProfiles, youtube } from '@anmiles/google-api-wrapper';

getProfiles().map(async (profile) => {
	const videos = await youtube.getPlaylistItems(profile, { playlistId : 'LL', part : [ 'snippet' ], maxResults : 50 });
	videos.forEach((video) => console.log(`Downloaded: ${video.snippet?.title}`));
});

```
