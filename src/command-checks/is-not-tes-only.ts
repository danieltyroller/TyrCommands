import { Guild } from 'discord.js'

import TyrCommands from '..'
import Command from '../Command'

export = (guild: Guild | null, command: Command, instance: TyrCommands) => {
    const { testOnly } = command

    if (!testOnly) {
        return true
    }

    return guild && instance.testServers.includes(guild.id)
}