"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const getFirstEmbed = function (instance, guild) {
    const { messageHandler, } = instance;
    const commands = instance.commandHandler.getCommands();
    const embed = new discord_js_1.MessageEmbed()
        .setTitle(`${instance.displayName} ${messageHandler.getEmbed(guild, 'HELP_MENU', 'TITLE')}`)
        .setDescription(messageHandler.getEmbed(guild, 'HELP_MENU', 'SELECT_A_CATEGORY'))
    if (instance.color) {
        embed.setColor(instance.color);
    }
    const categories = {};
    for (const { category, testOnly } of commands) {
        if (!category ||
            (testOnly && guild && !instance.testServers.includes(guild.id)) ||
            (instance.hiddenCategories.includes(category))) {
            continue;
        }
        if (categories[category]) {
            ++categories[category].amount;
        }
        else {
            categories[category] = {
                amount: 1,
                emoji: instance.getEmoji(category),
            };
        }
    }
    const keys = Object.keys(categories);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const { emoji } = categories[key];
        if (!emoji) {
            console.warn(`TyrCommands > Category "${key}" does not have an emoji icon.`);
            continue;
        }
        const visibleCommands = instance.commandHandler.getCommandsByCategory(key, true);

        const amount = visibleCommands.length;
        if (amount === 0) {
            continue;
        }

        embed.setDescription(embed.description + `\n\n**${emoji} - ${key}** - ${amount} Befehl${amount === 1 ? '' : 'e'}`);
    }
    return {
        embed,
        keys,
    };
};
exports.default = getFirstEmbed;