import { getRoom } from './../utils';
import { EventType } from './../../models/events/event-type';
import { Server, Socket } from 'socket.io';
import Event from '../../models/events/event';
import { PlayerState } from '../../models/player-state';

interface SocketPlayerState {
  sid: string;
  state: PlayerState;
}

let states: SocketPlayerState[] = [];

const playerState =
  (server: Server, socket: Socket) => (data: Event<PlayerState>) => {
    // If client sends twice his state, drop
    if (states.filter((s) => s.sid === socket.id).length === 0)
      states.push({ sid: socket.id, state: data.payload });

    const usersInRoom = server.of('/').adapter.rooms.get(getRoom(socket)).size;
    if (usersInRoom !== states.length) return;

    let songQueues: { song_uri: string; sid?: string; time?: number }[][] = [];

    states.forEach((s) => {
      if (!s.state.has_started_listening) return;

      songQueues.push([
        { song_uri: s.state.song_uri, sid: s.sid, time: s.state.time },
        ...s.state.queue.map((qs) => ({ song_uri: qs.uri })),
      ]);
    });
    const smallest = Math.min(...songQueues.map((a) => a.length));
    songQueues = songQueues.filter((s) => s.length === smallest);
    const highest = Math.max(...songQueues.map((a) => a[0].time));
    const winner = songQueues.find(s => s[0].time === highest);

    const winnerState = states.find(s => s.sid === winner[0].sid);

    server.to(getRoom(socket)).emit(EventType.PlayerState, { sentAt: new Date().getTime(), payload: winnerState.state});
    states = [];
  };

const playerPause = (server: Server, socket: Socket) => (data: Event<null>) => {
  data.sentAt = new Date().getTime();
  server.to(getRoom(socket)).emit(EventType.PlayerPause, data);
};

const playerResume =
  (server: Server, socket: Socket) => (data: Event<null>) => {
    data.sentAt = new Date().getTime();
    server.to(getRoom(socket)).emit(EventType.PlayerResume, data);
  };

const playerSkip = (server: Server, socket: Socket) => (data: Event<null>) => {
  data.sentAt = new Date().getTime();
  server.to(getRoom(socket)).emit(EventType.PlayerSkip, data);
};

export const PlayerEvents = {
  playerState,
  playerPause,
  playerResume,
  playerSkip,
};
