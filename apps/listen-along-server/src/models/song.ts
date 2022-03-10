export interface Song {
  id?: string; // Server generated
  name: string;
  artist: string;
  album: string;
  uri: string;
  preview_uri: string;
  preview_media: string;
}
