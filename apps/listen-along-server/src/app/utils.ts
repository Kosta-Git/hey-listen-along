import { Socket } from 'socket.io';

export const DEFAULT_ROOM = "listen-along-lobby";

export const getRoom = (socket: Socket): string => {
  if(socket.rooms.size === 0) return DEFAULT_ROOM;

  let room = DEFAULT_ROOM
  for(const r of socket.rooms) {
    if(r.startsWith("room#")) {
      room = r;
      break;
    }
  }

  return room;
}

