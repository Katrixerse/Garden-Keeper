const util = require('util');
const vm = require('node:vm');
const { OwnerID } = require('../../../config.json');

module.exports = {
  name: 'eval',
  aliases: ['ev'],
  description: 'Safely evaluate JavaScript in a restricted sandbox (bot owner only). Supports await.',
  usage: 'eval <code>',
  cooldownTime: '0',
  group: 'developer',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if(message.author.id !== OwnerID) return;
    if(!args.length) return message.reply('Provide code.');

    // Combine & strip code fences if present
    let raw = args.join(' ');
    raw = raw.replace(/^```(js|javascript)?\n?|```$/gi,'');

    // Flags
    const silent = /(--silent|-s)\b/.test(raw);
    raw = raw.replace(/(--silent|-s)\b/g,'');
    const depthMatch = raw.match(/--depth=(\d+)/);
    const depth = depthMatch ? parseInt(depthMatch[1],10) : 1;
    raw = raw.replace(/--depth=\d+/,'');

    // Build sandbox (no direct access to process, require, bot token, filesystem)
    const sandbox = {
      console, // allow basic console logging (appears in server logs)
      util,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Math,
      Date,
      URL,
      // Provide a minimal helper to inspect values manually
      inspect: (v,d=depth) => util.inspect(v,{ depth:d, colors:false })
    };
    sandbox.global = sandbox; // self reference

    const context = vm.createContext(sandbox, { codeGeneration: { strings: true, wasm: false } });

    // Wrap user code in async IIFE so top-level await works
    const wrapped = `(async () => { ${raw} })()`;
    let script;
    try {
      script = new vm.Script(wrapped, { timeout: 750, displayErrors: true });
    } catch (syntaxErr) {
      return message.channel.send('```js\n'+syntaxErr.message+'\n```').catch(()=>{});
    }

    const started = Date.now();
    let result, execError;
    try {
      const possiblePromise = script.runInContext(context, { timeout: 750 });
      // Enforce overall async timeout
      const timeoutMs = 2000;
      result = await Promise.race([
        possiblePromise,
        new Promise((_,rej)=> setTimeout(()=>rej(new Error('Execution timed out ('+timeoutMs+'ms)')), timeoutMs))
      ]);
    } catch (e) {
      execError = e;
    }
    const elapsed = Date.now() - started;

    function redact(str){
      if(!str) return str;
      const token = bot.token;
      if(token) str = str.split(token).join('[redacted-token]');
      return str;
    }

    if (execError) {
      let out = (execError && execError.stack) ? execError.stack : String(execError);
      if(out.length > 1900) out = out.slice(0,1900)+'...';
      return message.channel.send('```js\n'+redact(out)+'\n```').catch(()=>{});
    }

    if (silent) return; // no output requested

    try {
      let out = result;
      if (typeof out !== 'string') out = util.inspect(out, { depth, colors:false });
      out = redact(out);
      if(!out) out = 'undefined';
      if(out.length > 1900) out = out.slice(0,1900)+'...';
      message.channel.send('```js\n'+out+'\n```\n`'+elapsed+'ms`').catch(()=>{});
    } catch (sendErr) {
      message.channel.send('```js\nOutput error: '+sendErr.message+'\n```').catch(()=>{});
    }
  }
};
