const { app, shell, BrowserWindow, Menu, Tray, net, ipcMain, dialog } = require("electron");
const { homedir } = require("os");
const { join, resolve, sep } = require("path");
const { writeSync, closeSync, openSync, readdirSync, unlinkSync, existsSync, mkdirSync } = require("fs");
const { autoUpdater } = require("electron-updater");
const { spawn } = require("child_process");

// Model
app.on("ready", main);

let initApp;
let resDir = `${process.resourcesPath}${sep}util${sep}`;
let utilDir = process.resourcesPath + sep;
let ovpn = null;

resDir = `${resolve(resDir)}${sep}`;

// Controller
ipcMain.on("connect", (IpcEvent, selectedServer) => {
  let fetchDir = `${utilDir}bin${sep}openvpn`;
  const _process = resolve(fetchDir);

  const superPath = resDir + selectedServer;
  const args = ["--config", superPath];
  console.log(args);

  ovpn = spawn(_process, args);
  ovpn.on("error", (e) => {
    console.error(e);
  });
  ovpn.stdout.on("data", (data) => {
    const message = data.toString();
    console.log(`> stdout: ${message}`, true);
  });
  ovpn.stderr.on("data", (data) => {
    const message = data.toString();
    console.log(`> stderr: ${message}`, true);
  });
});

ipcMain.on("disconnect", (IpcEvent) => {
  const { exec } = require("sudo-prompt");
  if (ovpn) {
    ovpn.kill("SIGINT");
    ovpn = null;
  } else {
    if (ovpn) {
      exec("pkill -SIGINT openvpn", { name: "Opulence VPN" }, function (error, stdout, stderr) {
        if (error) log("err:" + error.toString(), true);
        if (stdout) log("stdout: " + stdout.toString(), false);
        if (stderr) {
          var msg = stderr.toString();
          log("stderr: " + msg, true);
          if (msg.includes("Request dismissed")) {
            return;
          }
        }
        ovpn = null;
      });
    }
  }
});

function serverUpdate() {
  let server;
  let list = {};
  const files = readdirSync(resDir);
  const fnArr = files.length;

  for (let i = 0; i < fnArr; ++i) {
    if (!list[server]) {
      list[server] = {};
      list[server] = new Array();
    }
    list[server].push(files[i]);
  }
}

function updateLocalDirectory(net) {
  const { get } = require("https");
  const { JSDOM } = require("jsdom");
  const dir = "remote";
  const server = `url`;
  const fetchRemoteFiles = `url`;

  function getRemoteFile(href, filename, onComplete) {
    get(server + href, function (response) {
      if (filename.includes("...") || filename.includes("..>")) {
        resDir + decodeURIComponent(href);
      } else {
        let localFilePath = resDir + filename;
        let fd = openSync(localFilePath, "w");
        response.on("data", function (d) {
          writeSync(fd, d);
        });
        response.on("end", function () {
          closeSync(fd);
          onComplete();
        });
      }
    });
  }

  get(fetchRemoteFiles, function (response) {
    let htmlResponse = "";
    response.on("data", function (d) {
      let htmlData = d.toString();
      htmlResponse += htmlData;

      if (d.includes("</html>")) {
        const dom = new JSDOM(htmlResponse);
        const links = dom.window.document.getElementsByTagName("a");
        const linksArr = links.length;
        let remoteFilesURL = [];
        let remoteFilesNames = [];
        let filesRead = 0;
        let filesTotal = 0;

        for (let i = 0; i < linksArr; ++i) {
          let link = links[i];
          if (link.href.includes(".ovpn.ovpn") || (link.href.includes(`/${dir}/`) && link.href.includes(".ovpn"))) {
            remoteFilesURL.push(link.href);
            remoteFilesNames.push(link.textContent);
            ++filesTotal;
          }
        }

        let localFileNames = readdirSync(resDir);
        const localArr = localFileNames.length;
        const remoteArr = remoteFilesNames.length;

        for (let i = 0; i < remoteArr; ++i) {
          if (localFileNames.includes(remoteFilesNames[i])) {
            --filesTotal;
            continue;
          }
          getRemoteFile(remoteFilesURL[i], remoteFilesNames[i], function () {
            ++filesRead;
            if (filesRead == filesTotal) {
              serverUpdate(function () {
                if (!selectedServer && serverTabs.length > 0) {
                  return;
                }
              });
            }
          });
        }
        for (let i = 0; i < localArr; ++i) {
          if (remoteFilesNames.includes(localFileNames[i]) == false) {
            unlinkSync(resDir + sep + localFileNames[i]);
          }
        }
        if (filesTotal == 0) {
          serverUpdate(function () {
            if (!selectedServer && serverTabs.length > 0) {
              return;
            }
          });
        }
      }
    });
  }).on("error", function (e) {
    console.log(e);
    console.log("No Servers were found!");
  });
}

