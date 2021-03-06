/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-use-before-define */
import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";

const { OAuth2 } = google.auth;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];
const TOKEN_DIR = `${
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
}/.credentials/`;
const TOKEN_PATH = `${TOKEN_DIR}youtube-nodejs-quickstart.json`;

// Load client secrets from a local file.
fs.readFile("client_secret.json", function processClientSecrets(err, content) {
  if (err) {
    // eslint-disable-next-line no-console
    console.log(`Error loading client secret file: ${err}`);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  authorize(JSON.parse(content as any), getPlaylist);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: Credentials | any, callback: any) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token as any);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client: OAuth2Client, callback: any) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token as any;
      storeToken(token as string);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token: string) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log(`Token stored to ${TOKEN_PATH}`);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth: OAuth2Client) {
  const service = google.youtube("v3");
  service.channels.list(
    {
      auth,
      part: ["snippet", "contentDetails", "statistics"],
      forUsername: "GoogleDevelopers",
    },
    (err: any, response: any) => {
      if (err) {
        console.log(`The API returned an error: ${err}`);
        return;
      }
      const channels = response.data.items;
      if (channels.length === 0) {
        console.log("No channel found.");
      } else {
        console.log(
          "This channel's ID is %s. Its title is '%s', and " +
            "it has %s views.",
          channels[0].id,
          channels[0].snippet.title,
          channels[0].statistics.viewCount
        );
      }
    }
  );
}

function getPlaylists(auth: OAuth2Client) {
  const service = google.youtube("v3");
  service.playlists.list(
    {
      auth,
      part: ["contentDetails"],
      maxResults: 25,
      mine: true,
    },
    (err: any, response: any) => {
      if (err) {
        console.log(`The API returned an error: ${err}`);
        return;
      }
      console.log(response.data.items);
    }
  );
}

function getPlaylist(auth: OAuth2Client) {
  const service = google.youtube("v3");
  service.playlistItems.list(
    {
      auth,
      part: ["snippet", "contentDetails"],
      playlistId: "PLPtvETppKZuZbEUCzQ9uMVvxJzpONJboK",
    },
    (err: any, response: any) => {
      if (err) {
        console.log(`The API returned an error: ${err}`);
        return;
      }
      console.log(response.data.items);
    }
  );
}
