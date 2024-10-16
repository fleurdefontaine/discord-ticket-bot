const { Events } = require('discord.js');
const { setupTicket } = require('../utils/ticketUtils');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    await setupTicket(client);
  },
};