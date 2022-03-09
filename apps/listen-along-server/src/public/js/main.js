const transferPlayback = async (device_id, token) => {
  await fetch(
    "https://api.spotify.com/v1/me/player",
    {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "device_ids": [device_id]
      })
    }
  )
};

const play = async (spotify_uri, device_id, token) => {

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [spotify_uri] }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
  }

  const token = getCookie('token');
  if (!token) return;
  document.getElementById("login").hidden = true;

  const player = new Spotify.Player({
    name: 'Listen Along',
    getOAuthToken: cb => { cb(token); },
    volume: 0.2
  });

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    await transferPlayback(device_id, token)
    await play("spotify:track:3F4ujQNrH5qbEA8cAzxYUR", device_id, token)
    await player.seek(0);
    await player.togglePlay()
  });

  // Not Ready
  player.addListener('not_ready', () => console.log("stopped"));

  document.getElementById('connectPlayer').onclick = () => player.connect();
  document.getElementById('togglePlay').onclick = () => player.togglePlay();
  document.getElementById('disconnectPlayer').onclick = () => player.disconnect();
}
