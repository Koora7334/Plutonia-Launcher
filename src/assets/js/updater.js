/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const pkg = require('../package.json');

const { ipcRenderer, shell } = require('electron');
const os = require('os');
const nodeFetch = require("node-fetch");

class Splash {
    constructor() {
        this.initElements()
        this.registerListeners()
    }

    initElements() {
        this.splash = document.querySelector(".splash-logo");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector(".progress");
    }

    async registerListeners() {
        document.addEventListener('DOMContentLoaded', async () => {
            this.applySplashAnimation();
        });
    }

    async applySplashAnimation() {
        const animations = [
            () => this.splash.classList.add("opacity"),
            () => this.splash.classList.add("translate"),
            () => this.message.classList.add("opacity")
        ];

        document.querySelector("#splash").style.display = "block";

        for (const animate of animations) {
            await sleep(500);
            animate();
        }

        this.startUpdate();
    }

    async startUpdate() {
        this.setMessage("Recherche de mise à jour...");

        ipcRenderer.invoke('update-app').then().catch(error => {
            console.log("Error happened during update: " + error.message);
            this.setMessageAndClose("<span style='color: red;'>Une erreur est survenue lors de la mise à jour.</span>");
            return;
        });

        ipcRenderer.on('updateAvailable', () => {
            if (os.platform() == 'win32') {
                this.setMessage("Téléchargement de la mise à jour...");
                ipcRenderer.send('start-update');
            } else {
                this.setMessage("<span style='color: red;'>Une mise à jour est disponible, veuillez re-télécharger notre lanceur !</span>");
                sleep(5_000);
                this.startLauncher();
            }
            
            return;
        })

        ipcRenderer.on('error', (event, error) => {
            if (error) {
                console.log("Error happened during update: " + error.message);
                this.setMessageAndClose("<span style='color: red;'>Une erreur est survenue lors de la mise à jour.</span>");
                return;
            }
        })

        ipcRenderer.on('download-progress', (event, progress) => {
            let percents = progress.transferred / progress.total;

            console.log("Downloading update... (total: " + percents + "%");
            this.setMessage("Téléchargement en cours... (" + percents + ")");
            return;
        })

        ipcRenderer.on('update-not-available', () => {
            console.log("The launcher is currently up to date.");
            this.setMessage("Votre lanceur est à jour !");
            this.startLauncher();
            return;
        })
    }

    startLauncher() {
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    setMessage(message) {
        this.message.innerHTML = message;
    }

    setMessageAndClose(message) {
        let countdown = 10;

        const intervalId = setInterval(() => {
            this.setMessage(message + "<br>Fermeture dans " + countdown-- + " secondes...</br>");

            if (countdown < 0) {
                clearInterval(intervalId);
                ipcRenderer.send('update-window-close');
            }
        }, 1000);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

new Splash();
