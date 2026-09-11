const { PermissionsBitField } = require('discord.js');

const ROLLEN = [
    '1547963828082311218',
    '1547628621856772146'
];

async function freischalten(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
            content: '❌ Dafür brauchst du Administrator-Rechte.',
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    let geändert = 0;

    for (const channel of interaction.guild.channels.cache.values()) {
        for (const roleId of ROLLEN) {
            try {
                await channel.permissionOverwrites.edit(roleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    Connect: true,
                    Speak: true
                });

                geändert++;
            } catch (err) {
                console.error(`Fehler bei ${channel.name} / Rolle ${roleId}:`, err);
            }
        }
    }

    await interaction.editReply(
        `✅ Alle Kanäle wurden freigeschaltet.\n` +
        `👥 Rollen: <@&${ROLLEN[0]}> und <@&${ROLLEN[1]}>\n` +
        `📁 Bearbeitete Berechtigungen: ${geändert}`
    );
}

module.exports = { freischalten };
