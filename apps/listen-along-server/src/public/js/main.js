import * as SpotifyApi from './api.js'

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

//let togglePlayButton = $('#togglePlayButton');

// Prevents page reloading when search button is used
$('#searchTrackForm').submit(function(e){
  e.preventDefault();
});

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

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    current_device = device_id;
    await SpotifyApi.transferPlayback(device_id, token);
  });

  // Not Ready
  player.addListener('not_ready', () => console.log('stopped'));

  $('#togglePlayButton').click(() => {
    player.getCurrentState().then(state => {
      if(!state) return;
      if(state.paused) {
        document.querySelector("#togglePlayButton i").classList.remove('fa-play');
        document.querySelector("#togglePlayButton i").classList.add('fa-pause');
      } else {
        document.querySelector("#togglePlayButton i").classList.remove('fa-pause');
        document.querySelector("#togglePlayButton i").classList.add('fa-play');
      }
    })
    player.togglePlay();
  });


  $('#searchbar-btn').click(() => {
    if(document.querySelector('#query').value !== '') {
      let query = document.querySelector('#query').value.trim().replaceAll(/\s+/g,'+');
      SpotifyApi.searchItem(query, token)
        .then(response => response.json())
        .then(json => {
          document.querySelector('#searchResults').innerHTML = '';
          json.tracks.items.forEach((songItem, pos) => {
            let article = document.createElement('article');
            article.innerHTML = `<img src="${songItem.album.images[0].url}" alt="Track Image">
                                <div class="container">
                                  <div class="songTitle">${songItem.name}</div>
                                  <div class="songSinger">${songItem.artists.map(artist => artist.name).join(",")}</div>
                                </div>`;
            article.classList.add('searchResult');

            let addButton = document.createElement('button');
            addButton.innerHTML = `<i class="fa-solid fa-satellite-dish"></i>`
            addButton.addEventListener('click', async () => {
              await SpotifyApi.play(songItem.uri, current_device, token);
              await setCurrentTrack(await player.getCurrentState());
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
    
    songDuration.text(`${Math.floor(seconds/60)}:${(seconds%60) < 10 ? '0'+seconds%60 : seconds%60}`);
    
    setInterval(updateCurrentTrack, 1000);

    await player.seek(0);

    document.querySelector("#togglePlayButton i").classList.remove('fa-play');
    document.querySelector("#togglePlayButton i").classList.add('fa-pause');

    document.querySelector('#previousTrackButton').addEventListener('click', async () => {
      await SpotifyApi.goToPreviousTrack(current_device, token);
    });

    document.querySelector('#nextTrackButton').addEventListener('click', async () => {
      await SpotifyApi.goToNextTrack(current_device, token);
    });
  };

  const updateCurrentTrack = async () => {
    let status = await player.getCurrentState();
    let position = Math.round(status["position"]  / 1000);
    document.querySelector('#songActualTimerRange').value = position;
    console.log('update du timer ' + position);
    songTimer.text(`${Math.floor(position/60)}:${(position%60) < 10 ? '0'+position%60 : position%60}`);
  }

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
<<<<<<< web-bindings
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
=======
};
>>>>>>> UPDATE - Query > Choix > Player + Amélioration Visuelle
