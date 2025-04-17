/**
 * progress.js - Handles all progression and ranking functionality
 * This file serves as a bridge between the application and the ProgressionSystem module.
 * It maintains the same API as the previous version while using the new progression system.
 */

// Progress manager namespace
const ProgressManager = (() => {
    // Define the rank progression system by referencing ProgressionSystem
    // This maintains backward compatibility with existing code
    const RANK_PROGRESSION = {};
    
    // Initialize RANK_PROGRESSION from ProgressionSystem.RANKS
    Object.keys(ProgressionSystem.RANKS).forEach(rankTitle => {
        const rankData = ProgressionSystem.RANKS[rankTitle];
        RANK_PROGRESSION[rankTitle] = {
            color: rankData.color,
            levels: rankData.levels,
            hoursPerLevel: [...rankData.levelHours], // Clone the array
            totalHours: rankData.attributeHoursRequired,
            nextRank: rankData.nextRank
        };
    });
    
    // Define the technique categories (this is unchanged from the original)
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
        // Use ProgressionSystem's function for this calculation
        const totalHoursPreviousRanks = ProgressionSystem.getTotalHoursForRank(rankTitle);
        
        // Get the rank data
        const rankData = ProgressionSystem.RANKS[rankTitle];
        
        if (!rankData) {
            console.error(`Rank information not found for ${rankTitle}`);
            return 0;
        }
        
        // Sum up hours for all levels up to target within the current rank
        let totalHoursWithinRank = 0;
        for (let i = 0; i < targetLevel && i < rankData.levelHours.length; i++) {
            totalHoursWithinRank += rankData.levelHours[i];
        }
        
        return totalHoursPreviousRanks + totalHoursWithinRank;
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
        // Just use the hoursToNextLevel directly from the attribute
        return attribute.totalHours >= attribute.hoursToNextLevel;
    }
    
    /**
     * Check if a user can rank up
     * @param {Object} userProfile - The user profile
     * @returns {boolean} - Whether the user can rank up
     */
    function canRankUp(userProfile) {
        return ProgressionSystem.canAdvanceToNextRank(userProfile);
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
        const availableQuests = quests.filter(q => 
            userProfile.unlockedQuests.includes(q.id) && 
            !userProfile.completedQuests.includes(q.id)
        );
        
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
            "explore": 3,
            "challenge": 4
        };
        
        appropriateQuests.sort((a, b) => {
            // First sort by level
            if (a.rank.level !== b.rank.level) {
                return a.rank.level - b.rank.level;
            }
            
            // Then by quest type
            return (questTypeOrder[a.type] || 5) - (questTypeOrder[b.type] || 5);
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
    
    // Public API - maintain the same interface as the original for compatibility
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
