/**
 * buildMetadata.js
 *
 * Rebuilds a metadata collection file by reading all individual
 * JSON files from build/json/ and assembling them in edition order.
 *
 * Usage:
 *   node buildMetadata.js json   →  build/json/buildMetadata.json
 *   node buildMetadata.js csv    →  build/json/buildMetadata.csv
 *
 * JSON output matches the exact _metadata.json format.
 *
 * CSV output matches the format:
 *   tokenID,name,description,file_name,external_url,attributes[TraitType],...
 */

const fs       = require("fs");
const path     = require("path");
const basePath = process.cwd();

// =============================================================================
// ARG VALIDATION
// =============================================================================
const FORMAT = (process.argv[2] || "").toLowerCase();

if (!["json", "csv"].includes(FORMAT)) {
  console.error("Usage: node buildMetadata.js <json|csv>");
  console.error("  json  →  build/json/buildMetadata.json");
  console.error("  csv   →  build/json/buildMetadata.csv");
  process.exit(1);
}

// =============================================================================
// PATHS
// =============================================================================
const jsonDir    = path.join(basePath, "build/json");
const outputPath = path.join(jsonDir, `buildMetadata.${FORMAT === "csv" ? "csv" : "json"}`);

if (!fs.existsSync(jsonDir)) {
  console.error("build/json/ directory not found. Have you run the generator?");
  process.exit(1);
}

// =============================================================================
// READ ALL INDIVIDUAL NUMBERED JSON FILES
// Skips _metadata.json, buildMetadata.json, anything non-numeric
// =============================================================================
const files = fs
  .readdirSync(jsonDir)
  .filter(f => f.endsWith(".json") && /^\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

if (files.length === 0) {
  console.error("No numbered JSON files found in build/json/ (e.g. 1.json, 2.json)");
  process.exit(1);
}

console.log("=".repeat(60));
console.log(`  buildMetadata.js  →  ${FORMAT.toUpperCase()} output`);
console.log("=".repeat(60));
console.log(`\n📂 Found ${files.length} JSON files in build/json/\n`);

// =============================================================================
// PARSE
// =============================================================================
const metadata = [];
const errors   = [];

files.forEach(file => {
  try {
    const entry = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
    if (typeof entry.edition === "undefined") { errors.push(`${file}: missing "edition"`); return; }
    if (!Array.isArray(entry.attributes))     { errors.push(`${file}: missing "attributes"`); return; }
    metadata.push(entry);
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
});

if (errors.length) {
  console.warn("⚠️  Skipped with errors:");
  errors.forEach(e => console.warn(`   • ${e}`));
  console.warn();
}

metadata.sort((a, b) => a.edition - b.edition);
console.log(`✅ Parsed ${metadata.length} entries.\n`);

// =============================================================================
// JSON OUTPUT  —  identical format to _metadata.json
// =============================================================================
if (FORMAT === "json") {
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`✅ Written → ${outputPath}`);
  console.log(`   ${metadata.length} entries | ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB\n`);
  process.exit(0);
}

// =============================================================================
// CSV OUTPUT
// Header:  tokenID,name,description,file_name,external_url,attributes[TraitType],...
// Row:     1,Item 1,Item 1 description,1.png,https://example.com/1,Green,Common,...
// =============================================================================
if (FORMAT === "csv") {
  // Collect trait types in first-appearance order
  const traitTypes = [];
  const seen       = new Set();
  metadata.forEach(e => e.attributes.forEach(a => {
    if (!seen.has(a.trait_type)) { seen.add(a.trait_type); traitTypes.push(a.trait_type); }
  }));

  const esc = v => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  // Derive external_url base from first image field if possible
  // Falls back to empty string — edit the BASE_URL constant below if needed
  const BASE_URL = "";

  const header = [
    "tokenID", "name", "description", "file_name", "external_url",
    ...traitTypes.map(t => `attributes[${t}]`),
  ].map(esc).join(",");

  const rows = metadata.map(e => {
    const tmap = {};
    e.attributes.forEach(a => { tmap[a.trait_type] = a.value; });

    const fileName    = `${e.edition}.png`;
    const externalUrl = BASE_URL ? `${BASE_URL.replace(/\/$/, "")}/${e.edition}` : "";

    return [
      e.edition,
      e.name        ?? "",
      e.description ?? "",
      fileName,
      externalUrl,
      ...traitTypes.map(t => tmap[t] ?? ""),
    ].map(esc).join(",");
  });

  const csv = [header, ...rows].join("\n");
  fs.writeFileSync(outputPath, csv);

  console.log(`✅ Written → ${outputPath}`);
  console.log(`   ${metadata.length} rows | ${traitTypes.length} trait columns | ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  console.log(`\n📋 Columns: tokenID, name, description, file_name, external_url, ${traitTypes.map(t => `attributes[${t}]`).join(", ")}\n`);
  process.exit(0);
}
