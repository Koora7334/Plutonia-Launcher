const { Plutonia, Launch } = require('../build/Index');
const launch = new Launch();

const { username, password } = require('./config.json');

(async () => {
    let opt = {
        url: 'https://plutonia.luuxis.fr',
        authenticator: await Plutonia.login(username, password),
        timeout: 10000,
        instance: 'test',
        path: './Minecraft',
        version: '1.8.9',
        detached: false,
        intelEnabledMac: true,
        downloadFileMultiple: 30,

        mcp: 'minecraft.jar',

        libs: 'libs',


        verify: false,
        ignored: [
            'config',
            'essential',
            'logs',
            'resourcepacks',
            'saves',
            'screenshots',
            'shaderpacks',
            'W-OVERFLOW',
            'options.txt',
            'optionsof.txt'
        ],
        JVM_ARGS: [],
        GAME_ARGS: [],

        java: {
            path: null,
            version: 11,
            type: 'jre',
        },

        screen: {},

        memory: {
            min: '4G',
            max: '4G'
        }
    }

    await launch.Launch(opt);

    launch.on('extract', extract => {
        console.log(extract);
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
})();