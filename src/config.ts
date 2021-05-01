import Youtube from "./youtube";
import PlaylistStorage from "./playlist-storage";
import SettingsStorage from "./settings-storage";
import YoutubeDownloader from "./youtube-downloader";

const HOME =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
console.log(HOME);
// Settings
const STORED_SETTINGS_DIRECTORY = HOME + "/.ytdl-settings/";
const STORED_SETTINGS_PATH = STORED_SETTINGS_DIRECTORY + "settings.json";

enum AvailableSettings {
  video_path,
}

// Playlists
const STORED_PLAYLISTS_DIR = HOME + "/.stored-playlists/";
const STORED_PLAYLISTS_PATH = STORED_PLAYLISTS_DIR + "playlists.json";

// YouTube API
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];
const TOKEN_DIR = HOME + "/.credentials/";
const TOKEN_PATH = TOKEN_DIR + "ytdl.json";

const YOUTUBE_VIDEO_URL = "http://www.youtube.com/watch?v=";

const youtube = new Youtube();
const settingsStorage = new SettingsStorage();
const playlistStorage = new PlaylistStorage();
const youtubeDownloader = new YoutubeDownloader();

export {
  STORED_SETTINGS_DIRECTORY,
  STORED_SETTINGS_PATH,
  AvailableSettings,
  STORED_PLAYLISTS_DIR,
  STORED_PLAYLISTS_PATH,
  SCOPES,
  TOKEN_DIR,
  TOKEN_PATH,
  YOUTUBE_VIDEO_URL,
  youtube,
  playlistStorage,
  youtubeDownloader,
  settingsStorage,
};
