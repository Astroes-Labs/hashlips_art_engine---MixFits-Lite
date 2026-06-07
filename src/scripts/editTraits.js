/**
 * editTraits.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bulk-edits build/json/_metadata.json by finding NFTs that match search
 * conditions and applying trait operations on them.
 *
 * Place this file in your project root and run:
 *   node src/scripts/editTraits.js [flags]
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * SEARCH FLAGS
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *  --search "TraitType=Value"
 *      Match NFTs where TraitType equals Value exactly.
 *      Multiple --search flags = AND logic (ALL must match).
 *
 *  --search "TraitType=exists"
 *      Match NFTs that have the TraitType at all (any value).
 *
 *  --search-or "TraitType=Val1,Val2,..."
 *      Match NFTs where TraitType equals ANY of the listed values (OR logic).
 *      Multiple --search-or flags are ANDed together like --search.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * GLOBAL OPERATIONS  (apply to ALL matched NFTs)
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *  --set "TraitType=Value"
 *      Set a trait to a fixed value. Adds the trait if it doesn't exist.
 *
 *  --random "TraitType=Val1,Val2,..."
 *      Set a trait to a random value from the list (each NFT independently).
 *      Adds the trait if it doesn't exist.
 *
 *  --rename "OldType>NewType=Value"
 *      Remove OldType trait, insert NewType trait at the same position with
 *      a fixed value. Appends if OldType not found.
 *
 *  --rename-random "OldType>NewType=Val1,Val2,..."
 *      Same as --rename but picks a random value from the list.
 *
 *  --delete "TraitType"
 *      Remove the entire trait regardless of its value.
 *
 *  --delete "TraitType=Value"
 *      Remove the trait only if its current value matches exactly.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * GROUP OPERATIONS  (apply to the SAME N randomly picked NFTs)
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *  --group-n N
 *      Declare a group of N NFTs, randomly selected from all matches.
 *      ALL --group-* flags that follow share this SAME set of N NFTs.
 *      Start a new group by using --group-n again.
 *
 *  --group-set           "TraitType=Value"
 *  --group-random        "TraitType=Val1,Val2,..."
 *  --group-rename        "OldType>NewType=Value"
 *  --group-rename-random "OldType>NewType=Val1,Val2,..."
 *  --group-delete        "TraitType"
 *  --group-delete        "TraitType=Value"
 *      Same behaviour as global ops but scoped to the group's N NFTs.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * MISC
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *  --dry-run
 *      Print every change that would be made without writing any files.
 *      Always do a dry run first before applying.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * COMPLETE USER MANUAL  —  every flag with a real example
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ── 1. --search (exact value match, AND logic) ───────────────────────────────
 *
 *   Find all Homo Sapien NFTs and randomize their Background:
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --random "Background=Dark,Light,Sky,Void,Wine"
 *
 *   Find NFTs that are BOTH Homo Sapien AND have Hair (AND logic):
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --search "Hair=exists" \
 *       --random "Shirt=Red Hoodie,Snow Jacket,Bloe Hoodie"
 *
 * ── 2. --search "exists" (trait present, any value) ─────────────────────────
 *
 *   Find all NFTs that have any Hat and randomize their Hair:
 *
 *     node editTraits.js \
 *       --search "Hats=exists" \
 *       --random "Hair=Low Cut,Low Cut II,Clean Shave"
 *
 *   Find NFTs that have both a Hat AND a Special item:
 *
 *     node editTraits.js \
 *       --search "Hats=exists" \
 *       --search "Special=exists" \
 *       --set "Background=Void"
 *
 * ── 3. --search-or (match any of several values for one trait) ───────────────
 *
 *   Find NFTs where Shirt is any of the full-body suits, then fix their Hair:
 *
 *     node editTraits.js \
 *       --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
 *       --random "Hair=Low Cut,Fade,Clean Shave"
 *
 *   Combine --search-or with --search (AND between them):
 *   Find Zombies wearing any suit, then delete their Special trait:
 *
 *     node editTraits.js \
 *       --search "Body=Zombie" \
 *       --search-or "Shirt=Croc Suit,Ninja Outfit,Panda Suit" \
 *       --delete "Special"
 *
 *   Two --search-or flags (both must match — AND between ORs):
 *   Find NFTs wearing a suit AND with a rare hat:
 *
 *     node editTraits.js \
 *       --search-or "Shirt=Croc Suit,Ninja Outfit,Panda Suit" \
 *       --search-or "Hats=King Crown,Grand Mage Hat,Wizard Hat" \
 *       --set "Background=Void"
 *
 * ── 4. --set (fixed value, all matches) ─────────────────────────────────────
 *
 *   Set Background to Void for all King Slimes:
 *
 *     node editTraits.js \
 *       --search "Body=King Slime" \
 *       --set "Background=Void"
 *
 *   Set multiple traits at once:
 *
 *     node editTraits.js \
 *       --search "Body=King Slime" \
 *       --set "Background=Void" \
 *       --set "Special=Slime Crown"
 *
 * ── 5. --random (random value from list, all matches) ────────────────────────
 *
 *   Randomize Hair for everyone with a Hat:
 *
 *     node editTraits.js \
 *       --search "Hats=exists" \
 *       --random "Hair=Low Cut,Low Cut II,Clean Shave"
 *
 *   Randomize two traits at once (each NFT gets independent rolls):
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --random "Hair=Low Cut,Fade,Clean Shave" \
 *       --random "Background=Dark,Light,Sky,Void,Wine"
 *
 * ── 6. --rename (replace trait type with a fixed value) ──────────────────────
 *
 *   Rename "Shirt" to "Outfit" and set it to Knight for all Homo Sapiens:
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --rename "Shirt>Outfit=Knight"
 *
 * ── 7. --rename-random (replace trait type with a random value) ──────────────
 *
 *   Rename "Shirt" to "Outfit" with a random value:
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --rename-random "Shirt>Outfit=Knight,Tux,Lab Coat,Monk Robe"
 *
 *   Rename in place (same type, just change values randomly):
 *
 *     node editTraits.js \
 *       --search "Body=Zombie" \
 *       --rename-random "Shirt>Shirt=Red Hoodie,Snow Jacket,Biker Jacket"
 *
 * ── 8. --delete (remove a trait) ─────────────────────────────────────────────
 *
 *   Remove the entire Eyes trait from all King Slimes:
 *
 *     node editTraits.js \
 *       --search "Body=King Slime" \
 *       --delete "Eyes"
 *
 *   Remove Eyes only if the value is "Laser":
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --delete "Eyes=Laser"
 *
 *   Delete multiple traits at once:
 *
 *     node editTraits.js \
 *       --search "Body=King Slime" \
 *       --delete "Eyes" \
 *       --delete "Hair" \
 *       --delete "Hats"
 *
 * ── 9. --group-n + group ops (same N NFTs get all ops) ───────────────────────
 *
 *   Give 500 randomly chosen Homo Sapiens BOTH a random Hair AND a random Hat
 *   (both ops target the SAME 500):
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --group-n 500 \
 *       --group-random "Hair=Low Cut,Low Cut II,Clean Shave" \
 *       --group-random "Hats=Baby Propeller Hat,King Crown,Wizard Hat,Pirate Hat"
 *
 *   Give 500 a random Hat AND delete their Special (same 500):
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --group-n 500 \
 *       --group-random "Hats=King Crown,Wizard Hat,Police Hat" \
 *       --group-delete "Special"
 *
 * ── 10. Multiple groups (each group picks its OWN independent N) ─────────────
 *
 *   500 get random Hats, a separate 200 get random Shirts (may overlap):
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --group-n 500 \
 *       --group-random "Hats=King Crown,Wizard Hat,Pirate Hat" \
 *       --group-n 200 \
 *       --group-random "Shirt=Knight,Tux,Lab Coat"
 *
 * ── 11. Global + group mixed ─────────────────────────────────────────────────
 *
 *   Set Background for ALL matches, but only give Hats to 300 of them:
 *
 *     node editTraits.js \
 *       --search "Body=Homo Sapien" \
 *       --set "Background=Void" \
 *       --group-n 300 \
 *       --group-random "Hats=King Crown,Wizard Hat,Turban"
 *
 * ── 12. --dry-run (always use first) ─────────────────────────────────────────
 *
 *   Preview without writing anything:
 *
 *     node editTraits.js \
 *       --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
 *       --random "Hair=Low Cut,Fade,Clean Shave" \
 *       --dry-run
 *
 * ── 13. Combined real-world example ──────────────────────────────────────────
 *
 *   Find all suit-wearing NFTs, fix their Hair randomly, AND give 100 of them
 *   a random Hat on top, AND delete Special from all of them:
 *
 *     node editTraits.js \
 *       --search-or "Shirt=Croc Suit,Full Protective Suit,Ninja Outfit,Panda Suit,Shark Suit" \
 *       --random "Hair=Low Cut,Fade,Clean Shave" \
 *       --delete "Special" \
 *       --group-n 100 \
 *       --group-random "Hats=King Crown,Wizard Hat,Police Hat,Pirate Hat"
 */

