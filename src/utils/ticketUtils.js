const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');

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
  const { user } = interaction;

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

  const modal = new ModalBuilder()
    .setCustomId('ticket_modal')
    .setTitle('Create a Ticket');

  const issueInput = new TextInputBuilder()
    .setCustomId('issue_description')
    .setLabel('Please Explain Your Issue')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const priorityInput = new TextInputBuilder()
    .setCustomId('priority_level')
    .setLabel('Priority Level (Low, Medium, High)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(issueInput),
    new ActionRowBuilder().addComponents(priorityInput)
  );

  await interaction.showModal(modal);
}

async function handleTicketModalSubmit(interaction, client) {
  const { user, guild } = interaction;

  const issueDescription = interaction.fields.getTextInputValue('issue_description');
  const priorityLevel = interaction.fields.getTextInputValue('priority_level');

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
    
  const modalEmbed = new EmbedBuilder()
    .setTitle('Reports Details')
    .setDescription(`Ticket ID: ${ticketChannel.id}\n\n🚨Issues: ${issueDescription} \n🔐 User ID: ${priorityLevel}`)
    .setColor('#00ff00');
  

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

  await ticketChannel.send({ embeds: [welcomeEmbed, modalEmbed], components: [buttonRow] });
  
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
    await interaction.deferUpdate();
    
  const timestampOpened = new Date(channel.createdTimestamp).toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
  });
  const timestampClosed = new Date().toLocaleString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true 
  });
  
  const transcript = await createTranscript(channel, {
    limit: -1, 
    returnBuffer: false,
    fileName: `transcript-${channel.id}.html`
  });

  const transcriptChannel = await client.channels.fetch(client.config.ticketTranscript);

  const transcriptEmbed = new EmbedBuilder()
    .setTitle('Ticket Transcript')
    .setDescription(`**Ticket Details:**\nTicket ID: ${channel.id}\nTime Open: ${timestampOpened}\nTime Close: ${timestampClosed}\n**Opened by:**\n<@${interaction.user.id}>\n**Claimed by:**\n<@${interaction.user.id}>\n**Closed by:**\n<@${interaction.user.id}>`)
    .setColor('#0099ff')
    .setTimestamp();

  await transcriptChannel.send({ embeds: [transcriptEmbed], files: [transcript] });

  await channel.send('This ticket will be closed in 5 seconds...');
  setTimeout(async () => {
    await channel.delete();
    client.tickets.delete(channel.topic);
  }, 5000);
}

async function claimTicket(interaction, client) {
  const channel = interaction.channel;

  if (!channel.name.startsWith('ticket-')) {
    return interaction.reply({ content: 'This command can only be used in ticket channels!', ephemeral: true });
  }

  const member = interaction.member;
  const hasStaffRole = client.config.staffRoles.some(roleId => member.roles.cache.has(roleId));

  if (!hasStaffRole) {
    return interaction.reply({
      content: 'You do not have permission to claim this ticket.',
      ephemeral: true,
    });
  }

  await interaction.deferUpdate();

  const ticketHandlerRoleId = client.config.staffRoles[1];
  const ticketHandlerRole = interaction.guild.roles.cache.get(ticketHandlerRoleId);

  if (!ticketHandlerRole) {
    return interaction.followUp({ content: 'Ticket handler role not found!', ephemeral: true });
  }

    const claimedEmbed = new EmbedBuilder()
    .setTitle('Ticket Claimed')
    .setDescription(`Staff <@${interaction.user.id}> Claimed Your Ticket`)
    .setColor('#ffcc00')
    .setTimestamp();

  await channel.send({ embeds: [claimedEmbed] });
}


module.exports = { setupTicket, createTicket, handleTicketModalSubmit, closeTicket, claimTicket };