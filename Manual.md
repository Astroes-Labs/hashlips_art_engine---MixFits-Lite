

1. Overview of the system
2. Project structure explanation
3. How to install and run the app
3.1 required dependencies
3.2 folder setup rules
3.3 common setup mistakes and fixes

4. Full CLI command reference
- generate
- single
- founder
- legendary
- analytics

For each command include:
- purpose
- input arguments
- example usage
- expected output

5. Configuration guide (config.js)
- explain every field in detail
- render settings
- metadata settings
- layer configuration rules

6. Layer system explanation
- how layers work
- naming rules
- rarity weights
- ordering rules

7. Rule engine guide (MixFits system)
Explain clearly:
- trait requires rules
- trait excludes rules
- trait replacement rules
- layer ignore rules
- multi-layer ignore rules
- trait groups
- trait inheritance
- conditional probability modifiers

Include examples for each rule type.

8. Generation modes
- full collection generation
- single NFT generation
- founder NFT generation
- legendary NFT generation

9. Metadata system
- how metadata is created
- JSON output structure
- IPFS integration

10. Analytics system
- what is tracked
- how to export analytics

11. Plugin system
- how plugins work
- how to extend engine

12. Troubleshooting section
- missing layers error
- canvas render failures
- duplicate DNA issues
- empty output folder issues

13. File output locations
- where images are saved
- where metadata is saved

The manual must be written in clean Markdown format with code blocks for commands and examples.

No unnecessary punctuation. No filler words. Keep it technical and direct.
```

---

### Now I’ll generate the full manual (manual.md)

```markdown
# MixFits NFT Generator Manual

## 1. Overview

This application is a Node.js NFT generator engine built on a modified HashLips architecture called MixFits.

It generates NFT images and metadata from layered assets, applies rule-based trait logic, and exports collection data for blockchain use.

---

## 2. Project Structure

```

src/
engine/
Generator.js
CanvasRenderer.js
CollectionBuilder.js
SingleNFTGenerator.js
FounderGenerator.js
LegendaryGenerator.js
BuildManager.js
GenerationPipeline.js

config.js
main.js

layers/
Background/
Body/
Eyes/
etc

build/
images/
json/

````

---

## 3. Installation and Run

### Install dependencies

```bash
npm install
````

### Run full collection generation

```bash
node src/main.js generate
```

### Run single NFT

```bash
node src/main.js single '{"Background":"Dark","Body":"Human"}'
```

### Run founder NFT

```bash
node src/main.js founder
```

### Run legendary NFT

```bash
node src/main.js legendary "NAME"
```

### Export analytics

```bash
node src/main.js analytics
```

---

## 4. CLI Command Reference

### generate

Generates full NFT collection

```bash
node src/main.js generate
```

Output:

* images in build/images
* metadata in build/json

---

### single

Generates one NFT from manual traits

```bash
node src/main.js single '{"Background":"Sky","Body":"Robot"}'
```

---

### founder

Generates special founder NFT

```bash
node src/main.js founder
```

---

### legendary

Generates named legendary NFT

```bash
node src/main.js legendary "Mythic Alpha"
```

---

### analytics

Exports generation analytics

```bash
node src/main.js analytics
```

---

## 5. Configuration Guide (config.js)

### render

Controls image size and output quality

```js
format: {
  width: 512,
  height: 512,
  smoothing: false
}
```

---

### baseUri

IPFS or server base path for metadata images

```js
baseUri: "ipfs://YOUR_URI"
```

---

### description

NFT collection description

---

### layerConfigurations

Defines generation structure

```js
layerConfigurations: [
  {
    growEditionSizeTo: 10,
    layersOrder: [
      { name: "Background" },
      { name: "Body" }
    ]
  }
]
```

---

### shuffleLayerConfigurations

Randomizes generation order

---

## 6. Layer System

Each folder inside `layers/` is a trait category.

Example:

