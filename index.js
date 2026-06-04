//index.js

const basePath = process.cwd();
const { buildSetup, startCreating } = require(`${basePath}/src/main.js`);

(async () => {
    try {
        console.log("Image output folder:", `${basePath}/build/images`);
        
        buildSetup();
        await startCreating();
        
    } catch (error) {
        console.error("Error during generation:", error);
    }
})();