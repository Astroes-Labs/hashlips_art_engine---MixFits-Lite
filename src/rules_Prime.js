//src\rules.js

/**
 * Advanced Trait Rules for Hashlips Art Engine
 * Supports single values or arrays for maximum flexibility
 */

const rules = {

    // ==================== GLOBAL LAYER CONTROLS ====================

    /** 
     * Completely skip these layers (they won't be loaded at all)
     * Accepts: string or array of strings
     */
    ignoreLayers: [],

    // ==================== FORCED TRAITS ====================

    /**
     * Force specific traits to always appear
     * Example: "Background": "Blue Sky"  or  "Body": ["Alien", "Robot"]
     */
    forcedTraits: {
        // "LayerName": "Trait Name"           → single
        // "LayerName": ["Trait1", "Trait2"]   → multiple (random among them)
    },

    // ==================== IGNORED TRAITS ====================

    /**
     * Never use these traits
     * Example: "Hair": "Long Hair"  or  "Hair": ["Long Hair", "Curly"]
     */
    ignoreTraits: {
        // "LayerName": "Trait Name"           → single
        // "LayerName": ["Trait1", "Trait2"]   → multiple
    },

    // ==================== CONDITIONAL RULES (Most Powerful) ====================

    conditions: [{
            // If this happens...
            if: {
                layer: "Body",
                trait: ["Alien Body", "Robot Body"] // can be string or array
            },
            // Then do this...
            then: {
                force: {
                    "Eyes": "Laser Eyes" // force single trait
                },
                ignore: ["Shirt", "Pants"], // skip entire layers
                ignoreTraits: {
                    "Hair": ["Long Hair", "Blonde"] // ignore specific traits on a layer
                }
            }
        },

        {
            if: {
                layer: "Hats",
                trait: ["Crown", "Big Hat", "Helmet"]
            },
            then: {
                ignore: ["Hair"] // no hair with hats
            }
        },

        // Add more rules as needed
    ]
};

module.exports = rules;