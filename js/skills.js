/**
 * skills.js - Handles all skill-related functionality
 * This file manages the skill tree, skill progression, and skill visualization.
 */

// Skills manager namespace
const SkillsManager = (() => {
    // Skill categories with their metadata
    const SKILL_CATEGORIES = {
        "Knife Skills": {
            icon: "🔪",
            description: "Precision cutting techniques",
            color: "#0E7C7B", // Using accent-color-3
            techniques: {}
        },
        "Heat Management": {
            icon: "🔥",
            description: "Temperature control and cooking methods",
            color: "#4A2A1B", // Using accent-color-1
            techniques: {}
        },
        "Flavor Building": {
            icon: "🌶️",
            description: "Seasoning and taste development",
            color: "#FF1B1C", // Using accent-color-2
            techniques: {}
        },
        "Ingredient Knowledge": {
            icon: "🥕",
            description: "Selection and understanding of foods",
            color: "#A2BC58", // Using primary-color
            techniques: {}
        },
        "Kitchen Management": {
            icon: "⏱️",
            description: "Organization and workflow",
            color: "#F1DEBD", // Using secondary-color
            techniques: {}
        }
    };
    
    // Define skill levels
    const SKILL_LEVELS = {
        "Basic": {
            order: 1,
            rankRequired: "Home Cook",
            minLevel: 1
        },
        "Intermediate": {
            order: 2,
            rankRequired: "Home Cook",
            minLevel: 4
        },
        "Advanced": {
            order: 3,
            rankRequired: "Home Cook",
            minLevel: 8
        }
    };
    
    // All techniques/skills data
    const TECHNIQUES = {
        // Knife Skills
        "basic-knife-grip": {
            name: "Basic Knife Grip",
            category: "Knife Skills",
            difficulty: "Basic",
            description: "Proper and safe way to hold a chef's knife",
            icon: "🔪",
            prerequisites: [],
            unlockedBy: ["T1-1"] // Quest IDs that unlock this skill
        },
        "cross-cutting": {
            name: "Cross-Cutting",
            category: "Knife Skills",
            difficulty: "Basic",
            description: "Simple straight cuts across vegetables",
            icon: "🔪",
            prerequisites: ["basic-knife-grip"],
            unlockedBy: ["T1-1"]
        },
        "uniform-dicing": {
            name: "Uniform Dicing",
            category: "Knife Skills",
            difficulty: "Basic",
            description: "Creating consistent sized cubes for even cooking",
            icon: "🔪",
            prerequisites: ["cross-cutting"],
            unlockedBy: ["T2-1"]
        },
        "julienne-cutting": {
            name: "Julienne Cutting",
            category: "Knife Skills",
            difficulty: "Intermediate",
            description: "Thin matchstick cuts for salads and stir-fries",
            icon: "🔪",
            prerequisites: ["uniform-dicing"],
            unlockedBy: ["T4-1"]
        },
        "chiffonade": {
            name: "Chiffonade",
            category: "Knife Skills",
            difficulty: "Intermediate",
            description: "Ribbon-like cuts for herbs and leafy greens",
            icon: "🔪",
            prerequisites: ["julienne-cutting"],
            unlockedBy: ["T8-1"]
        },
        
        // Heat Management
        "heat-assessment": {
            name: "Heat Assessment",
            category: "Heat Management",
            difficulty: "Basic",
            description: "Recognizing proper cooking temperatures visually",
            icon: "🔥",
            prerequisites: [],
            unlockedBy: ["T1-2"]
        },
        "basic-heat-control": {
            name: "Basic Heat Control",
            category: "Heat Management",
            difficulty: "Basic",
            description: "Maintaining consistent temperature during cooking",
            icon: "🔥",
            prerequisites: ["heat-assessment"],
            unlockedBy: ["T2-2"]
        },
        "heat-regulation": {
            name: "Heat Regulation",
            category: "Heat Management",
            difficulty: "Intermediate",
            description: "Adjusting heat for different cooking phases",
            icon: "🔥",
            prerequisites: ["basic-heat-control"],
            unlockedBy: ["T6-2"]
        },
        
        // Flavor Building
        "basic-seasoning": {
            name: "Basic Seasoning",
            category: "Flavor Building",
            difficulty: "Basic",
            description: "Properly applying salt and pepper for enhanced flavor",
            icon: "🌶️",
            prerequisites: [],
            unlockedBy: ["T1-3"]
        },
        "taste-assessment": {
            name: "Taste Assessment",
            category: "Flavor Building",
            difficulty: "Basic",
            description: "Identifying basic flavor components in dishes",
            icon: "🌶️",
            prerequisites: ["basic-seasoning"],
            unlockedBy: ["T1-3"]
        },
        "flavor-balancing": {
            name: "Flavor Balancing",
            category: "Flavor Building",
            difficulty: "Basic",
            description: "Creating harmonious combinations of flavors",
            icon: "🌶️",
            prerequisites: ["taste-assessment"],
            unlockedBy: ["S1-2"]
        },
        
        // Ingredient Knowledge
        "ingredient-selection": {
            name: "Ingredient Selection",
            category: "Ingredient Knowledge",
            difficulty: "Basic",
            description: "Choosing quality ingredients at the market",
            icon: "🥕",
            prerequisites: [],
            unlockedBy: ["E1-1"]
        },
        "produce-assessment": {
            name: "Produce Assessment",
            category: "Ingredient Knowledge",
            difficulty: "Basic",
            description: "Evaluating freshness and ripeness",
            icon: "🥕",
            prerequisites: ["ingredient-selection"],
            unlockedBy: ["E1-1"]
        },
        "ingredient-composition": {
            name: "Ingredient Composition",
            category: "Ingredient Knowledge",
            difficulty: "Intermediate",
            description: "Combining ingredients for complementary flavors and textures",
            icon: "🥕",
            prerequisites: ["produce-assessment"],
            unlockedBy: ["M1-3"]
        },
        
        // Kitchen Management
        "mise-en-place": {
            name: "Mise en Place",
            category: "Kitchen Management",
            difficulty: "Basic",
            description: "Preparing and organizing all ingredients before cooking",
            icon: "⏱️",
            prerequisites: [],
            unlockedBy: ["T2-4"]
        },
        "workflow-management": {
            name: "Workflow Management",
            category: "Kitchen Management",
            difficulty: "Basic",
            description: "Efficiently sequencing cooking tasks",
            icon: "⏱️",
            prerequisites: ["mise-en-place"],
            unlockedBy: ["T2-4"]
        },
        "equipment-assessment": {
            name: "Equipment Assessment",
            category: "Kitchen Management",
            difficulty: "Basic",
            description: "Selecting the right tools for specific tasks",
            icon: "⏱️",
            prerequisites: [],
            unlockedBy: ["E2-1"]
        }
    };
    
    // Organize techniques by category
    Object.keys(TECHNIQUES).forEach(key => {
        const technique = TECHNIQUES[key];
        const category = SKILL_CATEGORIES[technique.category];
        
        if (category) {
            category.techniques[key] = technique;
        }
    });
    
    /**
     * Get all skill categories
     * @returns {Object} - All skill categories
     */
    function getSkillCategories() {
        return SKILL_CATEGORIES;
    }
    
    /**
     * Get all techniques/skills
     * @returns {Object} - All techniques
     */
    function getAllTechniques() {
        return TECHNIQUES;
    }
    
    /**
     * Get techniques for a specific category
     * @param {string} category - The category name
     * @returns {Object} - Techniques in the category
     */
    function getTechniquesByCategory(category) {
        return SKILL_CATEGORIES[category]?.techniques || {};
    }
    
    /**
     * Get mastered techniques for a user
     * @param {Object} userProfile - The user profile
     * @returns {Array} - Mastered technique IDs
     */
    function getMasteredTechniques(userProfile) {
        return userProfile.masteredTechniques || [];
    }
    
    /**
     * Check if a technique is mastered
     * @param {string} techniqueId - The technique ID
     * @param {Object} userProfile - The user profile
     * @returns {boolean} - Whether the technique is mastered
     */
    function isTechniqueMastered(techniqueId, userProfile) {
        return userProfile.masteredTechniques && 
               userProfile.masteredTechniques.includes(techniqueId);
    }
    
    /**
     * Check if a technique is available to learn
     * @param {string} techniqueId - The technique ID
     * @param {Object} userProfile - The user profile
     * @returns {boolean} - Whether the technique can be learned
     */
    function isTechniqueAvailable(techniqueId, userProfile) {
        const technique = TECHNIQUES[techniqueId];
        
        if (!technique) {
            return false;
        }
        
        // Check if already mastered
        if (isTechniqueMastered(techniqueId, userProfile)) {
            return false;
        }
        
        // Check rank and level requirements
        const difficultyInfo = SKILL_LEVELS[technique.difficulty];
        const userRank = userProfile.currentRank.title;
        const userLevel = userProfile.currentRank.level;
        
        if (userRank !== difficultyInfo.rankRequired || userLevel < difficultyInfo.minLevel) {
            return false;
        }
        
        // Check prerequisites
        const prerequisites = technique.prerequisites || [];
        return prerequisites.every(prereq => isTechniqueMastered(prereq, userProfile));
    }
    
    /**
     * Get techniques that can be learned next
     * @param {Object} userProfile - The user profile
     * @returns {Array} - Available technique IDs
     */
    function getAvailableTechniques(userProfile) {
        return Object.keys(TECHNIQUES).filter(id => 
            isTechniqueAvailable(id, userProfile)
        );
    }
    
    /**
     * Generate the skill tree visualization data
     * @param {Object} userProfile - The user profile
     * @returns {Object} - Skill tree visualization data
     */
    function generateSkillTreeData(userProfile) {
        const treeData = {};
        
        // Process each category
        Object.keys(SKILL_CATEGORIES).forEach(categoryName => {
            const category = SKILL_CATEGORIES[categoryName];
            treeData[categoryName] = {
                icon: category.icon,
                description: category.description,
                color: category.color,
                skills: {}
            };
            
            // Group techniques by difficulty
            const difficultySections = {
                "Basic": [],
                "Intermediate": [],
                "Advanced": []
            };
            
            // Sort techniques into difficulty sections
            Object.keys(category.techniques).forEach(techniqueId => {
                const technique = category.techniques[techniqueId];
                const difficulty = technique.difficulty;
                
                if (difficultySections[difficulty]) {
                    difficultySections[difficulty].push({
                        id: techniqueId,
                        name: technique.name,
                        description: technique.description,
                        icon: technique.icon,
                        prerequisites: technique.prerequisites,
                        mastered: isTechniqueMastered(techniqueId, userProfile),
                        available: isTechniqueAvailable(techniqueId, userProfile)
                    });
                }
            });
            
            // Add difficulty sections to tree data
            treeData[categoryName].skills = difficultySections;
        });
        
        return treeData;
    }
    
    // Public API
    return {
        getSkillCategories,
        getAllTechniques,
        getTechniquesByCategory,
        getMasteredTechniques,
        isTechniqueMastered,
        isTechniqueAvailable,
        getAvailableTechniques,
        generateSkillTreeData
    };
})();
