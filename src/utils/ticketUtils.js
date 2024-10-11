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
    .setColor('#0099ff')
    .setFooter({ text: 'Click the button below to create a ticket' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel(client.config.buttonLabel)
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫')
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

  const welcomeEmbed = new EmbedBuilder()
    .setTitle('Welcome to Your Ticket')
    .setDescription(`Hello ${user}, a staff member will be with you shortly.`)
    .setColor('#00ff00')
    .setTimestamp();

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel('Claim Ticket')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🙋')
  );

  await ticketChannel.send({ embeds: [welcomeEmbed], components: [buttonRow] });

  await interaction.reply({
    content: `Your ticket has been created: ${ticketChannel}`,
    ephemeral: true,
  });
}

async function closeTicket(interaction, client) {
  const channel = interaction.channel;
  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: 'This command can only be used in ticket channels!', ephemeral: true });
  }

  await channel.send('This ticket will be closed in 5 seconds...');
  setTimeout(async () => {
    await channel.delete();
    client.tickets.delete(channel.topic);
  }, 5000);
}

module.exports = { setupTicket, createTicket, closeTicket };