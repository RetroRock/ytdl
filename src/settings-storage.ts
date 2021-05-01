import { ipcRenderer } from "electron";
import fs from "fs";
import {
  STORED_SETTINGS_DIRECTORY,
  STORED_SETTINGS_PATH,
  AvailableSettings,
} from "./config";

export default class SettingsStorage {
  settings: { [key: string]: any };
  defaultVideoPath: string;
  constructor() {
    this.settings = {};
    this.settingsInit();
    this.defaultVideoPath = "";
  }

  private settingsInit() {
    ipcRenderer.send("get-downloads-path");
    ipcRenderer.once("get-downloads-path", async (_, data) => {
      this.defaultVideoPath = data.path;
      if (!fs.existsSync(STORED_SETTINGS_DIRECTORY)) {
        const directory = await new Promise((resolve) =>
          fs.mkdir(
            STORED_SETTINGS_DIRECTORY,
            { recursive: true },
            (err, directory) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(directory);
              resolve(directory);
            }
          )
        );
        directory &&
          (await this.writeSettings({ video_path: this.defaultVideoPath }));
      }

      fs.readFile(STORED_SETTINGS_PATH, (err, content) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(`Error reading settings: ${err}`);
          return;
        }
        this.settings = JSON.parse(content as any).settings ?? {
          video_path: this.defaultVideoPath,
        };
      });
    });
  }

  getSettings(name?: AvailableSettings.video_path) {
    if (name) return { [name]: this.settings[name] };
    return this.settings;
  }

  async writeSettings(settings: {
    [key: string]: any;
  }): Promise<{ [key: string]: any }> {
    const newSettings: { settings: { [key: string]: any } } = await new Promise(
      (resolve) => {
        const newSettings = {
          settings: { ...this.settings, ...settings },
        };
        fs.writeFile(
          STORED_SETTINGS_PATH,
          JSON.stringify(newSettings),
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
        resolve(newSettings);
      }
    );
    this.settings = newSettings.settings;
    return new Promise((resolve) => resolve(this.settings));
  }
}
