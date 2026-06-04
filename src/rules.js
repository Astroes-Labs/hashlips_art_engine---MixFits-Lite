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
                trait: ["Homo Sapien", "Zombie"]
            },
            then: {
                allowedLayers: ["Background", "Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear", "Special"],
                mutualExclusion: ["Hair", "Hat"]
            }
        },

        // ====================== SLIME BODIES ======================
        {
            if: {
                layer: "Body",
                trait: "Slime"
            },
            then: {
                allowedLayers: ["Background", "Special"],
                ignore: ["Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear"],
                forcedTraits: {
                    "Eyes": "Straight Face"
                }
            }
        },

        {
            if: {
                layer: "Body",
                trait: "King Slime"
            },
            then: {
                allowedLayers: ["Background", "Special"],
                ignore: ["Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear"],
                forcedTraits: {
                    "Special": "Slime Crown"
                }
            }
        },

        // ====================== SPECIAL BODIES (No Eyes) ======================
        {
            if: {
                layer: "Body",
                trait: [
                    "Black Werewolf", "Bluish Ghost", "Brain Box", "Brown Werewolf II",
                    "Brown Werewolf", "Experiment Zero", "Ginger Werewolf", "Gold Skeleton",
                    "Greenish Ghost", "HellHound", "Mighty Balor", "Monitor Bot X",
                    "Monitor Bot Y", "Mummy", "Mummy II", "Mutant A", "Mutant B",
                    "Mutant C", "Mutant D", "Mutant P", "Reddish Ghost",
                    "Silver Back Werewolf", "Silver Skeleton", "Skeleton",
                    "Stone Balor", "Unknown Mutant", "Void Executioner", "Void Watcher"
                ]
            },
            then: {
                allowedLayers: ["Background", "Body"],   // Only Background + Body
                ignore: ["Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear", "Special"]
            }
        }

    ]
};

module.exports = rules;