const { ipcRenderer } = require('electron');

const confirmButton = document.querySelector('.confirm-button');

confirmButton.addEventListener('click', async _ => {
    ipcRenderer.send('options-window-confirm');
});