const queue_add_event = "queue:add";
const queue_remove_event = "queue:remove";
const queue_clear_event = "queue:clear";
const queue_list_event = "queue:list";
const player_state_event = "player:state";
const player_sync_event = "player:sync";
const player_pause_event = "player:pause";
const player_resume_event = "player:resume";
const player_skip_event = "player:skip";


const initWebsocket = (spotifyPlayer) => {
  const socket = io({ transports: ["websocket", "polling"], query: { room: "listen-along" } });

  socket.on(player_pause_event, () => spotifyPlayer.pause())
  socket.on(player_resume_event, () => spotifyPlayer.resume())
};
