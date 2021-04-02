import { ipcRenderer } from "electron";
import React, { createContext, ReactNode, useEffect, useState } from "react";

interface Context {
  showSettings: boolean;
  toggleSettings: () => void;
}

const SettingsContext = createContext<Context>(undefined as any);
function SettingsContextProvider({ children }: any) {
  const [showSettings, setShowSettings] = useState(false);

  function toggleSettings() {
    console.log("update", showSettings);
    setShowSettings(!showSettings);
  }

  useEffect(() => console.log("settings", showSettings), [showSettings]);

  useEffect(() => {
    ipcRenderer.on("settings", () => toggleSettings());
    return () => {
      ipcRenderer.removeListener("settings", toggleSettings);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ showSettings, toggleSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export { SettingsContext, SettingsContextProvider };
