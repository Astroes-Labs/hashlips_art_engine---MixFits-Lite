/**
 * regenSingle.js
 *
 * Regenerates ONE NFT image (and its individual JSON) from a single metadata entry.
 * Does NOT touch the rest of the collection.
 *
 * Usage:
 *   node regenSingle.js entry.json
 *
 * entry.json is the full metadata object for the NFT you want to regenerate.
 * It must have: edition, attributes (with trait_type/value pairs matching your layer folder names)
 */

const basePath = process.cwd();
const fs       = require("fs");
const path     = require("path");
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);

const {
  format,
  layerConfigurations,
  background,
  text,
} = require(`${basePath}/src/config.js`);

// =============================================================================
// LOAD ENTRY FILE
// =============================================================================
const entryFile = process.argv[2];
if (!entryFile) {
  console.error("Usage: node regen-single.js <entry.json>");
  process.exit(1);
}
if (!fs.existsSync(entryFile)) {
  console.error(`Entry file not found: ${entryFile}`);
  process.exit(1);
}

const entry   = JSON.parse(fs.readFileSync(entryFile, "utf8"));
const edition = entry.edition;

if (!edition || !Array.isArray(entry.attributes)) {
  console.error('Entry must have "edition" and "attributes".');
  process.exit(1);
}

// =============================================================================
// CANVAS SETUP
// =============================================================================
const canvas = createCanvas(format.width, format.height);
const ctx    = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;

// =============================================================================
// HELPERS
// =============================================================================
const rarityDelimiter = "#";

/**
 * Given a layer folder path and a desired trait name,
 * find the matching file (ignoring the #weight suffix and extension).
 */
const findTraitFile = (layerPath, traitName) => {
  if (!fs.existsSync(layerPath)) return null;

  const files = fs.readdirSync(layerPath).filter(f => !/(^|\/)\.[^\/\.]/g.test(f));

  for (const file of files) {
    const ext         = path.extname(file);
    const noExt       = file.slice(0, -ext.length);
    // Strip weight suffix
    const cleanName   = noExt.includes(rarityDelimiter)
      ? noExt.split(rarityDelimiter).slice(0, -1).join(rarityDelimiter)
      : noExt;

    if (cleanName === traitName) {
      return path.join(layerPath, file);
    }
  }
  return null;
};

const drawBackground = () => {
  const genColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, ${background.brightness})`;
  };
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addText = (sig, x, y, size) => {
  ctx.fillStyle  = text.color;
  ctx.font       = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign  = text.align;
  ctx.fillText(sig, x, y);
};

// =============================================================================
// BUILD LAYER ORDER from config (use the first layerConfiguration)
// =============================================================================
const layersOrder = layerConfigurations[0].layersOrder;

// =============================================================================
// RESOLVE EACH ATTRIBUTE TO A FILE PATH
// =============================================================================
const layersDir = path.join(basePath, "layers");

// Build a map: trait_type → value from the entry
const traitMap = {};
entry.attributes.forEach(a => { traitMap[a.trait_type] = a.value; });

// Walk layers in config order, resolve file paths
const renderPlan = [];

for (const layerDef of layersOrder) {
  const layerName  = layerDef.name;
  const traitValue = traitMap[layerName];

  if (!traitValue) {
    // This layer was disabled/skipped for this NFT — that's fine
    console.log(`  ⏭  ${layerName}: skipped (not in attributes)`);
    continue;
  }

  const layerPath = path.join(layersDir, layerName);
  const filePath  = findTraitFile(layerPath, traitValue);

  if (!filePath) {
    console.error(`  ❌ Could not find file for "${layerName}: ${traitValue}" in ${layerPath}`);
    console.error(`     Make sure the layer folder exists and the trait name matches exactly.`);
    process.exit(1);
  }

  renderPlan.push({
    layerName,
    traitValue,
    filePath,
    blend:   layerDef.options?.blend   ?? "source-over",
    opacity: layerDef.options?.opacity ?? 1,
  });

  console.log(`  ✅ ${layerName}: ${traitValue}  →  ${path.basename(filePath)}`);
}

// =============================================================================
// RENDER
// =============================================================================
(async () => {
  console.log(`\n🎨 Rendering edition #${edition}...\n`);

  ctx.clearRect(0, 0, format.width, format.height);

  if (background.generate) drawBackground();

  for (const layer of renderPlan) {
    const image = await loadImage(layer.filePath);

    ctx.globalAlpha              = layer.opacity;
    ctx.globalCompositeOperation = layer.blend;

    if (text.only) {
      addText(
        `${layer.layerName}${text.spacer}${layer.traitValue}`,
        text.xGap,
        text.yGap * (renderPlan.indexOf(layer) + 1),
        text.size
      );
    } else {
      ctx.drawImage(image, 0, 0, format.width, format.height);
    }
  }

  // Reset composite so the saved PNG is clean
  ctx.globalAlpha              = 1;
  ctx.globalCompositeOperation = "source-over";

  // =============================================================================
  // SAVE IMAGE
  // =============================================================================
  const outputImagePath = path.join(basePath, "build/images", `${edition}.png`);
  fs.writeFileSync(outputImagePath, canvas.toBuffer("image/png"));
  console.log(`\n✅ Image saved → build/images/${edition}.png`);

  // =============================================================================
  // SAVE INDIVIDUAL JSON (overwrites only the single file, not _metadata.json)
  // =============================================================================
  const outputJsonPath = path.join(basePath, "build/json", `${edition}.json`);
  fs.writeFileSync(outputJsonPath, JSON.stringify(entry, null, 2));
  console.log(`✅ JSON  saved → build/json/${edition}.json`);

  console.log(`\n🏁 Done — edition #${edition} regenerated.\n`);
})();