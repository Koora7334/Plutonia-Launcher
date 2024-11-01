const EventEmitter = require('events');

const fs = require('fs-extra');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const serverUrl = 'https://assets.plutonia.games/';

const ignoredFiles = [
    "logs.txt",
    "waypoints",
    "resourcepacks",
    "saves",
    "options.txt",
    "optionsof.txt",
    "usercache.json",
    "credentials.yml",
    "shaderpacks",
    "config",
    "screenshots",
    "crash-reports"
]

class UpdateWorker extends EventEmitter {

    async update(appDataPath) {
        console.log("Tentative de récupération des fichiers depuis : " + serverUrl);

        const response = await axios.get(serverUrl);
        const serverFiles = response.data;

        // 1. Vérifier et supprimer les fichiers obsolètes
        for (const file of serverFiles) {
            if (!file.path) {
                console.error("Le chemin du fichier est manquant dans la réponse du serveur :", file);
                throw new Error("Fichier manquant sur le serveur.");
                return;
            }

            // Vérifier si le fichier est dans la liste des fichiers ignorés
            if (ignoredFiles.includes(file.path)) {
                console.log("Fichier ignoré : " + file.path);
                continue;
            }

            const localFilePath = path.join(appDataPath, file.path);

            if (await fs.pathExists(localFilePath)) {
                const localHash = await this.calculateHash(localFilePath);

                if (localHash !== file.hash) {
                    console.log("Suppression d'un fichier obsolète : " + file.path);
                    await fs.remove(localFilePath);
                }
            }
        }

        // 2. Lister les fichiers manquants
        let toDownload = [];

        for (const file of serverFiles) {
            if (!file.path) {
                console.error("Le chemin du fichier est manquant dans la réponse du serveur :", file);
                throw new Error("Fichier manquant sur le serveur.");
                return;
            }

            const localFilePath = path.join(appDataPath, file.path);

            if (!await fs.pathExists(localFilePath)) {
                toDownload.push({ url: file.url, localFilePath });
                console.log("Fichier manquant : " + file.path);
            }
        }

        this.emit('check-completed');

        // 2. Télécharger les fichiers manquants
        let current = 0;

        for (const file of toDownload) {
            current += 1;

            console.log("Téléchargement de " + file.localFilePath + "... (" + current + "/" + toDownload.length + ")");
            this.emit('downloading', { current, total: toDownload.length });

            await this.downloadFile(file.url, file.localFilePath);
        }

        this.emit('completed');
        console.log("Mise à jour terminée !");
    }

    async calculateHash(filePath) {
        const hash = crypto.createHash('sha256');
        const fileBuffer = await fs.readFile(filePath);
        hash.update(fileBuffer);
        return hash.digest('hex');
    }

    async downloadFile(fileUrl, localFilePath) {
        const dir = path.dirname(localFilePath);
        await fs.ensureDir(dir);

        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);
        await fs.writeFile(localFilePath, buffer);
    }
}

module.exports = UpdateWorker;