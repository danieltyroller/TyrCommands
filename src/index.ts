import { Client, ColorResolvable, Guild } from 'discord.js'
import { Connection } from 'mongoose'
import { EventEmitter } from 'events'

import FeatureHandler from './FeatureHandler'
import mongo, { getMongoConnection } from './mongo'
import prefixes from './models/prefixes'
import MessageHandler from './message-Handler'
import SlashCommands from './SlashCommands'
import { ICategorySetting, Options } from '..'
import Events from './enums/Events'

import CommandHandler from './CommandHandler'

export default class TyrCommands extends EventEmitter {
  private _client: Client
  private _defaultPrefix = '!'
  private _commandsDir = 'commands'
  private _featuresDir = ''
  private _mongoConnection: Connection | null = null
  private _displayName = ''
  private _prefixes: { [name: string]: string } = {}
  private _categories: Map<String, string> = new Map() // <Category Name, Thumbnail>
  private _hiddenCategories: string[] = []
  private _color: ColorResolvable | null = null
  private _commandHandler: CommandHandler | null = null
  private _featureHandler: FeatureHandler | null = null
  private _tagPeople = true
  private _showWarns = true
  private _delErrMsgCooldown = -1
  private _ignoreBots = true
  private _botOwner: string[] = []
  private _testServers: string[] = []
  private _defaultLanguage = ''
  private _ephemeral = true
  private _debug = false
  private _messageHandler: MessageHandler | null = null
  private _slashCommand: SlashCommands | null = null

  constructor(client: Client, options?: Options) {
    super()

    this._client = client

    this.setUp(client, options)
  }

  private async setUp(client: Client, options?: Options) {
    if (!client) {
      throw new Error('No Discord JS Client provided as first argument!')
    }

    let {
      commandsDir = '',
      commandDir = '',
      featuresDir = '',
      featureDir = '',
      messagesPath,
      mongoUri,
      showWarns = true,
      delErrMsgCooldown = -1,
      defaultLanguage = 'de',
      ignoreBots = true,
      dbOptions,
      testServers,
      botOwners,
      disabledDefaultCommands = [],
      typeScript = false,
      ephemeral = true,
      debug = false,
    } = options || {}

    if (mongoUri) {
      await mongo(mongoUri, this, dbOptions)

      this._mongoConnection = getMongoConnection()

      const results: any[] = await prefixes.find({})

      for (const result of results) {
        const { _id, prefix } = result

        this._prefixes[_id] = prefix
      }
    } else {
      if (showWarns) {
        console.warn(
          'TyrCommands > No MongoDB connection URI provided. Some features might not work! See this for more details:\nhttps://tyrcommands.gitbook.io/tyrcommands/-MlFbHlJOkfMSgIyI_xq/databases/mongodb'
        )
      }

      this.emit(Events.DATABASE_CONNECTED, null, '')
    }

    this._commandsDir = commandsDir || commandDir || this._commandsDir
    this._featuresDir = featuresDir || featureDir || this._featuresDir
    this._ephemeral = ephemeral
    this._debug = debug

    if (
      this._commandsDir &&
      !(this._commandsDir.includes('/') || this._commandsDir.includes('\\'))
    ) {
      throw new Error(
        "TyrCommands > The 'commands' directory must be an absolute path. This can be done by using the 'path' module. More info: https://tyrcommands.gitbook.io/tyrcommands/-MlFbHlJOkfMSgIyI_xq/setup-and-options-object"
      )
    }

    if (
      this._featuresDir &&
      !(this._featuresDir.includes('/') || this._featuresDir.includes('\\'))
    ) {
      throw new Error(
        "TyrCommands > The 'features' directory must be an absolute path. This can be done by using the 'path' module. More info: https://tyrcommands.gitbook.io/tyrcommands/-MlFbHlJOkfMSgIyI_xq/setup-and-options-object"
      )
    }

    if (testServers) {
      if (typeof testServers === 'string') {
        testServers = [testServers]
      }
      this._testServers = testServers
    }

    if (botOwners) {
      if (typeof botOwners === 'string') {
        botOwners = [botOwners]
      }
      this._botOwner = botOwners
    }

    this._showWarns = showWarns
    this._delErrMsgCooldown = delErrMsgCooldown
    this._defaultLanguage = defaultLanguage.toLowerCase()
    this._ignoreBots = ignoreBots

    if (typeof disabledDefaultCommands === 'string') {
      disabledDefaultCommands = [disabledDefaultCommands]
    }

    this._commandHandler = new CommandHandler(
      this,
      client,
      this._commandsDir,
      disabledDefaultCommands,
      typeScript
    )
    this._slashCommand = new SlashCommands(this, true, typeScript)
    this._messageHandler = new MessageHandler(this, messagesPath || '')

    this.setCategorySettings([
      {
        name: 'Einstellungen',
        thumbnail: ''
      },
      {
        name: 'Help',
        thumbnail: ''
      },
    ])

    this._featureHandler = new FeatureHandler(
      client,
      this,
      this._featuresDir,
      typeScript
    )

    console.log('TyrCommands > Your bot is now running.')
  }

