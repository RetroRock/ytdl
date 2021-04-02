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
import icon from "../assets/icon.svg";
import "./App.global.scss";
import Youtube from "./youtube";

import { ipcRenderer, shell } from "electron";
import PlaylistMinimal from "./components/PlaylistMinimal";
import Playlist from "./components/Playlist";
import Settings from "./components/Settings";

const Main = () => {
  const { youtube } = useContext(YoutubeContext);

  const ytbCodeRef = useRef<HTMLInputElement>(null);
  const [playlists, setPlaylists] = useState<Array<any>>([]);
  const [playlistsDownload, setPlaylistsDownload] = useState<Array<any>>([]);
  const [isAuthorized, setIsAuthorized] = useState(true);
  useEffect(() => {
    async function fetchPlaylists() {
      const result: any = await youtube.getPlaylists();
      console.debug(result);
      if (result.error) {
        shell.openExternal(result.authUrl);
        isAuthorized && setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
        setPlaylists(result);
      }
    }
    fetchPlaylists();
  }, []);

  useEffect(() => {}, [playlistsDownload]);

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

  const openLink = (url: string) => () => {
    shell.openExternal(url);
  };

  const togglePlaylist = (playlist: any) => () => {
    const newPlaylists = [...playlistsDownload];
    const indexOfPlaylist = playlistsDownload.indexOf(playlist);
    console.log(indexOfPlaylist);
    if (indexOfPlaylist < 0) {
      newPlaylists.push(playlist);
      setPlaylistsDownload(newPlaylists);
      return;
    }
    newPlaylists.splice(indexOfPlaylist, 1);
    setPlaylistsDownload(newPlaylists);
  };

  // const showPlaylist = (id: string) => () => {
  //   Router.navigate("/p");

  // };

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
        <h2 className="title playlist-title">Deine PlayLists</h2>
        <ul className="columns">
          {playlists[0] &&
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
          {playlistsDownload[0] ? (
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

export const YoutubeContext = createContext(undefined as any);

export default function App() {
  const youtube = new Youtube();
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = () => setShowSettings(!showSettings);

  useEffect(() => {
    ipcRenderer.on("settings", toggleSettings);
    return () => {
      ipcRenderer.removeListener("settings", toggleSettings);
    };
  }, [showSettings]);

  return (
    <YoutubeContext.Provider value={{ youtube }}>
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
    </YoutubeContext.Provider>
  );
}
