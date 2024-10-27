const { Launch, Plutonia } = require('minecraft-java-core');
const os = require('os');
const launch = new Launch();
const { ipcRenderer } = require('electron');

const login = document.querySelector('.login input');
const passeword = document.querySelector('.password input');
const authCode = document.querySelector('.auth-code input');
const ram = document.querySelector('.ram-select');

const tabbychat = document.querySelector('.tabbychat');
const svc = document.querySelector('.svc');

let auth = null;

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        ipcRenderer.send('main-window-dev-tools-close');
        ipcRenderer.send('main-window-dev-tools');
    }

});

document.querySelector('.btn .settings').addEventListener('click', () => {
    document.querySelector('.box').style.display = 'flex';
});

document.querySelector('.confirm-button').addEventListener('click', () => {
    document.querySelector('.box').style.display = 'none';
});

document.querySelector('.btn .play').addEventListener('click', async _ => {
    if (login.value === '' || passeword.value === '') {
        document.querySelector('.progress').innerText = 'Identifiants incorrects.';
    } else {
        auth = await Plutonia.login(login.value, passeword.value, authCode.value);

        if (auth.error) {
            document.querySelector('.progress').innerText = auth.error.message;
        } else if (auth.A2F) {
            authCode.style.display = 'block';
            document.querySelector('.progress').innerText = 'Code d\'authentification requis.';
        } else {
            startGame();
        }
    }
});

document.querySelector('.close').addEventListener('click', () => {
    ipcRenderer.send('main-window-close');
});

async function startGame() {
    let addons = [];
    if (tabbychat.checked) addons.push('tabbychat');
    if (svc.checked) addons.push('svc');


    await launch.Launch({
        url: 'https://assets.plutonia.games',
        authenticator: auth,
        path: `${await ipcRenderer.invoke('appData').then(path => path)}/${os.platform() !== 'darwin' ? '.' : ''}plutonia`,
        version: '1.8.9',
        detached: true,
        intelEnabledMac: true,
        downloadFileMultiple: 30,

        mcp: 'minecraft.jar',

        libs: 'libs',

        verify: true,
        ignored: [
            'config',
            'logs',
            'resourcepacks',
            'saves',
            'screenshots',
            'shaderpacks',
            'options.txt',
            'optionsof.txt',
            'waypoints',
            'usercache.json',
            'credentials.yml',
            'crash-reports',
        ],

        GAME_ARGS: [
            addons.length > 0 ? `--mods=${addons.join(',')}` : '',
        ],

        java: {
            path: null,
            version: 11,
            type: 'jre',
        },

        memory: {
            min: `${ram.value * 1024}M`,
            max: `${ram.value * 1024}M`
        }
    });

    launch.on('progress', (progress, size, element) => {
        console.log(`Downloading ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('check', (progress, size, element) => {
        console.log(`Checking ${element} ${Math.round((progress / size) * 100)}%`);
    });

    launch.on('estimated', (time) => {
        let hours = Math.floor(time / 3600);
        let minutes = Math.floor((time - hours * 3600) / 60);
        let seconds = Math.floor(time - hours * 3600 - minutes * 60);
        console.log(`${hours}h ${minutes}m ${seconds}s`);
    })

    launch.on('speed', (speed) => {
        console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
    })

    launch.on('patch', patch => {
        console.log(patch);
    });

    launch.on('data', (e) => {
        console.log(e);
    })

    launch.on('close', code => {
        console.log(code);
    });

    launch.on('error', err => {
        console.log(err);
    });
}