/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { app, ipcMain, nativeTheme } = require('electron');
const { Microsoft } = require('minecraft-java-core');
const { autoUpdater } = require('electron-updater')

const path = require('path');
const fs = require('fs');

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/launcherWindow.js");

let isDev = process.env.NODE_ENV === 'dev';

if (isDev) {
    let appPath = path.resolve('./data/Launcher').replace(/\\/g, '/');
    let appdata = path.resolve('./data').replace(/\\/g, '/');

    if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath, { recursive: true });
    }

    if (!fs.existsSync(appdata)) {
        fs.mkdirSync(appdata, { recursive: true });
    }

    app.setPath('userData', appPath);
    app.setPath('appData', appdata)
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.whenReady().then(() => {
        if (isDev) {
            return openMainWindow();
        }

        UpdateWindow.createWindow()
    });
}

/* Listeners */
ipcMain.on('main-window-open', () => {
    openMainWindow();
});

ipcMain.on('main-window-close', () => {
    MainWindow.destroyWindow();
});

ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow());
/* Listeners */

/* Open the main window */
function openMainWindow() {
    MainWindow.createWindow();
}

/* Directories */
ipcMain.handle('path-user-data', () => app.getPath('userData'));
ipcMain.handle('appData', e => app.getPath('appData'));
/* Directories */

/* Updater listeners */
autoUpdater.autoDownload = false;

ipcMain.on('start-update', () => autoUpdater.downloadUpdate());

ipcMain.handle('update-app', async () => {
    return await new Promise(async (resolve, reject) => {
        autoUpdater.checkForUpdates().then(res => {
            resolve(res);
        }).catch(error => {
            reject({
                error: true,
                message: error
            })
        })
    })
});
/* Updater listeners */

/* Updater messaging */
autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();

    if (updateWindow) {
        updateWindow.webContents.send('updateAvailable');
    }
});

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();

    if (updateWindow) {
        updateWindow.webContents.send('update-not-available');
    }
});

autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();

    if (updateWindow) {
        updateWindow.webContents.send('download-progress', progress);
    }
})

autoUpdater.on('error', (err) => {
    const updateWindow = UpdateWindow.getWindow();

    if (updateWindow) {
        updateWindow.webContents.send('error', err);
    }
});
/* Updater messaging */

/* App work */
app.on('window-all-closed', () => app.quit());