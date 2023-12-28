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
                        if (this.__IS_HOOKED) {
                            return result
                        }
                        this.__IS_HOOKED = true

                        const proto = result.proto()
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