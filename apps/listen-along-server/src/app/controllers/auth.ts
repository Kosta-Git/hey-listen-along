import axios from 'axios';
import QueryString = require('qs');
import { v4 as uuid } from 'uuid';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const callback_uri = process.env.CALLBACK;

const login = (_, res) => {
  const state = uuid();
  const scope = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'streaming app-remote-control',
    'playlist-read-collaborative',
    'playlist-read-private',
  ].join(" ");

  const query = QueryString.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: callback_uri,
    state: state
  })

  res.redirect(`https://accounts.spotify.com/authorize?${query}` );
};

const callback = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if(!state) res.redirect('/#?error=state_mismatch');

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    QueryString.stringify({
      code: code,
      redirect_uri: callback_uri,
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

const refresh = async (req, res) => {
  const { refresh_token } = req.body || null;

  if(!refresh_token) res.status(401).send();

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    QueryString.stringify({
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
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

  res.cookie('token', response.data.access_token, { secure: true });
  res.send();
}

export const Auth = {
  login,
  callback,
  refresh
}
