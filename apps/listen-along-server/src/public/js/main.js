const transferPlayback = async (device_id, token) => {
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [device_id],
    }),
  });
};

const play = async (spotify_uri, device_id, token) => {
  await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${device_id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ uris: [spotify_uri] }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

const searchItem = async (query, token) => {
  let urlBase = 'https://api.spotify.com/v1/search?';
  let url = new URLSearchParams();
  url.append('type', 'track');
  url.append('q', query);
  url.append('limit', 5);
  return await fetch(urlBase + url.toString(), {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  });
};

window.onSpotifyWebPlaybackSDKReady = async () => {
  const getCookie = (cle) => {
    let cookies = decodeURIComponent(document.cookie).split(';');
    let valeur = '';
    cookies.forEach((c) => {
      c = c.trim();
      if (c.indexOf(cle) === 0) {
        valeur = c.slice(cle.length + 1).trim();
      }
    });
    return valeur;
  };

  let current_device;
  //document.getElementById('togglePlay').hidden = true;
  document.getElementById('searchbar').hidden = true;
  const token = getCookie('token');
  if (!token) return;
  document.getElementById('login').hidden = true;
  //document.getElementById('togglePlay').hidden = false;
  document.getElementById('searchbar').hidden = false;

  const player = new Spotify.Player({
    name: 'Listen Along',
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.1,
  });

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    current_device = device_id;
    await transferPlayback(device_id, token);
  });

  // Not Ready
  player.addListener('not_ready', () => console.log('stopped'));

  $('#togglePlayButton').click(() => {
    player.getCurrentState().then(state => {
      if(!state) return;
      if(state.paused) {
        document.querySelector("#togglePlayButton i").classList.remove('fa-play');
        document.querySelector("#togglePlayButton i").classList.add('fa-pause');
        // Set button icon to "pause"
      } else {
        document.querySelector("#togglePlayButton i").classList.remove('fa-pause');
        document.querySelector("#togglePlayButton i").classList.add('fa-play');
        // Set button icon to "play"
      }
    })
    player.togglePlay();
  });

  $('#searchbar-btn').click(() => {
	if (document.getElementById('searchbar-val').value !== '') {
		let query = document.getElementById('searchbar-val').value.trim().replaceAll(/\s+/g,'+');
		searchItem(query, token)
		  .then((response) => response.json())
		  .then(async (json) => {
			  let firstResult = json["tracks"]["items"][0];
			  document.title = firstResult["name"] + " - Listen Along";
			  $("#favicon").attr("href", firstResult["album"]["images"][2]["url"]);
        $('#currentTrackImage').attr('src', firstResult["album"]["images"][2]["url"]);
        $('#currentTrackTitle').text(firstResult["name"]);
        $('#currentTrackSingers').text(firstResult["artists"].map(artist => artist["name"]).join(","));
        let seconds = Math.round(firstResult["duration_ms"] / 1000)
        document.querySelector('#songActualTimerRange').value = '0';
        document.querySelector('#songActualTimerRange').max = `${seconds}`;
        document.querySelector('#songActualTimerRange').step = 1;
        $('#songDuration').text(`${Math.floor(seconds/60)}:${seconds%60}`);
        setInterval(async function() {
          let status = await player.getCurrentState();
          let seconds_pos = Math.round(status["position"]  / 1000);
          document.querySelector('#songActualTimerRange').value = seconds_pos;
          document.querySelector('#songActualTimer').innerText = `${Math.floor(seconds_pos/60)}:${(seconds_pos%60) < 10 ? '0'+seconds_pos%60 : seconds_pos%60}`;
        }, 1000);
			  await play(firstResult["uri"], current_device, token);
			  await player.seek(0);
        document.querySelector("#togglePlayButton i").classList.remove('fa-play');
        document.querySelector("#togglePlayButton i").classList.add('fa-pause');
		  });
	  }
  });

  let tempVolumeVal = 0;
  $('#playerVolumeIcon').click(async () => {
    if(await player.getVolume() > 0) {
      tempVolumeVal = document.querySelector('#playerVolumeValue').value;
      document.querySelector('#playerVolumeValue').value = '0';
      await player.setVolume(0);
      document.querySelector("#playerVolumeIcon").classList.remove('fa-volume-high')
      document.querySelector("#playerVolumeIcon").classList.add('fa-volume-xmark')
    } else {
      document.querySelector('#playerVolumeValue').value = tempVolumeVal;
      await player.setVolume(parseFloat(tempVolumeVal));
      document.querySelector("#playerVolumeIcon").classList.remove('fa-volume-xmark')
      document.querySelector("#playerVolumeIcon").classList.add('fa-volume-high')
    }
  });
  document.querySelector('#playerVolumeValue').addEventListener('input', async () => {
    let newVal = parseFloat(document.querySelector('#playerVolumeValue').value);  
    await player.setVolume(newVal);
    if(newVal === 0) {
      document.querySelector("#playerVolumeIcon").classList.remove('fa-volume-high')
      document.querySelector("#playerVolumeIcon").classList.add('fa-volume-xmark')
    } else {
      document.querySelector("#playerVolumeIcon").classList.remove('fa-volume-xmark')
      document.querySelector("#playerVolumeIcon").classList.add('fa-volume-high')
    }
  })

  document.querySelector('#songActualTimerRange').addEventListener('input', async () => {
    let wantedPos = parseInt(document.querySelector('#songActualTimerRange').value);
    await player.seek(wantedPos*1000);
  });
  player.connect();

  document.querySelector('#playerVolumeValue').value = 0.1;
  initWebsocket(player);
};

/*let currentState = await player.getCurrentState();
        
currentState.context.metadata = new MediaMetadata({
  title: `Test`,
  artist: 'Nat King Cole',
  album: 'The Ultimate Collection (Remastered)',
  artwork: Array.from(
    firstResult["album"]["images"].map(image => ({
      src: image["url"],
      sizes: `${image["width"]}x${image["height"]}`,
      type: 'image/jpeg'
    }))
  )
});*/