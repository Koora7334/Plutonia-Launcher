/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { ipcRenderer, shell } = require('electron');
const pkg = require('../package.json');
const os = require('os');
const nodeFetch = require("node-fetch");

class Splash {
    constructor() {
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.splash = document.querySelector(".splash-logo");
        //this.splashMessage = document.querySelector(".splash-message");
        // this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector(".progress");
    }

    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            this.startAnimation();
        });
    }

    async startAnimation() {
        await this.sleep(100);
        document.querySelector("#splash").style.display = "block";
        await this.applySplashAnimation();
        this.checkUpdate();
    }

    async applySplashAnimation() {
        const animations = [
            () => this.splash.classList.add("opacity"),
            () => this.splash.classList.add("translate"),
            //() => this.splashMessage.classList.add("opacity"),
            //() => this.splashAuthor.classList.add("opacity"),
            () => this.message.classList.add("opacity")
        ];

        for (const animate of animations) {
            await this.sleep(500);
            animate();
        }
    }

    async checkUpdate() {
        this.setStatus("Recherche de mise à jour...");
        try {
            await ipcRenderer.invoke('update-app');
        } catch (err) {
            return this.shutdown(`Erreur lors de la recherche de mise à jour :<br>${err.message}`);
        }

        ipcRenderer.on('updateAvailable', this.handleUpdateAvailable.bind(this));
        ipcRenderer.on('error', this.handleError.bind(this));
        ipcRenderer.on('download-progress', this.handleDownloadProgress.bind(this));
        ipcRenderer.on('update-not-available', this.startLauncher.bind(this));
    }

    handleUpdateAvailable() {
        this.setStatus("Mise à jour disponible !");
        if (os.platform() === 'win32') {
            this.toggleProgress();
            ipcRenderer.send('start-update');
        } else {
            this.downloadUpdate();
        }
    }

    handleError(event, err) {
        if (err) this.shutdown(`${err.message}`);
    }

    handleDownloadProgress(event, progress) {
        ipcRenderer.send('update-window-progress', { progress: progress.transferred, size: progress.total });
        this.setProgress(progress.transferred, progress.total);
    }

    async downloadUpdate() {
        const { repository: { url } } = pkg;
        const [owner, repo] = url.replace(/(git\+|\.git|https:\/\/github\.com\/)/g, "").split("/");
        const githubAPIRepoURL = `https://api.github.com/repos/${owner}/${repo}/releases`;
        let releases;

        try {
            releases = await (await nodeFetch(githubAPIRepoURL)).json();
        } catch (err) {
            return this.shutdown("Impossible de récupérer les informations de mise à jour.");
        }

        const latestRelease = releases[0]?.assets;
        const latest = this.getLatestReleaseForOS(os.platform(), latestRelease);

        if (latest) {
            this.setStatus(`Mise à jour disponible !<br><div class="download-update">Télécharger</div>`);
            document.querySelector(".download-update").addEventListener("click", () => {
                shell.openExternal(latest.browser_download_url);
                this.shutdown("Téléchargement en cours...");
            });
        }
    }

    getLatestReleaseForOS(platform, assets) {
        const formats = { win32: '.exe', darwin: '.dmg', linux: '.appimage' };
        const preferredFormat = formats[platform] || '.exe';

        return assets?.filter(asset =>
            asset.name.toLowerCase().includes(platform) && asset.name.endsWith(preferredFormat)
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    }

    startLauncher() {
        this.setStatus("Démarrage du launcher");
        ipcRenderer.send('main-window-open');
        ipcRenderer.send('update-window-close');
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Arrêt dans 5 secondes...`);
        let countdown = 4;
        const interval = setInterval(() => {
            this.setStatus(`${text}<br>Arrêt dans ${countdown--} secondes...`);
            if (countdown < 0) {
                clearInterval(interval);
                ipcRenderer.send('update-window-close');
            }
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

new Splash();