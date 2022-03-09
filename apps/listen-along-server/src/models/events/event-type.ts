export enum EventType {
  /**
   * Add an array of songs to the queue
   */
  AddToQueue,
  /**
   * Current song playing, with timestamp
   */
  PlayerState,
  /**
   *
   */
  ClearQueue,
  Sync
}