const fs       = require("fs");
const path     = require("path");
const basePath = process.cwd();
const sha1     = require(path.join(basePath, "node_modules/sha1"));

// =============================================================================
// HELPERS
// =============================================================================
const attrsToKey  = (attrs) => attrs.map(a => `${a.trait_type}:${a.value}`).sort().join("|");
const pickRandom  = (arr)   => arr[Math.floor(Math.random() * arr.length)];
const parseValues = (str)   => str.split(",").map(v => v.trim()).filter(Boolean);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const parseDeleteArg = (str) => {
  const eqIdx = str.indexOf("=");
  if (eqIdx !== -1) return { trait: str.slice(0, eqIdx).trim(), value: str.slice(eqIdx + 1).trim() };
  return { trait: str.trim(), value: null };
};

const parseRenameStr = (str, multi) => {
  const gtIdx = str.indexOf(">");
  const eqIdx = str.indexOf("=");
  if (gtIdx === -1 || eqIdx === -1 || eqIdx < gtIdx) {
    console.error(`Invalid rename format: "${str}". Expected "OldType>NewType=Value"`);
    process.exit(1);
  }
  const oldType = str.slice(0, gtIdx).trim();
  const newType = str.slice(gtIdx + 1, eqIdx).trim();
  const rawVals = str.slice(eqIdx + 1);
  if (!oldType || !newType) { console.error(`Trait types cannot be empty: "${str}"`); process.exit(1); }
  if (multi) {
    const values = parseValues(rawVals);
    if (!values.length) { console.error(`No values for rename: "${str}"`); process.exit(1); }
    return { oldType, newType, values };
  }
  const value = rawVals.trim() === "null" ? null : rawVals.trim();
  return { oldType, newType, value };
};

