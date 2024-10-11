const { Events } = require('discord.js');
const { createTicket, closeTicket } = require('../utils/ticketUtils');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
      }
    } else if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'create_ticket':
          await createTicket(interaction, client);
          break;
        case 'close_ticket':
          await closeTicket(interaction, client);
          break;
        default:
          break;
      }
    }
  },
};