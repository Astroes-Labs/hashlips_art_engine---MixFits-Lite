/**
 * patch-metadata.js
 *
 * Updates a single NFT entry in build/json/_metadata.json using a patch file.
 * Performs duplicate DNA + trait-combo detection before applying.
 * If a conflict is found, suggests an unused alternative from the trait pool.
 *
 * Usage:
 *   node patch-metadata.js patch.json
 *   node patch-metadata.js patch.json --dry-run
 *
 * patch.json format:
 * {
 *   "edition": 17,
 *   "attributes": [
 *     { "trait_type": "Background", "value": "Void" },
 *     { "trait_type": "Body",       "value": "Zombie" },
 *     { "trait_type": "Hair",       "value": "Fade" },
 *     { "trait_type": "Eyes",       "value": "Sunglasses" },
 *     { "trait_type": "Shirt",      "value": "Red Hoodie" },
 *     { "trait_type": "Pants",      "value": "Jeans" },
 *     { "trait_type": "Footwear",   "value": "Black Boots" }
 *   ]
 * }
 */

const fs   = require("fs");
const path = require("path");
const sha1 = require(path.join(process.cwd(), "node_modules/sha1"));

const DRY_RUN      = process.argv.includes("--dry-run");
const patchFile    = process.argv.find(a => a.endsWith(".json") && !a.includes("patch-metadata"));
const metaPath     = path.join(process.cwd(), "build/json/_metadata.json");
const backupPath   = metaPath + ".bak";

// =============================================================================
// FULL TRAIT POOL  (used to suggest alternatives when a conflict is detected)
// =============================================================================
const TRAIT_POOL = {
  Background: ["Dark", "Light", "Sky", "Void", "Wine"],

  Body: [
    "Black Werewolf", "Blue Slime", "Bluish Ghost", "Brain Box",
    "Brown Werewolf", "Brown Werewolf II", "Experiment Zero", "Ginger Werewolf",
    "Gold Skeleton", "Green Slime", "Greenish Ghost", "HellHound",
    "Homo Sapien", "King Slime", "Mighty Balor", "Monitor Bot X",
    "Monitor Bot Y", "Mummy", "Mummy II", "Mutant A", "Mutant B",
    "Mutant C", "Mutant D", "Mutant P", "Pink Slime", "Purple Slime",
    "Reddish Ghost", "Silver Back Werewolf", "Silver Skeleton", "Skeleton",
    "Stone Balor", "Stoner", "Unknown Mutant", "Void Executioner",
    "Void Watcher", "Zombie",
  ],

  Eyes: [
    "3D Glasses", "3D Shades", "Blue Wraparound Sunglasses", "Classic Visor",
    "Eye Patch", "Laser", "Nerd Glasses", "Pink Wraparound Sunglasses",
    "Regular Visor", "Straight Face", "Sunglasses",
  ],

  Footwear: [
    "Ash colorway Sneakers", "Black Boots", "Black Combat Boots", "Black Shoes",
    "Boxers Boot", "Brown Sandals", "Brown Shoes", "Combat Boots",
    "Flip Flops", "Kill Billy Boots", "OffWhyt Sneakers", "Pirate Boots",
    "Red colorway Sneakers", "Ski Boots",
  ],

  Hair: [
    "Blonde Slicked Back", "Blonde Taper Fade", "Blue Tinted Bun",
    "Bowl Cut", "Brains", "Brunette Bun", "Clean Shave", "Crew Cut",
    "Dirty Blonde Taper Fade", "Fade", "Ginger Bowl Cut", "Low Cut",
    "Low Cut II", "Messy", "Slick Afro",
  ],

  Hats: [
    "Baby Propeller Hat", "Banana Hat", "Black Baseball Hat",
    "Blue Baseball Hat", "Brown Trucker Hat", "Chef Hat", "Grand Mage Hat",
    "King Crown", "Knight Helmet", "Lucha Libre Mask", "Mummy Hat",
    "Not TMA Mask", "Orange Trucker Hat", "Pirate Hat", "Pizza Hat",
    "Police Hat", "Propeller Hat", "Space Gear Hood", "Super Mutario Hat",
    "Turban", "White Baseball Hat", "White Trucker Hat", "Wizard Hat",
  ],

  Pants: [
    "BBall Short", "Black Pants", "Black Shorts", "Black Suit Pants",
    "Blue Suit Pants", "Boxer Trunks", "Camo Pants", "Faded Jeans",
    "Grey Pants", "Jeans", "Joker Suit Pants", "Khaki Shorts",
    "Shredded Jeans", "Task Force Pants", "Tux Suit Pants",
  ],

  Shirt: [
    "BBall Uni", "Beach Shirt", "Biker Jacket", "Black Suits", "Bloe Hoodie",
    "Blue Pirate Capt", "Blue Suit", "Blue Varsity Jacket", "Chef Outfit",
    "Croc Suit", "Dark Green Jacket", "France Accent Jersey",
    "Full Protective Suit", "Grand Mage Robe", "Hawaii Beach Shirt",
    "High Priest", "Invisible Hoodie", "Joker Suit", "Kill Billy Jacket",
    "Knight", "Lab Coat", "Monk Robe", "Ninja Outfit", "Panda Suit",
    "Protective Suit", "Red Hoodie", "Red Pirate Capt", "Red Sweat Shirt",
    "Red Varsity Jacket", "Safety Vest", "Shark Suit", "Snow Jacket",
    "Space Hunter Gear", "Task Force Vest", "Trench Coat", "Tux",
    "Wizard Robe",
  ],

  Special: [
    "Bomb", "Boxing Gloves", "Brain", "Cheese", "Cigratte",
    "Dog", "Gun", "Halo", "Katana", "Ring", "Slime Crown",
  ],
};

