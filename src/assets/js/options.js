const { ipcRenderer, ipcMain, app } = require('electron');

const fs = require('fs');
const path = require('path');

async function getSaveFilePath() {
    try {
        const dataPath = await ipcRenderer.invoke('path-user-data');
        const saveFilePath = path.join(dataPath, 'options.json');

        return saveFilePath;
    } catch (error) {
        console.error('Erreur lors de la récupération du chemin :', error);
    }
}

const confirmButton = document.querySelector('.confirm-button');

const ramSelector = document.querySelector('#ram');

const tabbyChat = document.querySelector('#tc');
const simpleVoiceChat = document.querySelector('#svc');

/* Called when the confirm button is pressed */
confirmButton.addEventListener('click', async _ => {
    ipcRenderer.send('options-window-confirm');

    const data = {
        "ram": ramSelector.value,
        "tabbyChat": tabbyChat.checked,
        "simpleVoiceChat": simpleVoiceChat.checked
    };

    getSaveFilePath().then(filePath => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                console.error("Error saving options data:", err);
            } else {
                console.log("Options saved successfully.");
            }
        });
    });
});

/* Called when the HTML document is loaded */
window.addEventListener('load', () => {
    getSaveFilePath().then(filePath => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
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
});