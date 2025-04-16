/**
 * data.js - Handles all data loading, caching, and storage functionality
 * This file manages the application's data layer, handling fetching quest data 
 * from the server and managing local storage for user progress.
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
                level: 1,
                nextLevelAt: 20 // hours needed to reach next level
            },
            attributes: {
                technique: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: 5,
                    progressPercentage: 0
                },
                ingredients: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: 5,
                    progressPercentage: 0
                },
                flavor: {
                    totalHours: 0,
                    currentLevel: 1,
                    hoursToNextLevel: 5,
                    progressPercentage: 0
                },
                management: {
                    totalHours: 0,
                    currentLevel: 1, 
                    hoursToNextLevel: 5,
                    progressPercentage: 0
                }
            },
            completedQuests: [],
            unlockedQuests: ["T1-1", "T1-2", "T1-3", "S1-1", "M1-1", "E1-1"],
            masteredTechniques: [],
            journalEntries: []
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
        
        // Add attribute rewards
        const rewards = {};
        
        Object.keys(quest.attributeRewards).forEach(attr => {
            const hours = quest.attributeRewards[attr];
            if (hours > 0) {
                rewards[attr] = hours;
                updateAttribute(attr, hours);
            }
        });
        
        // Add techniques learned if present
        if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned)) {
            quest.techniquesLearned.forEach(technique => {
                if (!userProfile.masteredTechniques.includes(technique)) {
                    userProfile.masteredTechniques.push(technique);
                }
            });
        }
        
        // Mark quest as completed
        userProfile.completedQuests.push(questId);
        
        // Unlock new quests if defined
        if (quest.unlocks && Array.isArray(quest.unlocks)) {
            quest.unlocks.forEach(id => {
                if (!userProfile.unlockedQuests.includes(id)) {
                    userProfile.unlockedQuests.push(id);
                }
            });
        }
        
        // Save changes
        saveUserProfile();
        
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
        
        userProfile.attributes[attribute].totalHours += hours;
        
        // Calculate progress percentage to next level
        const totalHours = userProfile.attributes[attribute].totalHours;
        const nextLevelAt = userProfile.attributes[attribute].hoursToNextLevel;
        const progressPercentage = (totalHours / nextLevelAt) * 100;
        
        userProfile.attributes[attribute].progressPercentage = 
            progressPercentage > 100 ? 100 : progressPercentage;
        
        // Check for level up
        checkForLevelUp();
        
        // Save changes
        saveUserProfile();
        
        return true;
    }
    
    /**
     * Check if any attributes have leveled up
     */
    function checkForLevelUp() {
        const userProfile = loadUserProfile();
        const currentRank = userProfile.currentRank.title;
        
        // Define the rank progression system
        const rankProgression = {
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
            }
        };
        
        const rankInfo = rankProgression[currentRank];
        
        if (!rankInfo) {
            console.error(`Rank information not found for ${currentRank}`);
            return;
        }
        
        // Check each attribute for level up
        Object.keys(userProfile.attributes).forEach(attr => {
            const attribute = userProfile.attributes[attr];
            const currentLevel = attribute.currentLevel;
            
            // If we've reached the hours needed for next level
            if (currentLevel <= rankInfo.levels && 
                attribute.totalHours >= attribute.hoursToNextLevel) {
                
                // Level up the attribute
                attribute.currentLevel += 1;
                
                // If not at max level for this rank, set new hours goal
                if (attribute.currentLevel <= rankInfo.levels) {
                    const nextLevelHours = rankInfo.hoursPerLevel[attribute.currentLevel - 1];
                    attribute.hoursToNextLevel = attribute.totalHours + nextLevelHours;
                }
                
                // Reset progress percentage
                attribute.progressPercentage = 0;
            }
        });
        
        // Check if all attributes have reached the max level for this rank
        const allMaxLevel = Object.values(userProfile.attributes).every(
            attr => attr.currentLevel > rankInfo.levels
        );
        
        if (allMaxLevel) {
            // Rank up!
            userProfile.currentRank.title = rankInfo.nextRank;
            userProfile.currentRank.color = rankProgression[rankInfo.nextRank].color;
            userProfile.currentRank.level = 1;
            
            // Reset level-specific values for the new rank
            Object.keys(userProfile.attributes).forEach(attr => {
                const attribute = userProfile.attributes[attr];
                attribute.currentLevel = 1;
                attribute.hoursToNextLevel = attribute.totalHours + 
                    rankProgression[rankInfo.nextRank].hoursPerLevel[0];
                attribute.progressPercentage = 0;
            });
        } else {
            // Just update the current level within the rank
            const lowestLevel = Math.min(
                ...Object.values(userProfile.attributes).map(attr => attr.currentLevel)
            );
            userProfile.currentRank.level = lowestLevel;
        }
        
        // Save changes
        saveUserProfile();
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
     * Get recommended quests based on current progress
     * @param {number} count - Number of quests to recommend
     * @returns {Promise<Array>} - Promise resolving to array of recommended quests
     */
    async function getRecommendedQuests(count = 3) {
        const userProfile = loadUserProfile();
        const quests = await getQuestData();
        
        // Find attributes with lowest progress
        const attributesByProgress = Object.entries(userProfile.attributes)
            .sort((a, b) => a[1].totalHours - b[1].totalHours)
            .map(entry => entry[0]);
        
        const lowestAttribute = attributesByProgress[0];
        
        // Get unlocked but not completed quests
        const availableQuests = userProfile.unlockedQuests
            .filter(id => !userProfile.completedQuests.includes(id))
            .map(id => quests.find(q => q.id === id))
            .filter(q => q !== undefined);
        
        // Sort quests by reward for lowest attribute
        const sortedQuests = availableQuests.sort((a, b) => {
            return b.attributeRewards[lowestAttribute] - a.attributeRewards[lowestAttribute];
        });
        
        return sortedQuests.slice(0, count);
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
        getQuestData: getQuestData,
        completeQuest: completeQuest,
        updateAttribute: updateAttribute,
        addJournalEntry: addJournalEntry,
        getRecommendedQuests: getRecommendedQuests,
        resetUserProgress: resetUserProgress  // For testing/debugging
    };
})();
