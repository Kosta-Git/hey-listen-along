import { Song } from "./song";

export interface PlayerState {
  time: number;
  song_uri: string;
  is_playing: boolean;
  has_started_listening: boolean;
  queue: Song[];
}
