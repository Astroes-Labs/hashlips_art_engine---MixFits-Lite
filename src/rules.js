//src\rules.js

/**
 * Advanced Trait Rules for Hashlips Art Engine
 * Structured from user rule sheet - Supports single values and arrays
 */

const rules = {

    // ==================== GLOBAL LAYER CONTROLS ====================

    /** 
     * Completely skip these layers for ALL NFTs
     * Accepts: string or array of strings
     */
    ignoreLayers: [],

    // ==================== FORCED TRAITS ====================

    forcedTraits: {
        // Global forces (if any) - most forces will be handled via conditions
    },

    // ==================== IGNORED TRAITS ====================

    ignoreTraits: {
        // Global trait ignores (if any)
    },

    // ==================== CONDITIONAL RULES ====================

    conditions: [

        // ====================== HUMAN BASE RULES ======================
        {
            if: {
                layer: "Body",
                trait: ["Homo Sapien", "Zombie"] // Assuming default human body, adjust if your trait name differs
            },
            then: {
                allowedLayers: ["Background", "Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear", "Special"],
                ignore: [], // will be calculated
                mutualExclusion: ["Hair", "Hat"] // Hair and Hat cannot both appear
            }
        },

        // ====================== SLIME BASE RULES ======================
        {
            if: {
                layer: "Body",
                trait: "Slime"
            },
            then: {
                allowedLayers: ["Background", "Special"],
                ignore: ["Eyes", "Hair", "Hat", "Shirt", "Pants", "Footwear"],
                forcedTraits: {
                    "Eyes": "Straight Face" // as per "face": "Straight Face"
                }
            }
        },

        // King Slime special case
        {
            if: {
                layer: "Body",
                trait: "King Slime"
            },
            then: {
                forcedTraits: {
                    "Special": "Slime Crown"
                }
            }
        },

        // ====================== SPECIAL BODY OVERRIDES ======================
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
                allowedLayers: ["Background", "Body"],
                ignore: ["Hair", "Hat", "Shirt", "Pants", "Footwear", "Special", "Eyes"]
            }
        }

    ]
};

module.exports = rules;