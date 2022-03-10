import { EventType } from './../../models/events/event-type';
import { Server, Socket } from 'socket.io';
import Event from '../../models/events/event';
import { Song } from '../../models/song';
import { v4 as uuid } from 'uuid';
import { getRoom } from './../utils';

const queueAdd = (server: Server, socket: Socket) => (data: Event<Song[]>) => {
  if (!data.payload || data.payload.length === 0) return;

  data.payload.forEach((s) => (s.id = uuid()));
  data.sentAt = new Date().getTime();

  server.to(getRoom(socket)).emit(EventType.QueueAdd, data);
};

const queueRemove =
  (server: Server, socket: Socket) => (data: Event<string[]>) => {
    if (!data.payload || data.payload.length === 0) return;

    data.sentAt = new Date().getTime();

    server.to(getRoom(socket)).emit(EventType.QueueRemove, data);
  };

const queueClear = (server: Server, socket: Socket) => (data: Event<null>) => {
  data.sentAt = new Date().getTime();

  server.to(getRoom(socket)).emit(EventType.QueueClear, data);
};

const queueList = (_: Server, socket: Socket) => (data: Event<Song[]>) => {
  data.sentAt = new Date().getTime();

  // TODO: Improve this mess
  socket.to(getRoom(socket)).emit(EventType.QueueList, data);
};

export const QueueEvents = {
  queueAdd,
  queueRemove,
  queueClear,
  queueList,
};
