import { ipcRenderer, TouchBarSlider } from "electron";
import fs from "fs";
import {
  AvailableSettings,
  playlistStorage,
  settingsStorage,
  STORED_PLAYLISTS_DIR,
  youtube,
  YOUTUBE_VIDEO_URL,
} from "./config";
import ytdl from "ytdl-core";
import { replaceForbiddenCharacters, sleep } from "./utils";

export default class YoutubeDownloader {
  playlists: any[];
  isDownloading: boolean;
  constructor() {
    this.playlists = [];
    this.isDownloading = false;
    this.downloadPlaylistsForever();
  }

  updatePlaylists(playlists: any[]) {
    this.playlists = playlists;
  }

  private async downloadPlaylistsForever() {
    while (true) {
      this.playlists = playlistStorage.getPlaylists();
      console.log(this.playlists);
      await this.downloadPlaylists();
      await sleep(10000);
    }
  }

  async createPlaylistDir(playlistpath: string) {
    if (!fs.existsSync(playlistpath)) {
      await new Promise((resolve) =>
        fs.mkdir(playlistpath, { recursive: true }, (err, path) => {
          if (err !== null) {
            console.error(err);
            return;
          }
          resolve(path);
        })
      );
    }
    return new Promise((resolve) => resolve(playlistpath));
  }
  private downloadVideo(videoUrl: string, videoPath: string) {
    return new Promise((resolve) => {
      const stream = ytdl(videoUrl);
      stream.pipe(fs.createWriteStream(videoPath));
      stream.on("finish", () => {
        console.log(
          "%c" + new Date().getMinutes() + ":" + new Date().getSeconds(),
          "color: yellow"
        );
        resolve(true);
      });
      stream.on("error", () => resolve(true));
      // ytdl.getBasicInfo(videoUrl).then((data) => console.log(data));
    });
  }

  private async downloadPlaylists(): Promise<any> {
    const playlistPromises = this.playlists.map((playlist: any) =>
      youtube.getPlaylist(playlist.id)
    );
    const playlists: any[] = await Promise.all(playlistPromises);

    let playlistIndex = 0;
    for (let playlist of playlists) {
      await new Promise(async (resolve) => {
        for (let video of playlist.items) {
          if (video.contentDetails.videoId) {
            const playlistPath = await this.createPlaylistDir(
              settingsStorage.getSettings(AvailableSettings.video_path)
                .video_path +
                "/" +
                replaceForbiddenCharacters(
                  this.playlists[playlistIndex].snippet.title,
                  "_"
                )
            );
            const videoPath = `${playlistPath}/${replaceForbiddenCharacters(
              video.snippet.title,
              "_"
            )}.mp4`;
            if (!fs.existsSync(videoPath)) {
              await this.downloadVideo(
                YOUTUBE_VIDEO_URL + video.contentDetails.videoId,
                videoPath
              );
            }
          }
        }
        resolve(true);
      });
      playlistIndex++;
    }
    console.log(
      "%c" + new Date().getMinutes() + ":" + new Date().getSeconds(),
      "color: red"
    );
    return new Promise((resolve) => resolve(true));
  }
}
