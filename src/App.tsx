import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  HashRouter,
  useHistory,
} from "react-router-dom";
import "./App.global.scss";

import { ipcRenderer, shell } from "electron";
import PlaylistMinimal from "./components/PlaylistMinimal";
import Playlist from "./components/Playlist";
import Settings from "./components/Settings";
import { playlistStorage, youtube } from "./config";
import refreshIcon from "../assets/icons/refresh.svg";
import { sleep } from "./utils";

const Main = () => {
  const ytbCodeRef = useRef<HTMLInputElement>(null);
  const refreshRef = useRef<HTMLImageElement>(null);
  const [playlists, setPlaylists] = useState<Array<any>>([]);
  const [playlistsDownload, setPlaylistsDownload] = useState<Array<any>>([]);
  const [isAuthorized, setIsAuthorized] = useState(true);
  useEffect(() => {
    fetchPlaylists();
  }, []);

  async function sendCode() {
    if (ytbCodeRef.current) {
      console.log(ytbCodeRef.current.value);
      setPlaylists(
        (await youtube.getNewToken(
          ytbCodeRef.current.value,
          youtube.playlists
        )) as Array<any>
      );
      setIsAuthorized(true);
    }
  }

  async function refreshTransition() {
    if (refreshRef.current) {
      refreshRef.current.classList.add("spin");
      await sleep(1000);
      refreshRef.current.classList.remove("spin");
    }
  }

  async function fetchPlaylists(clearCache = false) {
    refreshTransition();
    const result: any = clearCache
      ? await youtube.getPlaylists(true)
      : await youtube.getPlaylists();
    if (result.error) {
      shell.openExternal(result.authUrl);
      isAuthorized && setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
      setPlaylists(result);
    }
    setPlaylistsDownload(
      playlistStorage
        .getPlaylists()
        .map((playlist: any) => result.find((p: any) => p.id === playlist.id))
    );
  }

  const openLink = (url: string) => () => {
    shell.openExternal(url);
  };

  const togglePlaylist = (playlist: any) => () => {
    const newPlaylists = [...playlistsDownload];
    const indexOfPlaylist = playlistsDownload.indexOf(playlist);
    if (indexOfPlaylist < 0) {
      newPlaylists.push(playlist);
      setPlaylistsDownload(newPlaylists);
      playlistStorage.addPlaylists([playlist]);
      return;
    }
    newPlaylists.splice(indexOfPlaylist, 1);
    setPlaylistsDownload(newPlaylists);
    playlistStorage.removePlaylists([playlist.id]);
  };

  if (!isAuthorized) {
    return (
      <div className="authorization">
        <div className="hero ">
          <div className="hero-body">
            <p className="title">Authorisierung</p>
            <p className="subtitle">Bitte loggen Sie sich ein!</p>
            <div className="auth-submit">
              <input
                ref={ytbCodeRef}
                className="input"
                type="text"
                placeholder="Code hier einfügen"
              />
              <button className="button" onClick={sendCode}>
                Fertig
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <main>
      <h2 className="title main-title">Youtube Downloader! 💖</h2>
      <div className="playlists">
        <div className="playlist-title-wrapper">
          <h2 className="title playlist-title">Deine PlayLists</h2>
          <button title="Aktualisieren" onClick={() => fetchPlaylists(true)}>
            <img ref={refreshRef} src={refreshIcon} alt="Aktualisieren" />
          </button>
        </div>
        <ul className="columns">
          {playlists[0]?.id &&
            playlists.map((playlist, index) => (
              <li
                className="column box"
                key={"playlist-" + index}
                // onClick={togglePlaylist(playlist)}
              >
                <PlaylistMinimal
                  playlist={playlist}
                  openLink={openLink}
                  addedPlaylists={playlistsDownload}
                  togglePlaylist={togglePlaylist}
                />
              </li>
            ))}
        </ul>
      </div>
      <div className="playlists-download">
        <h2 className="title playlist-title">
          Zum Download vorgesehene Playlists
        </h2>
        <ul className="columns">
          {playlistsDownload[0]?.id ? (
            playlistsDownload.map((playlist, index) => (
              <li
                className="column box"
                key={"playlist-download-" + index}
                // onClick={showPlaylist(playlist.id)}
              >
                <PlaylistMinimal
                  playlist={playlist}
                  openLink={openLink}
                  addedPlaylists={playlistsDownload}
                  togglePlaylist={togglePlaylist}
                />
              </li>
            ))
          ) : (
            <h3 className="title" style={{ overflow: "hidden" }}>
              Ja, wo sind sie denn? 🤯
            </h3>
          )}
        </ul>
      </div>
    </main>
  );
};

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = () => setShowSettings(!showSettings);

  useEffect(() => {
    ipcRenderer.on("settings", toggleSettings);
    return () => {
      ipcRenderer.removeListener("settings", toggleSettings);
    };
  }, [showSettings]);

  return (
    <>
      <HashRouter>
        <Switch>
          {/* "/" matches all routes, therefore "exact" */}
          <Route exact path="/" component={Main} />
          <Route
            path="/playlists/:playlistId/:playlistName"
            component={Playlist}
          />
        </Switch>
      </HashRouter>
      {showSettings && <Settings toggleSettings={toggleSettings} />}
    </>
  );
}
