const { PermissionsBitField } = require('discord.js');
const { getPrefix, setPrefix } = require('../../Handlers/dbHandlers/prefix.js');

module.exports = {
	name: 'prefix',
	aliases: ['setprefix','changeprefix'],
	description: 'View or change the server command prefix.',
	usage: 'prefix [newPrefix]',
	cooldownTime: 2,
	run: async (bot, currentPrefix, message, args) => {
		if(!message.guild) return;
		const invoker = message.member;
		const hasPerm = invoker.permissions.has(PermissionsBitField.Flags.ManageGuild) || invoker.id === message.guild.ownerId;
		const existing = await getPrefix(message.guild.id);

		if(!args.length){
			return message.reply(`Current prefix: \`${existing}\`\nUse \`${existing}prefix <new>\` to change it.`);
		}

		if(!hasPerm){
			return message.reply('You need Manage Server permission to change the prefix.');
		}

		const next = args[0].trim();
		if(!next) return message.reply('Provide a new prefix.');
		if(next.length > 5) return message.reply('Prefix too long (max 5 characters).');
		if(/\s/.test(next)) return message.reply('Prefix cannot contain spaces.');

		const saved = await setPrefix(message.guild.id, next);
		if(!saved) return message.reply('Failed to set prefix.');
		return message.reply(`Prefix updated to \`${saved}\``);
	}
};
