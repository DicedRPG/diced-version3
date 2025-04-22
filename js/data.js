/**
 * data.js - Handles all data loading, caching, and storage functionality
 * Updated to remove skills and journal features.
 */

// Data manager namespace
const DataManager = (() => {
    // Configuration
    const CONFIG = {
        // URL for quest data - replace with your GitHub URL or local path
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
     * Using ProgressionSystem to create a standardized profile
     * @returns {Object} - The default user profile
     */
    function initDefaultUserProfile() {
        // Use ProgressionSystem to create a baseline profile
        const baseProfile = ProgressionSystem.createNewUserProfile();
        
        // Add our app-specific properties
        const userProfile = {
            ...baseProfile,
            completedQuests: [],
            unlockedQuests: ["T1-1", "T1-2", "T1-3", "T1-6", "T1-7", "T1-8", "S1-1", "S1-5", "S1-6", "S1-7", "M1-1", "M1-4", "M1-5", "E1-1", "E1-3", "E1-4"],
            // Track progression milestones
            milestones: {
                questsCompleted: 0,
                hoursAccumulated: 0,
                rankAdvances: 0,
                levelUps: 0
            },
            // Track recent achievements
            recentAchievements: []
        };
        
        return userProfile;
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
                
                // Ensure all required properties exist
                if (!dataStore.userProfile.recentAchievements) {
                    dataStore.userProfile.recentAchievements = [];
                }
                
                if (!dataStore.userProfile.milestones) {
                    dataStore.userProfile.milestones = {
                        questsCompleted: 0,
                        hoursAccumulated: 0,
                        rankAdvances: 0,
                        levelUps: 0
                    };
                }
                
                // Add attribute currentRank property if missing
                const attributes = dataStore.userProfile.attributes || {};
                Object.keys(attributes).forEach(attrName => {
                    if (!attributes[attrName].currentRank) {
                        attributes[attrName].currentRank = dataStore.userProfile.currentRank.title;
                    }
                });
                
                // Calculate rank just to make sure everything is consistent
                dataStore.userProfile = ProgressionSystem.calculateUserRank(dataStore.userProfile);
                
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
     * Attempt to complete a quest
     * @param {string} questId - The quest ID
     * @returns {Promise<Object>} - Promise resolving to result object
     */
    async function completeQuest(questId) {
        // Load user profile and quest data
        let userProfile = loadUserProfile();
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
        
        // Save the current state for comparison later
        const previousRank = userProfile.currentRank.title;
        const previousLevel = userProfile.currentRank.level;
        
        // Collect rewards data
        const rewards = {};

        // Add attribute rewards using ProgressionSystem
        // Process each attribute one at a time to track individual updates
        for (const [attr, hours] of Object.entries(quest.attributeRewards)) {
            if (hours > 0) {
                rewards[attr] = hours;
                
                // Update attribute using ProgressionSystem
                const result = ProgressionSystem.updateAttributeHours(userProfile, attr, hours);
                
                // Update the user profile with the result
                userProfile = result.profile;
                
                // Log the update status for debugging
                console.log(`Attribute ${attr} update: ${result.status}`);
            }
        }
        
        // Mark quest as completed
        userProfile.completedQuests.push(questId);
        
        // Update milestone counters
        userProfile.milestones.questsCompleted++;
        
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
        
        // Create quest completion achievement
        const achievement = {
            type: 'quest_complete',
            timestamp: Date.now(),
            questId: questId,
            questTitle: quest.title,
            questType: quest.type,
            rewards: {...rewards}
        };
        
        // Add to recent achievements
        userProfile.recentAchievements.unshift(achievement);
        if (userProfile.recentAchievements.length > 10) {
            userProfile.recentAchievements.pop();
        }
        
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
        // Load the user profile
        const userProfile = loadUserProfile();
        
        // Check if the attribute exists
        if (!userProfile.attributes[attribute]) {
            console.error(`Attribute not found: ${attribute}`);
            return false;
        }
        
        // Update the attribute using ProgressionSystem
        const result = ProgressionSystem.updateAttributeHours(userProfile, attribute, hours);
        
        // Save the updated profile
        dataStore.userProfile = result.profile;
        saveUserProfile();
        
        return true;
    }
    
    /**
     * Get recommended quests based on current progress
     * @param {number} count - Number of quests to recommend
     * @returns {Promise<Array>} - Promise resolving to array of recommended quests
     */
    async function getRecommendedQuests(count = 3) {
        const userProfile = loadUserProfile();
        const quests = await getQuestData();
        
        // Get attributes sorted by progress (lowest first)
        const attributes = Object.entries(userProfile.attributes)
            .sort((a, b) => a[1].totalHours - b[1].totalHours)
            .map(entry => entry[0]);
        
        const lowestAttribute = attributes[0];
        
        // Get unlocked, not completed quests
        const availableQuests = userProfile.unlockedQuests
            .filter(id => !userProfile.completedQuests.includes(id))
            .map(id => quests.find(q => q.id === id))
            .filter(q => q !== undefined);
        
        // Sort quests by reward for lowest attribute
        const sortedQuests = [...availableQuests]
            .sort((a, b) => {
                const aReward = a.attributeRewards[lowestAttribute] || 0;
                const bReward = b.attributeRewards[lowestAttribute] || 0;
                return bReward - aReward;
            });
        
        return sortedQuests.slice(0, count);
    }
    
    /**
     * Reset user progress (for testing)
     */
    function resetUserProgress() {
        dataStore.userProfile = initDefaultUserProfile();
        saveUserProfile();
        console.log("User progress has been reset");
        return dataStore.userProfile;
    }
    
    /**
     * Get user statistics
     * @returns {Object} - User statistics
     */
    function getUserStats() {
        const userProfile = loadUserProfile();
        
        // Get rank progress info using ProgressionSystem
        const rankProgress = ProgressionSystem.getHoursForNextRank(userProfile);
        
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
        
        return {
            questsCompleted: userProfile.completedQuests.length,
            totalHours: totalHours,
            avgHoursPerAttribute: totalHours / 4,
            avgLevel: avgLevel,
            attributeBalance: attributeBalance,
            rankProgress: rankProgress.progressPercentage / 100,
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
        getRecommendedQuests: getRecommendedQuests,
        resetUserProgress: resetUserProgress,
        getUserStats: getUserStats,
        getRecentAchievements: getRecentAchievements
    };
})();
