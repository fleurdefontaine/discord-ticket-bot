const { SlashCommandBuilder } = require('@discordjs/builders');
const { setupTicket } = require('../utils/ticketUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the ticket system')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to set up the ticket system in')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('category')
        .setDescription('The category to create tickets in')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('The description for the ticket embed')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('button_label')
        .setDescription('The label for the create ticket button')
        .setRequired(true)),
  async execute(interaction, client) {
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'You need administrator permissions to use this command.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');
    const description = interaction.options.getString('description');
    const buttonLabel = interaction.options.getString('button_label');

    client.config.settingsChannelId = channel.id;
    client.config.ticketCategory = category.id;
    client.config.embedDescription = description;
    client.config.buttonLabel = buttonLabel;

    await setupTicket(client);

    await interaction.reply({ content: 'Ticket system has been set up successfully!', ephemeral: true });
  },
};