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
  url.append('limit', 20);
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
  document.getElementById('togglePlay').hidden = true;
  document.getElementById('searchbar').hidden = true;
  const token = getCookie('token');
  if (!token) return;
  document.getElementById('login').hidden = true;
  document.getElementById('togglePlay').hidden = false;
  document.getElementById('searchbar').hidden = false;

  const player = new Spotify.Player({
    name: 'Listen Along',
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.2,
  });

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    current_device = device_id;
    await transferPlayback(device_id, token);
  });

  // Not Ready
  player.addListener('not_ready', () => console.log('stopped'));

  $('#togglePlay').click(() => player.togglePlay());

  $('#searchbar-btn').click(() => {
	if (document.getElementById('searchbar-val').value !== '') {
		let query = document.getElementById('searchbar-val').value.trim().replaceAll(/\s+/g,'+');
		searchItem(query, token)
		  .then((response) => response.json())
		  .then(async (json) => {
			  let firstResult = json["tracks"]["items"][0];
			  document.title = firstResult["name"] + " - Listen Along";
			  $('meta[name=og\\:image]').attr('content', firstResult["album"]["images"][1]["url"] + ".jpg");
			  $("#favicon").attr("href", firstResult["album"]["images"][2]["url"]);
			  await play(firstResult["uri"], current_device, token);
			  await player.seek(0);
		  });
	  }
  });

  player.connect();
};