if (process.platform == "win32") {
  let _process = "openvpn";
  if (existsSync("C:\\Program Files\\OpenVPN\\bin\\openvpn.exe")) {
    _process = "C:\\Program Files\\OpenVPN\\bin\\openvpn.exe";
  } else if (existsSync("C:\\Program Files (x86)\\OpenVPN\\bin\\openvpn.exe")) {
    _process = "C:\\Program Files (x86)\\OpenVPN\\bin\\openvpn.exe";
  } else {
    console.warn("Running Installer");
    const msiInstallerPath = `${utilDir}bin${sep}ovpn.msi`;

    const execCMDArgs = `/i "${resolve(msiInstallerPath)}" ADDLOCAL=OpenVPN,Drivers.TAPWindows6,Drivers /qn /quiet /norestart`;
    const installer = spawn("msiexec", [execCMDArgs], {
      detached: true,
      cwd: homedir(),
      env: process.env,
      shell: true,
    });

    installer.on("error", (err) => {
      console.error("installer:error: " + err, true);
    });
    installer.stdout.on("data", (data) => {
      const message = data.toString();
      console.log("installer:stdout: " + message, true);
    });
    installer.stderr.on("data", (data) => {
      const message = data.toString();
      console.log("installer:stderr: " + message, true);
    });
    installer.on("close", (code) => {
      console.log(`installer: child process exited with code ${code}`, true);

      if (existsSync("C:\\Program Files\\OpenVPN\\bin\\openvpn.exe")) {
        _process = "C:\\Program Files\\OpenVPN\\bin\\openvpn.exe";
        console.log('OpenVPN intalled at "' + _process + '"', true);
      } else if (existsSync("C:\\Program Files (x86)\\OpenVPN\\bin\\openvpn.exe")) {
        _process = "C:\\Program Files (x86)\\OpenVPN\\bin\\openvpn.exe";
        console.log('OpenVPN intalled at "' + _process + '"', true);
      } else {
        console.log("OpenVPN installation failed. Please install OpenVPN", true);
      }
    });

    installer.unref();
  }
}

if (existsSync(resDir)) {
  console.log("> Directories already exist, no need to create them.");
} else {
  console.log("> Creating directories...");
  mkDirByPathSync(resDir);
}

function mkDirByPathSync(pathToCreate) {
  pathToCreate.split(sep).reduce((prevPath, folder) => {
    const currentPath = join(prevPath, folder, sep);
    if (!existsSync(currentPath)) {
      mkdirSync(currentPath);
    }
    return currentPath;
  }, "");
}

// View
function main() {
  const icon = __dirname + "/src/assets/icons/favicon.ico";
  const window = new BrowserWindow({
    width: 337,
    height: 540,
    icon: icon,
    show: false,
    resizable: false,
    webPreferences: {
      preload: __dirname + "/src/scripts/preload.js",
    },
  });

  window.loadFile("index.html");
  window.removeMenu();

  if (!app.requestSingleInstanceLock()) app.quit();
  else {
    app.on("second-instance", () => {
      if (window) window.show();
      window.focus();
    });
  }

  window.on("ready-to-show", () => {
    window.show();
    const tray = new Tray(icon);
    tray.setToolTip("Opulence VPN");

    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Opulence VPN", type: "normal", enabled: false },
        { type: "separator" },
        { label: `Check for Updates`, click: checkForUpdates, type: "normal" },
        { label: `Quit`, click: app.quit, type: "normal" },
      ])
    );

    tray.on("click", () => {
      window.isVisible() ? window.hide() : window.show();
    });
  });

  window.webContents.addListener("new-window", function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });

  window.on("close", (init) => {
    if (initApp) return;
    init.preventDefault();
    window.hide();
  });
}

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-downloaded", (info) => {
  const dialogOpts = {
    type: "info",
    buttons: ["Ok"],
    title: "Opulence VPN",
    detail: "A new update has been downloaded, please restart the app to install the update.",
  };

  dialog.showMessageBox(dialogOpts);
});

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on("update-not-available", (info) => {
    const dialogOpts = {
      type: "info",
      buttons: ["Ok"],
      title: "Opulence VPN",
      detail: "You're on the latest version.",
    };

    dialog.showMessageBox(dialogOpts);
  });
}

app.on("before-quit", () => (initApp = true));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

updateLocalDirectory(net);
