import { observeQueue, create } from "./tracker";
import { getChampionSelectChatInfo, postMessageToChat } from "./chatService";
import { createSettingsUi, createTabSettings } from "./uiSettings";
import { addButtonPostGame } from "./uiPostGame";

const delay = (t) => new Promise((r) => setTimeout(r, t))

let summoner;

async function getSummonerName() {
    const res = await fetch('/lol-summoner/v1/current-summoner')
    const data = await res.json()

    return data.gameName + "#" + data.tagLine
}

function isInMyTeam(currentQueue) {
    const dodgeList = DataStore.get('dodgelist', []).map(name => name.toLowerCase())
    const targets = currentQueue.filter(name => dodgeList.includes(name.toLowerCase()))

    return targets
}

async function playersInLobby(){

    // Funfact: Se o cara tiver net movida à lenha, não vai puxar aqui pq ele ainda não vai ter conectado.
    const lobby = await create("get", "//riotclient/chat/v5/participants")
    const participants = lobby.participants.filter(participant => participant.cid.includes('champ-select'));

    const names = []

    for (const player of participants) { 
        names.push(player.game_name + "#" + player.game_tag)
    }

    return names
}

export function init(context) {
    createTabSettings(context)
    addButtonPostGame(context)

    context.socket.observe('/lol-gameflow/v1/gameflow-phase', async (data) => {
        if(data.data == "ChampSelect") {
            await delay(5000)
    
            const players = await playersInLobby()
            const names = players.filter(name => name.toLowerCase() !== summoner.toLowerCase())
    
            const list = isInMyTeam(names)
    
            const chatInfo = await getChampionSelectChatInfo();
    
            if (list.length === 0) return postMessageToChat(chatInfo.id, `DodgeTracker: No players detected`)
    
            for (const player of list) {
                postMessageToChat(chatInfo.id, `DodgeTracker: ${player} detected`)
            }
         }
    })
}

export async function load() {
    summoner = await getSummonerName()
    
    createSettingsUi()

    let css = new URL('./icon.css', import.meta.url).href
    let link = document.createElement('link')
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', css);
    document.body.appendChild(link)
}