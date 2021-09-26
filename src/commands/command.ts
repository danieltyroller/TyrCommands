import DiscordJS from 'discord.js'

import disabledCommands from '../models/disabled-commands'
import { ICallbackObject, ICommand } from '../..'

export = {
    description: 'Aktiviert oder deaktiviert einen Befehl für diese Guild',
    category: 'Configuration',

    permissions: ['ADMINISTRATOR'],

    minArgs: 2,
    maxArgs: 2,
    expectedArgs: '<"aktivieren" oder "deaktivieren"> <Befehlsname>',

    cooldown: '2s',

    slash: 'both',

    options: [
        {
            name: 'Aktionen',
            description: 'Entweder "aktivieren" oder "deaktivieren"',
            required: true,
            type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING,
            choices: [
                {
                    name: 'Aktivieren',
                    value: 'aktivieren'
                },
                {
                    name: 'Deaktivieren',
                    value: 'deaktivieren'
                }
            ]
        },
        {
            name: 'Befehl',
            description: 'Der Name des Befehls',
            required: true,
            type: DiscordJS.Constants.ApplicationCommandOptionTypes.STRING
        }
    ],

    callback: async (options: ICallbackObject) => {
        const { channel, args, instance } = options
        const { messageHandler } = instance

        const { guild } = channel
        const newState = args.shift()?.toLowerCase()
        const name = (args.shift() || '').toLowerCase()

        if (!guild) {
            return messageHandler.get(guild, 'CANNOT_ENABLE_DISABLE_IN_DMS')
        }

        if (!instance.isDBConnected()) {
            return messageHandler.get(guild, 'NO_DATABASE_FOUND')
        }

        if (newState !== 'aktivieren' && newState !== 'deaktivieren') {
            return messageHandler.get(guild, 'ENABLE_DISABLE_STATE')
        }

        const command = instance.commandHandler.getCommand(name)

        if (command) {
            const mainCommand = command.names[0]
            if (mainCommand === 'command') {
                return messageHandler.get(guild, 'CANNOT_DISABLE_THIS_COMMAND')
            }

            const isDisabled = command.isDisabled(guild.id)

            if (newState === 'aktivieren') {
                if (!isDisabled) {
                    return messageHandler.get(guild, 'COMMAND_ALREADY_ENABLED')
                }

                await disabledCommands.deleteOne({
                    guildid: guild.id,
                    command: mainCommand,
                })

                command.enable(guild.id)

                return messageHandler.get(guild, 'COMMAND_NOW_ENABLED', {
                    COMMAND: mainCommand
                })
            }

            if (isDisabled) {
                return messageHandler.get(guild, 'COMMAND_ALREADY_DISABLED')
            }

            await new disabledCommands({
                guildId: guild.id,
                command: mainCommand,
            }).save()

            command.disable(guild.id)

            return messageHandler.get(guild, 'COMMAND_NOW_DISABLED', {
                COMMAND: mainCommand
            })
        }

        return messageHandler.get(guild, 'UNKNOWN_COMMAND', {
            COMMAND: name
        })
    }
} as ICommand