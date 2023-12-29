let uikit = undefined

export function addButtonPostGame(context) {
    context.rcp.postInit('rcp-fe-lol-uikit', (api) => {
		uikit = api
	})

    context.rcp.postInit('rcp-fe-ember-libs', async (api) => {
        const originalGetEmber = api.getEmber
        api.getEmber = function() {
            const result = originalGetEmber.apply(this, arguments)

            result.then((Ember) => {
                const originalExtend = Ember.Component.extend

                Ember.Component.extend = function(...args) {
                    const result = originalExtend.apply(this, arguments)

                    const classNames = args
                        .filter(x => typeof x === 'object' && x.classNames && Array.isArray(x.classNames))
                        .map(x => x.classNames.join(' '))

                    if (classNames[0] === 'scoreboard-row-actions-menu-component') {
                        // TODO: Proper check
                        const proto = result.proto()

                        if (proto.__IS_HOOKED) {
                            return result
                        }
                        proto.__IS_HOOKED = true

                        const originalActionOptions = proto.actionOptions._getter
                        proto.actionOptions._getter = function() {
                            const result = originalActionOptions.apply(this, arguments)
                            
                            result.push({
                                actionName: 'dlAction',
                                disabled: false,
                                label: 'Add to dodge list'
                            })

                            return result
                        }

                        const originalButtonClick = proto.actions.handleButtonClick
                        proto.actions.handleButtonClick = function(action, player, event) {

							if (action.actionName == 'dlAction') {

                                const playerName = `${player.displayName.playerName}#${player.displayName.tagLine}`

                                const data = DataStore.get('dodgelist').map(n => n.toLowerCase())
                                if (data.includes(playerName.toLowerCase())) {
                                    const removed = data.filter(name => name.toLowerCase() !== playerName.toLowerCase())
                                    DataStore.set('dodgelist', removed)
                                    leagueToast(`Removed ${playerName} from the Dodge List`)
                                } else {
                                    data.push(playerName)
                                    DataStore.set('dodgelist', data)
                                    leagueToast(`Added ${playerName} to the Dodge List`)
                                }
								return
							}

                            return originalButtonClick.apply(this, arguments)
                        }
                    } else if (classNames[0] === 'player-history-object') {
                        const proto = result.proto()

                        if (proto.__IS_HOOKED) {
                            return result
                        }
                        proto.__IS_HOOKED = true
                        
                        const originalMenuItemModal = proto.getMenuItemModel
                        proto.getMenuItemModel = function() {
                            const result = originalMenuItemModal.apply(this, arguments)

                            const isLocalSummoner = this.get('summonerId') == this.get('session.summonerId')
                            if (!isLocalSummoner) {
                                result.push({
                                    label: 'Add to dodge list',
                                    target: this,
                                    action: function() {
                                        const player = this.get('playerNameFull')
                                        const playerName = `${player.split('#')[0].slice(0, -1)}#${player.split('#')[1]}`

                                        const data = DataStore.get('dodgelist').map(n => n.toLowerCase())
                                        if (data.includes(playerName.toLowerCase())) {
                                            const removed = data.filter(name => name.toLowerCase() !== playerName.toLowerCase())
                                            DataStore.set('dodgelist', removed)
                                            leagueToast(`Removed ${playerName} from the Dodge List`)
                                        } else {
                                            data.push(playerName)
                                            DataStore.set('dodgelist', data)
                                            leagueToast(`Added ${playerName} to the Dodge List`)
                                        }
                                        return
                                    }
                                })

                                return result
                            }
                        }
                    }

                    return result
                }

                return Ember
            })

            return result
        }
    })
}

function leagueToast(message) {
    let s = `<div>${message}</div>`
    let e = uikit.getTemplateHelper().contentBlockNotification(s)
    uikit.getToastManager().add({
        type: "DialogToast",
        data: {
            contents: e,
            dismissable: true,
            hideCloseButton: false,
        },
        timing: "normal",
    })
}