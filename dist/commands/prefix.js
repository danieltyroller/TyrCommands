"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const prefixes_1 = __importDefault(require("../models/prefixes"));
module.exports = {
    description: 'Zeigt das Prefix für das aktuelle Guild an oder legt es fest',
    category: 'Einstellungen',
    maxArgs: 1,
    expectedArgs: '[prefix]',
    cooldown: '2s',
    slash: 'both',
    callback: async (options) => {
        const { channel, args, text, instance, member } = options;
        const { guild } = channel;
        if (args.length === 0) {
            return instance.messageHandler.get(guild, 'CURRENT_PREFIX', {
                PREFIX: instance.getPrefix(guild)
            });
        }
        if (!member.permissions.has('ADMINISTRATOR'))
            return instance.messageHandler.get(guild, 'MISSING_PERMISSION', {
                PERM: 'ADMINISTRATOR'
            });
        if (guild) {
            const { id } = guild;
            if (!instance.isDBConnected()) {
                return instance.messageHandler.get(guild, 'NO_DATABASE_FOUND');
            }
            await prefixes_1.default.findOneAndUpdate({
                _id: id,
            }, {
                _id: id,
                prefix: text
            }, {
                upsert: true,
            });
            instance.setPrefix(guild, text);
            return instance.messageHandler.get(guild, 'SET_PREFIX', {
                PREFIX: text
            });
        }
        return instance.messageHandler.get(guild, 'CANNOT_SET_PREFIX_IN_DMS');
    }
};
