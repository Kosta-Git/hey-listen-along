import { Server } from 'socket.io';

const roomCount = (server: Server) => (req, res) => {
  const rooms = {
    count: 0,
    rooms: [],
  };
  for (const entry of server.of('/').adapter.rooms.entries()) {
    if (entry[0].startsWith('room#')) {
      rooms.count += 1;

      rooms.rooms.push({
        name: entry[0].split("room#")[1],
        users: entry[1].size
      });
    }
  }

  res.send(rooms);
};

export const Rooms = {
  roomCount,
};
