export enum EventType {
  /**
   * Queue events
   */
  QueueAdd = "queue:add",
  QueueRemove = "queue:remove",
  QueueClear = "queue:clear",
  /**
   * Player events
   */
  PlayerState = "player:state",
  PlayerSync = "player:sync",
  PlayerPause = "player:pause",
  PlayerResume = "player:resume",
  PlayerSkip = "player:skip",
}
