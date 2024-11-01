/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { ipcRenderer, dialog } = require('electron');

const os = require('os');
const path = require('path');

const AuthWorker = require('./assets/js/workers/auth.js');
const authWorker = new AuthWorker();

const UpdateWorker = require('./assets/js/workers/updater.js');
const updateWorker = new UpdateWorker();

async function getDataPath() {
    try {
        const dataPath = await ipcRenderer.invoke('appData');
        const saveFilePath = path.join(dataPath, (os.platform() !== 'darwin' ? '.' : '') + "plutonia");

        return saveFilePath;
    } catch (error) {
        console.error('Erreur lors de la récupération du chemin :', error);
    }
}

const username = document.querySelector('.username input');
const password = document.querySelector('.password input');

const closeButton = document.querySelector('.close');
const playButton = document.querySelector('.play');
const settingsButton = document.querySelector('.settings');

const registerField = document.querySelector('.register');

const progressBar = document.querySelector('.progress');
const progressBarText = document.querySelector('.progress-text');

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
        return;
    }

    setMessage("Vérification des fichiers...");

    getDataPath().then(launcherPath => {
        try {
            updateWorker.update(launcherPath);
        } catch (error) {
            setErrorMessage(error.message);
            disableFields(false);
            return;
        }
    });
});
/* Registering listeners */

/* Listen events */
updateWorker.on('check-completed', () => {
    setMessage("Téléchargement en cours...");
});

updateWorker.on('downloading', ({ current, total }) => {
    setProgress((current / total) * 100);
    setMessage("Téléchargement en cours... (" + current + "/" + total + ")");
});

updateWorker.on('completed', () => {
    setProgress(100);
    setMessage("Lancement du jeu...");
});
/* Listen events */

/* Utils */
function setProgress(percentage) {
    const maxWidth = 447;
    const progressBarWidth = (percentage / 100) * maxWidth;

    progressBar.style.width = progressBarWidth + "px";
}

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
    progressBarText.innerHTML = text;
}

function setErrorMessage(text) {
    setMessage("<span style='color: red;'>" + text + "</span>");
}
/* Utils */