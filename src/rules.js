//src\rules.js

/**
 * Advanced Trait Rules for Hashlips Art Engine
 * Structured from user rule sheet
 */

const rules = {
  ignoreLayers: [],

  forcedTraits: {},

  ignoreTraits: {},

  conditions: [
    // ====================== NORMAL BODIES (Full Layers) ======================
    {
      if: {
        layer: "Body",
        trait: ["Homo Sapien", "Zombie"],
      },
      then: {
        allowedLayers: [
          "Background",
          "Eyes",
          "Hair",
          "Hat",
          "Shirt",
          "Pants",
          "Footwear",
        ],
        mutualExclusion: ["Hair", "Hat"],
        ignoreTraits: {
          Special: ["Bomb", "Brain", "Cheese", "Dog", "Ring", "Slime Crown"],
          Background: "Dark", // No Dark background
          Eyes: "Straight Face",
        },
      },
    },

    // ====================== SLIME BODIES ======================
    {
      if: {
        layer: "Body",
        trait: ["Purple Slime", "Blue Slime", "Green Slime", "Pink Slime"],
      },
      then: {
        allowedLayers: ["Background", "Eyes", "Special"],
        ignore: ["Hair", "Hat", "Shirt", "Pants", "Footwear"],
        forcedTraits: {
          Eyes: "Straight Face", // Force Straight Face
        },
        ignoreTraits: {
          Special: [
            "Boxing Gloves",
            "Cigratte",
            "Gun",
            "Halo",
            "Katana",
            "Slime Crown",
          ],
          // No need to ignore other eyes since we're forcing one
        },
      },
    },

    {
      if: {
        layer: "Body",
        trait: "King Slime",
      },
      then: {
        allowedLayers: ["Background", "Special"],
        ignore: ["Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear"],
        forcedTraits: {
          Special: "Slime Crown",
        },
      },
    },

    // ====================== SPECIAL BODIES (No Eyes) ======================
      {
      if: {
        layer: "Body",
        trait: [
          "Experiment Zero",
        ],
      },
      then: {
        allowedLayers: [ "Body","Eyes"], // Only Background + Body
        ignore: [
          "Background",
          "Hair",
          "Hat",
          "Shirt",
          "Pants",
          "Footwear",
          "Special",
        ],
        forcedTraits: {
          Eyes: ["Regular Visor"]
        },
      },
    },
    {
      if: {
        layer: "Body",
        trait: [
          "Black Werewolf",
          "Bluish Ghost",
          "Brain Box",
          "Brown Werewolf II",
          "Brown Werewolf",
          "Ginger Werewolf",
          "Gold Skeleton",
          "Greenish Ghost",
          "HellHound",
          "Mighty Balor",
          "Monitor Bot X",
          "Monitor Bot Y",
          "Mummy",
          "Mummy II",
          "Mutant A",
          "Mutant B",
          "Mutant C",
          "Mutant D",
          "Mutant P",
          "Reddish Ghost",
          "Silver Back Werewolf",
          "Silver Skeleton",
          "Skeleton",
          "Stone Balor",
          "Unknown Mutant",
          "Void Executioner",
          "Void Watcher",
        ],
      },
      then: {
        allowedLayers: ["Background", "Body"], // Only Background + Body
        ignore: [
          "Eyes",
          "Hair",
          "Hat",
          "Shirt",
          "Pants",
          "Footwear",
          "Special",
        ],
      },
    },
    {
      if: {
        layer: "Hair",
        trait: [
          "Blonde Slicked Back",
          "Blonde Taper Fade",
          "Blue Tinted Bun",
          "Bowl Cut",
          "Brains",
          "Brunette Bun",
          "Crew Cut",
          "Clean Shave",
          "Dirty Blonde Taper Fade",
          "Fade",
          "Ginger Bowl Cut",
          "Messy",
          "Slick Afro",
        ],
      },
      then: {
        ignoreTraits: {
          Shirt: [
            "Croc Suit",
            "Full Protective Suit",
            "Ninja Outfit",
            "Panda Suit",
            "Shark Suit",
          ],
        },
      },
    },
    {
      if: {
        layer: "Hat",
        trait: [
          "Baby Propeller Hat",
          "Banana Hat",
          "Black Baseball Hat",
          "Blue Baseball Hat",
          "Brown Trucker Hat",
          "Chef Hat",
          "Grand Mage Hat",
          "King Crown",
          "Knight Helmet",
          "Lucha Libre Mask",
          "Mummy Hat",
          "Not TMA Mask",
          "Orange Trucker Hat",
          "Pirate Hat",
          "Pizza Hat",
          "Police Hat",
          "Propeller Hat",
          "Space Gear Hood",
          "Super Mutario Hat",
          "Turban",
          "White Baseball Hat",
          "White Trucker Hat",
          "Wizard Hat",
        ],
      },
      then: {
        ignoreTraits: {
          Shirt: [
            "Croc Suit",
            "Full Protective Suit",
            "Ninja Outfit",
            "Panda Suit",
            "Shark Suit",
          ],
        },
      },
    }, {
      if: {
        layer: "Eyes",
        trait: [
          "Laser",
        ],
      },
      then: {
        ignoreTraits: {
          Shirt: [
            "Croc Suit",
            "Full Protective Suit",
            "Ninja Outfit",
            "Panda Suit",
            "Shark Suit",
          ],

        },
      },
    },

     {
      if: {
        layer: "Shirt",
        trait: [
         "Knight",
        ],
      },
      then: {
        ignore: [
         "Footwear",
        ],
      },
    },
  ],
};

module.exports = rules;
