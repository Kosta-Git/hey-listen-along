export const songToPayload = (song) => ({
  name: song.name,
  artist: song.artists.map(a => a.name).join(","),
  album: song.album.name,
  uri: song.uri,
  preview_uri: "string",
  preview_media: "string",
});


export const volumeManager = (player) => {
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
}
