import { Guild } from 'discord.js'

import languageSchema from './models/languages'
import TyrCommands from '.'
import Events from './enums/Events'
const defaultMessages = require('../messages.json')

export default class MessageHandler {
    private _instance: TyrCommands
    private _guildLanguage: Map<string, string> = new Map() // <Guild ID, Language>
    private _languages: string[] = []
    private _messages: {
        [key: string]: {
            [key: string]: any
        }
    } = {}

    constructor(instance: TyrCommands, messagePath: string) {
        this._instance = instance
            ; (async () => {
                this._messages = messagePath ? await import(messagePath) : defaultMessages

                for (const messageId of Object.keys(this._messages)) {
                    for (const language of Object.keys(this._messages[messageId])) {
                        this._languages.push(language.toLowerCase())
                    }
                }

                if (!this._languages.includes(instance.defaultLanguage)) {
                    throw new Error(
                        'The current default language defined is not supported.'
                    )
                }

                if (instance.isDBConnected()) {
                    const results = await languageSchema.find()

                    // @ts-ignore
                    for (const { _id: guildId, language } of results) {
                        this._guildLanguage.set(guildId, language)
                    }
                }
            })()
    }

    public languages(): string[] {
        return this._languages
    }

    public async setLanguage(guild: Guild | null, language: string) {
        if (guild) {
            this._guildLanguage.set(guild.id, language)
        }
    }

    public getLanguage(guild: Guild | null): string {
        if (guild) {
            const result = this._guildLanguage.get(guild.id)
            if (result) {
                return result
            }
        }
        return this._instance.defaultLanguage
    }

    get(
        guild: Guild | null,
        messageId: string,
        args: { [key: string]: string } = {}
    ): string {
        const language = this.getLanguage(guild)

        const translations = this._messages[messageId]
        if (!translations) {
            console.error(
                `TyrCommands > Could not find the correct message to send for "${messageId}""`
            )
            return 'Die Korrekte Nachricht konnte nicht gefunden werden. Bitte gib das einen der Bot Entwickler weiter.'
        }

        let result = translations[language]

        for (const key of Object.keys(args)) {
            const expression = new RegExp(`{${key}}`, 'g')
            result = result.replace(expression, args[key])
        }

        return result
    }

    getEmbed(
        guild: Guild | null,
        embedId: string,
        itemId: string,
        args: { [key: string]: string } = {}
    ): string {
        const language = this.getLanguage(guild)

        const items = this._messages[embedId]
        if (!items) {
            console.error(
                `TyrCommands > Could not find the coorect item to send for "${embedId}" -> "${itemId}"`
            )
            return 'Die Korrekte Nachricht konnte nicht gefunden werden. Bitte gib das einen der Bot Entwickler weiter.'
        }

        const translations = items[itemId]
        if (!translations) {
            console.error(
                `TyrCommands > Could not find the correct message to send for "${embedId}"`
            )
            return 'Die Korrekte Nachricht konnte nicht gefunden werden. Bitte gib das einen der Bot Entwickler weiter.'
        }

        let result = translations[language]

        for (const key of Object.keys(args)) {
            const expression = new RegExp(`{${key}}`, 'g')
            result = result.replace(expression, args[key])
        }

        return result
    }
}