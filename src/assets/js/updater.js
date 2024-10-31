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
            this.setMessage("Une mise à jour est disponible !");
            this.dowloadUpdate();
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
            percents = progress.transferred / progress.total;

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

    async downloadUpdate() {
        try {
            const repoURL = this.extractRepoDetails(pkg.repository.url);
            const latestReleaseAssets = await this.fetchLatestReleaseAssets(repoURL);
            const latestAsset = this.getLatestRelease(latestReleaseAssets);

            if (latestAsset) {
                shell.openExternal(latestAsset.browser_download_url);
                this.setMessageAndClose("Mise à jour téléchargée.");
            } else {
                console.error("No suitable release found for your operating system.");
            }
        } catch (error) {
            console.error("An error occurred while downloading the update:", error);
        }
    }

    extractRepoDetails(repoUrl) {
        return repoUrl.replace("git+", "").replace(".git", "").replace("https://github.com/", "").split("/");
    }

    async fetchLatestReleaseAssets(repoURL) {
        const githubAPI = await nodeFetch('https://api.github.com').then(res => res.json());
        const githubAPIRepoURL = githubAPI.repository_url.replace("{owner}", repoURL[0]).replace("{repo}", repoURL[1]);

        const githubAPIRepo = await nodeFetch(githubAPIRepoURL).then(res => res.json());
        const releasesUrl = await nodeFetch(githubAPIRepo.releases_url.replace("{/id}", '')).then(res => res.json());

        return releasesUrl[0].assets;
    }

    getLatestRelease(osInput, preferredFileFormat, assets) {
        const normalizedOS = osInput.toLowerCase();

        const filteredAssets = assets.filter(asset => {
            const assetName = asset.name.toLowerCase();
            const isOSCompatible = assetName.includes(normalizedOS);
            const isFormatCompatible = assetName.endsWith(preferredFileFormat);

            return isOSCompatible && isFormatCompatible;
        });

        if (filteredAssets.length === 0) {
            return null;
        }

        return filteredAssets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
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
