import fs from "fs";
import { google } from "googleapis";
import { Credentials, OAuth2Client } from "google-auth-library";
import { TOKEN_PATH, SCOPES, TOKEN_DIR } from "./config";
import { sleep } from "./utils";
import { clientSecret } from "./client_secret";
const OAuth2 = google.auth.OAuth2;

export default class YouTube {
  static getPlaylists(): any {
    throw new Error("Method not implemented.");
  }
  static getNewToken(
    value: string,
    playlists: any
  ): any[] | PromiseLike<any[]> {
    throw new Error("Method not implemented.");
  }

  credentials: any;
  oAuthClient: OAuth2Client | undefined;
  cachedPlaylistItems: any[] = [];
  cachedPlaylists: any[] = [];
  constructor() {
    this.cachedPlaylistItems = [];
    this.cachedPlaylists = [];
    this.getPlaylists.bind(this);
    this.playlist.bind(this);
    this.playlists.bind(this);
    this.getPlaylist.bind(this);

    // this.clearCache(10000);
  }

  private async clearCache(ms: number) {
    while (true) {
      await sleep(ms);
      this.cachedPlaylistItems = [];
      // this.cachedPlaylistItems.shift();
    }
  }

  getCredentials(
    callback: (auth: OAuth2Client, ...options: any[]) => any,
    ...options: any[]
  ) {
    if (this.credentials) {
      this.authorize(this.credentials, callback);
    }
    return new Promise((resolve) => {
      this.credentials = clientSecret;
      resolve(this.authorize(this.credentials, callback, ...options));
      // fs.readFile("./client_secret.json", (err, content) => {
      //   if (err) {
      //     // eslint-disable-next-line no-console
      //     console.log(`Error loading client secret file: ${err}`);
      //     return;
      //   }
      //   this.credentials = JSON.parse(content as any);
      //   console.log(this.credentials);
      //   resolve(this.authorize(this.credentials, callback, ...options));
      // });
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

    return {
      error: { msg: "Authorization needed" },
      authUrl: authUrl,
      callback: (code: string) => () => {},
    };
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
    return new Promise((resolve, reject) => {
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
            reject(err);
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
          playlistId: id,
          auth: auth,
          part: ["snippet", "contentDetails"],
          maxResults: 25,
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

  async getPlaylists(clearChache = false) {
    if (!clearChache && this.cachedPlaylists.length > 0) {
      console.log("Returning chached playlists ...");
      return this.cachedPlaylists;
    }
    try {
      const playlists = (await this.getCredentials(this.playlists)) as any[];
      this.cachedPlaylists = playlists;
      this.cachedPlaylistItems = [];
      return new Promise((resolve) => resolve(playlists));
    } catch (e) {
      console.error(e);
      return new Promise((resolve) =>
        resolve(
          this.getNewTokenUrl(this.oAuthClient as OAuth2Client, this.playlists)
        )
      );
    }
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
