/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import nodeFetch from 'node-fetch';

let api_url = 'https://api.plutonia-mc.fr';


async function login(username: string, password?: string, tfa?: string) {
    let message = await nodeFetch(`${api_url}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            agent: {
                name: "Minecraft",
                version: 1
            },
            username,
            password,
            tfa
        })
    }).then(res => res.json());

    if (message.status == 403) return { error: { message: message.message } };
    if (message.status == 400) return { A2F: true };

    return {
        access_token: message.session,
        client_token: message.uuid,
        uuid: message.uuid,
        name: username,
        user_properties: '{}',
        meta: {
            online: false,
            type: 'Mojang'
        }
    }
}

export {
    login as login
}