import React from "react";
import { Link } from "react-router-dom";

import addIcon from "../../assets/icons/add.svg";
import deleteIcon from "../../assets/icons/delete.svg";
import videoIcon from "../../assets/icons/video.svg";

interface Props {
  playlist: any;
  addedPlaylists: any[];
  togglePlaylist: (playlist: any) => () => void;
  openLink: (url: string) => () => void;
}

export default function PlaylistMinimal(props: Props) {
  const isSelected = props.addedPlaylists.find(
    (playlist) => playlist.id === props.playlist.id
  );
  return (
    <article className="media">
      <div className="media-left">
        <figure className="image is-48x48">
          <img
            // className="is-rounded"
            src={props.playlist.snippet.thumbnails.default.url}
            alt=""
          />
        </figure>
        <div className="videos-delete">
          <span>
            <img src={videoIcon} alt="" />
            <span>{props.playlist.contentDetails.itemCount}</span>
          </span>
          <button onClick={props.togglePlaylist(props.playlist)}>
            <img src={isSelected ? deleteIcon : addIcon} alt="Löschen" />
          </button>
        </div>
      </div>
      <div className="media-content">
        <div className="content">
          <p>
            <strong>{props.playlist.snippet.title}</strong>
            <br />

            {/* <a
              onClick={props.openLink(
                `https://www.youtube.com/playlist?list=${props.playlist.id}`
              )}
            >
              Playlist öffnen
            </a> */}

            <Link
              to={`/playlists/${props.playlist.id}/${props.playlist.snippet.title}`}
            >
              Playlist öffnen
            </Link>
            <br />

            <time dateTime={props.playlist.snippet.publishedAt}>
              {props.playlist.snippet.publishedAt.split("T")[0]}
            </time>
          </p>
        </div>
      </div>
    </article>
  );
}
