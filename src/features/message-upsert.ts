import { Client } from 'discord.js'

export default (client: Client): void  => {
  client.on('messageCreate', (message) => {
    client.emit('messageUpsert', message)
  })

  client.on('messageUpdate', (oldMessage, newMessage) => {
    client.emit('messageUpsert', newMessage, oldMessage)
  })
}

export const config = {
  displayName: 'Message Upsert',
  dbName: 'MESSAGE-UPSERT',
}
