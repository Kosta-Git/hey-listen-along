import { Rooms } from './app/controllers/rooms';
import { DEFAULT_ROOM } from './app/utils';
import { PlayerEvents } from './app/controllers/player.events';
import { QueueEvents } from './app/controllers/queue.events';
import { EventType } from './models/events/event-type';
import { Auth } from './app/controllers/auth';
import * as express from 'express';
import http = require('http');
import { Server } from 'socket.io';
import * as morgan from 'morgan';
import * as path from 'path';
import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

// Auth
app.get('/login', Auth.login);
app.get('/callback', Auth.callback);
app.post('/refresh', Auth.refresh);

// Rooms
app.get('/api/rooms', Rooms.roomCount(io));

// Events
io.on('connection', (socket) => {
  const room = `room#${socket.handshake.query.room.toString() || DEFAULT_ROOM}`;
  socket.join([room, socket.id]);

  // Queue events
  socket.on(EventType.QueueAdd, QueueEvents.queueAdd(io, socket));
  socket.on(EventType.QueueRemove, QueueEvents.queueRemove(io, socket));
  socket.on(EventType.QueueClear, QueueEvents.queueClear(io, socket));
  socket.on(EventType.QueueList, QueueEvents.queueList(io, socket));

  // Player events
  socket.on(EventType.PlayerState, PlayerEvents.playerState(io, socket));
  socket.on(EventType.PlayerPause, PlayerEvents.playerPause(io, socket));
  socket.on(EventType.PlayerResume, PlayerEvents.playerResume(io, socket));
  socket.on(EventType.PlayerSkip, PlayerEvents.playerSkip(io, socket));

  // Automatic events
  setInterval(() => socket.emit(EventType.PlayerSync), 5000);
});

// Entrypoint
const port = process.env.PORT || 3333;
server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
