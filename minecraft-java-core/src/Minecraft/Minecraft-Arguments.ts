/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import fs from 'fs';
import os from 'os'

export default class MinecraftArguments {
    options: any;
    authenticator: any;
    constructor(options: any) {
        this.options = options;
        this.authenticator = options.authenticator;
    }

    async GetArguments(json: any, loaderJson: any) {
        let game = await this.GetGameArguments(json, loaderJson);
        let jvm = await this.GetJVMArguments(json);
        let classpath = await this.GetClassPath(json, loaderJson);

        return {
            game: game,
            jvm: jvm,
            classpath: classpath.classpath,
            mainClass: classpath.mainClass
        }
    }

    async GetGameArguments(json: any, loaderJson: any) {
        let game = json.minecraftArguments ? json.minecraftArguments.split(' ') : json.arguments.game;
        let userType: String

        if (loaderJson) {
            let gameLoader = loaderJson.minecraftArguments ? loaderJson.minecraftArguments.split(' ') : [];
            game = game.concat(gameLoader);
            game = game.filter((item: String, index: Number, self: any) => index === self.findIndex((res: String) => res == item))
        }

        if (json.id.startsWith('1.16')) userType = 'Xbox'
        else userType = this.authenticator.meta.type === 'Xbox' ? 'msa' : this.authenticator.meta.type

        let table = {
            '${auth_access_token}': this.authenticator.access_token,
            '${auth_session}': this.authenticator.access_token,
            '${auth_player_name}': this.authenticator.name,
            '${auth_uuid}': this.authenticator.uuid,
            '${auth_xuid}': this.authenticator?.xboxAccount?.xuid || this.authenticator.access_token,
            '${user_properties}': this.authenticator.user_properties,
            '${user_type}': userType,
            '${version_name}': loaderJson ? loaderJson.id : json.id,
            '${assets_index_name}': json.assetIndex.id,
            '${game_directory}': this.options.instance ? `${this.options.path}/instances/${this.options.instance}` : this.options.path,
            '${assets_root}': `${this.options.path}/assets`,
            '${game_assets}': `${this.options.path}/assets`,
            '${version_type}': json.type,
            '${clientid}': this.authenticator.clientId || (this.authenticator.client_token || this.authenticator.access_token)
        }

        for (let i in game) {
            if (typeof game[i] == 'object') game.splice(i, 2)
            if (Object.keys(table).includes(game[i])) game[i] = table[game[i]]
        }

        if (this.options.screen) {
            if (this.options.screen.width && this.options.screen.height) {
                game.push('--width')
                game.push(this.options.screen.width)
                game.push('--height')
                game.push(this.options.screen.height)
            }
        }

        game.push(...this.options.GAME_ARGS)

        return game.filter((item: any) => typeof item !== 'object')
    }

    async GetJVMArguments(json: any) {
        let opts = {
            win32: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
            darwin: '-XstartOnFirstThread',
            linux: '-Xss1M'
        }
        let jvm = [
            `-Xms${this.options.memory.min}`,
            `-Xmx${this.options.memory.max}`,
            '-XX:+UnlockExperimentalVMOptions',
            '-XX:G1NewSizePercent=20',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapRegionSize=32M',
            '-Dfml.ignoreInvalidMinecraftCertificates=true',
            `-Djna.tmpdir=${this.options.path}/versions/${json.id}/natives`,
            `-Dorg.lwjgl.system.SharedLibraryExtractPath=${this.options.path}/versions/${json.id}/natives`,
            `-Dio.netty.native.workdir=${this.options.path}/versions/${json.id}/natives`
        ]

        if (!json.minecraftArguments) {
            jvm.push(opts[process.platform])
        }

        if (json.nativesList) {
            jvm.push(`-Djava.library.path=${this.options.path}/versions/${json.id}/natives`)
        }

        if (os.platform() == "darwin") {
            let pathAssets = `${this.options.path}/assets/indexes/${json.assets}.json`;
            let assets = JSON.parse(fs.readFileSync(pathAssets, 'utf-8'));
            let icon = assets.objects['icons/minecraft.icns'].hash

            jvm.push(`-Xdock:name=Minecraft`)
            jvm.push(`-Xdock:icon=${this.options.path}/assets/objects/${icon.substring(0, 2)}/${icon}`)
        }
        jvm.push(...this.options.JVM_ARGS)

        return jvm;
    }

    async GetClassPath(json: any, loaderJson: any) {
        let librariesList: string[] = [];


        let libs = fs.readdirSync(this.options.libs);
        for (let lib of libs) {
            librariesList.push(`${this.options.libs}/${lib}`);
        }

        librariesList.push(this.options.mcp);

        return {
            classpath: [
                `-cp`,
                librariesList.join(process.platform === 'win32' ? ';' : ':'),
            ],
            mainClass: json.mainClass
        }
    }
}