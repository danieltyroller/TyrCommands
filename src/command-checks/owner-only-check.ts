import { Guild, Message, User } from 'discord.js'

import TyrCommands from '..'
import Command from '../Command'

export = (guild: Guild | null, command: Command, instance: TyrCommands, user: User, reply: Function) => {
   const { ownerOnly } = command

   if (!ownerOnly) {
      return true
   }

   if (!instance.botOwner.includes(user.id)) {
      reply(instance.messageHandler.get(guild, 'BOT_OWNERS_ONLY')).then((message: Message | null) => {
         if (!message) {
            return
         }

         if (instance.delErrMsgCooldown === -1 || !message.deletable) {
            return
         }

         setTimeout(() => {
            message.delete()
         }, 1000 * instance.delErrMsgCooldown)
      })

      return false
   }

   return true
}
