// Standalone launcher for the developer portfolio website

const { start } = require('./website/server');

const portArg = process.argv.slice(2).find(a => /^\d+$/.test(a));
const port = Number(portArg || 3000);

start(port);
