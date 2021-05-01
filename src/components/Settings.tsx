import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { AvailableSettings, settingsStorage } from "../config";

interface Props {
  toggleSettings: () => void;
}

export default function Settings(props: Props) {
  const settingsWrapperRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState("");
  const clickAway = (e: any) => {
    if (e.target === settingsWrapperRef.current) {
      props.toggleSettings();
    }
  };

  useEffect(() => {
    setPath(
      settingsStorage.getSettings(AvailableSettings.video_path).video_path
    );
  }, []);

  function selectDirectory() {
    ipcRenderer.send("select-directory", path);
    ipcRenderer.once("select-directory", async (_, data) => {
      if (data.path) {
        const settings = await settingsStorage.writeSettings({
          video_path: data.path,
        });
        setPath(settings.video_path);
      }
    });
  }

  return (
    <div
      ref={settingsWrapperRef}
      className="settings-wrapper"
      onClick={clickAway}
    >
      <div className="card settings">
        <div className="card-content">
          <h1 className="title is-3">Settings</h1>

          <div className="content">
            <div className="field">
              <label className="label">Speicherort:</label>
              <div className="control">
                <input
                  title={path}
                  className="input"
                  type="text"
                  onChange={() => null}
                  onClick={selectDirectory}
                  value={path}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