const makeOpBucket = () => ({ set: [], random: [], rename: [], renameRandom: [], delete: [] });

// =============================================================================
// PARSE ARGUMENTS
// =============================================================================
const rawArgs = process.argv.slice(2);
const DRY_RUN = rawArgs.includes("--dry-run");

// Search: AND conditions (each entry must satisfy ALL)
// Each condition is either:
//   { type: "exact", trait, value }        — single value match
//   { type: "exists", trait }               — trait present (any value)
//   { type: "or", trait, values[] }         — any of the values
const searchConditions = [];
const globalOps  = makeOpBucket();
const groups     = [];
let currentGroup = null;

for (let i = 0; i < rawArgs.length; i++) {
  const flag = rawArgs[i];
  const val  = rawArgs[i + 1];

  if (flag === "--dry-run") continue;

  // ── Search ──────────────────────────────────────────────────────────────
  if (flag === "--search") {
    const eqIdx = val.indexOf("=");
    if (eqIdx === -1) { console.error(`--search must be "TraitType=Value": "${val}"`); process.exit(1); }
    const trait = val.slice(0, eqIdx).trim();
    const value = val.slice(eqIdx + 1).trim();
    if (value.toLowerCase() === "exists") {
      searchConditions.push({ type: "exists", trait });
    } else {
      searchConditions.push({ type: "exact", trait, value });
    }
    i++; continue;
  }

  if (flag === "--search-or") {
    const eqIdx = val.indexOf("=");
    if (eqIdx === -1) { console.error(`--search-or must be "TraitType=Val1,Val2,...": "${val}"`); process.exit(1); }
    const trait  = val.slice(0, eqIdx).trim();
    const values = parseValues(val.slice(eqIdx + 1));
    if (!values.length) { console.error(`--search-or "${trait}" has no values`); process.exit(1); }
    searchConditions.push({ type: "or", trait, values });
    i++; continue;
  }

  // ── Group boundary ───────────────────────────────────────────────────────
  if (flag === "--group-n") {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) { console.error(`--group-n must be a positive integer: "${val}"`); process.exit(1); }
    currentGroup = { n, ops: makeOpBucket() };
    groups.push(currentGroup);
    i++; continue;
  }

  // ── Group ops ────────────────────────────────────────────────────────────
  if (flag === "--group-set") {
    if (!currentGroup) { console.error("--group-set must come after --group-n"); process.exit(1); }
    const eqIdx = val.indexOf("=");
    currentGroup.ops.set.push({ traitType: val.slice(0, eqIdx).trim(), value: val.slice(eqIdx + 1).trim() === "null" ? null : val.slice(eqIdx + 1).trim() });
    i++; continue;
  }
  if (flag === "--group-random") {
    if (!currentGroup) { console.error("--group-random must come after --group-n"); process.exit(1); }
    const eqIdx = val.indexOf("=");
    const traitType = val.slice(0, eqIdx).trim();
    const values    = parseValues(val.slice(eqIdx + 1));
    if (!values.length) { console.error(`--group-random "${traitType}" has no values`); process.exit(1); }
    currentGroup.ops.random.push({ traitType, values });
    i++; continue;
  }
  if (flag === "--group-rename") {
    if (!currentGroup) { console.error("--group-rename must come after --group-n"); process.exit(1); }
    currentGroup.ops.rename.push(parseRenameStr(val, false));
    i++; continue;
  }
  if (flag === "--group-rename-random") {
    if (!currentGroup) { console.error("--group-rename-random must come after --group-n"); process.exit(1); }
    currentGroup.ops.renameRandom.push(parseRenameStr(val, true));
    i++; continue;
  }
  if (flag === "--group-delete") {
    if (!currentGroup) { console.error("--group-delete must come after --group-n"); process.exit(1); }
    currentGroup.ops.delete.push(parseDeleteArg(val));
    i++; continue;
  }

  // ── Global ops ───────────────────────────────────────────────────────────
  if (flag === "--set") {
    const eqIdx = val.indexOf("=");
    if (eqIdx === -1) { console.error(`Invalid --set: "${val}"`); process.exit(1); }
    globalOps.set.push({ traitType: val.slice(0, eqIdx).trim(), value: val.slice(eqIdx + 1).trim() === "null" ? null : val.slice(eqIdx + 1).trim() });
    i++; continue;
  }
  if (flag === "--random") {
    const eqIdx = val.indexOf("=");
    if (eqIdx === -1) { console.error(`Invalid --random: "${val}"`); process.exit(1); }
    const traitType = val.slice(0, eqIdx).trim();
    const values    = parseValues(val.slice(eqIdx + 1));
    if (!values.length) { console.error(`--random "${traitType}" has no values`); process.exit(1); }
    globalOps.random.push({ traitType, values });
    i++; continue;
  }
  if (flag === "--rename") {
    globalOps.rename.push(parseRenameStr(val, false));
    i++; continue;
  }
  if (flag === "--rename-random") {
    globalOps.renameRandom.push(parseRenameStr(val, true));
    i++; continue;
  }
  if (flag === "--delete") {
    globalOps.delete.push(parseDeleteArg(val));
    i++; continue;
  }
}

