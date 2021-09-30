import mongoose, { Connection } from 'mongoose'
import TyrCommands from '.'
import Events from './enums/Events'

const results: {
  [name: number]: string
} = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting',
}

const mongo = async (
  mongoPath: string,
  instance: TyrCommands,
  dbOptions = {}
) => {
  await mongoose.connect(mongoPath, {
    keepAlive: true,
    ...dbOptions,
  })

  const { connection } = mongoose
  const state = results[connection.readyState] || 'Unknown'
  instance.emit(Events.DATABASE_CONNECTED, connection, state)
}

export const getMongoConnection = (): Connection => {
  return mongoose.connection
}

export default mongo