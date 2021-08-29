"use strict";
class SlashCommands {
    _client;
    _instance;
    constructor(instance, listen = true) {
        this._instance = instance;
        this._client = instance.client;
        if (listen) {
            this._client.on('interactionCreate', async (interaction) => {
                if (!interaction.isCommand()) {
                    return;
                }
                const { member, commandName, options, guildId, channelId } = interaction;
                const command = commandName;
                const guild = this._client.guilds.cache.get(guildId || '') || null;
                const channel = guild?.channels.cache.get(channelId) || null;
                this.invokeCommand(interaction, command, options, member, guild, channel);
            });
        }
    }
    getCommands(guildId) {
        if (guildId) {
            return this._client.guilds.cache.get(guildId)?.commands;
        }
        return this._client.application?.commands;
    }
    async get(guildId) {
        const commands = this.getCommands(guildId);
        if (commands) {
            return commands.cache;
        }
        return new Map();
    }
    async create(name, description, options, guildId) {
        let commands;
        if (guildId) {
            commands = this._client.guilds.cache.get(guildId)?.commands;
        }
        else {
            commands = this._client.application?.commands;
        }
        if (commands) {
            return await commands.create({
                name,
                description,
                options,
            });
        }
        return Promise.resolve(undefined);
    }
    async delete(commandId, guildId) {
        const commands = this.getCommands(guildId);
        if (commands) {
            return await commands.cache.get(commandId)?.delete();
        }
        return Promise.resolve(undefined);
    }
    async invokeCommand(interaction, commandName, options, member, guild, channel) {
        const command = this._instance.commandHandler.getCommand(commandName);
        if (!command || !command.callback) {
            return;
        }
        const { requiredPermissions, cooldown, globalCooldown, error } = command;
        const owner = this._instance.botOwner.includes(member.user.id);
        const admin = this._instance.botAdmin.includes(member.user.id);
        if (command._ownerOnly && !owner) {
            interaction.reply(instance.messageHandler.get(guild, 'BOT_OWNERS_ONLY'));
            return;
        }
        for (const perm of requiredPermissions || []) {
            const noPerms = () => {
                if (error) {
                    error({
                        error: CommandErrors_1.default.MISSING_PERMISSIONS,
                        command,
                        interaction,
                    });
                }
                else {
                    interaction
                        .reply(instance.messageHandler.get(guild, 'MISSING_PERMISSION', {
                            PERM: perm,
                        }))
                        .then((message) => {
                            if (instance.delErrMsgCooldown === -1) {
                                return;
                            }
                            setTimeout(() => {
                                message.delete();
                            }, 1000 * instance.delErrMsgCooldown);
                        });
                }
            };
            // @ts-ignore
            if (command.allowAdmin && !member.permissions.has(perm) && !owner) {
                if (!admin) {
                    noPerms();
                    return;
                }
            } else if (!member.permissions.has(perm) && !owner) {
                noPerms();
                return;
            }
        }
        const roles = command.getRequiredRoles(guild.id);
        if (roles && roles.length) {
            const missingRoles = [];
            const missingRolesNames = [];
            for (const role of roles) {
                if (!member.roles.cache.has(role) && !owner) {
                    missingRoles.push(role);
                    missingRolesNames.push(guild.roles.cache.get(role)?.name);
                }
            }
            if (missingRoles.length) {
                if (error) {
                    error({
                        error: CommandErrors_1.default.MISSING_ROLES,
                        command,
                        interaction,
                        info: {
                            missingRoles,
                        },
                    });
                }
                else {
                    interaction
                        .reply(instance.messageHandler.get(guild, 'MISSING_ROLES', {
                            ROLES: missingRolesNames.join(', '),
                        }))
                        .then((message) => {
                            if (instance.delErrMsgCooldown === -1) {
                                return;
                            }
                            setTimeout(() => {
                                message.delete();
                            }, 1000 * instance.delErrMsgCooldown);
                        });
                }
                return;
            }
        }
        if ((cooldown || globalCooldown) && member.user && !owner) {
            const guildId = guild ? guild.id : 'dm';
            const timeLeft = command.getCooldownSeconds(guildId, member.user.id);
            if (timeLeft) {
                if (error) {
                    error({
                        error: CommandErrors_1.default.COOLDOWN,
                        command,
                        interaction,
                        info: {
                            timeLeft,
                        },
                    });
                }
                else {
                    interaction.reply(instance.messageHandler.get(guild, 'COOLDOWN', {
                        COOLDOWN: timeLeft,
                    }));
                }
                return;
            }
            command.setCooldown(guildId, member.user.id);
        }
        const args = [];
        options.data.forEach(({ value }) => {
            args.push(String(value));
        });
        command.callback({
            member,
            guild,
            channel,
            args,
            text: args.join(' '),
            client: this._client,
            instance: this._instance,
            interaction,
            options,
        });
    }
}
module.exports = SlashCommands;