// =============================================================================
// HELPERS
// =============================================================================

/** Build a deterministic DNA string from an attributes array (same style as Hashlips) */
const attrsToKey = (attrs) =>
  attrs
    .map(a => `${a.trait_type}:${a.value}`)
    .sort()
    .join("|");

/** Find all trait values currently used across the whole collection for a layer */
const usedTraitsFor = (metadata, traitType, excludeEdition) =>
  new Set(
    metadata
      .filter(m => m.edition !== excludeEdition)
      .flatMap(m => m.attributes)
      .filter(a => a.trait_type === traitType)
      .map(a => a.value)
  );

/**
 * Given a trait type and a value already in use, suggest the next
 * least-used alternative from the pool.
 */
const suggestAlternative = (metadata, traitType, conflictValue, excludeEdition) => {
  const pool = TRAIT_POOL[traitType];
  if (!pool) return null;

  // Count how many times each trait appears in the collection
  const counts = {};
  pool.forEach(t => (counts[t] = 0));
  metadata
    .filter(m => m.edition !== excludeEdition)
    .flatMap(m => m.attributes)
    .filter(a => a.trait_type === traitType)
    .forEach(a => { if (counts[a.value] !== undefined) counts[a.value]++; });

  // Return the pool item with the lowest count that isn't the conflict value
  const sorted = pool
    .filter(t => t !== conflictValue)
    .sort((a, b) => counts[a] - counts[b]);

  return sorted[0] ?? null;
};

// =============================================================================
// DUPLICATE CHECK
// =============================================================================

/**
 * Returns an array of conflict objects, each describing what clashes.
 * An empty array means no conflicts.
 */
const findConflicts = (metadata, patch) => {
  const conflicts = [];
  const patchKey  = attrsToKey(patch.attributes);

  metadata.forEach(entry => {
    if (entry.edition === patch.edition) return; // skip self

    const entryKey = attrsToKey(entry.attributes);

    // Full combo match → DNA collision
    if (entryKey === patchKey) {
      conflicts.push({
        type:    "FULL_DUPLICATE",
        edition: entry.edition,
        message: `Edition #${entry.edition} has the exact same trait combination.`,
      });
      return;
    }

    // Per-trait uniqueness check — only flag Body since that drives most rules.
    // You can extend this list to any traits you want to enforce as globally unique.
    const GLOBALLY_UNIQUE_TRAITS = []; // e.g. ["Body"] — empty by default
    GLOBALLY_UNIQUE_TRAITS.forEach(traitType => {
      const patchVal = patch.attributes.find(a => a.trait_type === traitType)?.value;
      const entryVal = entry.attributes.find(a => a.trait_type === traitType)?.value;
      if (patchVal && entryVal && patchVal === entryVal) {
        conflicts.push({
          type:      "UNIQUE_TRAIT_CLASH",
          traitType,
          value:     patchVal,
          edition:   entry.edition,
          message:   `Trait "${traitType}: ${patchVal}" already used in edition #${entry.edition}.`,
        });
      }
    });
  });

  return conflicts;
};

