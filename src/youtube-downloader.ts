import fs from "fs";
import {
  AvailableSettings,
  playlistStorage,
  settingsStorage,
  youtube,
  YOUTUBE_VIDEO_URL,
} from "./config";
import { replaceForbiddenCharacters, sleep } from "./utils";
import { downloadVideoCustom } from "./ffmpeg";
import { VideoQualityOptions } from "./interfaces";

export default class YoutubeDownloader {
  playlists: any[];
  isDownloading: boolean;
  videoDownloadQuality: VideoQualityOptions;

  constructor() {
    this.playlists = [];
    this.isDownloading = false;
    this.videoDownloadQuality = "360p";
    this.downloadPlaylistsForever();
  }

  updatePlaylists(playlists: any[]) {
    this.playlists = playlists;
  }

  updateVideoQuality(quality: VideoQualityOptions) {
    this.videoDownloadQuality = quality;
    console.log(this.videoDownloadQuality);
  }

  private async downloadPlaylistsForever() {
    while (true) {
      this.playlists = playlistStorage.getPlaylists();
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
              try {
                await downloadVideoCustom(
                  YOUTUBE_VIDEO_URL + video.contentDetails.videoId,
                  videoPath,
                  this.videoDownloadQuality === "highest"
                    ? undefined
                    : this.videoDownloadQuality
                );
              } catch (e) {
                console.error(e);
              }
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
