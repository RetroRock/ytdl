import fs from "fs";
import { STORED_PLAYLISTS_PATH, STORED_PLAYLISTS_DIR } from "./config";

export default class PlaylistStorage {
  playlists: Set<any>;

  constructor() {
    this.playlists = new Set();
    this.getPlaylistsInit();
  }

  private getPlaylistsInit() {
    fs.readFile(STORED_PLAYLISTS_PATH, (err, content) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log(`Error playlists: ${err}`);
        return;
      }
      console.log(JSON.parse(content as any));
      JSON.parse(content as any).playlists?.forEach((playlist: any) =>
        this.playlists.add(playlist)
      );
    });
  }

  getPlaylists(): any[] {
    return [...this.playlists];
  }

  private writePlaylists() {
    return new Promise((resolve, reject) =>
      fs.writeFile(
        STORED_PLAYLISTS_PATH,
        JSON.stringify({ playlists: [...this.playlists] }),
        (err) => {
          if (err) {
            console.error(err);
            reject(err);
          }
          resolve(true);
        }
      )
    );
  }

  async storePlaylistsInitial() {
    if (!fs.existsSync(STORED_PLAYLISTS_DIR + "playlists.json")) {
      await new Promise((resolve) =>
        fs.mkdir(STORED_PLAYLISTS_DIR, { recursive: true }, (err, path) => {
          if (err !== null) {
            console.error(err);
            return;
          }
          resolve(path);
        })
      );
      await this.writePlaylists();
    }
    return new Promise((resolve) => resolve(true));
  }
  async addPlaylists(playlists: any[]) {
    playlists.forEach((playlist) => {
      if (!this.playlists.has(playlist)) {
        this.playlists.add(playlist);
      }
    });
    await this.storePlaylistsInitial();
    let newPlaylists: any[] = [];
    this.playlists.forEach((playlist) => {
      newPlaylists.push(playlist);
    });
    await this.writePlaylists();
  }

  async removePlaylists(playlists: string[]) {
    for (let playlist of this.playlists) {
      if (playlists.find((pl) => pl === playlist.id)) {
        this.playlists.delete(playlist);
      }
    }
    await this.writePlaylists();
  }
}
