import { getRoom } from './../utils';
import { EventType } from './../../models/events/event-type';
import { Server, Socket } from 'socket.io';
import Event from '../../models/events/event';
import { PlayerState } from '../../models/player-state';

const playerState =
  (server: Server, socket: Socket) => (data: Event<PlayerState>) => {
    data.sentAt = new Date().getTime();
    socket.to(getRoom(socket)).emit(EventType.PlayerSync, data);
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
