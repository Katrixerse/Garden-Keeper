// Static data (projects & skills) - can be replaced with DB or CMS later

const projects = [
  {
    id: 'garden-bot',
    name: 'Garden Keeper',
    tagline: 'Moderation, stock tracking & automation discord bot for Grow a Garden.',
    description: 'A multi-feature Discord bot providing stock monitoring, reputation systems, moderation tools and scheduled events. Built with discord.js and MySQL.',
    tech: ['Node.js', 'discord.js', 'MySQL', 'Express'],
    highlights: [
      'Real-time stock & weather tracking with scheduled tasks',
      'Slash & prefix command architecture',
      'Giveaway scheduler & logging system'
    ],
    repo: 'https://github.com/Katrixerse/garden-keeper',
    live: null,
    featured: true
  },
  {
    id: 'robot-hamster-v2',
    name: 'Robot Hamster v2',
    tagline: 'Feature-rich multi-purpose discord bot with a dashboard.',
    description: 'Public Discord bot focused on moderation, leveling, and economy and more.',
    tech: ['Node.js', 'discord.js', 'MySQL', 'Python', 'Django'],
    highlights: [
      'Leveling system with XP & ranks with canvas profiles',
      'Economy system with virtual currency & shops',
      'Giveaway system with entry tracking & rewards',
      'Custom Command System with dynamic responses',
      'Tickets system for user support',
      'Welcome/leave system with customizable messages',
      'Twitch integration for stream alerts',
      'Reddit integration for post notifications',
      'And more!'
    ],
    repo: 'https://github.com/Katrixerse/Robot-Hamster-v2',
    live: null,
    featured: false
  },
  {
    id: 'portfolio-site',
    name: 'Developer Portfolio',
    tagline: 'This website showcasing projects and skills.',
    description: 'An Express-powered, server-rendered portfolio with minimalist CSS and JSON APIs for integration.',
    tech: ['Express', 'HTML', 'CSS', 'Vanilla JS'],
    highlights: [
      'Zero client framework overhead',
      'SEO friendly server rendering',
      'Simple JSON endpoints'
    ],
    repo: 'https://github.com/your-user/portfolio',
    live: '/',
    featured: true
  }
];

const skills = {
  Languages: ['JavaScript (ES2023)', 'C#', 'SQL', 'Python'],
  Backend: ['Node.js', 'Express', 'REST APIs', 'WebSockets'],
  Databases: ['MySQL'],
  Tools: ['Git', 'Docker', 'Linux']
};

module.exports = { projects, skills };
