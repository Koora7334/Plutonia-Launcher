const { ipcRenderer, ipcMain, app } = require('electron');

const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '..', 'options.json');

const confirmButton = document.querySelector('.confirm-button');

const ramSelector = document.querySelector('#ram');

const tabbyChat = document.querySelector('#tc');
const simpleVoiceChat = document.querySelector('#svc');

confirmButton.addEventListener('click', async _ => {
    ipcRenderer.send('options-window-confirm');

    const data = {
        "ram": ramSelector.value,
        "tabbyChat": tabbyChat.checked,
        "simpleVoiceChat": simpleVoiceChat.checked
    };

    fs.writeFile(saveFilePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error("Error saving options data:", err);
        } else {
            console.log("Options saved successfully.");
        }
    });
});

window.addEventListener('load', () => {
    fs.readFile(saveFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading options data:", err);
            return;
        }

        const optionsData = JSON.parse(data);

        if (optionsData) {
            ramSelector.value = optionsData.ram;
            tabbyChat.checked = optionsData.tabbyChat;
            simpleVoiceChat.checked = optionsData.simpleVoiceChat;
        }
    });
});