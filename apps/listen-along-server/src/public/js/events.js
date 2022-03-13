export const createWebsocket = () =>  io({ transports: ["websocket", "polling"], query: { room: "listen-along" } });

export const events = {
  // Queue events
  queue_add_event: "queue:add",
  queue_remove_event: "queue:remove",
  queue_clear_event: "queue:clear",
  queue_list_event: "queue:list",

  // Player events
  player_state_event: "player:state",
  player_sync_event: "player:sync",
  player_pause_event: "player:pause",
  player_resume_event: "player:resume",
  player_skip_event: "player:skip",
}
