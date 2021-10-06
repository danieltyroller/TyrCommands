import {
    MessageEmbed,
    MessageActionRow,
    MessageSelectMenu,
    Client,
    Guild,
    GuildMember,
    CommandInteraction
} from 'discord.js'

import TyrCommands from '.'
import CommandErros from './enums/CommandErrors'
import { ICommand } from '../typings'

class SelectMenuListener {
    private _client: Client
    private _instance: TyrCommands

    constructor(instance: TyrCommands, listen: boolean, typeScript?: boolean) {
        this._instance = instance
        this._client = instance.client
        if (listen) {
            this._client.on('interactionCreate', async (interaction) => {
                if (!interaction.isSelectMenu()) {
                    return
                }
                const guild = this._client?.guilds.cache.get(interaction?.guildId)
                if (interaction.customId === 'help_category') {
                    this.generateCategoryMenu(interaction, guild)
                } else if (interaction.customId === 'help_command') {
                    this.generateCommandMenu(interaction, guild)
                } else {
                    return
                }
            })
        }
    }
    private generateCategoryMenu(interaction: CommandInteraction, guild: Guild) {
        const commands = this._instance.commandHandler.getCommands()
        const categories = {}
        for (const { category, testOnly } of commands) {
            if (!category ||
                (testOnly && guild && !this._instance.testServers.includes(interaction.guildId)) ||
                (this._instance.hiddenCategories.includes(category))) {
                continue
            }
            if (categories[category]) {
                ++categories[category].amount
            } else {
                categories[category] = {
                    amount: 1,
                    emoji: this._instance.getEmoji(category)
                }
            }
        }
        const keys = Object.keys(categories)
        for (let a = 0; a < keys.length; a++) {
            const key = keys[a]
            const value = key.replace(' ', '_')
            if (interaction.values[0] === value) {
                const oldEmbed = interaction.message.embeds[0]
                const { commands, commandString, category } = this.getCommands(key, oldEmbed)
                let desc = `${category} ${commandString}\n\n${this._instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'DESCRIPTION_FIRST_LINE')}`
                const options = []
                for (let b = 0; b < commands.length; b++) {
                    const command = commands[b]
                    let { hidden, category: ICategory, names } = command
                    const commandName = typeof names === 'string' ? names : names[0]
                    const { minArgs, ownerOnly } = this._instance.commandHandler.getCommand(commandName)
                    if (!hidden && category === ICategory) {
                        desc += this.getHelp(command, guild)
                    }
                    if (minArgs !== 0 || ownerOnly) {
                        continue
                    }
                    const option = {
                        label: commandName,
                        description: command.description ? command.description : commandName,
                        value: commandName,
                        emoji: this._instance.getEmoji(category)
                    }
                    options.push(option)
                }
                const back = {
                    label: 'zurück',
                    description: 'Bringt dich zurück zum Start vom Help Menü',
                    value: 'zurück',
                    emoji: '🔙'
                }
                options.push(back)
                const newEmbed = new MessageEmbed()
                    .setTitle(`__${category}__`)
                    .setDescription(desc)
                    .setColor(oldEmbed?.color ? oldEmbed.color : 'RANDOM')
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('help_command')
                            .setPlaceholder('Command wählen')
                            .addOptions(options)
                    )
                interaction.update({ embeds: [newEmbed], components: [row], ephemeral: true })
            }
        }
    }
    private generateCommandMenu(interaction: CommandInteraction, guild: Interaction) {
        const { commandHandler, messageHandler, botOwner, botAdmin } = this._instance
        let commandName = interaction.values[0]
        if (!commandName) {
            return
        }
        if (commandName === 'zurück') {
            commandName = 'help'
        }
        const command = commandHandler.getCommand(commandName)
        if (!command) {
            return
        }
        const { member, channelId } = interaction
        const channel = guild?.channels.cache.get(channelId)
        if (guild) {
            const isDisabled = command.isDisabled(guild.id)
            if (isDisabled) {
                if (error) {
                    error({
                        error: CommandErros.default.COMMAND_DISABLED,
                        command,
                        message: interaction.message
                    })
                } else {
                    interaction.reply({
                        content: messageHandler.get(guild, 'DISABLED_COMMAND'),
                        ephemeral: true
                    })
                }
                return
            }
        }
        const { requiredPermissions, cooldown, globalCooldown } = command
        const owner = botOwner.includes(member.user.id)
        const admin = botAdmin.includes(member.user.id)
        if (guild && member) {
            if (command.ownerOnly && !owner) {
                interaction.reply({
                    content: messageHandler.get(guild, 'BOT_OWNERS_ONLY'),
                    ephemeral: true
                })
                return
            }

            for (const perm of requiredPermissions || []) {
                const noPerms = () => {
                    if (error) {
                        error({
                            error: CommandErros.default.MISSING_PERMISSIONS,
                            command,
                            message: interaction.message
                        })
                    } else {
                        interaction.reply({
                            content: messageHandler.get(guild, 'MISSING_PERMISSIONS', {
                                PERM: perm
                            }),
                            ephemeral: true
                        })
                    }
                }
                // @ts-ignore
                if (command.allowAdmin && !member.permissions.has(perm) && !owner) {
                    if (!admin) {
                        noPerms()
                        return
                    }
                } else if (!member.permissions.has(perm) && !owner) {
                    noPerms()
                    return
                }
            }
            const roles = command.getRequiredRoles(guild.id)
            if (roles && roles.length) {
                const missingRoles = []
                const missingRolesNames = []
                for (const role of roles) {
                    if (!member.roles.cache.has(role) && !owner) {
                        missingRoles.push(role)
                        missingRolesNames.push(guild.roles.cache.get(role)?.name)
                    }
                }
                if (missingRoles.length) {
                    if (error) {
                        error({
                            error: CommandErros.default.MISSING_ROLES,
                            command,
                            message: interaction.message,
                            info: {
                                missingRoles
                            }
                        })
                    } else {
                        interaction.reply({
                            content: messageHandler.get(guild, 'MISSING_ROLES', {
                                ROLES: missingRolesNames.join(', ')
                            }),
                            ephemeral: true
                        })
                    }
                    return
                }
            }
        }
        if ((cooldown || globalCooldown) && member.user && !owner) {
            const guildId = guild ? guild.id : 'dm'
            const timeLeft = command.getCooldownSeconds(guildId, member.user.id)
            if (timeLeft) {
                if (error) {
                    error({
                        error: CommandErros.default.COOLDOWN,
                        command,
                        message: interaction.message,
                        info: {
                            timeLeft
                        }
                    })
                } else {
                    interaction.reply({
                        content: messageHandler.get(guild, 'COOLDOWN', {
                            COOLDOWN: timeLeft
                        }),
                        ephemeral: true
                    })
                }
                return
            }
            command.setCooldown(guild, member?.user.id)
        }
        if (guild) {
            const key = `${guild.id}-${command.names[0]}`
            const channels = command.requiredChannels.get(key)
            if (channels &&
                channels.length &&
                !channels.includes(interaction?.channel.id) &&
                !owner) {
                let channelList = ''
                for (const channel of channels) {
                    channelList += `<#${channels}>, `
                }
                channelList = channelList.substring(0, channelList.length - 2)
                interaction.reply({
                    content: messageHandler.get(guild, 'ALLOWED_CHANNELS', {
                        CHANNELS: channelList
                    }),
                    ephemeral: true
                })
                return
            }
        }
        const args = [] as string[]
        command.callback({
            member,
            guild,
            channel,
            args,
            text: args.join(' '),
            client: this._client,
            instance: this._instance,
            interaction
        })
    }
    private getCommands(category: string, embed: MessageEmbed, guild: Guild) {
        const commandsString = this._instance.messageHandler.getEmbed(guild, 'HELP_MENU', 'COMMANDS')
        if (embed?.description) {
            const split = embed.description.split('\n')
            const cmdStr = ' ' + commandsString
            if (split[0].endsWith(cmdStr)) {
                category = split[0].replace(cmdStr, '')
            }
        }
        const commands = this._instance.commandHandler.getCommandsByCategory(category);
        return {
            commands,
            commandsString,
            category
        }
    }
    private getHelp(command: ICommand, guild: Guild) {
        const { description, names } = command
        if (names === undefined) {
            console.error('TyrCommands > A command does not have a name assigned to it.')
            return ''
        }
        const mainName = typeof names === 'string' ? names : names.shift()
        let desc = `\n• | \`${this._instance.getPrefix(guild)}${mainName}\` ${description ? ' - ' : ''}\*${description}\*`
        return desc
    }
}
export = SelectMenuListener