```
layers/Background/Dark.png
layers/Background/Sky.png
```

Rules:

* no dashes in filenames
* weight is defined using # syntax
* example: Dark#5.png

---

## 7. Rule Engine (MixFits)

### Trait Requires Rule

A trait can require another trait.

Example:

* Sword requires Warrior Body

```js
requires: {
  Sword: ["Warrior"]
}
```

---

### Trait Excludes Rule

Prevents trait combinations.

```js
excludes: {
  Crown: ["Helmet"]
}
```

---

### Trait Replacement Rule

Replaces conflicting traits.

```js
replace: {
  Mask: {
    with: "FacePaint"
  }
}
```

---

### Layer Ignore Rule

Skip entire layer if condition is met.

```js
ignoreLayer: {
  Hat: ["NoHatBody"]
}
```

---

### Multi Layer Ignore Rule

```js
ignore: {
  GhostBody: ["Hat", "Shoes"]
}
```

---

### Trait Groups

Group traits to enforce exclusivity.

```js
groups: {
  Weapons: ["Sword", "Gun", "Bow"]
}
```

---

### Trait Inheritance

Traits inherit properties from parent traits.

```js
inherit: {
  GoldenSword: "Sword"
}
```

---

### Conditional Probability

Adjust rarity dynamically.

```js
probabilityModifiers: {
  LegendaryBody: {
    ifHas: "Crown",
    multiplier: 0.2
  }
}
```

---

## 8. Generation Modes

### Full Collection

Generates entire NFT set

```bash
node src/main.js generate
```

---

### Single NFT

Manual trait input

---

### Founder NFT

Special rare generation

---

### Legendary NFT

Named ultra rare NFT

---

## 9. Metadata System

Each NFT outputs JSON:

```json
{
  "name": "MixFits #1",
  "description": "collection",
  "image": "ipfs://.../1.png",
  "attributes": []
}
```

Stored in:

```
build/json/
```

---

## 10. Analytics System

Tracks:

* trait frequency
* rarity distribution
* generation logs

Export:

```bash
node src/main.js analytics
```

---

## 11. Plugin System

Plugins extend engine behavior.

Structure:

```
plugins/
  MyPlugin.js
```

Example:

```js
module.exports = {
  beforeGenerate() {},
  afterGenerate() {}
}
```

---

## 12. Troubleshooting

### Missing layer error

Cause:

* folder name mismatch

Fix:

* ensure config matches folder names exactly

---

### Canvas render failure

Cause:

* missing image path

Fix:

* verify layer file names

---

### Duplicate DNA

Cause:

* low trait variation

Fix:

* increase asset pool

---

### Empty output

Cause:

* build folder not created

Fix:

```bash
rm -rf build
node src/main.js generate
```

---

## 13. Output Locations

Images:

```
build/images
```

Metadata:

```
build/json
```

Analytics:

```
build/analytics
```
## 14. src/scripts/editTraits tools

Command Flag,Description,Example
--search,Required. Finds all NFTs that match a specific trait,"--search ""Body=Homo Sapien"""
--set,Set a trait to a fixed value (adds if missing),"--set ""Background=Void"""
--random,Set a trait to a random value from a list (applies to all matches),"--random ""Hair=Blonde,Black,Brown"""
--delete,Completely remove a trait type,"--delete ""Special"""
--rename,Rename a trait type and set a fixed value,"--rename ""Shirt>Top=Knight"""
--rename-random,Rename a trait type and assign a random value (all matches),"--rename-random ""Shirt>Top=Knight,Tux,Lab Coat"""
--rename-random-n,Rename + random value but only on N random NFTs,"--rename-random-n ""500:Shirt>Top=Knight,Tux"""
--add-random-n (NEW),Add a new trait with a random value to N random NFTs (without removing anything),"--add-random-n ""500:Hat=Baby Propeller Hat,Chef Hat"""
---

## End of Manual

```

