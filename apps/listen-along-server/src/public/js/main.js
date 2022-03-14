import * as SpotifyApi from './api.js'
import * as IO from './events.js'
import { songToPayload, volumeManager } from './utils.js'
import { Queue } from './queue.js'

/** Visual Elements */
let playerContainer = $('#playerContainer');
let searchContainer = $('#searchContainer');
/** Visual Elements - Player Track */
let currentTrackImage = $('#currentTrackImage');
let currentTrackTitle = $('#currentTrackTitle');
let currentTrackSingers = $('#currentTrackSingers');

let songTimer = $('#songActualTimer');
let songDuration = $('#songDuration');
let songTimerRange = $('#songActualTimerRange');

// Check if session has started already
let sessionStarted = false;

// Prevents page reloading when search button is used
$('#searchTrackForm').submit((e) => e.preventDefault());

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

  const token = getCookie('token');
  const queue = new Queue();
  let current_device;
  let lastEventWasSkip = false;

  playerContainer.css('visibility', 'hidden');
  searchContainer.css('visibility', 'hidden');
  if (!token) {
    $("#login").removeClass("hidden");
    return;
  }
  playerContainer.css('visibility', 'visible');
  searchContainer.css('visibility', 'visible');

  const player = new Spotify.Player({
    name: 'Listen Along',
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.1,
  });

  /////////////////////
  /* Event listeners */
  /////////////////////
  const socket = IO.createWebsocket();
  socket.on(IO.events.player_pause_event, () => player.pause())
  socket.on(IO.events.player_resume_event, () => player.resume())
  socket.on(IO.events.player_sync_event, async () => {
    const state = await player.getCurrentState();
    console.log("SEND STATE")
    socket.emit(IO.events.player_state_event,
      {
        sentAt: new Date().getTime(),
        payload: {
          time: state.position,
          song_uri: state.track_window.current_track.uri,
          is_playing: !state.paused,
          has_started_listening: sessionStarted,
          queue: queue.all()
        }
      })
  })
  socket.on(IO.events.player_state_event, async (event) => {
    console.log("RECEIVED STATE")
    const {time, song_uri, is_playing, queue: serverQueue} = event.payload;
    const localState = await player.getCurrentState();

    const currentUri = localState.track_window.current_track.uri;
    const currentTime = localState.position;

    if(is_playing === localState.paused) await player.togglePlay();

    queue.setQueue(serverQueue);
    if(currentUri !== song_uri) {
      await SpotifyApi.play(song_uri, current_device, token);
      await player.seek(time + 50);
    } else {
      const deltaTime = (time + 50) - currentTime;
      if(deltaTime > 300) await player.seek(time + 50);
    }
  });
  socket.on(IO.events.player_skip_event, async () => {
    let nextSong = queue.next();
    if (!nextSong) return;

    await SpotifyApi.play(nextSong.uri, current_device, token);
    await player.seek(0);
  })
  socket.on(IO.events.queue_add_event, async (event) => {
    queue.add(event.payload[0]);

    // If the session hasnt started we can play the song directly
    if (!sessionStarted) {
      sessionStarted = true;
      let next = queue.next();
      await SpotifyApi.play(next.uri, current_device, token);
      await setCurrentTrack(await player.getCurrentState());
      await player.seek(0);
      await player.resume()
    }
  })

  //////////////////////////////////////////////////////////////

  ///////////////////
  /* SDK listeners */
  ///////////////////

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    current_device = device_id;
    await SpotifyApi.transferPlayback(device_id, token);
  });

  // Not Ready
  player.addListener('not_ready', () => console.log('stopped'));

  // State changed
  player.addListener('player_state_changed', async (state) => {
    const { paused, loading } = state;

    await setCurrentTrack(await player.getCurrentState());

    if (paused) {
      document.querySelector("#togglePlayButton i").classList.remove('fa-pause');
      document.querySelector("#togglePlayButton i").classList.add('fa-play');
    } else {
      document.querySelector("#togglePlayButton i").classList.remove('fa-play');
      document.querySelector("#togglePlayButton i").classList.add('fa-pause');
    }

    // Trust me it means session has ended
    if (paused && loading) {
      if (lastEventWasSkip) {
        lastEventWasSkip = false;
        return;
      }

      let nextSong = queue.next();
      if (!nextSong) {
        sessionStarted = false;
        return;
      }

      lastEventWasSkip = true;
      await SpotifyApi.play(nextSong.uri, current_device, token);
      await player.seek(0);
      await setCurrentTrack(await player.getCurrentState());
    }
  });


  //////////////////////////////////////////////////////////////

  // Send events on pause/resume
  $('#togglePlayButton').click(() => {
    player.getCurrentState().then(state => {
      if (!state) return;
      if (state.paused) {
        socket.emit(
          IO.events.player_resume_event,
          { sentAt: new Date().getTime(), payload: null }
        )
      } else {
        socket.emit(
          IO.events.player_pause_event,
          { sentAt: new Date().getTime(), payload: null }
        )
      }
    })
  });

  // TODO: Backend impl
  // document.querySelector('#previousTrackButton').addEventListener('click', () => );

  document.querySelector('#nextTrackButton').addEventListener('click', async () => {
    socket.emit(IO.events.player_skip_event, { sentAt: new Date().getTime(), payload: null })
  });

  // Search results
  $('#searchbar-btn').click(() => {
    if (document.querySelector('#query').value !== '') {
      let query = document.querySelector('#query').value.trim().replaceAll(/\s+/g, '+');
      SpotifyApi.searchItem(query, token)
        .then(response => response.json())
        .then(json => {
          document.querySelector('#searchResults').innerHTML = '';
          // Generate cards
          json.tracks.items.forEach((songItem, pos) => {
            let article = document.createElement('article');
            article.innerHTML = `<img src="${songItem.album.images[0].url}" alt="Track Image">
                                <div class="container">
                                  <div class="songTitle">${songItem.name}</div>
                                  <div class="songSinger">${songItem.artists.map(artist => artist.name).join(",")}</div>
                                </div>`;
            article.classList.add('searchResult');

            // Add song to queue handler
            let addButton = document.createElement('button');
            addButton.innerHTML = `<i class="fa-solid fa-satellite-dish"></i>`
            addButton.addEventListener('click', async () => {
              const songEventData = songToPayload(songItem);
              socket.emit(
                IO.events.queue_add_event,
                {
                  sentAt: new Date().getTime(),
                  payload: [songEventData]
                }
              )
            });

            article.appendChild(addButton);
            document.querySelector('#searchResults').appendChild(article);
          });
        });
    }
  });

  const setCurrentTrack = async (state) => {
    let currentTrack = state.track_window.current_track;

    document.title = currentTrack.name + " - Listen Along";
    $("#favicon").attr("href", currentTrack.album.images[2].url);
    $('meta[name=og\\:image]').attr('content', currentTrack.album.images[2].url);

    currentTrackImage.attr('src', currentTrack.album.images[2].url);
    currentTrackTitle.text(currentTrack.name);
    currentTrackSingers.text(currentTrack.artists.map(artist => artist.name).join(","));

    let seconds = Math.round(currentTrack.duration_ms / 1000);
    songTimerRange.attr('value', 0);
    songTimerRange.attr('step', 1);
    songTimerRange.attr('max', seconds);

    songDuration.text(`${Math.floor(seconds / 60)}:${(seconds % 60) < 10 ? '0' + seconds % 60 : seconds % 60}`);

    setInterval(updateCurrentTrack, 1000);
  };

  const updateCurrentTrack = async () => {
    let status = await player.getCurrentState();
    let position = Math.round(status["position"] / 1000);
    document.querySelector('#songActualTimerRange').value = position;
    songTimer.text(`${Math.floor(position / 60)}:${(position % 60) < 10 ? '0' + position % 60 : position % 60}`);
  }

  document.querySelector('#songActualTimerRange').addEventListener('input', async () => {
    let wantedPos = parseInt(document.querySelector('#songActualTimerRange').value);
    await player.seek(wantedPos * 1000);
  });

  volumeManager(player);
  player.connect();

  document.querySelector('#playerVolumeValue').value = 0.1;
};
