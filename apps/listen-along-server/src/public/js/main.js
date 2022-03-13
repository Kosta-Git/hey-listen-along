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
  let current_device;

  playerContainer.css('visibility', 'hidden');
  searchContainer.css('visibility', 'hidden');
  if (!token) return;
  document.getElementById('login').hidden = true;
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
  socket.on(IO.events.player_skip_event, async () => {
    await SpotifyApi.goToPreviousTrack(current_device, token);
  })
  socket.on(IO.events.queue_add_event, async (event) => {
    Queue.add(event.payload[0]);

    // If the session hasnt started we can play the song directly
    if (!sessionStarted) {
      sessionStarted = true;
      let next = Queue.next();
      await SpotifyApi.play(next.uri, current_device, token);
      await setCurrentTrack(await player.getCurrentState());
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
    const { position, paused, loading } = state;

    if (paused) {
      document.querySelector("#togglePlayButton i").classList.remove('fa-play');
      document.querySelector("#togglePlayButton i").classList.add('fa-pause');
    } else {
      document.querySelector("#togglePlayButton i").classList.remove('fa-pause');
      document.querySelector("#togglePlayButton i").classList.add('fa-play');
    }

    // Trust me it means session has ended
    if (paused && loading) {
      sessionStarted = false;
      return;
    }

    if (position !== 0) return;
    if (!paused) return;

    let nextSong = Queue.next();
    if (!nextSong) return;

    await SpotifyApi.play(nextSong.uri, current_device, token);
    await setCurrentTrack(await player.getCurrentState());
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

  document.querySelector('#previousTrackButton').addEventListener('click', () => {
    socket.emit(IO.events.player_skip_event, { sentAt: new Date().getTime(), payload: null})
  });

  // TODO: backend
  document.querySelector('#nextTrackButton').addEventListener('click', async () => {
    await SpotifyApi.goToNextTrack(current_device, token);
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

    currentTrackImage.attr('src', currentTrack.album.images[2].url);
    currentTrackTitle.text(currentTrack.name);
    currentTrackSingers.text(currentTrack.artists.map(artist => artist.name).join(","));

    let seconds = Math.round(currentTrack.duration_ms / 1000);
    songTimerRange.attr('value', 0);
    songTimerRange.attr('step', 1);
    songTimerRange.attr('max', seconds);

    songDuration.text(`${Math.floor(seconds / 60)}:${(seconds % 60) < 10 ? '0' + seconds % 60 : seconds % 60}`);

    setInterval(updateCurrentTrack, 1000);

    await player.seek(0);
  };

  const updateCurrentTrack = async () => {
    let status = await player.getCurrentState();
    let position = Math.round(status["position"] / 1000);
    document.querySelector('#songActualTimerRange').value = position;
    songTimer.text(`${Math.floor(position / 60)}:${(position % 60) < 10 ? '0' + position % 60 : position % 60}`);
  }

  volumeManager(player);
  player.connect();

  document.querySelector('#playerVolumeValue').value = 0.1;
};
