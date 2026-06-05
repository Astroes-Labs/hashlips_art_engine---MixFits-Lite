//src\main.js
const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;

const {
    format,
    baseUri,
    description,
    background,
    uniqueDnaTorrance,
    layerConfigurations,
    rarityDelimiter,
    shuffleLayerConfigurations,
    debugLogs,
    extraMetadata,
    text,
    namePrefix,
    network,
    solanaMetadata,
    gif,
} = require(`${basePath}/src/config.js`);

const rules = require(`${basePath}/src/rules.js`);

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;

var metadataList = [];
var attributesList = [];
var dnaList = new Set();
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);

let hashlipsGiffer = null;

const buildSetup = () => {
    if (fs.existsSync(buildDir)) {
        fs.rmdirSync(buildDir, { recursive: true });
    }
    fs.mkdirSync(buildDir);
    fs.mkdirSync(`${buildDir}/json`);
    fs.mkdirSync(`${buildDir}/images`);
    if (gif.export) {
        fs.mkdirSync(`${buildDir}/gifs`);
    }
};

const getRarityWeight = (_str) => {
    let nameWithoutExtension = _str.slice(0, -4);
    var nameWithoutWeight = Number(
        nameWithoutExtension.split(rarityDelimiter).pop()
    );
    if (isNaN(nameWithoutWeight)) {
        nameWithoutWeight = 1;
    }
    return nameWithoutWeight;
};

const cleanDna = (_str) => {
    const withoutOptions = removeQueryStrings(_str);
    var dna = Number(withoutOptions.split(":").shift());
    return dna;
};

const cleanName = (_str) => {
    let nameWithoutExtension = _str.slice(0, -4);
    var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
    return nameWithoutWeight;
};

const getElements = (path) => {
    return fs
        .readdirSync(path)
        .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
        .map((i, index) => {
            if (i.includes("-")) {
                throw new Error(`layer name can not contain dashes, please fix: ${i}`);
            }
            return {
                id: index,
                name: cleanName(i),
                filename: i,
                path: `${path}${i}`,
                weight: getRarityWeight(i),
            };
        });
};

const layersSetup = (layersOrder) => {
    const layers = layersOrder.map((layerObj, index) => ({
        id: index,
        elements: getElements(`${layersDir}/${layerObj.name}/`),
        name: layerObj.options?.["displayName"] != undefined
            ? layerObj.options?.["displayName"]
            : layerObj.name,
        blend: layerObj.options?.["blend"] != undefined
            ? layerObj.options?.["blend"]
            : "source-over",
        opacity: layerObj.options?.["opacity"] != undefined
            ? layerObj.options?.["opacity"]
            : 1,
        bypassDNA: layerObj.options?.["bypassDNA"] !== undefined
            ? layerObj.options?.["bypassDNA"]
            : false,
    }));
    return layers;
};

const saveImage = (_editionCount) => {
    fs.writeFileSync(
        `${buildDir}/images/${_editionCount}.png`,
        canvas.toBuffer("image/png")
    );
};

const genColor = () => {
    let hue = Math.floor(Math.random() * 360);
    let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
    return pastel;
};

const drawBackground = () => {
    ctx.fillStyle = background.static ? background.default : genColor();
    ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
    let dateTime = Date.now();
    let tempMetadata = {
        name: `${namePrefix} #${_edition}`,
        description: description,
        image: `${baseUri}/${_edition}.png`,
        dna: sha1(_dna),
        edition: _edition,
        date: dateTime,
        ...extraMetadata,
        attributes: attributesList,
        compiler: "HashLips Art Engine",
    };
    if (network == NETWORK.sol) {
        tempMetadata = {
            name: tempMetadata.name,
            symbol: solanaMetadata.symbol,
            description: tempMetadata.description,
            seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
            image: `${_edition}.png`,
            external_url: solanaMetadata.external_url,
            edition: _edition,
            ...extraMetadata,
            attributes: tempMetadata.attributes,
            properties: {
                files: [{ uri: `${_edition}.png`, type: "image/png" }],
                category: "image",
                creators: solanaMetadata.creators,
            },
        };
    }
    metadataList.push(tempMetadata);
    attributesList = [];
};

const addAttributes = (_element) => {
    // Skip if layer was disabled by rules
    if (!_element?.layer?.selectedElement) return;

    attributesList.push({
        trait_type: _element.layer.name,
        value: _element.layer.selectedElement.name,
    });
};

