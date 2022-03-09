import { AddToQueue } from './models/payloads/add-to-queue';
import * as path from 'path';
import 'dotenv/config';
// import Event from './models/payloads/add-to-queue';
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import { Server } from 'socket.io';
import axios from 'axios';
import qs = require('qs');

const app = express();
const io = new Server(3001);
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = 'http://localhost:3333/callback';

app.use(
  express.static(
    path.join('F:\\code\\hey\\hey\\apps\\listen-along-server', 'public')
  )
);

// app.get('/api', (req, res) => {
//   res.send({ message: 'Welcome to listen-along-server!' });
// });

app.get('/login', function (req, res) {
  const state = Math.random().toFixed(16).toString();
  const scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing user-library-read streaming app-remote-control playlist-read-collaborative playlist-read-private';

  res.redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}`
  );
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#?error=state_mismatch');
  } else {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(client_id + ':' + client_secret)
              .toString('base64')
              .trim(),
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    res.cookie('token', access_token, { secure: true });
    res.cookie('refresh_token', refresh_token, { secure: true });
    res.redirect('/');
  }
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
