//./src\scripts\generateTraitManifest.js

const fs = require("fs");
const path = require("path");

const layersDir = "./layers"; // change to your layers directory

const result = {};

const layerFolders = fs
  .readdirSync(layersDir)
  .filter((item) =>
    fs.statSync(path.join(layersDir, item)).isDirectory()
  );

for (const layer of layerFolders) {
  const layerPath = path.join(layersDir, layer);

  const traits = fs
    .readdirSync(layerPath)
    .filter((file) => !file.startsWith("."))
    .map((file) => {
      const nameWithoutExt = path.parse(file).name;

      return nameWithoutExt.includes("#")
        ? nameWithoutExt.split("#")[0].trim()
        : nameWithoutExt.trim();
    });

  result[layer] = [...new Set(traits)].sort();
}

const outputPath = path.join(__dirname, "../json/traitManifest.json");

fs.writeFileSync(
  outputPath,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(`Saved to ${outputPath}`);
console.log(JSON.stringify(result, null, 2));