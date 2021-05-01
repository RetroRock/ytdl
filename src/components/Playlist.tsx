import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { youtube } from "../config";

export default function Playlist() {
  const { playlistId, playlistName }: any = useParams();
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);

  async function getPlaylistItems() {
    const playlist: any = await youtube.getPlaylist(playlistId);
    if (!playlist.items) return;
    setPlaylistItems([...playlist.items]);
  }
  useEffect(() => {
    getPlaylistItems();
  }, [playlistId]);

  return (
    <div>
      <div className="hero">
        <div className="hero-body">
          <p className="title">{playlistName}</p>
          <p className="subtitle">
            <Link to="/">Back home</Link>
          </p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>
              <abbr title="Position">Pos</abbr>
            </th>
            <th>Titel</th>
            <th>Kanalname</th>
            <th>Veröffentlicht</th>
            <th>Beschreibung</th>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <th>
              <abbr title="Position">Position</abbr>
            </th>
            <th>Titel</th>
            <th>Kanalname</th>
            <th>Veröffentlicht</th>
            <th>Beschreibung</th>
          </tr>
        </tfoot>
        <tbody>
          {playlistItems.map((video, index) => (
            <tr key={"video-" + index}>
              <td>{video.snippet.position + 1}</td>
              <td>
                <div className="table-thumbnail">
                  <figure>
                    <img
                      src={video.snippet.thumbnails.high?.url}
                      alt="No thumbnail"
                    />
                  </figure>
                  {video.snippet.title}
                </div>
              </td>
              <td>{video.snippet.videoOwnerChannelTitle}</td>
              <td>{video.snippet.publishedAt.split("T")[0]}</td>
              <td>
                {video.snippet.description.length > 400
                  ? video.snippet.description.slice(1, 600) + " …"
                  : video.snippet.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
