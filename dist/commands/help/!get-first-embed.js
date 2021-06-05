"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// require discord.js
var discord_js_1 = require("discord.js");


var getFirstEmbed = function (message, instance) {

    // Variablen guild und member erstellen 
    var guild = message.guild, member = message.member;
    // Variablen commands und messageHandler erstellen
    var commands = instance.commandHandler.commands, messageHandler = instance.messageHandler;
    // Embed erstellen
    var embed = new discord_js_1.MessageEmbed()
        // Titel des Embeds in der Sprach des Bots auf dem Server setzen
        .setTitle(instance.displayName + " " + messageHandler.getEmbed(guild, 'HELP_MENU', 'TITLE'))
        // Beschreibung in der Sprach des Bots auf dem Server setzten
        .setDescription(messageHandler.getEmbed(guild, 'HELP_MENU', 'SELECT_A_CATEGORY'))
        // Footer mit der ID des Nachrichten Autors
        .setFooter("ID #" + message.author.id);
    // Schauen ob eine Standart Embed Farbe im index.js angegeben wurde
    if (instance.color) {
        // Farbe setzen
        embed.setColor(instance.color);
    }
    // Variable categories definieren
    var categories = {};
    // Überprüfen ob der Autor Administrator Berechtigungen auf dem Server hat
    var isAdmin = member && member.hasPermission('ADMINISTRATOR');
    // Variable _i und commands_1 definieren 
    // Überprüfen ob _i kleiner commands_1.length ist 
    // Wenn dann _i + 1
    for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
        // Variablen _a, category und testOnly definieren
        var _a = commands_1[_i], category = _a.category, testOnly = _a.testOnly;
        // Sicherstellen das beifehlenden werten vorgefahren wird
        if (!category ||
            (testOnly && guild && !instance.testServers.includes(guild.id)) ||
            (/*!isAdmin && */instance.hiddenCategories.includes(category))) {
            continue;
        }
        // Wenn Kategorien vorhanden sind dann + 1
        if (categories[category]) {
            ++categories[category].amount;
        }
        else {
            // Kategorien Anzahl auf 1 setzten und emoji abfragen
            categories[category] = {
                amount: 1,
                emoji: instance.getEmoji(category),
            };
        }
    }

    // Variable ractions definieren
    var reactions = [];

    // Variable keys definieren
    var keys = Object.keys(categories);
    // Variable a definieren
    // Überbrpfen ob a kleiner ist wie keys.length
    // Wenn dann a + 1
    for (var a = 0; a < keys.length; ++a) {
        // 
        var key = keys[a];
        var emoji = categories[key].emoji;
        if (!emoji) {
            console.warn("TyrCommands > Kategorie \"" + key + "\" hat kein Emoji-Symbol.");
            continue;
        }
        var visibleCommands = instance.commandHandler.getCommandsByCategory(key, true);
        var amount = visibleCommands.length;
        if (amount === 0) {
            continue;
        }
        var reaction = emoji;
        reactions.push(reaction);
        embed.setDescription(embed.description +
            ("\n\n**" + reaction + " - " + key + "** - " + amount + " Befehl" + (amount === 1 ? '' : 'e')));
    }
    return {
        embed: embed,
        reactions: reactions,
    };
};
exports.default = getFirstEmbed;
