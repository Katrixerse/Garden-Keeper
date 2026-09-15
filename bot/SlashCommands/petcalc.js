const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Lazy loaders to avoid hard failures if some modules are incomplete
function safeRequire(path){ try { return require(path); } catch { return null; } }

// Individually require known pet data modules (kept explicit for clarity / tree-shaking; safe if missing)
const petModules = [
  'commonEgg',
  'uncommonEgg',
  'rareEgg',
  'legendaryEgg',
  'mythicalEgg',
  'sproutEgg',
  'nightEgg',
  'oasisEgg',
  'paradiseEgg',
  'zenEgg',
  'gourmetEgg',
  'dinosaurEgg',
  'antiBeeEgg',
  'beeEgg',
  'bugEgg',
  'rainbowExotic',
  'chestsEventsOther',
  'commonSummerEgg',
  'rareSummerEgg',
  'birds_new'
].map(name => ({ name, mod: safeRequire(`../Handlers/petCalcHandler/pets/${name}.js`) }));

const mutationsMod = safeRequire('../Handlers/petCalcHandler/data/mutations.js');

// Utility expectations (placeholder minimal versions if site utilities absent)
const Utils = {
  isValidWeight(kg){ return Number.isFinite(kg) && kg >= 0 && kg <= 10000; },
  formatTime(sec){ if(!Number.isFinite(sec)) return 'N/A'; if(sec < 60) return `${sec.toFixed(0)}s`; const m=Math.floor(sec/60); const s=Math.floor(sec%60); return `${m}m ${s}s`; }
};

// Provide modifier details if original helper absent
function getModifierDetails(type){
  switch(String(type||'none').toLowerCase()){
    case 'gold': return { value: 0.15, text: 'Gold', style: 'color:#f1c40f;font-weight:bold;' };
    case 'silver': return { value: 0.07, text: 'Silver', style: 'color:#bdc3c7;font-weight:bold;' };
    case 'bronze': return { value: 0.04, text: 'Bronze', style: 'color:#cd7f32;font-weight:bold;' };
    default: return { value: 0, text: 'None', style: '' };
  }
}

// Merge pet datasets into a lookup map (name lowercased)
function buildPetMap(){
  const map = new Map();
  function ingest(obj){
    if(!obj || typeof obj !== 'object') return;
    for(const key of Object.keys(obj)){
      const p = obj[key];
      if(!p || typeof p !== 'object') continue;
      // Heuristic: treat as pet if has a string name property OR object contains icon + description
      if(typeof p.name === 'string') {
        map.set(p.name.toLowerCase(), p);
      }
    }
  }
  for(const { name, mod } of petModules){
    if(!mod) continue;
    // Try common export naming patterns
    const exportCandidates = Object.values(mod);
    for(const candidate of exportCandidates){
      // candidate might itself be the collection
      if(candidate && typeof candidate === 'object') {
        const values = Object.values(candidate);
        // If majority of values look like pet objects (have name), ingest this candidate
        const petLike = values.filter(v => v && typeof v === 'object' && typeof v.name === 'string');
        if(petLike.length && petLike.length >= Math.min(1, values.length)) {
          ingest(candidate);
        }
      }
    }
  }
  return map;
}

const petMap = buildPetMap();

