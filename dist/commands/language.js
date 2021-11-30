"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const languages_1 = __importDefault(require("../models/languages"));
const Events_1 = __importDefault(require("../enums/Events"));
module.exports = {
    description: 'Zeigt die Sprache für diesen Discord-Server an oder legt sie fest',
    category: 'Einstellungen',
    aliases: ['lang'],
    permissions: ['ADMINISTRATOR'],
    maxArgs: 1,
    expectedArgs: '[language]',
    cooldown: '2s',
    slash: 'both',
    callback: async (options) => {
        const { channel, text, instance } = options;
        const { guild } = channel;
        if (!guild) {
            return;
        }
        const { messageHandler } = instance;
        if (!instance.isDBConnected()) {
            return messageHandler.get(guild, 'NO_DATABASE_FOUND');
        }
        const lang = text.toLowerCase();
        if (!lang) {
            return messageHandler.get(guild, 'CURRENT_LAMGUAGE', {
                LANGUAGE: messageHandler.getLanguage(guild)
            });
        }
        if (!messageHandler.languages().includes(lang)) {
            instance.emit(Events_1.default.LANGUAGE_NOT_SUPPORTED, guild, lang);
            return messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', {
                LANGUAGE: lang
            });
        }
        messageHandler.setLanguage(guild, lang);
        await languages_1.default.findOneAndUpdate({
            _id: guild.id
        }, {
            _id: guild.id,
            language: lang
        }, {
            upsert: true
        });
        return messageHandler.get(guild, 'NEW_LANGUAGE', {
            LANGUAGE: lang
        });
    }
};
