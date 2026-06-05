const fs = require("fs");
const path = require("path");

const LAYERS_DIR = path.join(
  process.cwd(),
  "layers"
);

function normalize(name) {
  return name
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const issues = [];

for (const layer of fs.readdirSync(LAYERS_DIR)) {
  const layerPath = path.join(LAYERS_DIR, layer);

  if (!fs.statSync(layerPath).isDirectory()) {
    continue;
  }

  console.log(`\n=== ${layer} ===`);

  const seen = {};

  for (const file of fs.readdirSync(layerPath)) {
    const ext = path.extname(file);

    let raw = path.basename(file, ext);

    if (raw.includes("#")) {
      raw = raw.split("#")[0];
    }

    const normalized = normalize(raw);

    // leading/trailing spaces
    if (raw !== raw.trim()) {
      issues.push({
        layer,
        file,
        issue: "Leading or trailing spaces",
      });
    }

    // double spaces
    if (/\s{2,}/.test(raw)) {
      issues.push({
        layer,
        file,
        issue: "Multiple consecutive spaces",
      });
    }

    // space before extension
    if (/\s+\.[^.]+$/.test(file)) {
      issues.push({
        layer,
        file,
        issue: "Space before extension",
      });
    }

    // duplicate normalized names
    if (seen[normalized]) {
      issues.push({
        layer,
        file,
        issue: `Duplicate normalized trait name with "${seen[normalized]}"`,
      });
    } else {
      seen[normalized] = file;
    }
  }
}

if (!issues.length) {
  console.log("\n✓ No naming issues found");
  process.exit(0);
}

console.log(`\nFound ${issues.length} issues:\n`);

for (const issue of issues) {
  console.log(
    `[${issue.layer}] ${issue.file}`
  );
  console.log(
    `  → ${issue.issue}\n`
  );
}

fs.writeFileSync(
  "./src/layer-name-audit.json",
  JSON.stringify(issues, null, 2)
);

console.log(
  "Report saved to layer-name-audit.json"
);