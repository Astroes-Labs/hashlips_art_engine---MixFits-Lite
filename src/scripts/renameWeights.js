/**
 * renameWeights.js
 * 
 * Renames all trait files in your layers/ folder by appending #WEIGHT
 * to match Hashlips rarity system.
 * 
 * Run from your project root:
 *   node renameWeights.js
 * 
 * Use --dry-run to preview without making changes:
 *   node renameWeights.js --dry-run
 */

const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const layersDir = path.join(process.cwd(), "layers");

// =============================================================================
// WEIGHT TABLES
// Weights are relative integers. Hashlips picks proportionally.
// Higher = more common. Lower = rarer.
//
// Rarity tiers used:
//   Legendary : 2
//   Rare      : 5
//   Uncommon  : 10
//   Common    : 20
// =============================================================================

const weights = {

  // ---------------------------------------------------------------------------
  // BACKGROUND
  // All backgrounds are slightly differentiated by mood/desirability
  // ---------------------------------------------------------------------------
  Background: {
    "Dark":  20,   // common — dark is popular but basic
    "Light": 20,   // common
    "Sky":   20,   // common
    "Void":  15,   // uncommon — moody, collector favourite
    "Wine":  25,   // most common — warm, accessible
  },

  // ---------------------------------------------------------------------------
  // BODY
  // Exact counts from your distribution spec
  // ---------------------------------------------------------------------------
  Body: {
    // Humans
    "Homo Sapien":          3100,
    "Zombie":                600,
    // Slimes
    "Blue Slime":             95,
    "Green Slime":            95,
    "Pink Slime":             96,
    "Purple Slime":           96,
    "King Slime":             42,
    // Specials
    "Black Werewolf":         10,
    "Bluish Ghost":           10,
    "Brain Box":               6,
    "Brown Werewolf":         10,
    "Brown Werewolf II":      10,
    "Experiment Zero":        10,
    "Ginger Werewolf":        10,
    "Gold Skeleton":           6,
    "Greenish Ghost":         10,
    "HellHound":               6,
    "Mighty Balor":           16,
    "Monitor Bot X":           6,
    "Monitor Bot Y":           4,
    "Mummy":                  20,
    "Mummy II":               20,
    "Mutant A":               10,
    "Mutant B":               10,
    "Mutant C":               10,
    "Mutant D":               10,
    "Mutant P":               10,
    "Reddish Ghost":          10,
    "Silver Back Werewolf":   10,
    "Silver Skeleton":        10,
    "Skeleton":               40,
    "Stone Balor":             6,
    "Stoner":                 10,
    "Unknown Mutant":          2,
    "Void Executioner":        4,
    "Void Watcher":            4,
  },

  // ---------------------------------------------------------------------------
  // EYES (human only)
  // Laser is iconic/rare, Straight Face is a slime-forced trait
  // ---------------------------------------------------------------------------
  Eyes: {
    "Sunglasses":                 20,  // common   — classic
    "Nerd Glasses":               20,  // common   — classic
    "Eye Patch":                  15,  // uncommon — pirate flavour
    "Regular Visor":              15,  // uncommon
    "Classic Visor":              15,  // uncommon
    "Blue Wraparound Sunglasses": 15,  // uncommon
    "Pink Wraparound Sunglasses": 15,  // uncommon
    "3D Glasses":                 10,  // rare
    "3D Shades":                  10,  // rare
    "Laser":                       5,  // legendary — highly desirable
    "Straight Face":              20,  // common   — slime forced trait, needs weight
  },

  // ---------------------------------------------------------------------------
  // HAIR
  // Clean Shave is a skip-equivalent (bald), Brains is a unique crossover
  // ---------------------------------------------------------------------------
  Hair: {
    "Blonde Slicked Back":      20,  // common
    "Blonde Taper Fade":        20,  // common
    "Blue Tinted Bun":          10,  // rare     — coloured hair
    "Bowl Cut":                 20,  // common
    "Brains":                    2,  // legendary — easter egg / horror crossover
    "Brunette Bun":             20,  // common
    "Clean Shave":              20,  // common   — bald look
    "Crew Cut":                 20,  // common
    "Dirty Blonde Taper Fade":  20,  // common
    "Fade":                     20,  // common
    "Ginger Bowl Cut":          10,  // rare     — ginger = rare IRL
    "Low Cut":                  20,  // common
    "Low Cut II":               20,  // common
    "Messy":                    15,  // uncommon
    "Slick Afro":               10,  // rare     — distinctive
  },

  // ---------------------------------------------------------------------------
  // HATS
  // Crowns/helmets/wizard gear = legendary. Basic caps = common.
  // ---------------------------------------------------------------------------
  Hats: {
    "Baby Propeller Hat":     10,  // rare     — goofy, collectors love it
    "Banana Hat":             10,  // rare     — absurdist
    "Black Baseball Hat":     20,  // common
    "Blue Baseball Hat":      20,  // common
    "Brown Trucker Hat":      20,  // common
    "Chef Hat":               15,  // uncommon
    "Grand Mage Hat":          5,  // legendary — fantasy tier
    "King Crown":              2,  // legendary — royalty
    "Knight Helmet":           5,  // legendary — armour
    "Lucha Libre Mask":        5,  // legendary — crossover icon
    "Mummy Hat":               5,  // legendary — unique to collection
    "Not TMA Mask":            5,  // legendary — meta/collab nod
    "Orange Trucker Hat":     20,  // common
    "Pirate Hat":             10,  // rare
    "Pizza Hat":              10,  // rare     — meme potential
    "Police Hat":             15,  // uncommon
    "Propeller Hat":          10,  // rare
    "Space Gear Hood":         5,  // legendary — sci-fi
    "Super Mutario Hat":       5,  // legendary — gaming nod
    "Turban":                 15,  // uncommon — cultural
    "White Baseball Hat":     20,  // common
    "White Trucker Hat":      20,  // common
    "Wizard Hat":              5,  // legendary — magic tier
  },

  // ---------------------------------------------------------------------------
  // PANTS
  // Suit pants / tux / joker = rare+. Jeans / shorts = common.
  // ---------------------------------------------------------------------------
  Pants: {
    "BBall Short":        20,  // common
    "Black Pants":        20,  // common
    "Black Shorts":       20,  // common
    "Black Suit Pants":   10,  // rare     — formal
    "Blue Suit Pants":    10,  // rare     — formal
    "Boxer Trunks":       15,  // uncommon — humorous
    "Camo Pants":         15,  // uncommon — tactical
    "Faded Jeans":        20,  // common
    "Grey Pants":         20,  // common
    "Jeans":              20,  // common
    "Joker Suit Pants":    5,  // legendary — villain drip
    "Khaki Shorts":       20,  // common
    "Shredded Jeans":     15,  // uncommon — punk
    "Task Force Pants":   10,  // rare     — military
    "Tux Suit Pants":      5,  // legendary — black tie
  },

  // ---------------------------------------------------------------------------
  // SHIRT
  // Full-body suits (Croc/Panda/Shark/Ninja) = legendary.
  // Plain hoodies/basic shirts = common.
  // Robes/knight/space gear = rare/legendary.
  // ---------------------------------------------------------------------------
  Shirt: {
    // Common (weight 20)
    "BBall Uni":              20,
    "Beach Shirt":            20,
    "Bloe Hoodie":            20,
    "Hawaii Beach Shirt":     20,
    "Invisible Hoodie":       20,
    "Red Hoodie":             20,
    "Red Sweat Shirt":        20,
    "Safety Vest":            20,
    "Snow Jacket":            20,

    // Uncommon (weight 10)
    "Biker Jacket":           10,
    "Blue Varsity Jacket":    10,
    "Dark Green Jacket":      10,
    "France Accent Jersey":   10,
    "Lab Coat":               10,
    "Protective Suit":        10,
    "Red Varsity Jacket":     10,
    "Trench Coat":            10,

    // Rare (weight 5)
    "Black Suits":             5,
    "Blue Pirate Capt":        5,
    "Blue Suit":               5,
    "Chef Outfit":             5,
    "Grand Mage Robe":         5,
    "High Priest":             5,
    "Joker Suit":              5,
    "Kill Billy Jacket":       5,
    "Knight":                  5,
    "Monk Robe":               5,
    "Red Pirate Capt":         5,
    "Task Force Vest":         5,
    "Tux":                     5,
    "Wizard Robe":             5,

    // Legendary (weight 2)
    "Croc Suit":               2,
    "Full Protective Suit":    2,
    "Ninja Outfit":            2,
    "Panda Suit":              2,
    "Shark Suit":              2,
    "Space Hunter Gear":       2,
  },

  // ---------------------------------------------------------------------------
  // FOOTWEAR
  // Designer/unique boots = rare+. Basic shoes/sandals = common.
  // ---------------------------------------------------------------------------
  Footwear: {
    // Common (weight 20)
    "Black Shoes":              20,
    "Brown Shoes":              20,
    "Flip Flops":               20,
    "Brown Sandals":            20,

    // Uncommon (weight 10)
    "Ash colorway Sneakers":    10,
    "OffWhyt Sneakers":         10,
    "Red colorway Sneakers":    10,
    "Black Boots":              10,
    "Combat Boots":             10,

    // Rare (weight 5)
    "Black Combat Boots":        5,
    "Boxers Boot":               5,
    "Pirate Boots":              5,
    "Ski Boots":                 5,

    // Legendary (weight 2)
    "Kill Billy Boots":          2,
  },

  // ---------------------------------------------------------------------------
  // SPECIAL
  // Slime Crown is forced for King Slime only.
  // For humans: Halo/Katana are iconic. Cigarette/Bomb = rare.
  // ---------------------------------------------------------------------------
  Special: {
    "Halo":           20,  // common   — angelic, universally liked
    "Boxing Gloves":  15,  // uncommon
    "Ring":           15,  // uncommon — bling
    "Dog":            10,  // rare     — companion
    "Cheese":         10,  // rare     — absurdist
    "Brain":          10,  // rare     — horror crossover
    "Katana":          5,  // legendary — weapon
    "Gun":             5,  // legendary — weapon
    "Cigratte":        5,  // legendary — edgy
    "Bomb":            5,  // legendary — danger
    "Slime Crown":     2,  // legendary — King Slime exclusive
  },
};

