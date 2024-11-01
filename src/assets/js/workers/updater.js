const fs = require('fs-extra');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const serverUrl = 'https://assets.plutonia.games'; // URL du serveur

class UpdateWorker {

    async update(appDataPath) {
        try {
            // Étape 1: Récupérer les fichiers et leur hash depuis le serveur
            const response = await axios.get(serverUrl); // Mettez à jour avec le bon chemin pour récupérer la liste
            const serverFiles = response.data; // On suppose que cela retourne un tableau d'objets

            // Étape 2: Vérifier les fichiers locaux
            for (const file of serverFiles) {
                const localFilePath = path.join(this.appDataPath, file.path);

                // Vérifier si le fichier existe localement
                if (await fs.pathExists(localFilePath)) {
                    const localHash = await this.calculateHash(localFilePath);

                    // Comparer le hash local avec celui du serveur
                    if (localHash !== file.hash) {
                        console.log(`Fichier obsolète détecté : ${file.path}. Suppression.`);
                        //await fs.remove(localFilePath); // Supprimer le fichier local obsolète
                    }
                } else {
                    console.log(`Fichier manquant : ${file.path}. Téléchargement...`);
                    await this.downloadFile(file.url, localFilePath); // Télécharger le fichier manquant
                }
            }

            console.log("Mise à jour terminée !");
        } catch (error) {
            console.error("Erreur lors de la mise à jour :", error);
        }
    }

    async calculateHash(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', (err) => reject(err));
        });
    }

    async downloadFile(fileUrl, localFilePath) {
        const writer = fs.createWriteStream(localFilePath);

        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream',
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
}

module.exports = UpdateWorker;