const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let optionsWindow;
function createOptionsWindow() {
    optionsWindow = new BrowserWindow({
        width: 300,
        height: 250,
        show: false,
        resizable: false,
        modal: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    optionsWindow.loadFile(path.join(`${app.getAppPath()}/src/optionPanel.html`));

    optionsWindow.on('close', (event) => {
        event.preventDefault();
        optionsWindow.hide();
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
    console.log("Open");

    if (optionsWindow) {
        optionsWindow.show();
    } else {
        console.error("Options window has not been created.");
    }
});

ipcMain.once('options-confirm', (event, data) => {
    console.log("Selected Options:", data);

    if (optionsWindow) {
        optionsWindow.hide();
    }
});