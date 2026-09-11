const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-create')
    .setDescription('Erstellt eine neue Team-Rolle und damit ein Team.')
    .addStringOption((option) => option.setName('name').setDescription('Name des Teams').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, client) {
    const teamName = interaction.options.getString('name');
    const guild = interaction.guild;

    const existingRole = guild.roles.cache.find((role) => role.name.toLowerCase() === teamName.toLowerCase());
    if (existingRole) {
      await interaction.reply({ content: `Ein Team mit dem Namen **${teamName}** existiert bereits.`, ephemeral: true });
      return;
    }

    const role = await guild.roles.create({
      name: teamName,
      color: config.colors.primary,
      mentionable: true,
    });

    client.teamRoles = client.teamRoles || new Map();
    client.teamRoles.set(teamName.toLowerCase(), role.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🛠️ Team erstellt')
      .setDescription(`Das Team **${teamName}** wurde erfolgreich erstellt.`)
      .addFields({ name: 'Rolle', value: `${role}`, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};
