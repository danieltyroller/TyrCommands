import { ICallbackObject, ICommand } from '../..'
import prefixes from '../models/prefixes'

export = {
  description: 'Zeigt das Prefix für das aktuelle Guild an oder legt es fest',
  category: 'Einstellungen',

  maxArgs: 1,
  expectedArgs: '[prefix]',

  cooldown: '2s',

  slash: 'both',

  callback: async (options: ICallbackObject) => {
    const { channel, args, text, instance, member } = options
    const { guild } = channel

    if (args.length === 0) {
      return instance.messageHandler.get(guild, 'CURRENT_PREFIX', {
        PREFIX: instance.getPrefix(guild)
      })
    }

    if (!member.permissions.has('ADMINISTRATOR')) return instance.messageHandler.get(guild, 'MISSING_PERMISSION', {
      PERM: 'ADMINISTRATOR'
    })

    if (guild) {
      const { id } = guild

      if (!instance.isDBConnected()) {
        return instance.messageHandler.get(guild, 'NO_DATABASE_FOUND')
      }

      await prefixes.findOneAndUpdate(
        {
          _id: id,
        },
        {
          _id: id,
          prefix: text
        },
        {
          upsert: true,
        }
      )

      instance.setPrefix(guild, text)

      return instance.messageHandler.get(guild, 'SET_PREFIX', {
        PREFIX: text
      })
    }

    return instance.messageHandler.get(guild, 'CANNOT_SET_PREFIX_IN_DMS')
  }
} as ICommand
