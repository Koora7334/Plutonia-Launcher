const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require("os");

let isDev = process.env.NODE_ENV === 'dev';
let optionsWindow;

function createOptionsWindow() {
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

    optionsWindow.loadFile(path.join(`${app.getAppPath()}/src/optionPanel.html`));

    optionsWindow.on('close', (event) => {
        event.preventDefault();
        optionsWindow.hide();
    });

    optionsWindow.once("ready-to-show", () => {
        /*if (isDev) {
            optionsWindow.webContents.openDevTools({ mode: 'detach' });
        }*/
    });

    optionsWindow.webContents.once('did-finish-load', () => {
        optionsWindow.webContents.send('load-config', {
            ram: "2048",
            tabbychat: true,
            voiceChat: false,
        });
    });
}

app.on('ready', () => {
    createOptionsWindow();
});

ipcMain.on('open-options-panel', (event) => {
    if (optionsWindow) {
        optionsWindow.show();
    }
});

ipcMain.on('options-confirm', (event, data) => {
    if (optionsWindow) {
        optionsWindow.hide();
    }
});