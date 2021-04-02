import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";
// const { OAuth2 } = google.auth;
const OAuth2 = google.auth.OAuth2;

const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];
const TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
const TOKEN_PATH = TOKEN_DIR + "ytdl.json";
console.log(TOKEN_PATH);

export default class YouTube {
  credentials: any;
  oAuthClient: OAuth2Client | undefined;
  cachedPlaylistItems: any[] = [];
  cachedPlaylists: any[] = [];
  constructor() {
    this.cachedPlaylistItems = [];
    this.cachedPlaylists = [];
    this.getPlaylists.bind(this);
    this.playlist.bind(this);
    this.getPlaylist.bind(this);
  }

  getCredentials(
    callback: (auth: OAuth2Client, ...options: any[]) => any,
    ...options: any[]
  ) {
    if (this.credentials) {
      this.authorize(this.credentials, callback);
    }
    return new Promise((resolve) => {
      fs.readFile("./src/client_secret.json", (err, content) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(`Error loading client secret file: ${err}`);
          return;
        }
        this.credentials = JSON.parse(content as any);
        resolve(this.authorize(this.credentials, callback, ...options));
      });
    });
  }

  authorize(
    credentials: Credentials | any,
    callback: (oauth2Client: OAuth2Client, ...options: any[]) => any,
    ...options: any[]
  ) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    this.oAuthClient = oauth2Client;
    return new Promise((resolve) => {
      fs.readFile(TOKEN_PATH, async (err, token) => {
        if (err) {
          resolve(this.getNewTokenUrl(oauth2Client, callback, ...options));
        } else {
          oauth2Client.credentials = JSON.parse(token as any);
          resolve(callback(oauth2Client, ...options));
        }
      });
    });
  }

  getNewTokenUrl(
    oauth2Client: OAuth2Client,
    callback: (oauth2Client: OAuth2Client, ...options: any[]) => any,
    ...options: any[]
  ) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url: ", authUrl);
    // const rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });

    return {
      error: { msg: "Authorization needed" },
      authUrl: authUrl,
      callback: (code: string) => () => {},
    };

    // return new Promise((resolve) => {

    //   rl.question("Enter the code from that page here: ", (code) => {
    //     rl.close();

    //   });
    // });
  }
  getNewToken(code: string, callback: (oAuthClient: OAuth2Client) => void) {
    return new Promise((resolve) => {
      if (!this.oAuthClient) return;
      this.oAuthClient.getToken(code, (err, token) => {
        if (err) {
          console.log("Error while trying to retrieve access token", err);
          return;
        }
        if (!this.oAuthClient) return;
        this.oAuthClient.credentials = token as Credentials;
        this.storeToken(token as Credentials);
        resolve(callback(this.oAuthClient));
      });
    });
  }

  storeToken(token: Credentials) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != "EEXIST") {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) throw err;
      console.log("Token stored to " + TOKEN_PATH);
    });
  }

  playlists(auth: OAuth2Client) {
    const service = google.youtube("v3");
    return new Promise((resolve) => {
      service.playlists.list(
        {
          auth: auth,
          part: ["contentDetails", "snippet"],
          maxResults: 25,
          mine: true,
        },
        (err, response) => {
          if (err) {
            console.log("The API returned an error: " + err);
            return;
          }
          resolve((response as any).data.items);
          // console.log((response as any).data.items);
        }
      );
    });
  }

  playlist(auth: OAuth2Client, id: string) {
    var service = google.youtube("v3");
    return new Promise((resolve) => {
      service.playlistItems.list(
        {
          auth: auth,
          part: ["snippet", "contentDetails"],
          maxResults: 25,
          playlistId: id,
        },
        (err, response) => {
          if (err) {
            console.log("The API returned an error: " + err);
            return;
          }
          resolve((response as any).data);
        }
      );
    });
  }

  async getPlaylists() {
    if (this.cachedPlaylists.length > 0) {
      console.log("Returning chached playlists ...");
      return this.cachedPlaylists;
    }
    const playlists = (await this.getCredentials(this.playlists)) as any[];
    this.cachedPlaylists = playlists;
    return new Promise((resolve) => resolve(playlists));
  }

  async getPlaylist(id: string) {
    const existingPlaylist = this.cachedPlaylistItems.find(
      (playlist) => playlist.id === id
    );
    if (existingPlaylist) {
      console.log("Returning chached playlist ...");
      return new Promise((resolve) => resolve(existingPlaylist.playlist));
    }
    const playlist = await this.getCredentials(this.playlist, id);
    this.cachedPlaylistItems.push({ id, playlist });
    return new Promise((resolve) => resolve(playlist));
  }
}
