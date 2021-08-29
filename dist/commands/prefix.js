"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const prefixes_1 = __importDefault(require("../models/prefixes"));
module.exports = {
    slash: 'both',
    aliases: ['prefix', 'präfix'],
    maxArgs: 1,
    cooldown: '2s',
    expectedArgs: '[New Prefix]',
    requiredPermissions: ['ADMINISTRATOR'],
    description: 'Zeigt oder legt das Prefix für den Server fest.',
    category: 'Einstellungen',
    callback: async (options) => {
        const { message, args, text, instance, interaction, client } = options;
        const guild = message ? message.guild : client.guilds.cache.get(interaction.guildId);
        const prefix = instance.getPrefix(guild)
        if (args.length === 0) {
            (message ? message : interaction).reply({
                content: instance.messageHandler.get(guild, 'CURRENT_PREFIX', {
                    PREFIX: prefix,
                }),
                ephemeral: true,
            });
        }
        else {
            if (guild) {
                const { id } = guild;
                if (!instance.isDBConnected()) {
                    (message ? message : interaction).reply({
                        content: instance.messageHandler.get(guild, 'NO_DATABASE_FOUND'),
                        ephemeral: true,
                    });
                    return;
                }
                await prefixes_1.default.findOneAndUpdate({
                    _id: id,
                }, {
                    _id: id,
                    prefix: text,
                }, {
                    upsert: true,
                });
                instance.setPrefix(guild, text);
                (message ? message : interaction).reply({
                    content: instance.messageHandler.get(guild, 'SET_PREFIX', {
                        PREFIX: text,
                    }),
                    ephemeral: true,
                });
            }
            else {
                (message ? message : interaction).reply({
                    content: instance.messageHandler.get(guild, 'CANNOT_SET_PREFIX_IN_DMS'),
                    ephemeral: true,
                });
            }
        }
    },
};