// Mutation support
const petMutationOptions = mutationsMod?.petMutationOptions || {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('petcalc')
    .setDescription('Calculate pet ability output (optionally compare two pets).')
    .setDMPermission(false)
    .addStringOption(o=>o.setName('pet').setDescription('Pet name').setRequired(true))
    .addNumberOption(o=>o.setName('weight').setDescription('Pet weight in kg').setRequired(true))
    .addStringOption(o=>o.setName('mutation').setDescription('Mutation name (optional)').setRequired(false))
    .addStringOption(o=>o.setName('modifier').setDescription('Gold/Silver/Bronze modifier').setRequired(false)
      .addChoices(
        { name:'None', value:'none' },
        { name:'Bronze', value:'bronze' },
        { name:'Silver', value:'silver' },
        { name:'Gold', value:'gold' }
      )
    )
    // Comparison (all optional)
    .addStringOption(o=>o.setName('pet2').setDescription('Second pet name to compare').setRequired(false))
    .addNumberOption(o=>o.setName('weight2').setDescription('Second pet weight in kg').setRequired(false))
    .addStringOption(o=>o.setName('mutation2').setDescription('Second pet mutation (optional)').setRequired(false))
    .addStringOption(o=>o.setName('modifier2').setDescription('Second pet modifier').setRequired(false)
      .addChoices(
        { name:'None', value:'none' },
        { name:'Bronze', value:'bronze' },
        { name:'Silver', value:'silver' },
        { name:'Gold', value:'gold' }
      )
    ),
  cooldownMs: 3000,
  async execute(interaction){
    const petName = interaction.options.getString('pet', true).toLowerCase();
    const weight = interaction.options.getNumber('weight', true);
  const mutationQuery = interaction.options.getString('mutation');
  const modifierType = interaction.options.getString('modifier') || 'none';
  const pet2NameRaw = interaction.options.getString('pet2');
  const weight2 = interaction.options.getNumber('weight2');
  const mutation2Query = interaction.options.getString('mutation2');
  const modifier2Type = interaction.options.getString('modifier2') || modifierType; // default to first if not set

    const pet = petMap.get(petName);
    if(!pet){
      return interaction.reply({ ephemeral:true, content:`Unknown pet: ${petName}` });
    }
    if(!Utils.isValidWeight(weight)){
      return interaction.reply({ ephemeral:true, content:`Invalid weight. Provide a number between 0 and 10000.` });
    }

    // Optional second pet validation
    let pet2, abilityText2 = null, mutationText2 = null;
    let pet2Name = null;
    if(pet2NameRaw){
      pet2Name = pet2NameRaw.toLowerCase();
      pet2 = petMap.get(pet2Name);
      if(!pet2){
        return interaction.reply({ ephemeral:true, content:`Unknown second pet: ${pet2NameRaw}` });
      }
      if(weight2 == null){
        return interaction.reply({ ephemeral:true, content:'Provide weight2 when specifying pet2.' });
      }
      if(!Utils.isValidWeight(weight2)){
        return interaction.reply({ ephemeral:true, content:`Invalid weight2. Provide a number between 0 and 10000.` });
      }
    }

    // Prepare an evaluation environment similar to site logic
    const env = { Utils, getModifierDetails };

    let abilityText = 'Ability data unavailable for this pet.';
    try {
      if(typeof pet.calculate === 'function'){
        // Bind helpers if source code expects them as globals
        const calcFn = pet.calculate.bind({});
        // Some of the provided pet files have early 'if (!Utils.isValidWeight(kg))' with missing return; guard manually
        if(!Utils.isValidWeight(weight)) throw new Error('Weight check failed');
        abilityText = calcFn(weight, modifierType) || abilityText;
      }
    } catch(e){ abilityText = `Error computing ability: ${e.message}`; }

    if(pet2){
      abilityText2 = 'Ability data unavailable for this pet.';
      try {
        if(typeof pet2.calculate === 'function'){
          const calcFn2 = pet2.calculate.bind({});
          if(!Utils.isValidWeight(weight2)) throw new Error('Weight check failed');
          abilityText2 = calcFn2(weight2, modifier2Type) || abilityText2;
        }
      } catch(e){ abilityText2 = `Error computing ability: ${e.message}`; }
    }

    let mutationText = null;
    if(mutationQuery){
      const mutKey = Object.keys(petMutationOptions).find(k => k.toLowerCase() === mutationQuery.toLowerCase());
      if(mutKey){
        try {
          const mut = petMutationOptions[mutKey];
          if(typeof mut.calculate === 'function'){
            mutationText = mut.calculate(weight, modifierType) || 'No mutation output generated.';
          } else {
            mutationText = 'Mutation has no calculate function.';
          }
        } catch(e){ mutationText = `Mutation error: ${e.message}`; }
      } else {
        mutationText = 'Unknown mutation.';
      }
    }

    if(pet2 && mutation2Query){
      const mut2Key = Object.keys(petMutationOptions).find(k => k.toLowerCase() === mutation2Query.toLowerCase());
      if(mut2Key){
        try {
          const mut2 = petMutationOptions[mut2Key];
            if(typeof mut2.calculate === 'function'){
              mutationText2 = mut2.calculate(weight2, modifier2Type) || 'No mutation output generated.';
            } else {
              mutationText2 = 'Mutation has no calculate function.';
            }
        } catch(e){ mutationText2 = `Mutation error: ${e.message}`; }
      } else {
        mutationText2 = 'Unknown mutation.';
      }
    }

    const embed = new EmbedBuilder().setColor('#F49A32');
    if(!pet2){
      embed.setAuthor({ name: pet.name })
        .setDescription(pet.description || 'No description.')
        .addFields(
          { name:'Weight', value: weight.toString(), inline:true },
          { name:'Rarity', value: pet.rarity || 'Unknown', inline:true },
          { name:'Type', value: pet.type || 'Unknown', inline:true },
          { name:'Modifier', value: modifierType, inline:true }
        );
      if(abilityText) embed.addFields({ name:'Ability', value: trimField(abilityText) });
      if(mutationText) embed.addFields({ name:'Mutation', value: trimField(mutationText) });
      if(typeof pet.perKgImpact === 'function'){
        try { embed.addFields({ name:'Per Kg Impact', value: trimField(pet.perKgImpact()) }); } catch {}
      }
    } else {
      embed.setAuthor({ name: 'Pet Comparison' })
        .setDescription('Side-by-side comparison.');
      embed.addFields(
        { name: `${pet.name} • Weight`, value: weight.toString(), inline: true },
        { name: `${pet2.name} • Weight`, value: weight2.toString(), inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: `${pet.name} • Rarity`, value: pet.rarity || 'Unknown', inline: true },
        { name: `${pet2.name} • Rarity`, value: pet2.rarity || 'Unknown', inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: `${pet.name} • Type`, value: pet.type || 'Unknown', inline: true },
        { name: `${pet2.name} • Type`, value: pet2.type || 'Unknown', inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: `${pet.name} • Modifier`, value: modifierType, inline: true },
        { name: `${pet2.name} • Modifier`, value: modifier2Type, inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      );
      if(abilityText) embed.addFields({ name: `${pet.name} Ability`, value: trimField(abilityText) });
      if(abilityText2) embed.addFields({ name: `${pet2.name} Ability`, value: trimField(abilityText2) });
      if(mutationText) embed.addFields({ name: `${pet.name} Mutation`, value: trimField(mutationText) });
      if(mutationText2) embed.addFields({ name: `${pet2.name} Mutation`, value: trimField(mutationText2) });
      if(typeof pet.perKgImpact === 'function'){
        try { embed.addFields({ name:`${pet.name} Per Kg`, value: trimField(pet.perKgImpact()) }); } catch {}
      }
      if(typeof pet2.perKgImpact === 'function'){
        try { embed.addFields({ name:`${pet2.name} Per Kg`, value: trimField(pet2.perKgImpact()) }); } catch {}
      }
    }

    return interaction.reply({ embeds:[embed] });
  }
};

function trimField(v){
  if(!v) return 'N/A';
  v = String(v);
  if(v.length > 1000) v = v.slice(0,997)+'...';
  return v;
}