const loadLayerImg = async (_layer) => {
    try {
        // Skip layers disabled by rules
        if (!_layer.selectedElement) {
            return { layer: _layer, loadedImage: null };
        }
        return new Promise(async (resolve) => {
            const image = await loadImage(`${_layer.selectedElement.path}`);
            resolve({ layer: _layer, loadedImage: image });
        });
    } catch (error) {
        console.error("Error loading image:", error);
        return null;
    }
};

const addText = (_sig, x, y, size) => {
    ctx.fillStyle = text.color;
    ctx.font = `${text.weight} ${size}pt ${text.family}`;
    ctx.textBaseline = text.baseline;
    ctx.textAlign = text.align;
    ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
    if (!_renderObject || !_renderObject.loadedImage) return;

    ctx.globalAlpha = _renderObject.layer.opacity;
    ctx.globalCompositeOperation = _renderObject.layer.blend;

    text.only
        ? addText(
            `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
            text.xGap,
            text.yGap * (_index + 1),
            text.size
        )
        : ctx.drawImage(
            _renderObject.loadedImage,
            0,
            0,
            format.width,
            format.height
        );

    addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
    const dnaItems = _dna.split(DNA_DELIMITER);
    return _layers.map((layer, index) => {
        const dnaSegment = dnaItems[index];
        if (!dnaSegment || dnaSegment === "null") {
            return {
                name: layer.name,
                blend: layer.blend,
                opacity: layer.opacity,
                selectedElement: null
            };
        }
        let selectedElement = layer.elements.find(
            (e) => e.id == cleanDna(dnaSegment)
        );
        return {
            name: layer.name,
            blend: layer.blend,
            opacity: layer.opacity,
            selectedElement: selectedElement,
        };
    });
};

const filterDNAOptions = (_dna) => {
    const dnaItems = _dna.split(DNA_DELIMITER);
    const filteredDNA = dnaItems.filter((element) => {
        const query = /(\?.*$)/;
        const querystring = query.exec(element);
        if (!querystring) return true;
        const options = querystring[1].split("&").reduce((r, setting) => {
            const keyPairs = setting.split("=");
            return { ...r, [keyPairs[0]]: keyPairs[1] };
        }, {});
        return options.bypassDNA;
    });
    return filteredDNA.join(DNA_DELIMITER);
};

const removeQueryStrings = (_dna) => {
    const query = /(\?.*$)/;
    return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
    const _filteredDNA = filterDNAOptions(_dna);
    return !_DnaList.has(_filteredDNA);
};

// ==================== ADVANCED CREATE DNA WITH RULES ====================
const createDna = (_layers) => {
    let randNum = [];
    let disabledLayers = new Set();
    let forcedTraits = {};
    let ignoreTraitsConfig = {};

    // Step 1: Select Body FIRST
    const bodyLayerIndex = _layers.findIndex(l => l.name === "Body");
    let bodyTrait = null;

    if (bodyLayerIndex !== -1) {
        const bodyLayer = _layers[bodyLayerIndex];
        let available = [...bodyLayer.elements];
        let totalWeight = available.reduce((sum, el) => sum + el.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);

        for (let el of available) {
            random -= el.weight;
            if (random < 0) {
                bodyTrait = el.name;
                randNum[bodyLayerIndex] = `${el.id}:${el.filename}${bodyLayer.bypassDNA ? "?bypassDNA=true" : ""}`;
                break;
            }
        }
    }

    if (!bodyTrait) return "";

    // Step 2: Apply all rules based on selected Body
    rules.conditions.forEach(condition => {
        const ifTraits = Array.isArray(condition.if.trait) ? condition.if.trait : [condition.if.trait];

        if (ifTraits.includes(bodyTrait)) {
            const then = condition.then || {};

            // Allowed Layers
            if (then.allowedLayers?.length > 0) {
                rules.currentAllowed = then.allowedLayers;
            }

            // Ignore entire layers
            if (then.ignore?.length > 0) {
                then.ignore.forEach(l => disabledLayers.add(l));
            }

            // Forced Traits
            if (then.forcedTraits) {
                forcedTraits = { ...forcedTraits, ...then.forcedTraits };
            }

            // Ignore Specific Traits
            if (then.ignoreTraits) {
                ignoreTraitsConfig = { ...ignoreTraitsConfig, ...then.ignoreTraits };
            }

            // Mutual Exclusion
            if (then.mutualExclusion) {
                rules.currentMutualExclusion = then.mutualExclusion;
            }
        }
    });

    // Step 3: Generate DNA for all layers
    _layers.forEach((layer, index) => {
        const layerName = layer.name;
        if (layerName === "Body") return;

        // Skip layer if not allowed
        if (rules.currentAllowed && !rules.currentAllowed.includes(layerName)) {
            if (!forcedTraits[layerName]) {
                disabledLayers.add(layerName);
            }
        }

        if (disabledLayers.has(layerName)) {
            randNum[index] = null;
            return;
        }

        let availableElements = [...layer.elements];

        // === APPLY ignoreTraits ===
        if (ignoreTraitsConfig[layerName]) {
            let toIgnore = ignoreTraitsConfig[layerName];
            if (!Array.isArray(toIgnore)) toIgnore = [toIgnore];

            availableElements = availableElements.filter(el => 
                !toIgnore.includes(el.name)
            );
        }

        // === FORCED TRAIT ===
        let forcedTrait = forcedTraits[layerName];
        if (forcedTrait) {
            const forcedElement = availableElements.find(el => el.name === forcedTrait);
            if (forcedElement) {
                randNum[index] = `${forcedElement.id}:${forcedElement.filename}${layer.bypassDNA ? "?bypassDNA=true" : ""}`;
                return;
            } else {
                console.warn(`Forced trait "${forcedTrait}" not found in ${layerName}`);
            }
        }

        // === NORMAL RANDOM SELECTION ===
        if (availableElements.length === 0) {
            randNum[index] = null;
            return;
        }

        let totalWeight = availableElements.reduce((sum, el) => sum + el.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);

        for (let el of availableElements) {
            random -= el.weight;
            if (random < 0) {
                randNum[index] = `${el.id}:${el.filename}${layer.bypassDNA ? "?bypassDNA=true" : ""}`;
                break;
            }
        }
    });

    // Fill missing slots
    for (let i = 0; i < _layers.length; i++) {
        if (randNum[i] === undefined) randNum[i] = null;
    }

    return randNum.join(DNA_DELIMITER);
};

const applyMutualExclusions = (selectedLayer, selectedTrait, disabledLayers) => {
    if (rules.currentMutualExclusion?.includes(selectedLayer)) {
        rules.currentMutualExclusion.forEach(layer => {
            if (layer !== selectedLayer) disabledLayers.add(layer);
        });
    }
};

const writeMetaData = (_data) => {
    fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
    let metadata = metadataList.find((meta) => meta.edition == _editionCount);
    debugLogs
        ? console.log(`Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`)
        : null;
    fs.writeFileSync(
        `${buildDir}/json/${_editionCount}.json`,
        JSON.stringify(metadata, null, 2)
    );
};

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const startCreating = async () => {
    let layerConfigIndex = 0;
    let editionCount = 1;
    let failedCount = 0;
    let abstractedIndexes = [];

    for (let i = network == NETWORK.sol ? 0 : 1; i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo; i++) {
        abstractedIndexes.push(i);
    }

    if (shuffleLayerConfigurations) {
        abstractedIndexes = shuffle(abstractedIndexes);
    }

    while (layerConfigIndex < layerConfigurations.length) {
        const layers = layersSetup(layerConfigurations[layerConfigIndex].layersOrder);

        while (editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo) {
            let newDna = createDna(layers);

            if (isDnaUnique(dnaList, newDna)) {
                let results = constructLayerToDna(newDna, layers);
                let loadedElements = results.map(layer => loadLayerImg(layer));

                await Promise.all(loadedElements).then((renderObjectArray) => {
                    ctx.clearRect(0, 0, format.width, format.height);

                    if (gif.export) {
                        hashlipsGiffer = new HashlipsGiffer(
                            canvas, ctx,
                            `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
                            gif.repeat, gif.quality, gif.delay
                        );
                        hashlipsGiffer.start();
                    }

                    if (background.generate) drawBackground();

                    renderObjectArray.forEach((renderObject) => {
                        drawElement(renderObject, 0, 0); // index not critical here
                        if (gif.export) hashlipsGiffer.add();
                    });

                    if (gif.export) hashlipsGiffer.stop();

                    saveImage(abstractedIndexes[0]);
                    addMetadata(newDna, abstractedIndexes[0]);
                    saveMetaDataSingleFile(abstractedIndexes[0]);

                    console.log(`Created edition: ${abstractedIndexes[0]}`);
                });

                dnaList.add(filterDNAOptions(newDna));
                editionCount++;
                abstractedIndexes.shift();
            } else {
                console.log("DNA exists!");
                failedCount++;
                if (failedCount >= uniqueDnaTorrance) process.exit();
            }
        }
        layerConfigIndex++;
    }

    writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };