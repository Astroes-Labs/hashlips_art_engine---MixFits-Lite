const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const WIDTH = 1000;
const HEIGHT = 1000;

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
  const name = path.parse(filename).name;

  if (name.includes("#")) {
    return name.split("#")[0].trim();
  }

  return name.trim();
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

  const files = fs.readdirSync(layerPath);

  const match = files.find((file) => {
    return cleanTraitName(file) === trait;
  });

  if (!match) {
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

  for (const attribute of nft.attributes) {
    const layerName =
      attribute.trait_type;

    const traitName =
      attribute.value;

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

  fs.writeFileSync(
    path.join(
      JSON_DIR,
      `${nft.edition}.json`
    ),
    JSON.stringify(
      nft,
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

  fs.writeFileSync(
    path.join(
      JSON_DIR,
      "_metadata.json"
    ),
    JSON.stringify(
      metadata,
      null,
      2
    )
  );

  console.log(
    `Finished ${metadata.length} NFTs`
  );
}

generate().catch(console.error);