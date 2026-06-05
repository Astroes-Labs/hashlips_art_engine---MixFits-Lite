const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const METADATA_FILE = path.join(
  ROOT,
  "build",
  "json",
  "_metadata.json"
);

const LAYERS_DIR = path.join(
  ROOT,
  "layers"
);

function normalize(name) {
  return name
    .replace(/\.[^/.]+$/, "")
    .split("#")[0]
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildLayerLookup() {
  const lookup = {};

  const layers = fs
    .readdirSync(LAYERS_DIR)
    .filter((item) =>
      fs.statSync(path.join(LAYERS_DIR, item)).isDirectory()
    );

  for (const layer of layers) {
    lookup[layer] = {};

    const files = fs.readdirSync(
      path.join(LAYERS_DIR, layer)
    );

    for (const file of files) {
      const normalized = normalize(file);

      lookup[layer][normalized] = file;
    }
  }

  return lookup;
}

function findClosest(layerTraits, target) {
  const matches = Object.keys(layerTraits).filter(
    (name) =>
      name.includes(target) ||
      target.includes(name)
  );

  return matches.slice(0, 5);
}

function checkMetadata() {
  const metadata = JSON.parse(
    fs.readFileSync(METADATA_FILE, "utf8")
  );

  const lookup = buildLayerLookup();

  const missing = [];

  for (const nft of metadata) {
    for (const attr of nft.attributes) {
      const layer = attr.trait_type;
      const trait = attr.value;

      if (!lookup[layer]) {
        missing.push({
          edition: nft.edition,
          layer,
          trait,
          reason: "Layer not found",
        });

        continue;
      }

      const normalizedTrait =
        normalize(trait);

      if (
        !lookup[layer][normalizedTrait]
      ) {
        missing.push({
          edition: nft.edition,
          layer,
          trait,
          reason: "Trait not found",
          suggestions: findClosest(
            lookup[layer],
            normalizedTrait
          ),
        });
      }
    }
  }

  return missing;
}

const results = checkMetadata();

if (results.length === 0) {
  console.log(
    "✓ All metadata traits match layer files"
  );
} else {
  console.log(
    `✗ Found ${results.length} missing traits`
  );

  results.forEach((item) => {
    console.log("\n------------------");
    console.log(
      `Edition: ${item.edition}`
    );
    console.log(
      `Layer: ${item.layer}`
    );
    console.log(
      `Trait: ${item.trait}`
    );
    console.log(
      `Reason: ${item.reason}`
    );

    if (
      item.suggestions &&
      item.suggestions.length
    ) {
      console.log(
        `Suggestions: ${item.suggestions.join(
          ", "
        )}`
      );
    }
  });

  fs.writeFileSync(
    path.join(
      ROOT,
      "missing-traits-report.json"
    ),
    JSON.stringify(
      results,
      null,
      2
    )
  );

  console.log(
    "\nReport saved to missing-traits-report.json"
  );
}