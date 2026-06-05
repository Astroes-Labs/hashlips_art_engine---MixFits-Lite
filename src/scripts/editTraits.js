/**
 * editTraits.js - Enhanced Version
 * 
 * Bulk edit your _metadata.json file with powerful operations.
 * 
 * NEW FEATURE: --add-random-n
 *   Allows you to ADD a new trait (e.g. Hat) to a random subset of NFTs
 *   without removing existing traits.
 * 
 * Usage Example:
 *   node editTraits.js --search "Body=Homo Sapien" \
 *     --random-n "500:Hair=Blonde Slicked Back,Blonde Taper Fade,Bowl Cut,Fade,Messy" \
 *     --add-random-n "500:Hat=Baby Propeller Hat,Chef Hat,King Crown,Pirate Hat,Wizard Hat"
 */

const fs = require("fs");
const path = require("path");
const basePath = process.cwd();
const sha1 = require(path.join(basePath, "node_modules/sha1"));

// =============================================================================
// 1. PARSE COMMAND LINE ARGUMENTS
// =============================================================================
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

const getFlag = (flag) => {
    const values = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === flag && args[i + 1]) {
            values.push(args[i + 1]);
        }
    }
    return values;
};

const searchArgs       = getFlag("--search");
const setArgs          = getFlag("--set");
const randomArgs       = getFlag("--random");
const deleteArgs       = getFlag("--delete");
const renameArgs       = getFlag("--rename");
const renameRandomArgs = getFlag("--rename-random");
const renameRandomNArgs = getFlag("--rename-random-n");
const addRandomNArgs   = getFlag("--add-random-n");     // ← NEW FEATURE

// Validation
if (searchArgs.length === 0) {
    console.error("❌ Error: --search is required.");
    console.error('Example: node editTraits.js --search "Body=Homo Sapien" --add-random-n "500:Hat=..."');
    process.exit(1);
}

const SEARCH_TRAIT = searchArgs[0].split("=")[0].trim();
const SEARCH_VALUE = searchArgs[0].split("=").slice(1).join("=").trim();

// =============================================================================
// 2. PARSE --add-random-n "N:TraitType=Val1,Val2,..."
// =============================================================================
const addRandomNOps = addRandomNArgs.map(arg => {
    const colonIdx = arg.indexOf(":");
    if (colonIdx === -1) {
        console.error(`Invalid --add-random-n format. Use: N:TraitType=Val1,Val2,...`);
        process.exit(1);
    }
    const n = parseInt(arg.slice(0, colonIdx).trim(), 10);
    const rest = arg.slice(colonIdx + 1);
    const eqIdx = rest.indexOf("=");
    const traitType = rest.slice(0, eqIdx).trim();
    const values = rest.slice(eqIdx + 1).split(",").map(v => v.trim()).filter(Boolean);

    if (isNaN(n) || n < 1 || !traitType || values.length === 0) {
        console.error(`Invalid --add-random-n argument: ${arg}`);
        process.exit(1);
    }
    return { n, traitType, values };
});

// =============================================================================
// 3. LOAD METADATA
// =============================================================================
const metaPath = path.join(basePath, "build/json/_metadata.json");
if (!fs.existsSync(metaPath)) {
    console.error(`❌ _metadata.json not found at: ${metaPath}`);
    process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metaPath, "utf8"));

// Find all NFTs matching the search
const matches = metadata.filter(entry =>
    entry.attributes.some(a => a.trait_type === SEARCH_TRAIT && a.value === SEARCH_VALUE)
);

console.log(`🔍 Found ${matches.length} NFTs with ${SEARCH_TRAIT} = "${SEARCH_VALUE}"`);

// =============================================================================
// 4. PRE-SELECT RANDOM SUBSETS FOR --add-random-n
// =============================================================================
const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const addRandomNSubsets = addRandomNOps.map(op => {
    const shuffledEditions = shuffle(matches.map(m => m.edition));
    return new Set(shuffledEditions.slice(0, Math.min(op.n, matches.length)));
});

// =============================================================================
// 5. APPLY ALL OPERATIONS
// =============================================================================
let changed = 0;

matches.forEach(entry => {
    const before = JSON.stringify(entry.attributes);

    // === NEW: Add Random Trait to subset ===
    addRandomNOps.forEach((op, idx) => {
        if (!addRandomNSubsets[idx].has(entry.edition)) return;

        const randomValue = op.values[Math.floor(Math.random() * op.values.length)];

        const existing = entry.attributes.find(a => a.trait_type === op.traitType);
        if (existing) {
            existing.value = randomValue;
        } else {
            entry.attributes.push({
                trait_type: op.traitType,
                value: randomValue
            });
        }
    });

    // Recalculate DNA if anything changed
    const after = JSON.stringify(entry.attributes);
    if (before !== after) {
        entry.dna = sha1(entry.attributes.map(a => `${a.trait_type}:${a.value}`).sort().join("|"));
        entry.date = Date.now();
        changed++;
    }
});

console.log(`\n✏️  ${changed} NFTs were successfully modified.`);

// =============================================================================
// 6. SAVE CHANGES
// =============================================================================
if (DRY_RUN) {
    console.log("🧪 DRY RUN COMPLETE — No files were changed.");
    process.exit(0);
}

// Create backup
const backupPath = metaPath + ".bak";
fs.copyFileSync(metaPath, backupPath);
console.log(`💾 Backup created: _metadata.json.bak`);

fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
console.log(`✅ _metadata.json has been updated.`);

console.log("\n🏁 All done!\n");