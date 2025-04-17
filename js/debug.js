/**
 * DICED Debugging Utility
 * Add this code to your project for troubleshooting the progression system
 */

// Create a namespace for debugging utilities
const DICEDDebug = (() => {
    // Debug control panel UI
    function createDebugPanel() {
        // Check if panel already exists
        if (document.getElementById('diced-debug-panel')) {
            return;
        }
        
        // Create debug panel
        const panel = document.createElement('div');
        panel.id = 'diced-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 300px;
            background-color: white;
            border: 2px solid #333;
            border-radius: 5px;
            padding: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
            max-height: 500px;
            overflow-y: auto;
        `;
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'DICED Debug Panel';
        title.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            font-weight: bold;
        `;
        closeBtn.onclick = () => {
            panel.remove();
        };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // Add debug sections
        
        // 1. Quest Techniques Section
        const questSection = document.createElement('div');
        questSection.className = 'debug-section';
        questSection.innerHTML = `
            <h4>Debug Quest Techniques</h4>
            <div class="input-group">
                <input id="debug-quest-id" placeholder="Quest ID (e.g. T1-1)" style="width: 160px; padding: 4px;">
                <button id="debug-quest-btn" style="padding: 4px 8px; margin-left: 5px;">Debug</button>
            </div>
            <div id="quest-debug-output" style="margin-top: 5px; border: 1px solid #ccc; padding: 5px; max-height: 100px; overflow-y: auto;"></div>
        `;
        panel.appendChild(questSection);
        
        // 2. User Profile Section
        const profileSection = document.createElement('div');
        profileSection.className = 'debug-section';
        profileSection.style.marginTop = '10px';
        profileSection.innerHTML = `
            <h4>User Profile Data</h4>
            <button id="show-profile-btn" style="padding: 4px 8px;">Show Profile</button>
            <div id="profile-debug-output" style="margin-top: 5px; border: 1px solid #ccc; padding: 5px; max-height: 150px; overflow-y: auto;"></div>
        `;
        panel.appendChild(profileSection);
        
        // 3. Fix Skills Section
        const fixSection = document.createElement('div');
        fixSection.className = 'debug-section';
        fixSection.style.marginTop = '10px';
        fixSection.innerHTML = `
            <h4>Fix Skills</h4>
            <button id="scan-quests-btn" style="padding: 4px 8px;">Scan Completed Quests</button>
            <button id="fix-techniques-btn" style="padding: 4px 8px; margin-left: 5px;">Fix Techniques</button>
            <div id="fix-debug-output" style="margin-top: 5px; border: 1px solid #ccc; padding: 5px; max-height: 100px; overflow-y: auto;"></div>
        `;
        panel.appendChild(fixSection);
        
        // 4. Manual Add Skill Section
        const skillSection = document.createElement('div');
        skillSection.className = 'debug-section';
        skillSection.style.marginTop = '10px';
        skillSection.innerHTML = `
            <h4>Add Skill Manually</h4>
            <div class="input-group">
                <input id="debug-skill-id" placeholder="Skill ID" style="width: 160px; padding: 4px;">
                <button id="add-skill-btn" style="padding: 4px 8px; margin-left: 5px;">Add</button>
            </div>
            <div id="skill-debug-output" style="margin-top: 5px; border: 1px solid #ccc; padding: 5px; max-height: 100px; overflow-y: auto;"></div>
        `;
        panel.appendChild(skillSection);
        
        // 5. Reset Section
        const resetSection = document.createElement('div');
        resetSection.className = 'debug-section';
        resetSection.style.marginTop = '10px';
        resetSection.innerHTML = `
            <h4>Reset Data</h4>
            <button id="reset-btn" style="padding: 4px 8px; background-color: #ff6666;">Reset All Progress</button>
            <div id="reset-debug-output" style="margin-top: 5px;"></div>
        `;
        panel.appendChild(resetSection);
        
        // Add to document
        document.body.appendChild(panel);
        
        // Add event listeners
        
        // Quest debug button
        document.getElementById('debug-quest-btn').addEventListener('click', () => {
            const questId = document.getElementById('debug-quest-id').value;
            if (!questId) {
                document.getElementById('quest-debug-output').textContent = 'Please enter a quest ID';
                return;
            }
            
            debugQuestTechniques(questId);
        });
        
        // Show profile button
        document.getElementById('show-profile-btn').addEventListener('click', () => {
            showUserProfile();
        });
        
        // Scan quests button
        document.getElementById('scan-quests-btn').addEventListener('click', () => {
            scanCompletedQuests();
        });
        
        // Fix techniques button
        document.getElementById('fix-techniques-btn').addEventListener('click', () => {
            fixTechniques();
        });
        
        // Add skill button
        document.getElementById('add-skill-btn').addEventListener('click', () => {
            const skillId = document.getElementById('debug-skill-id').value;
            if (!skillId) {
                document.getElementById('skill-debug-output').textContent = 'Please enter a skill ID';
                return;
            }
            
            addSkill(skillId);
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                resetProgress();
            }
        });
    }
    
    // Debug a specific quest's techniques
    function debugQuestTechniques(questId) {
        const output = document.getElementById('quest-debug-output');
        output.innerHTML = `Looking up quest ${questId}...`;
        
        // Get quest data
        DataManager.getQuestData().then(quests => {
            const quest = quests.find(q => q.id === questId);
            
            if (!quest) {
                output.innerHTML = `<span style="color: red;">Quest not found: ${questId}</span>`;
                return;
            }
            
            // Display basic quest info
            let html = `
                <strong>Quest:</strong> ${quest.title} (${quest.id})<br>
                <strong>Type:</strong> ${quest.type}<br>
                <strong>Rank:</strong> ${quest.rank.title} Level ${quest.rank.level}<br>
            `;
            
            // Display techniques
            if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned) && quest.techniquesLearned.length > 0) {
                html += `<strong>Techniques:</strong><br>`;
                
                const allTechniques = SkillsManager.getAllTechniques();
                quest.techniquesLearned.forEach(techniqueId => {
                    const technique = allTechniques[techniqueId];
                    if (technique) {
                        html += `- ${techniqueId}: ${technique.name} (${technique.category})<br>`;
                    } else {
                        html += `- ${techniqueId}: <span style="color: red;">Not found in SkillsManager</span><br>`;
                    }
                });
            } else {
                html += `<span style="color: orange;">No techniques defined for this quest</span>`;
            }
            
            output.innerHTML = html;
        });
    }
    
    // Show user profile data
    function showUserProfile() {
        const output = document.getElementById('profile-debug-output');
        const userProfile = DataManager.getUserProfile();
        
        // Format the profile data for display
        let html = `
            <strong>Rank:</strong> ${userProfile.currentRank.title} (${userProfile.currentRank.color}) Level ${userProfile.currentRank.level}<br>
        `;
        
        // Show attributes
        html += `<strong>Attributes:</strong><br>`;
        Object.entries(userProfile.attributes).forEach(([attr, data]) => {
            html += `- ${attr}: Level ${data.currentLevel}, ${data.totalHours.toFixed(1)} hours<br>`;
        });
        
        // Show completed quests count
        html += `<strong>Completed Quests:</strong> ${userProfile.completedQuests.length}<br>`;
        
        // Show mastered techniques
        html += `<strong>Mastered Techniques:</strong> ${userProfile.masteredTechniques.length}<br>`;
        if (userProfile.masteredTechniques.length > 0) {
            html += `<ul style="margin: 0; padding-left: 20px;">`;
            userProfile.masteredTechniques.forEach(techniqueId => {
                const technique = SkillsManager.getAllTechniques()[techniqueId];
                if (technique) {
                    html += `<li>${techniqueId}: ${technique.name}</li>`;
                } else {
                    html += `<li>${techniqueId}: <span style="color: red;">Not found</span></li>`;
                }
            });
            html += `</ul>`;
        }
        
        output.innerHTML = html;
    }
    
    // Scan completed quests for techniques
    function scanCompletedQuests() {
        const output = document.getElementById('fix-debug-output');
        output.innerHTML = `Scanning completed quests...`;
        
        const userProfile = DataManager.getUserProfile();
        const completedQuests = userProfile.completedQuests;
        
        if (completedQuests.length === 0) {
            output.innerHTML = `<span style="color: orange;">No completed quests found</span>`;
            return;
        }
        
        DataManager.getQuestData().then(quests => {
            const missingTechniques = [];
            let questsWithTechniques = 0;
            
            // Check each completed quest
            for (const questId of completedQuests) {
                const quest = quests.find(q => q.id === questId);
                
                if (!quest) continue;
                
                if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned) && quest.techniquesLearned.length > 0) {
                    questsWithTechniques++;
                    
                    // Check for missing techniques
                    for (const techniqueId of quest.techniquesLearned) {
                        if (!userProfile.masteredTechniques.includes(techniqueId)) {
                            const technique = SkillsManager.getAllTechniques()[techniqueId];
                            if (technique) {
                                missingTechniques.push({
                                    id: techniqueId,
                                    name: technique.name,
                                    questId: quest.id
                                });
                            }
                        }
                    }
                }
            }
            
                            // Display results
            if (missingTechniques.length > 0) {
                let html = `<span style="color: orange;">Found ${missingTechniques.length} missing techniques from completed quests:</span><br>`;
                
                missingTechniques.forEach(tech => {
                    html += `- ${tech.id}: ${tech.name} (Quest: ${tech.questId})<br>`;
                });
                
                html += `<br>Use the "Fix Techniques" button to add these missing techniques.`;
                output.innerHTML = html;
            } else {
                output.innerHTML = `<span style="color: green;">All techniques from completed quests (${questsWithTechniques}) are already mastered!</span>`;
            }
        });
    }
    
    // Fix missing techniques
    function fixTechniques() {
        const output = document.getElementById('fix-debug-output');
        output.innerHTML = `Fixing missing techniques...`;
        
        const userProfile = DataManager.getUserProfile();
        const completedQuests = userProfile.completedQuests;
        
        if (completedQuests.length === 0) {
            output.innerHTML = `<span style="color: orange;">No completed quests found</span>`;
            return;
        }
        
        DataManager.getQuestData().then(quests => {
            const techniquesAdded = [];
            
            // Check each completed quest
            for (const questId of completedQuests) {
                const quest = quests.find(q => q.id === questId);
                
                if (!quest) continue;
                
                if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned) && quest.techniquesLearned.length > 0) {
                    // Add missing techniques
                    for (const techniqueId of quest.techniquesLearned) {
                        if (!userProfile.masteredTechniques.includes(techniqueId)) {
                            const technique = SkillsManager.getAllTechniques()[techniqueId];
                            if (technique) {
                                // Add technique to mastered techniques
                                userProfile.masteredTechniques.push(techniqueId);
                                techniquesAdded.push({
                                    id: techniqueId,
                                    name: technique.name
                                });
                            }
                        }
                    }
                }
            }
            
            // Save the updated profile
            DataManager.saveUserProfile();
            
            // Display results
            if (techniquesAdded.length > 0) {
                let html = `<span style="color: green;">Added ${techniquesAdded.length} missing techniques:</span><br>`;
                
                techniquesAdded.forEach(tech => {
                    html += `- ${tech.id}: ${tech.name}<br>`;
                });
                
                output.innerHTML = html;
                
                // Refresh the UI if progress tab is active
                const progressTab = document.getElementById('progress-tab');
                if (progressTab && !progressTab.classList.contains('hidden')) {
                    UIManager.renderProgressTab(userProfile);
                }
            } else {
                output.innerHTML = `<span style="color: green;">No missing techniques found!</span>`;
            }
        });
    }
    
    // Add a skill manually
    function addSkill(skillId) {
        const output = document.getElementById('skill-debug-output');
        
        // Check if skill exists
        const allTechniques = SkillsManager.getAllTechniques();
        const technique = allTechniques[skillId];
        
        if (!technique) {
            output.innerHTML = `<span style="color: red;">Skill ID "${skillId}" not found!</span><br>Available skills:<br>`;
            
            // Show some available skills
            const availableSkills = Object.keys(allTechniques).slice(0, 5);
            availableSkills.forEach(id => {
                output.innerHTML += `- ${id}: ${allTechniques[id].name}<br>`;
            });
            
            if (Object.keys(allTechniques).length > 5) {
                output.innerHTML += `...and ${Object.keys(allTechniques).length - 5} more`;
            }
            
            return;
        }
        
        // Add the skill
        const result = DataManager.addMasteredTechnique(skillId);
        
        if (result.success) {
            output.innerHTML = `<span style="color: green;">Successfully added skill: ${technique.name}</span>`;
            
            // Refresh the UI if progress tab is active
            const userProfile = DataManager.getUserProfile();
            const progressTab = document.getElementById('progress-tab');
            if (progressTab && !progressTab.classList.contains('hidden')) {
                UIManager.renderProgressTab(userProfile);
            }
        } else {
            output.innerHTML = `<span style="color: orange;">${result.message}</span>`;
        }
    }
    
    // Reset all progress
    function resetProgress() {
        DataManager.resetUserProgress();
        
        const output = document.getElementById('reset-debug-output');
        output.innerHTML = `<span style="color: green;">Progress has been reset!</span>`;
        
        // Reload the page after a short delay
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    // Return public methods
    return {
        init: function() {
            createDebugPanel();
        },
        debugQuestTechniques,
        showUserProfile,
        scanCompletedQuests,
        fixTechniques,
        addSkill,
        resetProgress
    };
})();

