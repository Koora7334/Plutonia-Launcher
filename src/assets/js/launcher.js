/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const AuthWorker = require('./assets/js/workers/auth.js');
const authWorker = new AuthWorker();

const { Launch } = require('minecraft-java-core');
const os = require('os');
const launch = new Launch();
const { ipcRenderer, dialog } = require('electron');

const username = document.querySelector('.username input');
const password = document.querySelector('.password input');

const closeButton = document.querySelector('.close');
const playButton = document.querySelector('.play');
const settingsButton = document.querySelector('.settings');

const registerField = document.querySelector('.register');
const progressBar = document.querySelector('.progress');

/* Registering listeners */
closeButton.addEventListener('click', async _ => {
    ipcRenderer.send('main-window-close');
});

settingsButton.addEventListener('click', async _ => {
    ipcRenderer.send('options-window-open');
});

registerField.addEventListener('click', async _ => {
    window.open('https://plutonia-mc.fr/user/register', 'RegisterWindow', 'width=700,height=600');
});

playButton.addEventListener('click', async _ => {
    disableFields(true);

    if (username.value === '' || password.value === '') {
        setErrorMessage("Identifiants incorrects.");
        disableFields(false);
        return;
    }

    setMessage("Authentification en cours...");

    try {
        await authWorker.auth(username.value, password.value);
        setMessage("Authentification réussie.");
    } catch (error) {
        setErrorMessage(error.message);
        disableFields(false);
    }
});
/* Registering listeners */

/* Utils */
function disableFields(state) {
    const elements = [username, password, playButton, settingsButton, registerField];

    elements.forEach(element => {
        if (state) {
            element.classList.add('disabled');
        } else {
            element.classList.remove('disabled');
        }
    });
}

function setMessage(text) {
    progressBar.innerHTML = text;
}

function setErrorMessage(text) {
    setMessage("<span style='color: red;'>" + text + "</span>");
}
/* Utils */