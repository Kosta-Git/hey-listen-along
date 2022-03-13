export {transferPlayback, play, searchItem, goToPreviousTrack, goToNextTrack};

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

const goToPreviousTrack = async (device_id, token) => {
    await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${device_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    });
};

const goToNextTrack = async (device_id, token) => {
    await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${device_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        }
    });
};