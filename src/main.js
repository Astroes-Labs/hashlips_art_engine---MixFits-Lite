const config = require("./config");

const BuildManager = require("./engine/BuildManager");
const GenerationPipeline = require("./engine/GenerationPipeline");

const CollectionBuilder = require("./engine/CollectionBuilder");
const SingleNFTGenerator = require("./engine/SingleNFTGenerator");
const FounderGenerator = require("./engine/FounderGenerator");
const LegendaryGenerator = require("./engine/LegendaryGenerator");

const buildManager = new BuildManager();

const pipeline = new GenerationPipeline(config);

const args = process.argv.slice(2);
const command = args[0];

async function run() {
  buildManager.setup();
  pipeline.initialize();

  switch (command) {
    case "generate": {
      const builder = new CollectionBuilder(config);
      const results = builder.build();

      console.log("RESULTS:", results);
      console.log("RESULT LENGTH:", results?.length);

      let edition = 1;

      for (const result of results) {
        await pipeline.process(result, edition);
        edition++;
      }

      pipeline.finalize();
      console.log("Collection generated");
      break;
    }

    case "single": {
      const traits = JSON.parse(args[1] || "{}");

      const generator = new SingleNFTGenerator(config);
      const result = generator.generate(traits);

      await pipeline.process(result, 1);

      pipeline.finalize();
      console.log("Single NFT generated");
      break;
    }

    case "founder": {
      const generator = new FounderGenerator(config);
      const result = generator.generate();

      await pipeline.process(result, 1);

      pipeline.finalize();
      console.log("Founder NFT generated");
      break;
    }

    case "legendary": {
      const name = args[1];

      const generator = new LegendaryGenerator(config);
      const result = generator.generate(name);

      await pipeline.process(result, 1);

      pipeline.finalize();
      console.log("Legendary NFT generated");
      break;
    }

    case "analytics": {
      pipeline.analytics.export();
      console.log("Analytics exported");
      break;
    }

    default:
      console.log("Unknown command");
      break;
  }
}

run();
