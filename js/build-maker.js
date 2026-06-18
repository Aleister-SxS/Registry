/* ============================================================
   TEAM REGISTRY — Build Maker (js/build-maker.js)
   Skills sourced from lootandwaifus.com
   ============================================================ */

const SKILL_BASE = "https://lootandwaifus.com/skills/swordxstaff/";
const CLASS_ICON_BASE = "https://lootandwaifus.com/skills/swordxstaff/classes/";

// ── Skill database ────────────────────────────────────────
// Each entry: { id, name, type, classes[] }
// type: "technique" | "charm"
// classes: which classes can use it (empty = all / universal)
const SKILLS = [
  // Techniques
  {id:"10000",name:"Water Shot",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10001",name:"Tempest Sphere",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10002",name:"Starlight Burst",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10003",name:"Water Assault",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10004",name:"Flickering Stars",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10005",name:"Iron Thorn",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10006",name:"Cyclone",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10008",name:"Edge Strike",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10009",name:"Heavy Impact",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10010",name:"Stunning Strike",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10011",name:"Lion Combo",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10012",name:"Wind Blade Slash",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10013",name:"Quadrant Slash",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10014",name:"Whirlwind Slash",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10015",name:"Leap Attack",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10016",name:"Flash Dash",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10017",name:"Lunarwater Threads",type:"technique",classes:["Paladin","Guardian","Templar"]},
  {id:"10018",name:"Gravity Pull",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10019",name:"Stonechief Summon",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10020",name:"Healing Touch",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10021",name:"Radiant Restoration",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10024",name:"Luminous Shield",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10025",name:"Treantling Summon",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10026",name:"Fire Slash",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10028",name:"Fireball",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10029",name:"Weakening Hex",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10030",name:"Lightning Chain",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10031",name:"Blazing Fire Ring",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10032",name:"Desperate Protection",type:"technique",classes:["Paladin","Guardian","Templar"]},
  {id:"10034",name:"Fiery Star Trail",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10035",name:"Ice Spike",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10036",name:"Wind's Delight",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10037",name:"Divine Wrath",type:"technique",classes:["Archmage","Destroyer","Magister"]},
  {id:"10038",name:"Frosty Nova",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10039",name:"Star Shattering Slash",type:"technique",classes:["Paladin","Guardian","Templar"]},
  {id:"10040",name:"Abyssal Hand",type:"technique",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10041",name:"Energy Burst",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10042",name:"Shattering Sigil",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10043",name:"Diving Gale",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10044",name:"Frostbite Blossom",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10046",name:"Guardian Ring",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10047",name:"Seismic Tide",type:"technique",classes:["Guardian","Templar"]},
  {id:"10048",name:"Ricocheting Shield",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10049",name:"Heart of Challenge",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10051",name:"Boiling Bloodlust",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10052",name:"Mountain Collapse",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10053",name:"Sunset Sword",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10054",name:"Phantom Assault",type:"technique",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10055",name:"Darkness Descends",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10056",name:"Flowing Doom",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10057",name:"Howling Hurricane",type:"technique",classes:["Archmage","Destroyer","Magister"]},
  {id:"10058",name:"Flame Wolf Summon",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10059",name:"Chaos Rune",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10060",name:"Void Blessing",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10061",name:"Flame Aura",type:"technique",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10062",name:"Aqua Vortex",type:"technique",classes:["Archmage","Destroyer","Magister"]},
  {id:"10063",name:"Asura's Grasp",type:"technique",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10064",name:"Mana Blast",type:"technique",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10065",name:"Eclipse Slash",type:"technique",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10066",name:"Valor Surge",type:"technique",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10067",name:"Last Stand",type:"technique",classes:["Templar"]},
  {id:"10068",name:"Hellfire Requiem",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10069",name:"Doom Blade",type:"technique",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10070",name:"Meteoric Flames",type:"technique",classes:["Archmage","Destroyer","Magister"]},
  {id:"10071",name:"Waterling Summon",type:"technique",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10072",name:"Flame Jet",type:"technique",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10073",name:"Forceful Charge",type:"technique",classes:["Paladin","Guardian","Templar"]},
  {id:"10074",name:"Hunter's Judgment",type:"technique",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10075",name:"Light of Dawn",type:"technique",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10076",name:"Shadow Impact",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10077",name:"Spirit Aegis",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10078",name:"Shadow of Termination",type:"technique",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10079",name:"Holy Purification",type:"technique",classes:["Paladin","Guardian","Templar"]},
  {id:"10080",name:"Frenzy Totem",type:"technique",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10081",name:"Dark Bullet",type:"technique",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10082",name:"Swirling Blade",type:"technique",classes:["Guardian","Templar"]},
  {id:"10083",name:"Light Sword Array",type:"technique",classes:["Guardian","Templar"]},
  {id:"10084",name:"Hamper Strike",type:"technique",classes:["Guardian","Templar"]},
  {id:"10085",name:"Phantom Blade",type:"technique",classes:["Guardian","Templar"]},
  {id:"10086",name:"Gale Dance",type:"technique",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10087",name:"Air Break",type:"technique",classes:["Ravager"]},
  {id:"10088",name:"Blade Storm",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10089",name:"Soul Piercer",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10090",name:"Night Curse",type:"technique",classes:["Ravager"]},
  {id:"10091",name:"Wind Blade Spiral",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10092",name:"Formation Breaker",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10093",name:"Thunder of Judgment",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10094",name:"Blast Spirit",type:"technique",classes:["Magister"]},
  {id:"10095",name:"Rock Rex Summon",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10096",name:"Rejuvenating Rain",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10097",name:"Decoy Clone",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10098",name:"Fire Blast",type:"technique",classes:["Archmage","Destroyer","Magister"]},
  {id:"10099",name:"Raging Maelstrom",type:"technique",classes:["Guardian","Templar"]},
  {id:"10100",name:"Flickering Blade",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10101",name:"Flash Fire",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10102",name:"Protective Rune",type:"technique",classes:["Destroyer","Magister"]},
  {id:"10103",name:"Dark Starburst",type:"technique",classes:["Dominator","Prophet"]},
  {id:"10104",name:"Dreadful Shadow",type:"technique",classes:["Conqueror","Ravager"]},
  {id:"10105",name:"First Light",type:"technique",classes:["Templar"]},
  {id:"10106",name:"Dawnburst",type:"technique",classes:["Templar"]},
  {id:"10107",name:"Sacred Shine",type:"technique",classes:["Templar"]},
  {id:"10108",name:"Sanctified Soul",type:"technique",classes:["Templar"]},
  {id:"10109",name:"Iron Slashes",type:"technique",classes:["Templar"]},
  {id:"10110",name:"Shattering Dance",type:"technique",classes:["Ravager"]},
  {id:"10111",name:"Solaris Storm",type:"technique",classes:["Ravager"]},
  {id:"10112",name:"Glacial Song",type:"technique",classes:["Ravager"]},
  {id:"10113",name:"Shadow End",type:"technique",classes:["Ravager"]},
  {id:"10114",name:"Frost Thorn",type:"technique",classes:["Magister"]},
  {id:"10115",name:"Crimson Whirl",type:"technique",classes:["Magister"]},
  {id:"10116",name:"Storm Rhapsody",type:"technique",classes:["Magister"]},
  {id:"10117",name:"Light Burst",type:"technique",classes:["Magister"]},
  {id:"10118",name:"Twin Gale",type:"technique",classes:["Magister"]},
  {id:"10119",name:"Thalasson Summon",type:"technique",classes:["Prophet"]},
  {id:"10120",name:"Soul Reap",type:"technique",classes:["Prophet"]},
  {id:"10121",name:"Hexed Blast",type:"technique",classes:["Prophet"]},
  {id:"10122",name:"Desperate Shadow",type:"technique",classes:["Prophet"]},
  {id:"10123",name:"Radiant Rhythm",type:"technique",classes:["Prophet"]},
  {id:"10124",name:"Void Chant",type:"technique",classes:["Prophet"]},
  // Charms
  {id:"10500",name:"Insightful Eye",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10501",name:"Crystal Armor",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10502",name:"Lightning Mystery",type:"charm",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10503",name:"Fiery Burst",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10505",name:"Life Blessing",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10507",name:"Block Awareness",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10509",name:"Eye for an Eye",type:"charm",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10510",name:"Feline Dance",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10512",name:"Unstable Aura",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10513",name:"Gale Shield",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10514",name:"Healing Mastery",type:"charm",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10516",name:"Pursuit of Victory",type:"charm",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10518",name:"Indomitable Will",type:"charm",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10519",name:"Blade Siphon",type:"charm",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10520",name:"Heart of Flame",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10521",name:"Dew's Blessing",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10522",name:"Wind's Whisper",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10524",name:"Warrior's Essence",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10525",name:"Incarnation of Light",type:"charm",classes:["Archmage","Destroyer","Magister"]},
  {id:"10527",name:"Summoner's Frenzy",type:"charm",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10528",name:"Night's Blessing",type:"charm",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10530",name:"Soul Impact",type:"charm",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10531",name:"Resurrection",type:"charm",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10535",name:"Strength Rules",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10537",name:"Counter Blade",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10539",name:"Pure Protection",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10540",name:"Defensive Assault",type:"charm",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10541",name:"Rebound",type:"charm",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10542",name:"Stone Skin",type:"charm",classes:["Paladin","Guardian","Templar"]},
  {id:"10543",name:"Blazing Momentum",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10544",name:"Blade of Lament",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10545",name:"Soul Splash",type:"charm",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10546",name:"Relentless Frenzy",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10547",name:"Desperate Valor",type:"charm",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10550",name:"Tough Soul",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10554",name:"Mana Surge",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10555",name:"Elemental Mystery",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10556",name:"Void Bubble",type:"charm",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10557",name:"Shattering Ice",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10559",name:"Insight",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10560",name:"Water to Ice",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10561",name:"Flaming Path",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10562",name:"Blade Tempest",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10563",name:"Ripple Impact",type:"charm",classes:["Knight","Paladin","Guardian","Templar"]},
  {id:"10564",name:"Blazing Clash",type:"charm",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10565",name:"Shadow Erosion",type:"charm",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10566",name:"Repelling Wind",type:"charm",classes:["Archmage","Destroyer","Magister"]},
  {id:"10567",name:"Reflective Armor",type:"charm",classes:["Paladin","Guardian","Templar"]},
  {id:"10568",name:"Piercing Assault",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10569",name:"Wind's Shadow",type:"charm",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10570",name:"Overhealing",type:"charm",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10571",name:"Iron Fortress",type:"charm",classes:["Warrior","Duelist","Berserker","Conqueror","Ravager","Knight","Paladin","Guardian","Templar"]},
  {id:"10572",name:"Source of Vitality",type:"charm",classes:["Paladin","Guardian","Templar"]},
  {id:"10573",name:"Overload Protection",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10574",name:"Blade of Judgment",type:"charm",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10575",name:"Soul Protection",type:"charm",classes:["Guardian","Templar"]},
  {id:"10576",name:"Raging Wildfire",type:"charm",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10577",name:"Radiant Sear",type:"charm",classes:["Archmage","Destroyer","Magister"]},
  {id:"10578",name:"Curse Resonance",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10579",name:"Aberrancy",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10580",name:"Oath of Vigil",type:"charm",classes:["Guardian","Templar"]},
  {id:"10581",name:"Potential Rebirth",type:"charm",classes:["Paladin","Guardian","Templar"]},
  {id:"10582",name:"Frame of Battles",type:"charm",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10583",name:"Elemental Body",type:"charm",classes:["Mage","Sorcerer","Archmage","Destroyer","Magister","Sage","Arcanist","Dominator","Prophet"]},
  {id:"10584",name:"Summoning Pact",type:"charm",classes:["Prophet"]},
  {id:"10585",name:"Linked Misfortune",type:"charm",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10586",name:"Shadow Vengeance",type:"charm",classes:["Arcanist","Dominator","Prophet"]},
  {id:"10587",name:"Block Mastery",type:"charm",classes:["Paladin","Guardian","Templar"]},
  {id:"10588",name:"Crit Mastery",type:"charm",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10589",name:"Potential Vitality",type:"charm",classes:["Duelist","Berserker","Conqueror","Ravager"]},
  {id:"10590",name:"Soulfire Protection",type:"charm",classes:["Berserker","Conqueror","Ravager"]},
  {id:"10591",name:"Soul Pact Resonance",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10592",name:"Iron Will",type:"charm",classes:["Guardian","Templar"]},
  {id:"10593",name:"Holy Aegis",type:"charm",classes:["Guardian","Templar"]},
  {id:"10594",name:"Soul Breaker",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10595",name:"Sharp Feathers",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10596",name:"Frostsoul Ward",type:"charm",classes:["Magister"]},
  {id:"10597",name:"Fiery Rejuvenation",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10598",name:"Cyclone Lament",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10599",name:"Explosive Spirit",type:"charm",classes:["Destroyer","Magister"]},
  {id:"10600",name:"Soulbond Restoration",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10601",name:"Phantom Light",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10602",name:"Elemental Harmony",type:"charm",classes:["Sorcerer","Archmage","Destroyer","Magister"]},
  {id:"10603",name:"Soul Spark",type:"charm",classes:["Sage","Arcanist","Dominator","Prophet"]},
  {id:"10604",name:"Rapid Cast",type:"charm",classes:["Archmage","Destroyer","Magister"]},
  {id:"10605",name:"Frost Guard",type:"charm",classes:["Archmage","Destroyer","Magister"]},
  {id:"10606",name:"Frigid Glint",type:"charm",classes:["Guardian","Templar"]},
  {id:"10607",name:"Frigid Aura",type:"charm",classes:["Guardian","Templar"]},
  {id:"10608",name:"Spirit in Fire",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10609",name:"Tactical Adaptation",type:"charm",classes:["Conqueror","Ravager"]},
  {id:"10610",name:"Mantra of Blessings",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10611",name:"Falling Dark Star",type:"charm",classes:["Dominator","Prophet"]},
  {id:"10612",name:"Holy Bulwark",type:"charm",classes:["Templar"]},
  {id:"10613",name:"Healing Shift",type:"charm",classes:["Templar"]},
  {id:"10614",name:"Punishment Sigil",type:"charm",classes:["Templar"]},
  {id:"10615",name:"Holy Restoration",type:"charm",classes:["Templar"]},
  {id:"10616",name:"Holy Recuperation",type:"charm",classes:["Templar"]},
  {id:"10617",name:"Sacred Rhythm",type:"charm",classes:["Templar"]},
  {id:"10618",name:"Windless Lord",type:"charm",classes:["Ravager"]},
  {id:"10619",name:"Tempest Edge",type:"charm",classes:["Ravager"]},
  {id:"10620",name:"Dominant Gaze",type:"charm",classes:["Ravager"]},
  {id:"10621",name:"Shadowstep",type:"charm",classes:["Ravager"]},
  {id:"10622",name:"Flaming Heel",type:"charm",classes:["Ravager"]},
  {id:"10623",name:"Scarlet Zeal",type:"charm",classes:["Ravager"]},
  {id:"10624",name:"Thunder Judgment",type:"charm",classes:["Magister"]},
  {id:"10625",name:"Thunderbolt Mark",type:"charm",classes:["Magister"]},
  {id:"10626",name:"Radiant Warp",type:"charm",classes:["Magister"]},
  {id:"10627",name:"Ember Flare",type:"charm",classes:["Magister"]},
  {id:"10628",name:"Vital Rhythm",type:"charm",classes:["Magister"]},
  {id:"10629",name:"Soulweave",type:"charm",classes:["Prophet"]},
  {id:"10630",name:"Shadowy Current",type:"charm",classes:["Prophet"]},
  {id:"10631",name:"Ring of Omen",type:"charm",classes:["Prophet"]},
  {id:"10632",name:"Rejuvenating Elixir",type:"charm",classes:["Prophet"]},
];

function skillIconUrl(id) {
  return `${SKILL_BASE}skill_${id}.webp`;
}

// ── Skill image fallback ──────────────────────────────────
// Called via onerror when a skill webp doesn't exist on the server.
// Replaces the broken <img> with a styled abbreviation tile so the
// slot never looks empty — always shows e.g. "RS" for "Ricocheting Shield".
function skillImgFallback(img) {
  img.onerror = null; // prevent re-triggering
  const sz = img.style.width || img.getAttribute("width") || "32px";
  const name = img.alt || img.title || "?";
  const abbr = name.split(" ").map(function(w){ return w[0]; }).join("").slice(0, 2).toUpperCase();
  const radius = img.style.borderRadius || "6px";
  const fb = document.createElement("div");
  fb.style.cssText = [
    "width:" + sz, "height:" + sz, "border-radius:" + radius,
    "background:var(--surface3)", "border:1px solid var(--border2)",
    "display:flex", "align-items:center", "justify-content:center",
    "font-size:0.55rem", "font-weight:700", "color:var(--text2)",
    "flex-shrink:0", "user-select:none",
  ].join(";");
  fb.textContent = abbr;
  fb.title = name;
  img.replaceWith(fb);
}

// ── Build Maker class ─────────────────────────────────────
class BuildMaker {
  constructor(opts = {}) {
    this.containerId   = opts.containerId   || "build-maker";
    this.slotsId       = opts.slotsId       || "build-slots";
    this.maxTechniques = opts.maxTechniques  || 6;
    this.maxCharms     = opts.maxCharms      || 6;
    this.readOnly      = opts.readOnly       || false;
    this.onSave        = opts.onSave         || null;
    this.currentClass  = opts.currentClass   || "";
    this.currentTab    = "technique";
    this.searchQuery   = "";
    this.techniques    = []; // selected skill ids
    this.charms        = []; // selected skill ids
  }

  skillsForTab() {
    return SKILLS.filter(s => {
      if (s.type !== this.currentTab) return false;
      if (this.currentClass && s.classes.length > 0 && !s.classes.includes(this.currentClass)) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  isSelected(id) {
    return this.techniques.includes(id) || this.charms.includes(id);
  }

  toggle(skillId) {
    if (this.readOnly) return;
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    const arr = skill.type === "technique" ? this.techniques : this.charms;
    const max = skill.type === "technique" ? this.maxTechniques : this.maxCharms;
    const idx = arr.indexOf(skillId);
    if (idx >= 0) { arr.splice(idx,1); }
    else if (arr.length < max) { arr.push(skillId); }
    else { toast(`Max ${max} ${skill.type}s allowed`, "amber"); return; }
    this.render();
  }

  load(techniques = [], charms = []) {
    this.techniques = [...techniques];
    this.charms     = [...charms];
    this.render();
  }

  getBuild() {
    return { techniques: [...this.techniques], charms: [...this.charms] };
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    const skills = this.skillsForTab();
    const selectedArr = this.currentTab === "technique" ? this.techniques : this.charms;
    const maxSlots    = this.currentTab === "technique" ? this.maxTechniques : this.maxCharms;

    container.innerHTML = `
      <div class="flex-between mb-md" style="flex-wrap:wrap;gap:0.75rem;">
        <div class="flex gap-xs">
          <button class="filter-btn ${this.currentTab==='technique'?'active':''}"
            onclick="window._bm_${this.containerId}.setTab('technique')">Techniques</button>
          <button class="filter-btn ${this.currentTab==='charm'?'active':''}"
            onclick="window._bm_${this.containerId}.setTab('charm')">Charms</button>
        </div>
        <div class="flex gap-xs" style="align-items:center;">
          ${this.currentClass ? `<span class="badge badge-captain">${esc(this.currentClass)}</span>` : ""}
          <input class="search-input" style="width:160px;" placeholder="Search skills…"
            value="${esc(this.searchQuery)}"
            oninput="window._bm_${this.containerId}.setSearch(this.value)" />
        </div>
      </div>

      <!-- Selected slots -->
      <div style="margin-bottom:1rem;">
        <div class="section-title mb-sm">
          Selected ${this.currentTab === "technique" ? "Techniques" : "Charms"}
          <span style="color:var(--text3);margin-left:4px;">(${selectedArr.length}/${maxSlots})</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;margin-bottom:1rem;">
          ${Array.from({length:maxSlots},(_,i) => {
            const id = selectedArr[i];
            const skill = id ? SKILLS.find(s=>s.id===id) : null;
            if (skill) {
              return `<div class="build-slot filled" title="${esc(skill.name)}">
                ${!this.readOnly ? `<button class="build-slot-remove" onclick="window._bm_${this.containerId}.toggle('${skill.id}')" title="Remove">✕</button>` : ""}
                <img class="skill-icon" src="${skillIconUrl(skill.id)}" alt="${esc(skill.name)}"
                  onerror="skillImgFallback(this)" />
                <div class="skill-name">${esc(skill.name)}</div>
              </div>`;
            }
            return `<div class="build-slot">
              <div style="font-size:1.5rem;opacity:0.2;">+</div>
              <div class="skill-name" style="color:var(--text3);">Empty</div>
            </div>`;
          }).join("")}
        </div>
      </div>

      <!-- Skill browser -->
      ${!this.readOnly ? `
      <div class="section-title mb-sm">
        ${skills.length} skill${skills.length!==1?"s":""} available
        ${this.currentClass ? `for ${esc(this.currentClass)}` : ""}
      </div>
      <div class="build-grid">
        ${skills.map(s => `
          <div class="skill-card ${this.isSelected(s.id) ? "selected" : ""}"
            onclick="window._bm_${this.containerId}.toggle('${s.id}')" title="${esc(s.name)}">
            <img class="skill-icon" src="${skillIconUrl(s.id)}" alt="${esc(s.name)}"
              loading="lazy" onerror="skillImgFallback(this)" />
            <div class="skill-name">${esc(s.name)}</div>
          </div>
        `).join("")}
        ${skills.length === 0 ? `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:2rem;font-size:0.82rem;">No skills found</div>` : ""}
      </div>
      ` : ""}

      ${!this.readOnly && this.onSave ? `
        <div style="margin-top:1.25rem;display:flex;gap:0.75rem;justify-content:flex-end;">
          <button class="btn btn-ghost btn-sm" onclick="window._bm_${this.containerId}.clear()">Clear</button>
          <button class="btn btn-primary btn-sm" onclick="window._bm_${this.containerId}.save()">Save Build</button>
        </div>
      ` : ""}
    `;
  }

  setTab(tab)    { this.currentTab = tab; this.render(); }
  setSearch(q)   { this.searchQuery = q; this.render(); }
  clear()        { this.techniques = []; this.charms = []; this.render(); }

  save() {
    if (this.onSave) this.onSave(this.getBuild());
  }

  mount() {
    window[`_bm_${this.containerId}`] = this;
    this.render();
    return this;
  }
}

// ── Formation grid ────────────────────────────────────────
class FormationGrid {
  constructor(opts = {}) {
    this.containerId = opts.containerId || "formation-grid";
    this.members     = opts.members     || []; // [{id,name,class}]
    this.readOnly    = opts.readOnly    || false;
    this.positions   = opts.positions   || {}; // {cellIndex: memberId}
    this.onSave      = opts.onSave      || null;
    this.selectedMember = null;
  }

  cellLabel(idx) {
    const rows = ["Back","Mid","Front"];
    const cols = ["Left","Center","Right"];
    return `${rows[Math.floor(idx/3)]} ${cols[idx%3]}`;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    container.innerHTML = `
      ${!this.readOnly && this.members.length > 0 ? `
        <div style="margin-bottom:1rem;">
          <div class="section-title mb-sm">Select a member, then click a cell to place them</div>
          <div class="flex gap-xs flex-wrap">
            ${this.members.map(m => {
              const placed = Object.values(this.positions).includes(m.id);
              return `<button class="btn btn-sm ${this.selectedMember===m.id?'btn-primary':placed?'btn-ghost':''}"
                onclick="window._fg_${this.containerId}.selectMember('${m.id}')">
                ${esc(CLASS_ICONS[m.class]||"👤")} ${esc(m.name)}${placed?" ✓":""}
              </button>`;
            }).join("")}
          </div>
        </div>
      ` : ""}

      <div style="margin-bottom:0.5rem;display:flex;gap:1rem;align-items:center;">
        <div class="formation-grid" id="${this.containerId}-cells">
          ${Array.from({length:9},(_,i) => {
            const memberId = this.positions[i];
            const member   = memberId ? this.members.find(m=>m.id===memberId) : null;
            return `<div class="formation-cell ${member?'occupied':''}"
              onclick="window._fg_${this.containerId}.clickCell(${i})"
              title="${this.cellLabel(i)}">
              ${member ? `
                <div class="class-icon">${esc(CLASS_ICONS[member.class]||"👤")}</div>
                <div class="cell-name">${esc(member.name)}</div>
              ` : `<div class="cell-name" style="color:var(--text3);font-size:0.55rem;">${this.cellLabel(i)}</div>`}
            </div>`;
          }).join("")}
        </div>
        <div style="font-size:0.72rem;color:var(--text3);line-height:1.8;">
          <div>⬆️ Back row</div>
          <div>➡️ Front row</div>
        </div>
      </div>

      ${!this.readOnly && this.onSave ? `
        <div class="flex gap-xs mt-md">
          <button class="btn btn-ghost btn-sm" onclick="window._fg_${this.containerId}.clearAll()">Clear Formation</button>
          <button class="btn btn-primary btn-sm" onclick="window._fg_${this.containerId}.save()">Save Formation</button>
        </div>
      ` : ""}
    `;
  }

  selectMember(id) {
    this.selectedMember = this.selectedMember === id ? null : id;
    this.render();
  }

  clickCell(idx) {
    if (this.readOnly) return;
    if (this.positions[idx]) {
      // clear cell
      delete this.positions[idx];
    } else if (this.selectedMember) {
      // remove member from any existing cell first
      Object.keys(this.positions).forEach(k => {
        if (this.positions[k] === this.selectedMember) delete this.positions[k];
      });
      this.positions[idx] = this.selectedMember;
      this.selectedMember = null;
    }
    this.render();
  }

  clearAll()    { this.positions = {}; this.render(); }
  save()        { if (this.onSave) this.onSave({...this.positions}); }

  load(positions = {}) {
    this.positions = {...positions};
    this.render();
  }

  mount() {
    window[`_fg_${this.containerId}`] = this;
    this.render();
    return this;
  }
}
