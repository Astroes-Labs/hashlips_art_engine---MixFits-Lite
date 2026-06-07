// src/generateFromMetadata.js

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const {
  format,
  layerConfigurations,
  namePrefix,
  description,
  baseUri,
} = require("./../config");

const WIDTH = format.width;
const HEIGHT = format.height;

const ROOT_DIR = process.cwd();

const METADATA_FILE = path.join(
  ROOT_DIR,
  "build",
  "json",
  "_metadata.json"
);

const LAYERS_DIR = path.join(
  ROOT_DIR,
  "layers"
);

const OUTPUT_DIR = path.join(
  ROOT_DIR,
  "build_from_metadata"
);

const IMAGES_DIR = path.join(
  OUTPUT_DIR,
  "images"
);

const JSON_DIR = path.join(
  OUTPUT_DIR,
  "json"
);

const LAYER_ORDER =
  layerConfigurations[0].layersOrder.map(
    (layer) => layer.name
  );

const VALID_LAYERS = new Set(
  LAYER_ORDER
);

const LAYER_ALIASES = {
  Hat: "Hats",
  Hats: "Hats",
};

const canvas = createCanvas(
  WIDTH,
  HEIGHT
);

const ctx = canvas.getContext("2d");

function setup() {
  fs.rmSync(OUTPUT_DIR, {
    recursive: true,
    force: true,
  });

  fs.mkdirSync(IMAGES_DIR, {
    recursive: true,
  });

  fs.mkdirSync(JSON_DIR, {
    recursive: true,
  });
}

function cleanTraitName(filename) {
  let name = path.parse(filename).name;

  if (name.includes("#")) {
    name = name.split("#")[0];
  }

  return name
    .replace(/\s+/g, " ")
    .trim();
}

function findTraitFile(layer, trait) {
  const layerPath = path.join(
    LAYERS_DIR,
    layer
  );

  if (!fs.existsSync(layerPath)) {
    throw new Error(
      `Layer not found: ${layer}`
    );
  }

  const normalizedTrait = trait
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const files = fs.readdirSync(layerPath);

  const match = files.find((file) => {
    return (
      cleanTraitName(file)
        .toLowerCase() ===
      normalizedTrait
    );
  });

  if (!match) {
    console.log(
      `\nMissing Trait`
    );
    console.log(
      `Layer: ${layer}`
    );
    console.log(
      `Trait: "${trait}"`
    );

    throw new Error(
      `Trait not found: ${layer} -> ${trait}`
    );
  }

  return path.join(
    layerPath,
    match
  );
}

async function drawNFT(nft) {
  ctx.clearRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );

  const orderedAttributes =
    LAYER_ORDER.map((layer) =>
      nft.attributes.find((attr) => {
        const attrLayer =
          LAYER_ALIASES[
            attr.trait_type
          ] || attr.trait_type;

        return attrLayer === layer;
      })
    ).filter(Boolean);

  for (const attribute of orderedAttributes) {
    const layerName =
      LAYER_ALIASES[
        attribute.trait_type
      ] || attribute.trait_type;

    const traitName =
      attribute.value;

    if (
      !VALID_LAYERS.has(layerName)
    ) {
      console.warn(
        `Unknown layer "${layerName}" in edition ${nft.edition}`
      );
      continue;
    }

    const imagePath =
      findTraitFile(
        layerName,
        traitName
      );

    const image =
      await loadImage(imagePath);

    ctx.drawImage(
      image,
      0,
      0,
      WIDTH,
      HEIGHT
    );
  }

  const imageBuffer =
    canvas.toBuffer("image/png");

  fs.writeFileSync(
    path.join(
      IMAGES_DIR,
      `${nft.edition}.png`
    ),
    imageBuffer
  );

  const outputMetadata = {
    ...nft,
    name: `${namePrefix} #${nft.edition}`,
    description,
    image: `${baseUri}/${nft.edition}.png`,
  };

  fs.writeFileSync(
    path.join(
      JSON_DIR,
      `${nft.edition}.json`
    ),
    JSON.stringify(
      outputMetadata,
      null,
      2
    )
  );

  console.log(
    `Generated #${nft.edition}`
  );
}

async function generate() {
  setup();

  const metadata =
    JSON.parse(
      fs.readFileSync(
        METADATA_FILE,
        "utf8"
      )
    );

  for (const nft of metadata) {
    await drawNFT(nft);
  }

  const finalMetadata =
    metadata.map((nft) => ({
      ...nft,
      name: `${namePrefix} #${nft.edition}`,
      description,
      image: `${baseUri}/${nft.edition}.png`,
    }));

  fs.writeFileSync(
    path.join(
      JSON_DIR,
      "_metadata.json"
    ),
    JSON.stringify(
      finalMetadata,
      null,
      2
    )
  );

  console.log(
    `\nFinished generating ${metadata.length} NFTs`
  );

  console.log(
    `Images: ${IMAGES_DIR}`
  );

  console.log(
    `Metadata: ${JSON_DIR}`
  );
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});