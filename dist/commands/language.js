"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const languages_1 = __importDefault(require("../models/languages"));
const Events_1 = __importDefault(require("../enums/Events"));
module.exports = {
    slash: 'both',
    aliases: ['language', 'lang'],
    maxArgs: 1,
    cooldown: '2s',
    expectedArgs: '[Language]',
    requiredPermissions: ['ADMINISTRATOR'],
    description: "Zeigt oder legt die Sprach für diesen Server fest.",
    category: "Einstellungen",
    callback: async (options) => {
        const { message, text, instance, interaction, client } = options;
        const guild = message ? message.guild : client.guilds.cache.get(interaction.guildId);
        if (!guild) {
            return;
        }
        const { messageHandler } = instance;
        if (!instance.isDBConnected()) {
            (message ? message : interaction).reply({
                content: instance.messageHandler.get(guild, 'NO_DATABASE_FOUND'),
                ephemeral: true,
            });
            return;
        }
        const lang = text.toLowerCase();
        if (!lang) {
            (message ? message : interaction).reply({
                content: instance.messageHandler.get(guild, 'CURRENT_LANGUAGE', {
                    LANGUAGE: instance.messageHandler.getLanguage(guild),
                }),
                ephemeral: true,
            });
            return;
        }
        if (!messageHandler.languages().includes(lang)) {
            (message ? message : interaction).reply({
                content: messageHandler.get(guild, 'LANGUAGE_NOT_SUPPORTED', {
                    LANGUAGE: lang,
                }),
                ephemeral: true,
            });
            instance.emit(Events_1.default.LANGUAGE_NOT_SUPPORTED, message, lang);
            return;
        }
        instance.messageHandler.setLanguage(guild, lang);
        (message ? message : interaction).reply({
            content: instance.messageHandler.get(guild, 'NEW_LANGUAGE', {
                LANGUAGE: lang,
            }),
            ephemeral: true,
        });
        await languages_1.default.findOneAndUpdate({
            _id: guild.id,
        }, {
            _id: guild.id,
            language: lang,
        }, {
            upsert: true,
        });
    },
};
