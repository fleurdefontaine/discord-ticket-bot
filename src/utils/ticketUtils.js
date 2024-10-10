const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

async function setupTicket(client) {
  const guild = await client.guilds.fetch(client.config.guildId);
  const ticketCategory = await guild.channels.fetch(client.config.ticketCategory);
  
  ticketCategory.children.cache
    .filter(channel => channel.name.startsWith('ticket-'))
    .forEach(channel => client.tickets.set(channel.topic, channel.id));

  const settingsChannel = await client.channels.fetch(client.config.settingsChannelId);
  const embed = new EmbedBuilder()
    .setTitle('Support Ticket System')
    .setDescription(client.config.embedDescription)
    .setColor('#0099ff');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel(client.config.buttonLabel)
      .setStyle(ButtonStyle.Primary)
  );

  await settingsChannel.send({ embeds: [embed], components: [row] });
}

async function createTicket(interaction, client) {
  const { user, guild } = interaction;

  if (client.tickets.has(user.id)) {
    return interaction.reply({
      content: 'You already have an open ticket!',
      ephemeral: true,
    });
  }

  if (client.tickets.size >= client.config.ticketLimit) {
    return interaction.reply({
      content: 'The maximum number of tickets has been reached. Please try again later.',
      ephemeral: true,
    });
  }

  const channelName = `ticket-${user.username}`;
  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: client.config.ticketCategory,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      ...client.config.staffRoles.map(roleId => ({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      })),
    ],
  });

  client.tickets.set(user.id, ticketChannel.id);

  await ticketChannel.send(`Welcome to your ticket, ${user}! A staff member will be with you shortly.`);

  await interaction.reply({
    content: `Your ticket has been created: ${ticketChannel}`,
    ephemeral: true,
  });
}

module.exports = { setupTicket, createTicket };