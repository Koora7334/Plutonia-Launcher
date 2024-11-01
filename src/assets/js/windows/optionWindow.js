const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require("os");

let optionsWindow = undefined;

let forceClose = false;
let isDev = process.env.NODE_ENV === 'dev';

function destroyWindow() {
    if (optionsWindow) {
        forceClose = true;

        optionsWindow.close();
        optionsWindow = undefined;
    }
}

function createOptionsWindow() {
    destroyWindow();

    const iconExtension = os.platform() === "win32" ? "ico" : "png";

    optionsWindow = new BrowserWindow({
        title: "Plutonia - Options",
        width: 275,
        height: 225,
        icon: "./src/assets/images/icon." + iconExtension, // Never change this, its completly fucked up.
        show: false,
        resizable: false,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    optionsWindow.loadFile(path.join(app.getAppPath() + "/src/options.html")); // Never change this, its completly fucked up.

    optionsWindow.on('close', (event) => {
        if (!forceClose) {
            event.preventDefault();
        }

        if (optionsWindow) {
            optionsWindow.hide();
        }
    });

    optionsWindow.once("ready-to-show", () => {
        /* if (isDev) {
            optionsWindow.webContents.openDevTools({ mode: 'detach' });
        } */
    });

    /*optionsWindow.webContents.once('did-finish-load', () => {
        optionsWindow.webContents.send('load-config', {
            ram: "2048",
            tabbychat: true,
            voiceChat: false,
        });
    });*/
}

ipcMain.on('options-window-open', (event) => {
    if (optionsWindow) {
        optionsWindow.show();
    } else {
        createOptionsWindow();
    }
});

ipcMain.on('options-window-confirm', (event, data) => {
    if (optionsWindow) {
        optionsWindow.hide();
    }
});

module.exports = { createOptionsWindow, destroyWindow };