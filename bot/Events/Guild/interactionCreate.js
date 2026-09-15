const handleGiveawayButtons = require('../../Handlers/interactions/interaction_giveawayButtons.js');
const handleTicketSystem = require('../../Handlers/interactions/interaction_ticketSystem.js');

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(bot, interaction) {
    // Fan-out to sub-handlers; each filters for its own customIds/types
    try {
      await handleGiveawayButtons(bot, interaction);
    } catch (err) {
      console.error('interactionCreate giveaway handler error:', err);
    }

    try {
      await handleTicketSystem(bot, interaction);
    } catch (err) {
      console.error('interactionCreate ticket handler error:', err);
    }
  }
};