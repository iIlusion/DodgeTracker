import { observeQueue, create } from "./tracker";
import { getChampionSelectChatInfo, postMessageToChat } from "./chatService";
import { createSettingsUi, createTabSettings } from "./uiCreator";

const delay = (t) => new Promise((r) => setTimeout(r, t))

async function getSummonerName() {
    const res = await fetch('/lol-summoner/v1/current-summoner')
    const data = await res.json()

    return data.gameName + "#" + data.tagLine
}

/// Importante
const summoner = await getSummonerName()
///

function isInMyTeam(currentQueue) {
    const dodgeList = DataStore.get('dodgelist', []).map(name => name.toLowerCase())
    const targets = currentQueue.filter(name => dodgeList.includes(name.toLowerCase()))

    return targets
}

async function playersInLobby(){

    // Funfact: Se o cara tiver net movida à lenha, não vai puxar aqui pq ele ainda não vai ter conectado.
    const lobby = await create("get", "//riotclient/chat/v5/participants/champ-select")
    const names = []

    for (const player of lobby.participants) { 
        names.push(player.game_name + "#" + player.game_tag)
    }

    return names
}

async function updateLobbyState(message) { 
    const data = JSON.parse(message.data)
    const phase = data[2]

    if(phase.data == "ChampSelect") {
        await delay(5000)

        const players = await playersInLobby()
        const names = players//.filter(name => name !== summoner)

        const list = isInMyTeam(names)

        const chatInfo = await getChampionSelectChatInfo();

        if (list.length === 0) return postMessageToChat(chatInfo.id, `DodgeTracker: No players detected`)

        for (const player of list) {
            postMessageToChat(chatInfo.id, `DodgeTracker: ${player} detected`)
        }
     }
}

export function init(context) {
    createTabSettings(context)
}

export function load() {
    observeQueue(updateLobbyState)
    createSettingsUi()
}