// =============================================================================
// MAIN
// =============================================================================

if (!patchFile) {
  console.error("Usage: node patch-metadata.js <patch.json> [--dry-run]");
  process.exit(1);
}

if (!fs.existsSync(patchFile)) {
  console.error(`Patch file not found: ${patchFile}`);
  process.exit(1);
}

if (!fs.existsSync(metaPath)) {
  console.error(`Metadata not found: ${metaPath}`);
  process.exit(1);
}

const patch    = JSON.parse(fs.readFileSync(patchFile, "utf8"));
const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));

if (!patch.edition || !Array.isArray(patch.attributes)) {
  console.error('Patch must have "edition" (number) and "attributes" (array).');
  process.exit(1);
}

const target = metadata.find(m => m.edition === patch.edition);
if (!target) {
  console.error(`Edition #${patch.edition} not found in metadata.`);
  process.exit(1);
}

console.log("=".repeat(60));
console.log(`  Metadata Patcher — Edition #${patch.edition}`);
console.log(DRY_RUN ? "  MODE: DRY RUN" : "  MODE: LIVE");
console.log("=".repeat(60));

// Show what's changing
console.log("\n📋 CURRENT attributes:");
target.attributes.forEach(a => console.log(`   ${a.trait_type}: ${a.value}`));

console.log("\n📝 PATCH attributes:");
patch.attributes.forEach(a => console.log(`   ${a.trait_type}: ${a.value}`));

// Run conflict check
const conflicts = findConflicts(metadata, patch);

if (conflicts.length > 0) {
  console.log("\n❌ CONFLICTS DETECTED:\n");

  conflicts.forEach(c => {
    console.log(`  • ${c.message}`);

    if (c.type === "FULL_DUPLICATE") {
      // Suggest an alternative for every trait that differs from the conflicting edition
      const conflictEntry = metadata.find(m => m.edition === c.edition);
      console.log("    Suggested changes to make it unique:");

      patch.attributes.forEach(pAttr => {
        const cAttr = conflictEntry.attributes.find(a => a.trait_type === pAttr.trait_type);
        if (!cAttr || cAttr.value !== pAttr.value) return; // already different

        const suggestion = suggestAlternative(metadata, pAttr.trait_type, pAttr.value, patch.edition);
        if (suggestion) {
          console.log(`      → Change "${pAttr.trait_type}" from "${pAttr.value}" to "${suggestion}"`);
        }
      });
    }

    if (c.type === "UNIQUE_TRAIT_CLASH") {
      const suggestion = suggestAlternative(metadata, c.traitType, c.value, patch.edition);
      if (suggestion) {
        console.log(`    Suggestion: use "${suggestion}" for "${c.traitType}" instead.`);
      }
    }
  });

  console.log("\n⚠️  Patch NOT applied. Fix conflicts and re-run.\n");
  process.exit(1);
}

console.log("\n✅ No conflicts found.\n");

if (DRY_RUN) {
  console.log("DRY RUN — no files written.\n");
  process.exit(0);
}

// Backup before writing
fs.copyFileSync(metaPath, backupPath);
console.log(`📦 Backup saved → ${backupPath}`);

// Apply patch
target.attributes = patch.attributes;
target.dna        = sha1(attrsToKey(patch.attributes)); // recalculate DNA
target.date       = Date.now();

// Write updated metadata
fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

// Also update the individual file if it exists
const singlePath = path.join(process.cwd(), `src/json/${patch.edition}.json`);
if (fs.existsSync(singlePath)) {
  fs.writeFileSync(singlePath, JSON.stringify(target, null, 2));
  console.log(`✅ Updated build/json/${patch.edition}.json`);
}

console.log(`✅ Updated _metadata.json — edition #${patch.edition} patched.\n`);

// Show final state
console.log("📋 UPDATED attributes:");
target.attributes.forEach(a => console.log(`   ${a.trait_type}: ${a.value}`));
console.log();