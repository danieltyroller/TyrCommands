"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
var _get_first_embed_1 = __importDefault(require("./!get-first-embed"));
var sendHelpMenu = (message, instance, interaction, client) => {
    const guild = message ? message.guild : client.guilds.cache.get(interaction.guildId);
    const { embed, keys } = _get_first_embed_1.default(instance, guild);
    const options = [];
    for (let a = 0; a < keys.length; ++a) {
        const value = keys[a].replace(' ', '_');
        const option = {
            label: keys[a],
            value,
            emoji: instance.getEmoji(keys[a]),
        };
        options.push(option);
    }
    const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('help_category')
                .setPlaceholder('Kategorie wählen')
                .addOptions(options),
        );
    if (message) {
        message.reply({ embeds: [embed], components: [row] }).then((msg) => {
            setTimeout(() => {
                msg.delete();
            }, 3 * 60 * 1000); // 3 min
        });
    }
    else {
        interaction?.update({ embeds: [embed], components: [row] });
    }
};
module.exports = {
    aliases: ['help', 'commands', 'befehle'],
    maxArgs: 1,
    expectedArgs: '[Befehl]',
    description: 'Zeigt die Befehle dieses Bots an',
    category: 'Einstellungen',
    callback: (options) => {
        const { message, instance, args, interaction, client } = options;
        const guild = message ? message.guild : client.guilds.cache.get(interaction.guildId);
        if (guild && !guild.me?.permissions.has('SEND_MESSAGES')) {
            console.warn(`TyrCommands > Could not send message due to no permissions in channel for ${guild.name}`);
            return;
        }
        // Typical "!help" syntax for the menu
        if (args.length === 0) {
            sendHelpMenu(message, instance, interaction, client);
            return;
        }
        // If the user is looking for info on a specific command
        // Ex: "!help prefix"
        const arg = args.shift()?.toLowerCase();
        const command = instance.commandHandler.getICommand(arg);
        if (!command) {
            message.reply(instance.messageHandler.get(guild, 'UNKNOWN_COMMAND', {
                COMMAND: arg,
            }));
            return;
        }
        const { description, syntax, names } = command;
        if (names === undefined) {
            console.error('TyrCommands > A command does not have a name assigned to it.');
            return '';
        }
        const mainName = typeof names === 'string' ? names : names.shift();
        let desc = `**${mainName}**${description ? ' - ' : ''}${description}`;
        if (names.length && typeof names !== 'string') {
            desc += `\n• | \`${instance.getPrefix(guild)}${mainName}\` ${(description ? ' - ' : '')}\*${description}\*`;
            desc += `\n${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'ALIASES')}: "${names.join('", "')}"`;
        }
        const embedDescription = desc += `\n${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'SYNTAX')}: "${instance.getPrefix(guild)}${mainName}${syntax ? ' ' : ''}${syntax || ''}"`;
        const embed = new MessageEmbed()
            .setTitle(`${instance.displayName} ${instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'TITLE')} - ${arg}`)
            .setDescription(embedDescription);
        if (instance.color) {
            embed.setColor(instance.color);
        }
        message.channel.send({ embeds: [embed] });
    },
};