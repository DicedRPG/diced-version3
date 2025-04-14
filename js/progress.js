/**
 * progress.js - Handles all progression and ranking functionality
 * This file manages the user's progress through the game, including attribute leveling
 * and rank advancement.
 */

// Progress manager namespace
const ProgressManager = (() => {
    // Define the rank progression system
    const RANK_PROGRESSION = {
        "Home Cook": {
            color: "Bronze",
            levels: 10,
            hoursPerLevel: [20, 5, 5, 5, 5, 6, 7, 8, 9, 10], // Hours needed for each level
            totalHours: 80,
            nextRank: "Culinary Student"
        },
        "Culinary Student": {
            color: "Iron",
            levels: 10,
            hoursPerLevel: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            totalHours: 325,
            nextRank: "Kitchen Assistant"
        },
        "Kitchen Assistant": {
            color: "Silver",
            levels: 10,
            hoursPerLevel: [60, 65, 70, 75, 80, 85, 90, 95, 100, 105],
            totalHours: 825,
            nextRank: "Line Cook"
        },
        "Line Cook": {
            color: "Gold",
            levels: 10,
            hoursPerLevel: [110, 115, 120, 125, 130, 135, 140, 145, 150, 155],
            totalHours: 1325,
            nextRank: "Sous Chef"
        },
        "Sous Chef": {
            color: "Platinum",
            levels: 10,
            hoursPerLevel: [160, 165, 170, 175, 180, 185, 190, 195, 200, 205],
            totalHours: 1825,
            nextRank: "Head Chef"
        },
        "Head Chef": {
            color: "Master",
            levels: 10,
            hoursPerLevel: [210, 215, 220, 225, 230, 235, 240, 245, 250, 255],
            totalHours: 2325,
            nextRank: null
        }
    };
    
    // Define the technique categories
    const TECHNIQUE_CATEGORIES = {
        "Knife Skills": {
            icon: "🔪",
            description: "Precision cutting techniques"
        },
        "Heat Management": {
            icon: "🔥",
            description: "Temperature control and cooking methods"
        },
        "Flavor Building": {
            icon: "🌶️",
            description: "Seasoning and taste development"
        },
        "Ingredient Knowledge": {
            icon: "🥕",
            description: "Selection and understanding of foods"
        },
        "Kitchen Management": {
            icon: "⏱️",
            description: "Organization and workflow"
        }
    };
    
    /**
     * Calculate the total hours needed to reach a specific level in a rank
     * @param {string} rankTitle - The rank title
     * @param {number} targetLevel - The target level
     * @returns {number} - Total hours needed
     */
    function calculateHoursToLevel(rankTitle, targetLevel) {
        const rankInfo = RANK_PROGRESSION[rankTitle];
        
        if (!rankInfo) {
            console.error(`Rank information not found for ${rankTitle}`);
            return 0;
        }
        
        // Sum up hours for all levels up to target
        let totalHours = 0;
        for (let i = 0; i < targetLevel && i < rankInfo.hoursPerLevel.length; i++) {
            totalHours += rankInfo.hoursPerLevel[i];
        }
        
        return totalHours;
    }
    
    /**
     * Calculate the progress between two levels
     * @param {number} currentHours - Current total hours
     * @param {number} previousLevelHours - Hours at previous level
     * @param {number} nextLevelHours - Hours at next level
     * @returns {number} - Progress percentage
     */
    function calculateLevelProgress(currentHours, previousLevelHours, nextLevelHours) {
        const levelRequirement = nextLevelHours - previousLevelHours;
        const currentProgress = currentHours - previousLevelHours;
        
        // Avoid division by zero
        if (levelRequirement <= 0) {
            return 100;
        }
        
        const percentage = (currentProgress / levelRequirement) * 100;
        return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
    }
    
    /**
     * Check if a user can level up an attribute
     * @param {Object} attribute - The attribute object
     * @param {string} rankTitle - The current rank title
     * @returns {boolean} - Whether the attribute can level up
     */
    function canLevelUp(attribute, rankTitle) {
        const rankInfo = RANK_PROGRESSION[rankTitle];
        
        if (!rankInfo) {
            return false;
        }
        
        return attribute.totalHours >= attribute.hoursToNextLevel && 
               attribute.currentLevel <= rankInfo.levels;
    }
    
    /**
     * Check if a user can rank up
     * @param {Object} userProfile - The user profile
     * @returns {boolean} - Whether the user can rank up
     */
    function canRankUp(userProfile) {
        const currentRank = userProfile.currentRank.title;
        const rankInfo = RANK_PROGRESSION[currentRank];
        
        if (!rankInfo || !rankInfo.nextRank) {
            return false;
        }
        
        // Check if all attributes have reached max level for this rank
        return Object.values(userProfile.attributes).every(
            attr => attr.currentLevel > rankInfo.levels
        );
    }
    
    /**
     * Get the next challenge quest based on user's level
     * @param {Object} userProfile - The user profile
     * @param {Array} quests - All available quests
     * @returns {Object|null} - The next challenge quest or null if none
     */
    function getNextChallengeQuest(userProfile, quests) {
        const currentRank = userProfile.currentRank.title;
        const currentLevel = userProfile.currentRank.level;
        
        // Look for challenge quests that match the user's rank and are at or just above their level
        const challengeQuests = quests.filter(quest => 
            quest.type === "challenge" && 
            quest.rank.title === currentRank &&
            quest.rank.level >= currentLevel &&
            !userProfile.completedQuests.includes(quest.id)
        );
        
        // Sort by level (ascending)
        challengeQuests.sort((a, b) => a.rank.level - b.rank.level);
        
        return challengeQuests.length > 0 ? challengeQuests[0] : null;
    }
    
    /**
     * Calculate the hours earned from a quest
     * @param {Object} quest - The quest object
     * @returns {number} - Total hours earned
     */
    function calculateQuestHours(quest) {
        if (!quest.attributeRewards) {
            return 0;
        }
        
        return Object.values(quest.attributeRewards)
            .reduce((total, hours) => total + hours, 0);
    }
    
    /**
     * Get quests that are appropriate for the user's current level
     * @param {Object} userProfile - The user profile
     * @param {Array} quests - All available quests
     * @param {number} count - Maximum number of quests to return
     * @returns {Array} - Appropriate quests
     */
    function getAppropriateQuests(userProfile, quests, count = 5) {
        const currentRank = userProfile.currentRank.title;
        const currentLevel = userProfile.currentRank.level;
        
        // Get unlocked, not completed quests
        const availableQuests = userProfile.unlockedQuests
            .filter(id => !userProfile.completedQuests.includes(id))
            .map(id => quests.find(q => q.id === id))
            .filter(q => q !== undefined);
        
        // Filter quests by rank and level
        const appropriateQuests = availableQuests.filter(quest => 
            quest.rank.title === currentRank &&
            quest.rank.level <= currentLevel + 1 // Include next level quests
        );
        
        // Sort by quest type importance: Training > Side > Main > Explore
        const questTypeOrder = {
            "training": 0,
            "side": 1,
            "main": 2,
            "explore": 3
        };
        
        appropriateQuests.sort((a, b) => {
            // First sort by level
            if (a.rank.level !== b.rank.level) {
                return a.rank.level - b.rank.level;
            }
            
            // Then by quest type
            return questTypeOrder[a.type] - questTypeOrder[b.type];
        });
        
        return appropriateQuests.slice(0, count);
    }
    
    /**
     * Format the time required for a quest
     * @param {number} minutes - Time in minutes
     * @returns {string} - Formatted time string
     */
    function formatTimeRequired(minutes) {
        if (!minutes) return "Unknown";
        
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            if (remainingMinutes === 0) {
                return `${hours} hr`;
            } else {
                return `${hours} hr ${remainingMinutes} min`;
            }
        }
    }
    
    // Public API
    return {
        RANK_PROGRESSION,
        TECHNIQUE_CATEGORIES,
        calculateHoursToLevel,
        calculateLevelProgress,
        canLevelUp,
        canRankUp,
        getNextChallengeQuest,
        calculateQuestHours,
        getAppropriateQuests,
        formatTimeRequired
    };
})();
