/**
 * data.js - Handles all data loading, caching, and storage functionality
 * This file manages the application's data layer, handling fetching quest data 
 * from the server and managing local storage for user progress.
 * 
 * UPDATED: Now fully integrated with ProgressManager for progression tracking
 * FIXED: Issues with skills updating and hours calculation
 */

// Data manager namespace
const DataManager = (() => {
    // Configuration
    const CONFIG = {
        // URL for quest data - replace with your GitHub URL
        questDataUrl: 'https://dicedrpg.github.io/diced-rpg-data/data/quests.json',
        
        // Local storage keys
        storageKeys: {
            userProfile: 'diced_user_profile',
            questData: 'diced_quest_data',
            lastFetch: 'diced_last_fetch'
        },
        
        // Cache expiration (24 hours in milliseconds)
        cacheExpiration: 24 * 60 * 60 * 1000
    };
    
    // In-memory data store
    let dataStore = {
        userProfile: null,
        questData: null
    };
    
    /**
     * Initialize the default user profile if none exists
     * @returns {Object} - The default user profile
     */
    function initDefaultUserProfile() {
        return {
            userId: "user-" + Date.now(),
            username: "Player",
            currentRank: {
                title: "Home Cook",
                color: "Bronze",
                level: 1
            },
            attributes: {
                technique: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: ProgressManager.RANK_PROGRESSION["Home Cook"].hoursPerLevel[0],
                    progressPercentage: 0
                },
                ingredients: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: ProgressManager.RANK_PROGRESSION["Home Cook"].hoursPerLevel[0],
                    progressPercentage: 0
                },
                flavor: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: ProgressManager.RANK_PROGRESSION["Home Cook"].hoursPerLevel[0],
                    progressPercentage: 0
                },
                management: {
                    totalHours: 0,
                    currentLevel: 1, 
                    hoursToNextLevel: ProgressManager.RANK_PROGRESSION["Home Cook"].hoursPerLevel[0],
                    progressPercentage: 0
                }
            },
            completedQuests: [],
            unlockedQuests: ["T1-1", "T1-2", "T1-3", "T1-6", "T1-7", "T1-8", "S1-1", "S1-5", "S1-6", "S1-7", "M1-1", "M1-4", "M1-5", "E1-1", "E1-3", "E1-4"],
            masteredTechniques: [],
            journalEntries: [],
            // New fields for tracking progression milestones
            milestones: {
                questsCompleted: 0,
                techniquesLearned: 0,
                hoursAccumulated: 0,
                rankAdvances: 0,
                levelUps: 0
            },
            // New field for tracking recent achievements
            recentAchievements: []
        };
    }
    
    /**
     * Load the user profile from local storage
     * @returns {Object} - The user profile
     */
    function loadUserProfile() {
        // Check if we already have it in memory
        if (dataStore.userProfile) {
            return dataStore.userProfile;
        }
        
        // Try to get from local storage
        const storedProfile = localStorage.getItem(CONFIG.storageKeys.userProfile);
        
        if (storedProfile) {
            try {
                dataStore.userProfile = JSON.parse(storedProfile);
                
                // Ensure masteredTechniques is an array
                if (!dataStore.userProfile.masteredTechniques) {
                    dataStore.userProfile.masteredTechniques = [];
                }
                
                // Ensure recentAchievements is an array
                if (!dataStore.userProfile.recentAchievements) {
                    dataStore.userProfile.recentAchievements = [];
                }
                
                // Ensure milestones object exists
                if (!dataStore.userProfile.milestones) {
                    dataStore.userProfile.milestones = {
                        questsCompleted: 0,
                        techniquesLearned: 0,
                        hoursAccumulated: 0,
                        rankAdvances: 0,
                        levelUps: 0
                    };
                }
                
                return dataStore.userProfile;
            } catch (e) {
                console.error('Error parsing stored user profile:', e);
                // If there's an error, create a new profile
            }
        }
        
        // If no profile exists or there was an error, create a new one
        dataStore.userProfile = initDefaultUserProfile();
        saveUserProfile();
        return dataStore.userProfile;
    }
    
    /**
     * Save the user profile to local storage
     */
    function saveUserProfile() {
        if (dataStore.userProfile) {
            localStorage.setItem(
                CONFIG.storageKeys.userProfile, 
                JSON.stringify(dataStore.userProfile)
            );
        }
    }
    
    /**
     * Fetch quest data from server or use cached data
     * @returns {Promise<Object>} - Promise resolving to quest data
     */
    async function fetchQuestData() {
        // Check if we need to fetch new data
        const lastFetch = localStorage.getItem(CONFIG.storageKeys.lastFetch);
        const cachedData = localStorage.getItem(CONFIG.storageKeys.questData);
        const now = Date.now();
        
        // Use cached data if it exists and is not expired
        if (
            lastFetch && 
            cachedData && 
            (now - parseInt(lastFetch)) < CONFIG.cacheExpiration
        ) {
            try {
                dataStore.questData = JSON.parse(cachedData);
                return dataStore.questData;
            } catch (e) {
                console.error('Error parsing cached quest data:', e);
                // If there's an error, fetch new data
            }
        }
        
        // Fetch new data
        try {
            const response = await fetch(CONFIG.questDataUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the data
            dataStore.questData = data;
            localStorage.setItem(CONFIG.storageKeys.questData, JSON.stringify(data));
            localStorage.setItem(CONFIG.storageKeys.lastFetch, now.toString());
            
            return data;
        } catch (e) {
            console.error('Error fetching quest data:', e);
            
            // If fetch fails but we have cached data, use it regardless of age
            if (cachedData) {
                try {
                    return JSON.parse(cachedData);
                } catch (parseError) {
                    console.error('Error parsing cached quest data:', parseError);
                }
            }
            
            // If all else fails, return empty array
            return [];
        }
    }
    
    /**
     * Get quest data (fetch if needed)
     * @returns {Promise<Object>} - Promise resolving to quest data
     */
    async function getQuestData() {
        if (dataStore.questData) {
            return dataStore.questData;
        }
        
        return await fetchQuestData();
    }
    
    /**
     * Debug quest techniques - helper for fixing skills issue
     * @param {string} questId - The quest ID to debug
     */
    function debugQuestTechniques(questId) {
        getQuestData().then(quests => {
            const quest = quests.find(q => q.id === questId);
            
            if (!quest) {
                console.error(`Quest not found: ${questId}`);
                return;
            }
            
            console.log(`Quest ${questId}: ${quest.title}`);
            console.log(`Techniques learned: ${JSON.stringify(quest.techniquesLearned || [])}`);
            
            // Check if techniques exist in SkillsManager
            if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned)) {
                quest.techniquesLearned.forEach(techniqueId => {
                    const technique = SkillsManager.getAllTechniques()[techniqueId];
                    console.log(`Technique ${techniqueId}: ${technique ? 'Exists' : 'NOT FOUND'}`);
                });
            } else {
                console.warn(`Quest ${questId} has no techniquesLearned array defined`);
            }
        });
    }
    
    /**
     * Update user attributes when completing a quest
     * @param {string} questId - The ID of the completed quest
     * @returns {Object} - Result object with success status and message
     */
    async function completeQuest(questId) {
        // Load user profile and quest data
        const userProfile = loadUserProfile();
        const quests = await getQuestData();
        
        // Find the quest
        const quest = quests.find(q => q.id === questId);
        
        if (!quest) {
            return { 
                success: false, 
                message: "Quest not found" 
            };
        }
        
        // Check if quest is already completed
        if (userProfile.completedQuests.includes(questId)) {
            return { 
                success: false, 
                message: "Quest already completed" 
            };
        }
        
        // Check if quest is unlocked
        if (!userProfile.unlockedQuests.includes(questId)) {
            return { 
                success: false, 
                message: "Quest not unlocked yet" 
            };
        }
        
        // Debug: Log before completion state
        console.log(`Before completion - Attribute hours:`, 
            Object.entries(userProfile.attributes).map(([attr, data]) => 
                `${attr}: ${data.totalHours.toFixed(1)}`).join(', '));
        
        // Add attribute rewards
        const rewards = {};
        const previousRank = userProfile.currentRank.title;
        const previousLevel = userProfile.currentRank.level;
        
        Object.keys(quest.attributeRewards).forEach(attr => {
            const hours = quest.attributeRewards[attr];
            if (hours > 0) {
                rewards[attr] = hours;
                updateAttribute(attr, hours);
            }
        });
        
        // Debug: Log quest techniques
        console.log(`Quest ${questId} techniques:`, quest.techniquesLearned || 'none defined');
        
        // Add techniques learned if present
        let techniquesLearned = 0;
        if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned)) {
            quest.techniquesLearned.forEach(technique => {
                if (!userProfile.masteredTechniques.includes(technique)) {
                    // Debug: Log technique being added
                    console.log(`Adding technique ${technique} to masteredTechniques`);
                    
                    userProfile.masteredTechniques.push(technique);
                    techniquesLearned++;
                }
            });
            
            // Debug: Log masteredTechniques after adding
            console.log(`masteredTechniques after update:`, userProfile.masteredTechniques);
        } else {
            console.warn(`Quest ${questId} has no techniquesLearned array or it's not valid`);
        }
        
        // Mark quest as completed
        userProfile.completedQuests.push(questId);
        
        // Update milestone counters
        userProfile.milestones.questsCompleted++;
        userProfile.milestones.techniquesLearned += techniquesLearned;
        
        // Calculate total hours added
        const totalHoursAdded = Object.values(rewards).reduce((sum, val) => sum + val, 0);
        userProfile.milestones.hoursAccumulated += totalHoursAdded;
        
        // Unlock new quests if defined
        if (quest.unlocks && Array.isArray(quest.unlocks)) {
            quest.unlocks.forEach(id => {
                if (!userProfile.unlockedQuests.includes(id)) {
                    userProfile.unlockedQuests.push(id);
                }
            });
        }
        
        // Create achievement entry
        const achievement = {
            type: 'quest_complete',
            timestamp: Date.now(),
            questId: questId,
            questTitle: quest.title,
            questType: quest.type,
            rewards: {...rewards}
        };
        
        // Add to recent achievements (keep most recent 10)
        userProfile.recentAchievements.unshift(achievement);
        if (userProfile.recentAchievements.length > 10) {
            userProfile.recentAchievements.pop();
        }
        
        // Debug: Log after completion state
        console.log(`After completion - Attribute hours:`, 
            Object.entries(userProfile.attributes).map(([attr, data]) => 
                `${attr}: ${data.totalHours.toFixed(1)}`).join(', '));
        
        // Save changes
        saveUserProfile();
        
        // Check if rank or level changed
        const currentRank = userProfile.currentRank.title;
        const currentLevel = userProfile.currentRank.level;
        
        if (previousRank !== currentRank) {
            userProfile.milestones.rankAdvances++;
            
            // Create rank-up achievement
            const rankUpAchievement = {
                type: 'rank_up',
                timestamp: Date.now(),
                previousRank: previousRank,
                newRank: currentRank
            };
            
            userProfile.recentAchievements.unshift(rankUpAchievement);
            if (userProfile.recentAchievements.length > 10) {
                userProfile.recentAchievements.pop();
            }
            
            // Save changes again
            saveUserProfile();
            
            return { 
                success: true, 
                message: `Quest completed! You advanced to ${currentRank}!`, 
                rewards: rewards,
                rankUp: true,
                newRank: currentRank
            };
        } else if (previousLevel !== currentLevel) {
            userProfile.milestones.levelUps++;
            
            // Create level-up achievement
            const levelUpAchievement = {
                type: 'level_up',
                timestamp: Date.now(),
                rank: currentRank,
                previousLevel: previousLevel,
                newLevel: currentLevel
            };
            
            userProfile.recentAchievements.unshift(levelUpAchievement);
            if (userProfile.recentAchievements.length > 10) {
                userProfile.recentAchievements.pop();
            }
            
            // Save changes again
            saveUserProfile();
            
            return { 
                success: true, 
                message: `Quest completed! You reached ${currentRank} Level ${currentLevel}!`, 
                rewards: rewards,
                levelUp: true,
                newLevel: currentLevel
            };
        }
        
        return { 
            success: true, 
            message: "Quest completed!", 
            rewards: rewards
        };
    }
    
    /**
     * Update an attribute with new hours
     * @param {string} attribute - The attribute to update
     * @param {number} hours - The hours to add
     * @returns {boolean} - Success status
     */
    function updateAttribute(attribute, hours) {
        const userProfile = loadUserProfile();
        
        if (!userProfile.attributes[attribute]) {
            return false;
        }
        
        // Debug: Log before and after hours
        const beforeHours = userProfile.attributes[attribute].totalHours;
        userProfile.attributes[attribute].totalHours += hours;
        const afterHours = userProfile.attributes[attribute].totalHours;
        
        console.log(`Updated ${attribute}: ${beforeHours.toFixed(1)} + ${hours} = ${afterHours.toFixed(1)}`);
        
        // Calculate progress percentage using ProgressManager
        const attrData = userProfile.attributes[attribute];
        const rankTitle = userProfile.currentRank.title;
        const previousLevelHours = ProgressManager.calculateHoursToLevel(
            rankTitle, 
            attrData.currentLevel - 1
        );
        
        // Use ProgressManager to calculate the progress percentage
        attrData.progressPercentage = ProgressManager.calculateLevelProgress(
            attrData.totalHours,
            previousLevelHours,
            attrData.hoursToNextLevel
        );
        
        // Check for level up
        checkForLevelUp();
        
        // Save changes
        saveUserProfile();
        
        return true;
    }
    
    /**
     * Check if any attributes have leveled up
     * Uses ProgressManager for level and rank calculations
     */
    function checkForLevelUp() {
        const userProfile = loadUserProfile();
        const currentRank = userProfile.currentRank.title;
        
        // Use ProgressManager's rank progression
        const rankInfo = ProgressManager.RANK_PROGRESSION[currentRank];
        
        if (!rankInfo) {
            console.error(`Rank information not found for ${currentRank}`);
            return;
        }
        
        // Check each attribute for level up
        Object.keys(userProfile.attributes).forEach(attr => {
            const attribute = userProfile.attributes[attr];
            
            // Use ProgressManager to check if can level up
            if (ProgressManager.canLevelUp(attribute, currentRank)) {
                // Debug: Log level up
                console.log(`${attr} leveled up from ${attribute.currentLevel} to ${attribute.currentLevel + 1}`);
                
                // Level up the attribute
                attribute.currentLevel += 1;
                
                // If not at max level for this rank, set new hours goal
                if (attribute.currentLevel <= rankInfo.levels) {
                    const nextLevelHours = rankInfo.hoursPerLevel[attribute.currentLevel - 1];
                    attribute.hoursToNextLevel = attribute.totalHours + nextLevelHours;
                    
                    // Debug: Log new level target
                    console.log(`${attr} new target: ${attribute.hoursToNextLevel.toFixed(1)} hours`);
                }
                
                // Reset progress percentage
                attribute.progressPercentage = 0;
            }
        });
        
        // Use ProgressManager to check if can rank up
        if (ProgressManager.canRankUp(userProfile)) {
            // Debug: Log rank up
            console.log(`Ranking up from ${currentRank} to ${rankInfo.nextRank}`);
            
            // Rank up!
            userProfile.currentRank.title = rankInfo.nextRank;
            userProfile.currentRank.color = ProgressManager.RANK_PROGRESSION[rankInfo.nextRank].color;
            userProfile.currentRank.level = 1;
            
            // Reset level-specific values for the new rank
            Object.keys(userProfile.attributes).forEach(attr => {
                const attribute = userProfile.attributes[attr];
                attribute.currentLevel = 1;
                attribute.hoursToNextLevel = attribute.totalHours + 
                    ProgressManager.RANK_PROGRESSION[rankInfo.nextRank].hoursPerLevel[0];
                attribute.progressPercentage = 0;
                
                // Debug: Log new attribute targets
                console.log(`${attr} reset to level 1, new target: ${attribute.hoursToNextLevel.toFixed(1)} hours`);
            });
        } else {
            // Just update the current level within the rank
            const lowestLevel = Math.min(
                ...Object.values(userProfile.attributes).map(attr => attr.currentLevel)
            );
            userProfile.currentRank.level = lowestLevel;
            
            // Debug: Log rank level update
            console.log(`Rank level updated to ${lowestLevel} (lowest attribute level)`);
        }
        
        // Save changes
        saveUserProfile();
    }
    
    /**
     * Get recommended quests based on current progress
     * Uses ProgressManager to find appropriate quests
     * @param {number} count - Number of quests to recommend
     * @returns {Promise<Array>} - Promise resolving to array of recommended quests
     */
    async function getRecommendedQuests(count = 3) {
        const userProfile = loadUserProfile();
        const quests = await getQuestData();
        
        // Use ProgressManager to get appropriate quests
        const availableQuests = userProfile.unlockedQuests
            .filter(id => !userProfile.completedQuests.includes(id))
            .map(id => quests.find(q => q.id === id))
            .filter(q => q !== undefined);
            
        return ProgressManager.getAppropriateQuests(userProfile, availableQuests, count);
    }
    
    /**
     * Reset user progress (for testing)
     */
    function resetUserProgress() {
        dataStore.userProfile = initDefaultUserProfile();
        saveUserProfile();
        return dataStore.userProfile;
    }
    
    /**
     * Add a journal entry
     * @param {string} questId - The ID of the quest
     * @param {string} content - The journal entry content
     * @param {Array} photos - Array of photo URLs (optional)
     * @returns {Object} - Result object with success status and message
     */
    async function addJournalEntry(questId, content, photos = []) {
        const userProfile = loadUserProfile();
        const quests = await getQuestData();
        
        // Find the quest
        const quest = quests.find(q => q.id === questId);
        
        if (!quest) {
            return { success: false, message: "Quest not found" };
        }
        
        const entry = {
            id: `journal-${Date.now()}`,
            date: new Date().toISOString(),
            questId: questId,
            questTitle: quest.title,
            content: content,
            photos: photos
        };
        
        userProfile.journalEntries.push(entry);
        saveUserProfile();
        
        return { success: true, message: "Journal entry added" };
    }
    
    /**
     * Get user statistics
     * @returns {Object} - User statistics
     */
    function getUserStats() {
        const userProfile = loadUserProfile();
        
        // Calculate total hours across all attributes
        const totalHours = Object.values(userProfile.attributes)
            .reduce((sum, attr) => sum + attr.totalHours, 0);
        
        // Calculate average level across all attributes
        const avgLevel = Object.values(userProfile.attributes)
            .reduce((sum, attr) => sum + attr.currentLevel, 0) / 4;
        
        // Calculate attribute balance (how evenly attributes are developed)
        const levels = Object.values(userProfile.attributes).map(attr => attr.currentLevel);
        const maxLevel = Math.max(...levels);
        const minLevel = Math.min(...levels);
        const attributeBalance = minLevel / maxLevel; // 1.0 means perfectly balanced
        
        // Calculate rank progress
        const currentRank = userProfile.currentRank.title;
        const rankInfo = ProgressManager.RANK_PROGRESSION[currentRank];
        
        // Calculate average hours per attribute (this is what determines rank progression)
        const avgHoursPerAttribute = totalHours / 4;
        const rankProgress = avgHoursPerAttribute / rankInfo.totalHours;
        
        return {
            questsCompleted: userProfile.completedQuests.length,
            techniquesLearned: userProfile.masteredTechniques.length,
            totalHours: totalHours,
            avgHoursPerAttribute: avgHoursPerAttribute,
            avgLevel: avgLevel,
            attributeBalance: attributeBalance,
            rankProgress: rankProgress,
            currentRank: userProfile.currentRank,
            milestones: userProfile.milestones
        };
    }
    
    /**
     * Get all recent achievements
     * @param {number} count - Maximum number of achievements to return
     * @returns {Array} - Recent achievements
     */
    function getRecentAchievements(count = 10) {
        const userProfile = loadUserProfile();
        return userProfile.recentAchievements.slice(0, count);
    }
    
    /**
     * Add a technique to the user's mastered techniques
     * @param {string} techniqueId - The technique ID
     * @returns {Object} - Result object with success status and message
     */
    function addMasteredTechnique(techniqueId) {
        const userProfile = loadUserProfile();
        
        // Check if technique is already mastered
        if (userProfile.masteredTechniques.includes(techniqueId)) {
            return { 
                success: false, 
                message: "Technique already mastered" 
            };
        }
        
        // Add technique
        userProfile.masteredTechniques.push(techniqueId);
        
        // Debug: Log technique added
        console.log(`Manually added technique ${techniqueId} to masteredTechniques`);
        
        // Update milestone counter
        userProfile.milestones.techniquesLearned++;
        
        // Create achievement
        const achievement = {
            type: 'technique_learned',
            timestamp: Date.now(),
            techniqueId: techniqueId
        };
        
        // Add to recent achievements
        userProfile.recentAchievements.unshift(achievement);
        if (userProfile.recentAchievements.length > 10) {
            userProfile.recentAchievements.pop();
        }
        
        // Save changes
        saveUserProfile();
        
        return { 
            success: true, 
            message: "Technique mastered" 
        };
    }
    
    // Public API
    return {
        initialize: async function() {
            // Load user profile first
            loadUserProfile();
            
            // Then pre-fetch quest data
            await getQuestData();
            
            return {
                userProfile: dataStore.userProfile,
                questData: dataStore.questData
            };
        },
        getUserProfile: loadUserProfile,
        saveUserProfile: saveUserProfile,
        getQuestData: getQuestData,
        completeQuest: completeQuest,
        updateAttribute: updateAttribute,
        addJournalEntry: addJournalEntry,
        getRecommendedQuests: getRecommendedQuests,
        resetUserProgress: resetUserProgress,
        getUserStats: getUserStats,
        getRecentAchievements: getRecentAchievements,
        addMasteredTechnique: addMasteredTechnique,
        // Debug functions
        debugQuestTechniques: debugQuestTechniques
    };
})();