// =============================================================================
// VALIDATE
// =============================================================================
if (!searchConditions.length) {
  console.error("Error: at least one --search or --search-or is required.");
  process.exit(1);
}
const hasGlobalOps = Object.values(globalOps).some(v => v.length > 0);
const hasGroupOps  = groups.length > 0;
if (!hasGlobalOps && !hasGroupOps) {
  console.error("Error: at least one operation required.");
  process.exit(1);
}

// =============================================================================
// LOAD METADATA
// =============================================================================
const metaPath   = path.join(basePath, "build/json/_metadata.json");
const backupPath = metaPath + ".bak";
if (!fs.existsSync(metaPath)) { console.error(`_metadata.json not found at ${metaPath}`); process.exit(1); }
const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));

// =============================================================================
// MATCH — ALL conditions must pass (AND across conditions)
// Within each condition:
//   exact → attribute value must equal the search value
//   exists → attribute with that trait_type must be present
//   or     → attribute value must be one of the listed values
// =============================================================================
const matches = metadata.filter(entry =>
  searchConditions.every(cond => {
    if (cond.type === "exists") {
      return entry.attributes.some(a => a.trait_type === cond.trait);
    }
    if (cond.type === "or") {
      return entry.attributes.some(a => a.trait_type === cond.trait && cond.values.includes(a.value));
    }
    // exact
    return entry.attributes.some(a => a.trait_type === cond.trait && a.value === cond.value);
  })
);

// =============================================================================
// PRINT PLAN
// =============================================================================
const condLabel = (c) => {
  if (c.type === "exists") return `${c.trait} = <exists>`;
  if (c.type === "or")     return `${c.trait} IN [${c.values.join(", ")}]`;
  return `${c.trait} = "${c.value}"`;
};

console.log("=".repeat(60));
console.log("  editTraits.js");
console.log(DRY_RUN ? "  MODE: DRY RUN (nothing saved)" : "  MODE: LIVE");
console.log("=".repeat(60));
console.log(`\n🔍 Search (AND):`);
searchConditions.forEach(c => console.log(`   ${condLabel(c)}`));
console.log(`   ↳ Matched: ${matches.length} of ${metadata.length} NFTs\n`);

if (matches.length === 0) { console.log("No matches. Nothing to do.\n"); process.exit(0); }

const printOps = (ops, indent = "   ") => {
  ops.set.forEach(op          => console.log(`${indent}SET           ${op.traitType} = "${op.value}"`));
  ops.random.forEach(op       => console.log(`${indent}RANDOM        ${op.traitType} = [${op.values.join(", ")}]`));
  ops.rename.forEach(op       => console.log(`${indent}RENAME        ${op.oldType} → ${op.newType} = "${op.value}"`));
  ops.renameRandom.forEach(op => console.log(`${indent}RENAME RANDOM ${op.oldType} → ${op.newType} = [${op.values.join(", ")}]`));
  ops.delete.forEach(op       => console.log(`${indent}DELETE        ${op.trait}${op.value ? ` = "${op.value}"` : ""}`));
};

if (hasGlobalOps) {
  console.log(`📋 Global ops — ALL ${matches.length} matches:`);
  printOps(globalOps);
  console.log();
}
groups.forEach((grp, gi) => {
  console.log(`📦 Group ${gi + 1} — ${Math.min(grp.n, matches.length)} of ${matches.length} randomly selected:`);
  printOps(grp.ops);
  console.log();
});

// =============================================================================
// PRE-SELECT GROUP SUBSETS
// =============================================================================
const groupSubsets = groups.map(grp => {
  const shuffled = shuffle(matches.map(e => e.edition));
  return new Set(shuffled.slice(0, Math.min(grp.n, matches.length)));
});

// =============================================================================
// APPLY OPS
// =============================================================================
const applyOps = (entry, ops) => {
  ops.set.forEach(op => {
    const ex = entry.attributes.find(a => a.trait_type === op.traitType);
    if (ex) { ex.value = op.value; } else { entry.attributes.push({ trait_type: op.traitType, value: op.value }); }
  });
  ops.random.forEach(op => {
    const pick = pickRandom(op.values);
    const ex   = entry.attributes.find(a => a.trait_type === op.traitType);
    if (ex) { ex.value = pick; } else { entry.attributes.push({ trait_type: op.traitType, value: pick }); }
  });
  ops.rename.forEach(op => {
    const idx = entry.attributes.findIndex(a => a.trait_type === op.oldType);
    const obj = { trait_type: op.newType, value: op.value };
    if (idx !== -1) { entry.attributes.splice(idx, 1, obj); } else { entry.attributes.push(obj); }
  });
  ops.renameRandom.forEach(op => {
    const pick = pickRandom(op.values);
    const idx  = entry.attributes.findIndex(a => a.trait_type === op.oldType);
    const obj  = { trait_type: op.newType, value: pick };
    if (idx !== -1) { entry.attributes.splice(idx, 1, obj); } else { entry.attributes.push(obj); }
  });
  ops.delete.forEach(op => {
    if (op.value) {
      entry.attributes = entry.attributes.filter(a => !(a.trait_type === op.trait && a.value === op.value));
    } else {
      entry.attributes = entry.attributes.filter(a => a.trait_type !== op.trait);
    }
  });
};

// =============================================================================
// MAIN LOOP
// =============================================================================
let changed = 0;
matches.forEach(entry => {
  const before = JSON.stringify(entry.attributes);
  applyOps(entry, globalOps);
  groups.forEach((grp, gi) => { if (groupSubsets[gi].has(entry.edition)) applyOps(entry, grp.ops); });
  const after = JSON.stringify(entry.attributes);
  if (before !== after) {
    entry.dna  = sha1(attrsToKey(entry.attributes));
    entry.date = Date.now();
    changed++;
    if (DRY_RUN) console.log(`  #${entry.edition}  ${entry.attributes.map(a => `${a.trait_type}:${a.value}`).join(" | ")}`);
  }
});

console.log(`\n✏️  ${changed} of ${matches.length} matched entries modified.\n`);

// =============================================================================
// SAVE
// =============================================================================
if (DRY_RUN) { console.log("DRY RUN — no files written.\n"); process.exit(0); }

fs.copyFileSync(metaPath, backupPath);
console.log(`📦 Backup → _metadata.json.bak`);
fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
console.log(`✅ _metadata.json updated.\n`);

let updatedFiles = 0;
matches.forEach(entry => {
  const p = path.join(basePath, `build/json/${entry.edition}.json`);
  if (fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(entry, null, 2)); updatedFiles++; }
});
if (updatedFiles > 0) console.log(`✅ ${updatedFiles} individual JSON files updated.\n`);
console.log("🏁 Done.\n");