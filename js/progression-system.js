/**
 * DICED: Culinary RPG Progression System (FINAL)
 * This module handles the progression logic for both user ranks and attribute levels.
 * 
 * Key features:
 * 1. Attribute hours are capped at the maximum for the current user rank
 * 2. Each attribute contributes exactly 25% to overall rank progress
 * 3. When an attribute maxes out in the current rank, it advances to the next rank at 0% completion
 * 4. Attributes in a rank higher than the user rank remain at 0% completion until the user advances
 */

const ProgressionSystem = (() => {
    // Define rank progression data
    const RANKS = {
        "Home Cook": {
            color: "Iron",
            levels: 9,
            nextRank: "Culinary Student",
            attributeHoursRequired: 55, // Total hours per attribute to complete this rank
            // Hours needed for each level within this rank (array of 9 values)
            levelHours: [5, 5, 5, 5, 5, 6, 7, 8, 9]
        },
        "Culinary Student": {
            color: "Bronze",
            levels: 9,
            nextRank: "Kitchen Assistant",
            attributeHoursRequired: 209, // 55 + 154
            levelHours: [10, 11, 13, 15, 17, 19, 21, 23, 25]
        },
        "Kitchen Assistant": {
            color: "Silver",
            levels: 9,
            nextRank: "Line Cook",
            attributeHoursRequired: 530, // 55 + 209 + 
            levelHours: [27, 29, 31, 33, 35, 37, 40, 43, 46]
        },
        "Line Cook": {
            color: "Gold",
            levels: 9,
            nextRank: "Sous Chef",
            attributeHoursRequired: 1177, // 55 + 209 + 530 + 
            levelHours: [49, 54, 59, 64, 71, 77, 83, 91, 99]
        },
        "Sous Chef": {
            color: "Platinum",
            levels: 9,
            nextRank: "Head Chef",
            attributeHoursRequired: 2500, // 55 + 99 + 207 + 279 + 351
            levelHours: [106, 114, 123, 133, 143, 157, 167, 180, 200]
        },
        "Head Chef": {
            color: "Master",
            levels: 9,
            nextRank: null, // Final rank
            attributeHoursRequired: 0, // 55 + 99 + 207 + 279 + 351 + 414
            levelHours: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    };

    // List of all attributes
    const ATTRIBUTES = ["technique", "ingredients", "flavor", "management"];

    /**
     * Get the rank index for comparing ranks
     * @param {string} rankTitle - The rank title
     * @returns {number} - Rank index (higher index = higher rank)
     */
    function getRankIndex(rankTitle) {
        const rankOrder = Object.keys(RANKS);
        return rankOrder.indexOf(rankTitle);
    }

    /**
     * Check if rank1 is higher than rank2
     * @param {string} rank1 - First rank to compare
     * @param {string} rank2 - Second rank to compare
     * @returns {boolean} - Whether rank1 is higher than rank2
     */
    function isRankHigher(rank1, rank2) {
        return getRankIndex(rank1) > getRankIndex(rank2);
    }

    /**
     * Get the total hours required to reach a given rank
     * @param {string} rankTitle - The target rank
     * @returns {number} - Total hours required
     */
    function getTotalHoursForRank(rankTitle) {
        let totalHours = 0;
        const rankOrder = Object.keys(RANKS);
        const rankIndex = rankOrder.indexOf(rankTitle);
        
        // Add up hours for all ranks before this one
        for (let i = 0; i < rankIndex; i++) {
            totalHours += RANKS[rankOrder[i]].attributeHoursRequired;
        }
        
        return totalHours;
    }

    /**
     * Calculate attribute level data based on total hours
     * @param {string} attributeRank - Current rank of this attribute
     * @param {string} userRank - Current rank of the user 
     * @param {number} totalHours - Total hours accumulated for this attribute
     * @returns {Object} - Attribute level data
     */
    function calculateAttributeLevel(attributeRank, userRank, totalHours) {
        // If attribute rank is higher than user rank, lock at level 1, 0% progress
        if (isRankHigher(attributeRank, userRank)) {
            return {
                currentLevel: 1,
                hoursToNextLevel: getTotalHoursForRank(attributeRank) + RANKS[attributeRank].levelHours[0],
                levelProgressPercentage: 0,
                rankProgressPercentage: 0,
                totalHoursForRank: RANKS[attributeRank].attributeHoursRequired,
                hoursInCurrentRank: 0,
                hoursRemainingInRank: RANKS[attributeRank].attributeHoursRequired,
                cappedTotalHours: getTotalHoursForRank(attributeRank),
                actualTotalHours: totalHours,
                isMaxed: false,
                waitingForUserRankUp: true,
                nextRank: RANKS[attributeRank].nextRank
            };
        }
        
        // Normal calculation for attribute at or below user rank
        const rankData = RANKS[attributeRank];
        if (!rankData) {
            console.error(`Rank data not found for: ${attributeRank}`);
            return null;
        }

        // Get hours from previous ranks
        const previousRanksHours = getTotalHoursForRank(attributeRank);
        
        // Cap totalHours at the maximum for the current rank + previous ranks
        const maxHours = previousRanksHours + rankData.attributeHoursRequired;
        const cappedTotalHours = Math.min(totalHours, maxHours);
        
        // Hours within the current rank (capped)
        const hoursInCurrentRank = Math.min(
            cappedTotalHours - previousRanksHours,
            rankData.attributeHoursRequired
        );
        
        // Check if attribute has maxed out its current rank
        if (hoursInCurrentRank >= rankData.attributeHoursRequired && rankData.nextRank) {
            // Attribute should advance to the next rank
            return {
                currentLevel: 1,
                hoursToNextLevel: previousRanksHours + rankData.attributeHoursRequired + RANKS[rankData.nextRank].levelHours[0],
                levelProgressPercentage: 0,
                rankProgressPercentage: 100, // Show as 100% in current rank but ready for next
                totalHoursForRank: rankData.attributeHoursRequired,
                hoursInCurrentRank: rankData.attributeHoursRequired,
                hoursRemainingInRank: 0,
                cappedTotalHours: cappedTotalHours,
                actualTotalHours: totalHours,
                isMaxed: true,
                waitingForUserRankUp: false,
                nextRank: rankData.nextRank
            };
        }
        
        // Calculate current level within rank
        let currentLevel = 1;
        let hoursToNextLevel = previousRanksHours + rankData.levelHours[0];
        let accumulatedHours = 0;
        
        for (let i = 0; i < rankData.levels; i++) {
            const levelHours = rankData.levelHours[i];
            
            if (accumulatedHours + levelHours > hoursInCurrentRank) {
                // Found the current level
                currentLevel = i + 1;
                hoursToNextLevel = previousRanksHours + accumulatedHours + levelHours;
                break;
            }
            
            accumulatedHours += levelHours;
            
            // If we're at the last level and have enough hours
            if (i === rankData.levels - 1) {
                currentLevel = rankData.levels;
                hoursToNextLevel = previousRanksHours + accumulatedHours;
            }
        }
        
        // Calculate progress percentage for this level
        const levelStartHours = hoursToNextLevel - rankData.levelHours[currentLevel - 1];
        const levelProgress = cappedTotalHours - levelStartHours;
        const levelProgressPercentage = Math.min(
            (levelProgress / rankData.levelHours[currentLevel - 1]) * 100, 
            100
        );
        
        // Calculate overall progress percentage within the rank
        const rankProgressPercentage = Math.min(
            (hoursInCurrentRank / rankData.attributeHoursRequired) * 100,
            100
        );
        
        return {
            currentLevel,
            hoursToNextLevel,
            levelProgressPercentage,
            rankProgressPercentage,
            totalHoursForRank: rankData.attributeHoursRequired,
            hoursInCurrentRank,
            hoursRemainingInRank: Math.max(rankData.attributeHoursRequired - hoursInCurrentRank, 0),
            cappedTotalHours,
            actualTotalHours: totalHours,
            isMaxed: hoursInCurrentRank >= rankData.attributeHoursRequired,
            waitingForUserRankUp: false,
            nextRank: rankData.nextRank
        };
    }

    /**
     * Calculate the user profile's rank and level based on all attributes
     * @param {Object} userProfile - The user profile with attributes
     * @returns {Object} - Updated user profile
     */
    function calculateUserRank(userProfile) {
        if (!userProfile || !userProfile.attributes) {
            console.error("Invalid user profile");
            return userProfile;
        }

        // First, determine the minimum rank across all attributes
        let attributeRanks = {};
        let totalHoursAllAttributes = 0;
        const currentRank = userProfile.currentRank?.title || "Home Cook";
        const rankData = RANKS[currentRank];
        
        if (!rankData) {
            console.error(`Rank data not found for: ${currentRank}`);
            return userProfile;
        }
        
        // Analyze each attribute
        ATTRIBUTES.forEach(attrName => {
            const attr = userProfile.attributes[attrName];
            if (!attr) return;
            
            // Get attribute's current rank (may be higher than user rank if maxed out)
            const attributeRank = attr.currentRank || currentRank;
            
            // Calculate attribute level data with capped hours
            const levelData = calculateAttributeLevel(attributeRank, currentRank, attr.totalHours);
            if (!levelData) return;
            
            // Use the capped total hours for each attribute
            totalHoursAllAttributes += levelData.cappedTotalHours;
            
            // Store current rank for each attribute
            attributeRanks[attrName] = {
                rank: attributeRank,
                totalHours: levelData.cappedTotalHours,
                completed: levelData.rankProgressPercentage >= 100
            };
            
            // Update attribute data in the user profile
            userProfile.attributes[attrName] = {
                ...attr,
                currentRank: levelData.isMaxed && levelData.nextRank ? levelData.nextRank : attributeRank,
                currentLevel: levelData.currentLevel,
                hoursToNextLevel: levelData.hoursToNextLevel,
                levelProgressPercentage: levelData.levelProgressPercentage,
                rankProgressPercentage: levelData.rankProgressPercentage,
                cappedTotalHours: levelData.cappedTotalHours,
                totalHours: attr.totalHours,
                isMaxed: levelData.isMaxed,
                waitingForUserRankUp: levelData.waitingForUserRankUp
            };
        });
        
        // Determine if all attributes have completed the current rank
        let allCanAdvance = true;
        
        // Check if all attributes have completed their current rank requirements
        Object.values(attributeRanks).forEach(attr => {
            if (!attr.completed) {
                allCanAdvance = false;
            }
        });
        
        // If all attributes have completed the current rank, advance to next rank
        let newRank = currentRank;
        if (allCanAdvance) {
            const nextRank = rankData.nextRank;
            if (nextRank) {
                newRank = nextRank;
                
                // When advancing to a new rank, update all attributes
                ATTRIBUTES.forEach(attrName => {
                    const attr = userProfile.attributes[attrName];
                    if (!attr) return;
                    
                    // Reset any attributes that were waiting for rank up
                    if (attr.waitingForUserRankUp && attr.currentRank === newRank) {
                        attr.waitingForUserRankUp = false;
                    }
                });
            }
        }
        
        // Calculate the user level based on the current rank
        // The level is the minimum level across all attributes
        let minLevel = 9;
        
        ATTRIBUTES.forEach(attrName => {
            const attr = userProfile.attributes[attrName];
            if (!attr) return;
            
            // Only consider attributes at the current user rank
            if (attr.currentRank === newRank && !attr.waitingForUserRankUp) {
                if (attr.currentLevel < minLevel) {
                    minLevel = attr.currentLevel;
                }
            }
        });
        
        // Calculate overall rank progress based on balanced attribute contributions
        // Each attribute contributes exactly 25% to the overall progress
        let overallRankProgressPercentage = 0;
        
        ATTRIBUTES.forEach(attrName => {
            const attr = userProfile.attributes[attrName];
            if (!attr) return;
            
            // Each attribute contributes 25% of its own progress to the overall progress
            // If attribute is at a higher rank, it contributes 25% (max)
            const contribution = attr.currentRank === newRank && !attr.waitingForUserRankUp 
                ? attr.rankProgressPercentage * 0.25
                : 25; // Max contribution if already at next rank
            
            overallRankProgressPercentage += contribution;
        });
        
        // Update the user's current rank
        userProfile.currentRank = {
            title: newRank,
            color: RANKS[newRank].color,
            level: minLevel,
            progressPercentage: overallRankProgressPercentage
        };
        
        return userProfile;
    }

    /**
     * Update an attribute with new hours and recalculate rank
     * @param {Object} userProfile - The user profile
     * @param {string} attribute - The attribute to update
     * @param {number} hours - Hours to add
     * @returns {Object} - Updated user profile and status info
     */
    function updateAttributeHours(userProfile, attribute, hours) {
        if (!userProfile || !userProfile.attributes || !userProfile.attributes[attribute]) {
            console.error(`Invalid user profile or attribute: ${attribute}`);
            return { profile: userProfile, status: "Error: Invalid profile or attribute" };
        }
        
        // Get current user rank
        const userRank = userProfile.currentRank?.title || "Home Cook";
        const rankData = RANKS[userRank];
        
        if (!rankData) {
            console.error(`Rank data not found for: ${userRank}`);
            return { profile: userProfile, status: `Error: Rank data not found for ${userRank}` };
        }
        
        // Get attribute's current rank
        const attributeRank = userProfile.attributes[attribute].currentRank || userRank;
        
        // Check if attribute is in a higher rank than the user
        if (isRankHigher(attributeRank, userRank)) {
            return { 
                profile: userProfile, 
                status: `Attribute ${attribute} is already at rank ${attributeRank} and waiting for user to reach this rank.`
            };
        }
        
        // Get current hours for this attribute
        const currentHours = userProfile.attributes[attribute].totalHours;
        
        // Calculate max hours allowed for user's current rank
        const maxHoursForRank = getTotalHoursForRank(userRank) + rankData.attributeHoursRequired;
        
        // Check if attribute is already maxed out in the user's rank
        if (currentHours >= maxHoursForRank) {
            const status = `Attribute ${attribute} is already at maximum for rank ${userRank} (${rankData.attributeHoursRequired} hours)`;
            
            // If attribute is at max, promote it to the next rank if there is one
            if (rankData.nextRank && userProfile.attributes[attribute].currentRank === userRank) {
                userProfile.attributes[attribute].currentRank = rankData.nextRank;
                userProfile.attributes[attribute].waitingForUserRankUp = true;
                
                return { 
                    profile: calculateUserRank(userProfile), 
                    status: `${status}. Advanced to ${rankData.nextRank} (waiting for user rank up).`
                };
            }
            
            return { profile: userProfile, status };
        }
        
        // Add hours (but cap at max for current rank)
        const effectiveHours = Math.min(hours, maxHoursForRank - currentHours);
        userProfile.attributes[attribute].totalHours += effectiveHours;
        
        // Generate status message
        let status;
        if (effectiveHours < hours) {
            status = `Added ${effectiveHours.toFixed(1)} hours to ${attribute} (capped from ${hours} hours). Max for rank: ${rankData.attributeHoursRequired} hours.`;
        } else {
            status = `Added ${effectiveHours.toFixed(1)} hours to ${attribute}.`;
        }
        
        // Recalculate user rank and levels
        const updatedProfile = calculateUserRank(userProfile);
        
        // Check if the attribute has been maxed out and promoted
        const attr = updatedProfile.attributes[attribute];
        if (attr.isMaxed && attr.currentRank !== userRank) {
            status += ` Attribute maxed out and advanced to ${attr.currentRank} (waiting for user rank up).`;
        }
        
        return { profile: updatedProfile, status };
    }

    /**
     * Create a new user profile with default values
     * @returns {Object} - New user profile
     */
    function createNewUserProfile() {
        const userProfile = {
            userId: "user-" + Date.now(),
            username: "Player",
            currentRank: {
                title: "Home Cook",
                color: RANKS["Home Cook"].color,
                level: 1,
                progressPercentage: 0
            },
            attributes: {},
            completedQuests: [],
            unlockedQuests: []
        };
        
        // Initialize each attribute
        ATTRIBUTES.forEach(attr => {
            userProfile.attributes[attr] = {
                totalHours: 0,
                cappedTotalHours: 0,
                currentRank: "Home Cook",
                currentLevel: 1,
                hoursToNextLevel: RANKS["Home Cook"].levelHours[0],
                levelProgressPercentage: 0,
                rankProgressPercentage: 0,
                isMaxed: false,
                waitingForUserRankUp: false
            };
        });
        
        return userProfile;
    }

    /**
     * Get information about a specific rank
     * @param {string} rankTitle - The rank title
     * @returns {Object} - Rank information
     */
    function getRankInfo(rankTitle) {
        return RANKS[rankTitle] || null;
    }

    /**
     * Get all rank information
     * @returns {Object} - All rank data
     */
    function getAllRanks() {
        return RANKS;
    }

    /**
     * Validate if all attributes can advance to next rank
     * @param {Object} userProfile - The user profile
     * @returns {boolean} - Whether all attributes can advance
     */
    function canAdvanceToNextRank(userProfile) {
        if (!userProfile || !userProfile.attributes) {
            return false;
        }
        
        const currentRank = userProfile.currentRank?.title || "Home Cook";
        const requiredHours = RANKS[currentRank]?.attributeHoursRequired || 0;
        const requiredTotalHours = getTotalHoursForRank(currentRank) + requiredHours;
        
        // Check if all attributes have enough hours
        for (const attrName of ATTRIBUTES) {
            const attr = userProfile.attributes[attrName];
            if (!attr || attr.totalHours < requiredTotalHours) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get hours required for next rank
     * @param {Object} userProfile - The user profile
     * @returns {Object} - Hours required information
     */
    function getHoursForNextRank(userProfile) {
        if (!userProfile || !userProfile.currentRank) {
            return { canAdvance: false, required: 0, current: 0 };
        }
        
        const currentRank = userProfile.currentRank.title;
        const requiredHours = RANKS[currentRank]?.attributeHoursRequired || 0;
        const nextRank = RANKS[currentRank]?.nextRank;
        
        if (!nextRank) {
            return { 
                canAdvance: false, 
                message: "Already at maximum rank",
                current: 0,
                required: 0,
                nextRank: null
            };
        }
        
        const attributeStatus = {};
        let totalHours = 0;
        
        // Check each attribute's status
        ATTRIBUTES.forEach(attrName => {
            const attr = userProfile.attributes[attrName];
            if (!attr) return;
            
            // Special handling for attributes at higher ranks
            if (isRankHigher(attr.currentRank, currentRank)) {
                attributeStatus[attrName] = {
                    currentHours: requiredHours, // Consider as maxed for current rank
                    requiredHours: requiredHours,
                    remainingHours: 0,
                    completed: true
                };
                totalHours += requiredHours;
                return;
            }
            
            // Use capped hours for calculation
            const cappedHours = Math.min(attr.totalHours - getTotalHoursForRank(currentRank), requiredHours);
            totalHours += cappedHours;
            
            attributeStatus[attrName] = {
                currentHours: cappedHours,
                requiredHours: requiredHours,
                remainingHours: Math.max(requiredHours - cappedHours, 0),
                completed: cappedHours >= requiredHours
            };
        });
        
        // Total hours required across all attributes
        const totalRequired = requiredHours * ATTRIBUTES.length;
        
        return {
            canAdvance: canAdvanceToNextRank(userProfile),
            currentRank: currentRank,
            nextRank: nextRank,
            attributeStatus: attributeStatus,
            totalHours: totalHours,
            totalRequired: totalRequired,
            progressPercentage: Math.min((totalHours / totalRequired) * 100, 100)
        };
    }

    // Public API
    return {
        calculateAttributeLevel,
        calculateUserRank,
        updateAttributeHours,
        createNewUserProfile,
        getRankInfo,
        getAllRanks,
        canAdvanceToNextRank,
        getHoursForNextRank,
        getTotalHoursForRank,
        getRankIndex,
        isRankHigher,
        RANKS,
        ATTRIBUTES
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressionSystem;
}