// =============================================================================
// RENAME ENGINE
// =============================================================================

const rarityDelimiter = "#";

let totalRenamed = 0;
let totalSkipped = 0;
let totalErrors = 0;

const getBaseName = (filename) => {
  // Strip extension
  const ext = path.extname(filename);
  const noExt = filename.slice(0, -ext.length);
  // Strip any existing weight suffix (everything after last #)
  const withoutWeight = noExt.includes(rarityDelimiter)
    ? noExt.split(rarityDelimiter).slice(0, -1).join(rarityDelimiter)
    : noExt;
  return { base: withoutWeight, ext };
};

const processLayer = (layerName) => {
  const layerPath = path.join(layersDir, layerName);

  if (!fs.existsSync(layerPath)) {
    console.warn(`  ⚠  Layer folder not found: ${layerPath}`);
    return;
  }

  const weightMap = weights[layerName];
  if (!weightMap) {
    console.warn(`  ⚠  No weight table for layer "${layerName}" — skipping`);
    return;
  }

  const files = fs.readdirSync(layerPath).filter(f => !/(^|\/)\.[^\/\.]/g.test(f));

  console.log(`\n📁 ${layerName} (${files.length} files)`);

  files.forEach(filename => {
    const { base, ext } = getBaseName(filename);
    const weight = weightMap[base];

    if (weight === undefined) {
      console.warn(`  ❓ No weight defined for "${base}" — skipping`);
      totalSkipped++;
      return;
    }

    const newFilename = `${base}${rarityDelimiter}${weight}${ext}`;

    if (filename === newFilename) {
      console.log(`  ✓  Already correct: ${filename}`);
      totalSkipped++;
      return;
    }

    const oldPath = path.join(layerPath, filename);
    const newPath = path.join(layerPath, newFilename);

    if (DRY_RUN) {
      console.log(`  →  ${filename}  ➜  ${newFilename}`);
    } else {
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`  ✅ ${filename}  ➜  ${newFilename}`);
        totalRenamed++;
      } catch (err) {
        console.error(`  ❌ Failed to rename "${filename}": ${err.message}`);
        totalErrors++;
      }
    }
  });
};

// =============================================================================
// MAIN
// =============================================================================

console.log("=".repeat(60));
console.log("  Hashlips Trait Weight Renamer");
console.log(DRY_RUN ? "  MODE: DRY RUN (no files changed)" : "  MODE: LIVE (files will be renamed)");
console.log("=".repeat(60));

const layerOrder = [
  "Background",
  "Body",
  "Hair",
  "Hats",
  "Eyes",
  "Pants",
  "Shirt",
  "Footwear",
  "Special",
];

layerOrder.forEach(processLayer);

console.log("\n" + "=".repeat(60));
if (DRY_RUN) {
  console.log(`  DRY RUN complete. Run without --dry-run to apply changes.`);
} else {
  console.log(`  ✅ Renamed : ${totalRenamed}`);
  console.log(`  ⏭  Skipped : ${totalSkipped}`);
  console.log(`  ❌ Errors  : ${totalErrors}`);
}
console.log("=".repeat(60));