// Add a button to toggle the debug panel
function addDebugToggleButton() {
    const button = document.createElement('button');
    button.textContent = 'Debug';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 5px 10px;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 9998;
    `;
    
    button.onclick = () => {
        // Initialize the debug panel
        DICEDDebug.init();
    };
    
    document.body.appendChild(button);
}

// Call this function to add the debug button to the page
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to initialize
    setTimeout(addDebugToggleButton, 1000);
});

// Function to check if any quests have techniques defined
async function checkQuestsForTechniques() {
    const quests = await DataManager.getQuestData();
    
    let questsWithTechniques = 0;
    let techniquesFound = 0;
    
    // Check each quest
    quests.forEach(quest => {
        if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned) && quest.techniquesLearned.length > 0) {
            questsWithTechniques++;
            techniquesFound += quest.techniquesLearned.length;
        }
    });
    
    console.log(`Found ${questsWithTechniques} quests with techniques defined (${techniquesFound} total techniques)`);
    
    // Check if techniques exist in SkillsManager
    const allTechniques = SkillsManager.getAllTechniques();
    console.log(`SkillsManager has ${Object.keys(allTechniques).length} defined techniques`);
    
    // Output some sample technique IDs
    if (Object.keys(allTechniques).length > 0) {
        console.log("Sample technique IDs:", Object.keys(allTechniques).slice(0, 5));
    }
}

// Call this function to check quests for techniques
// This will automatically run when this script is loaded
checkQuestsForTechniques();
