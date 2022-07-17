const { contextBridge, ipcRenderer } = require("electron");
const { resolve, sep } = require("path");
const { readdirSync } = require("fs");

// Model
const flags = `${__dirname}${sep}..${sep}assets${sep}icons${sep}flags${sep}`;
let resDir = `${process.resourcesPath}${sep}util${sep}`;

resDir = `${resolve(resDir)}${sep}`;

// Controller
const main = {
  read: () => {
    return readdirSync(resDir);
  },
  icons: () => {
    return flags;
  },
  connect: (selectedServer) => {
    ipcRenderer.send("connect", selectedServer);
  },
  disconnect: () => {
    ipcRenderer.send("disconnect");
  },
};

// View
contextBridge.exposeInMainWorld("api", main);
