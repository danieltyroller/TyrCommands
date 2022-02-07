import languageSchema from '../models/languages'
import { ICallbackObject, ICommand } from '../..'
import Events from '../enums/Events'

export = {
   description: 'Displays or sets the language for this Discord server',
   category: 'Configuration',
   aliases: ['lang'],
   permissions: ['ADMINISTRATOR'],
   maxArgs: 1,
   expectedArgs: '[language]',
   expectedArgsTypes: ['STRING'],
   cooldown: '2s',
   slash: 'both',
   callback: async ({ channel, text, instance }) => {
      const { guild } = channel
      if (!guild) {
         return
      }

      const { messageHandler } = instance

      if (!instance.isDBConnected()) {
         return messageHandler.get(guild, 'NO_DATABASE_FOUND')
      }

      const lang = text.toLowerCase()

      if (!lang) {
         return messageHandler.get(guild, 'CURRENT_LAMGUAGE', {
            LANGUAGE: messageHandler.getLanguage(guild)
         })
      }

      if (!messageHandler.languages().includes(lang)) {
         instance.emit(Events.LANGUAGE_NOT_SUPPORTED, guild, lang)

         return messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', {
            LANGUAGE: lang
         })
      }

      messageHandler.setLanguage(guild, lang)

      await languageSchema.findOneAndUpdate(
         {
            _id: guild.id
         },
         {
            _id: guild.id,
            language: lang
         },
         {
            upsert: true
         }
      )

      return messageHandler.get(guild, 'NEW_LANGUAGE', {
         LANGUAGE: lang
      })
   }
} as ICommand