  public setMongoPath(): TyrCommands {
    console.warn(
      'TyrCommands > .setMongoPath() no longer works as expected. Please pass in your mongo URI as a "mongoUri" property using the options object. For more information: https://tyrcommands.gitbook.io/tyrcommands/-MlFbHlJOkfMSgIyI_xq/databases/mongodb'
    )
    return this
  }

  public get client(): Client {
    return this._client
  }

  public get displayName(): string {
    return this._displayName
  }

  public setDisplayName(displayName: string): TyrCommands {
    this._displayName = displayName
    return this
  }

  public get prefixes() {
    return this._prefixes
  }

  public get defaultPrefix(): string {
    return this._defaultPrefix
  }

  public setDefaultPrefix(defaultPrefix: string): TyrCommands {
    this._defaultPrefix = defaultPrefix
    return this
  }

  public getPrefix(guild: Guild | null): string {
    return this._prefixes[guild ? guild.id : ''] || this._defaultPrefix
  }

  public setPrefix(guild: Guild | null, prefix: string): TyrCommands {
    if (guild) {
      this._prefixes[guild.id] = prefix
    }
    return this
  }

  public get categories(): Map<String, string> {
    return this._categories
  }

  public get hiddenCategories(): string[] {
    return this._hiddenCategories
  }

  public get color(): ColorResolvable | null {
    return this._color
  }

  public setColor(color: ColorResolvable | null): TyrCommands {
    this._color = color
    return this
  }

  public getThumbnail(category: string) {
    const thumbnail = this._categories.get(category)
    return thumbnail
  }

  public setCategorySettings(category: ICategorySetting[]): TyrCommands {
    for (let { thumbnail, name, hidden } of category) {

      this._categories.set(name, thumbnail || this.categories.get(name) || '')

      if (hidden) {
        this._hiddenCategories.push(name)
      }
    }

    return this
  }

  public get commandHandler(): CommandHandler {
    return this._commandHandler!
  }

  public get mongoConnection(): Connection | null {
    return this._mongoConnection
  }

  public isDBConnected(): boolean {
    const connection = this.mongoConnection
    return !!(connection && connection.readyState === 1)
  }

  public setTagPeople(tagPeople: boolean): TyrCommands {
    this._tagPeople = tagPeople
    return this
  }

  public get tagPeople(): boolean {
    return this._tagPeople
  }

  public get showWarns(): boolean {
    return this._showWarns
  }

  public get delErrMsgCooldown(): number {
    return this._delErrMsgCooldown
  }

  public get ignoreBots(): boolean {
    return this._ignoreBots
  }

  public get botOwner(): string[] {
    return this._botOwner
  }

  public setBotOwner(botOwner: string | string[]): TyrCommands {
    console.log(
      'TyrCommands > setBotOwner() is deprecated. Please specify your bot owners in the object constructor instead. See https://tyrcommands.gitbook.io/tyrcommands/-MlFbHlJOkfMSgIyI_xq/setup-and-options-object'
    )

    if (typeof botOwner === 'string') {
      botOwner = [botOwner]
    }
    this._botOwner = botOwner
    return this
  }

  public get testServers(): string[] {
    return this._testServers
  }

  public get defaultLanguage(): string {
    return this._defaultLanguage
  }

  public setDefaultLanguage(defaultLanguage: string): TyrCommands {
    this._defaultLanguage = defaultLanguage
    return this
  }

  public get ephemeral(): boolean {
    return this._ephemeral
  }

  public get debug(): boolean {
    return this._debug
  }

  public get messageHandler(): MessageHandler {
    return this._messageHandler!
  }

  public get slashCommands(): SlashCommands {
    return this._slashCommand!
  }
}

module.exports = TyrCommands
