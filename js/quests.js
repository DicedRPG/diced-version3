/**
 * quests.js - Handles all quest-related functionality
 * This file manages quest completion, quest selection, and other quest-related operations.
 */

// Quest manager namespace
const QuestManager = (() => {
    // Store for the current selected quest
    let currentQuestId = null;
    
    // Store for local quest data caching
    let questData = [];
    
    /**
     * Initialize the quest manager
     * @param {Array} quests - The quest data
     */
    function initialize(quests) {
        questData = quests;
    }
    
    /**
     * Get a single quest by ID
     * @param {string} questId - The quest ID
     * @returns {Object|null} - The quest or null if not found
     */
    function getQuest(questId) {
        return questData.find(q => q.id === questId) || null;
    }
    
    /**
     * Check if a quest's prerequisites are met
     * @param {string} questId - The quest ID
     * @param {Array} completedQuests - Array of completed quest IDs
     * @returns {boolean} - Whether prerequisites are met
     */
    function arePrerequisitesMet(questId, completedQuests) {
        const quest = getQuest(questId);
        
        if (!quest || !quest.prerequisites || quest.prerequisites.length === 0) {
            return true;
        }
        
        return quest.prerequisites.every(prereqId => 
            completedQuests.includes(prereqId)
        );
    }
    
    /**
     * Get all currently available quests for the user
     * @param {Object} userProfile - The user profile
     * @returns {Array} - Available quests
     */
    function getAvailableQuests(userProfile) {
        return userProfile.unlockedQuests
            .filter(id => !userProfile.completedQuests.includes(id))
            .map(id => getQuest(id))
            .filter(q => q !== null && arePrerequisitesMet(q.id, userProfile.completedQuests));
    }
    
    /**
     * Get all completed quests
     * @param {Object} userProfile - The user profile
     * @returns {Array} - Completed quests
     */
    function getCompletedQuests(userProfile) {
        return userProfile.completedQuests
            .map(id => getQuest(id))
            .filter(q => q !== null);
    }
    
    /**
     * Get quests of a specific type
     * @param {Array} quests - Quests to filter
     * @param {string} type - Quest type (training, side, main, explore, challenge)
     * @returns {Array} - Filtered quests
     */
    function getQuestsByType(quests, type) {
        return quests.filter(q => q.type === type);
    }
    
    /**
     * Get quests for a specific level
     * @param {Array} quests - Quests to filter
     * @param {string} rankTitle - Rank title
     * @param {number} level - Level number
     * @returns {Array} - Filtered quests
     */
    function getQuestsByLevel(quests, rankTitle, level) {
        return quests.filter(q => 
            q.rank.title === rankTitle && 
            q.rank.level === level
        );
    }
    
    /**
     * Attempt to complete a quest
     * @param {string} questId - The quest ID
     * @returns {Promise<Object>} - Promise resolving to result object
     */
    async function completeQuest(questId) {
        return await DataManager.completeQuest(questId);
    }
    
    /**
     * Set the current selected quest
     * @param {string} questId - The quest ID
     */
    function setCurrentQuest(questId) {
        currentQuestId = questId;
    }
    
    /**
     * Get the current selected quest
     * @returns {Object|null} - The current quest or null
     */
    function getCurrentQuest() {
        if (!currentQuestId) {
            return null;
        }
        
        return getQuest(currentQuestId);
    }
    
    /**
     * Generate a random quest element or modifier
     * @param {Object} quest - The quest to modify
     * @returns {Object} - The random element
     */
    function generateRandomElement(quest) {
        const elementTypes = [
            'ingredient',
            'technique',
            'constraint',
            'flavor'
        ];
        
        const type = elementTypes[Math.floor(Math.random() * elementTypes.length)];
        
        // Define options based on the type
        const options = {
            ingredient: [
                "Add a fresh herb of your choice",
                "Include a citrus element",
                "Use a spice you've never tried before",
                "Incorporate a seasonal vegetable",
                "Add a fermented ingredient"
            ],
            technique: [
                "Use only wooden utensils",
                "Try a different cutting technique",
                "Cook without using the microwave",
                "Use a one-pot approach",
                "Practice mise en place rigorously"
            ],
            constraint: [
                "Complete in 25% less time",
                "Use only 3 main ingredients",
                "Create no food waste",
                "Use only one heat source",
                "Work in complete silence"
            ],
            flavor: [
                "Make it slightly spicy",
                "Emphasize umami flavors",
                "Create a sweet-savory balance",
                "Focus on brightness with acid",
                "Develop deeper, roasted flavors"
            ]
        };
        
        const option = options[type][Math.floor(Math.random() * options[type].length)];
        
        return {
            type: type,
            description: option,
            text: `${type.charAt(0).toUpperCase() + type.slice(1)} Challenge: ${option}`
        };
    }
    
    /**
     * Get quest type display information
     * @param {string} type - Quest type
     * @returns {Object} - Display information
     */
    function getQuestTypeInfo(type) {
        const typeInfo = {
            training: {
                name: "Training",
                cssClass: "training-quest",
                description: "Focus on a specific technique or skill"
            },
            side: {
                name: "Side",
                cssClass: "side-quest",
                description: "Create a component or side dish"
            },
            main: {
                name: "Main",
                cssClass: "main-quest",
                description: "Create a complete meal or dish"
            },
            explore: {
                name: "Explore",
                cssClass: "explore-quest",
                description: "Discover new ingredients or ideas"
            },
            challenge: {
                name: "Challenge",
                cssClass: "challenge-quest",
                description: "Test multiple skills in a complex task"
            }
        };
        
        return typeInfo[type] || { 
            name: type.charAt(0).toUpperCase() + type.slice(1),
            cssClass: "default-quest",
            description: "Complete this quest"
        };
    }

    /**
 * QuestManager Updates for ProgressManager Integration
 * This code updates the QuestManager module to integrate with ProgressManager
 */

// The following should be added or modified in the QuestManager namespace

/**
 * Get appropriate quests for the current user level using ProgressManager
 * @param {number} count - The number of quests to return
 * @returns {Array} - Array of appropriate quests
 */
function getAppropriateQuests(userProfile, count = 3) {
    if (!userProfile) {
        console.error('User profile is required for getAppropriateQuests');
        return [];
    }
    
    // Get available quests
    const availableQuests = getAvailableQuests(userProfile);
    
    // Use ProgressManager to filter by appropriate level
    return ProgressManager.getAppropriateQuests(userProfile, availableQuests, count);
}

/**
 * Get the next challenge quest for the user
 * @param {Object} userProfile - The user profile
 * @returns {Object|null} - The next challenge quest or null
 */
function getNextChallengeQuest(userProfile) {
    if (!userProfile) {
        console.error('User profile is required for getNextChallengeQuest');
        return null;
    }
    
    // Get all quests
    return DataManager.getQuestData().then(quests => {
        return ProgressManager.getNextChallengeQuest(userProfile, quests);
    });
}

/**
 * Format time required for a quest using ProgressManager
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time string
 */
function formatTimeRequired(minutes) {
    return ProgressManager.formatTimeRequired(minutes);
}

/**
 * Calculate total hours earned from a quest using ProgressManager
 * @param {Object} quest - The quest object
 * @returns {number} - Total hours earned
 */
function calculateQuestHours(quest) {
    return ProgressManager.calculateQuestHours(quest);
}

/**
 * Check if a quest is appropriate for the user's current level
 * @param {Object} quest - The quest object
 * @param {Object} userProfile - The user profile
 * @returns {boolean} - Whether the quest is appropriate
 */
function isQuestAppropriate(quest, userProfile) {
    if (!quest || !userProfile) return false;
    
    const currentRank = userProfile.currentRank.title;
    const currentLevel = userProfile.currentRank.level;
    
    // Check if quest is for the same rank
    if (quest.rank.title !== currentRank) {
        return false;
    }
    
    // Allow quests for current level or one level above
    return quest.rank.level <= currentLevel + 1;
}

/**
 * Get quest difficulty indicator based on user's current level
 * @param {Object} quest - The quest object
 * @param {Object} userProfile - The user profile
 * @returns {string} - Difficulty indicator (easy, moderate, challenging)
 */
function getQuestDifficulty(quest, userProfile) {
    if (!quest || !userProfile) return 'unknown';
    
    const currentLevel = userProfile.currentRank.level;
    const questLevel = quest.rank.level;
    
    if (questLevel < currentLevel) {
        return 'easy';
    } else if (questLevel === currentLevel) {
        return 'moderate';
    } else {
        return 'challenging';
    }
}

// Add these functions to the public API in the return statement
// return {
//     ...
//     getAppropriateQuests,
//     getNextChallengeQuest,
//     formatTimeRequired,
//     calculateQuestHours,
//     isQuestAppropriate,
//     getQuestDifficulty
//
    
    // Public API
    return {
        initialize,
        getQuest,
        getAvailableQuests,
        getCompletedQuests,
        getQuestsByType,
        getQuestsByLevel,
        completeQuest,
        setCurrentQuest,
        getCurrentQuest,
        generateRandomElement,
        getQuestTypeInfo,
        getAppropriateQuests,
        getNextChallengeQuest,
        formatTimeRequired,
        calculateQuestHours,
        isQuestAppropriate,
        getQuestDifficulty
    };
})();
