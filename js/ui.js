/**
 * ui.js - Handles all user interface interactions
 * This file manages DOM manipulations, rendering, and UI event handling.
 * UPDATED: Includes fixed Progress Tab implementation
 */

// UI manager namespace
const UIManager = (() => {
    // Cache DOM elements for better performance
    const elements = {
        // Main sections
        attributesDashboard: document.getElementById('attributes-dashboard'),
        availableQuests: document.getElementById('available-quests'),
        recommendedQuests: document.getElementById('recommended-quests'),
        challengeQuests: document.getElementById('challenge-quests'),
        completedQuestsSection: document.getElementById('completed-quests-section'),
        
        // Modal elements
        questDetailModal: document.getElementById('quest-detail-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalContent: document.getElementById('modal-content'),
        
        // Rank display
        rankDisplay: document.getElementById('rank-display'),
        
        // Notification
        notification: document.getElementById('notification'),
        notificationMessage: document.getElementById('notification-message'),
        
        // Skills tab
        skillsContainer: document.getElementById('skills-container')
    };
    
    /**
     * Initialize the UI
     * @param {Object} userProfile - The user profile
     * @param {Array} quests - The quest data
     */
    function initialize(userProfile, quests) {
        // Update the rank display
        updateRankDisplay(userProfile);
        
        // Render attributes dashboard
        renderAttributesDashboard(userProfile);
        
        // Initialize the main quest sections
        renderQuestSections(userProfile, quests);
        
        // Initialize tabs
        initializeTabs();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Initialize tab navigation
     */
    function initializeTabs() {
        // Set the initial active tab
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab) {
            const tabName = activeTab.getAttribute('data-tab');
            const tabContent = document.getElementById(`${tabName}-tab`);
            
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.classList.remove('hidden');
            }
        }
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
        
        // Section toggles - IMPORTANT: Use this approach instead of inline onclick attributes
        document.querySelectorAll('.section-title.collapsed').forEach(title => {
            // Remove any existing onclick attribute to prevent double-firing
            title.removeAttribute('onclick');
            
            // Add click event listener
            title.addEventListener('click', function() {
                // Get the section ID from the data attribute
                const sectionId = this.getAttribute('data-section');
                if (sectionId) {
                    toggleSection(sectionId);
                }
            });
        });
    }
    
    /**
     * Handle tab navigation clicks
     * @param {Event} event - The click event
     */
    function handleTabClick(event) {
        event.preventDefault();
        
        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to clicked tab
        event.currentTarget.classList.add('active');
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        
        // Show selected tab content
        const tabName = event.currentTarget.getAttribute('data-tab');
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabContent) {
            tabContent.classList.add('active');
            tabContent.classList.remove('hidden');
            
            // Special handling for skills tab
            if (tabName === 'skills') {
                const userProfile = DataManager.getUserProfile();
                renderSkillsTab(userProfile);
            }
            
            // Special handling for progress tab
            if (tabName === 'progress') {
                const userProfile = DataManager.getUserProfile();
                renderProgressTab(userProfile);
            }
        }
        
        console.log(`Switched to ${tabName} tab`);
    }
    
    /**
     * Update the user's rank display
     * @param {Object} userProfile - The user profile
     */
    function updateRankDisplay(userProfile) {
        if (elements.rankDisplay) {
            elements.rankDisplay.textContent = `${userProfile.currentRank.title} (${userProfile.currentRank.color})`;
        }
    }
    
    /**
     * Render the attributes dashboard
     * @param {Object} userProfile - The user profile
     */
    function renderAttributesDashboard(userProfile) {
        if (!elements.attributesDashboard) return;
        
        // Clear existing content
        elements.attributesDashboard.innerHTML = '';
        
        // Render each attribute card
        const attributes = ['technique', 'ingredients', 'flavor', 'management'];
        
        attributes.forEach(attr => {
            const attrData = userProfile.attributes[attr];
            
            const attrCard = document.createElement('div');
            attrCard.className = `attribute-card ${attr}-border`;
            
            // Use ProgressManager to calculate accurate percentage
            const rankTitle = userProfile.currentRank.title;
            const previousLevelHours = ProgressManager.calculateHoursToLevel(
                rankTitle, 
                attrData.currentLevel - 1
            );
            
            const percentage = ProgressManager.calculateLevelProgress(
                attrData.totalHours,
                previousLevelHours,
                attrData.hoursToNextLevel
            );
            
            attrCard.innerHTML = `
                <div class="attribute-title">
                    <span class="attribute-icon ${attr}-icon"></span>
                    ${attr.charAt(0).toUpperCase() + attr.slice(1)}
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${attr}-fill" style="width: ${percentage}%;"></div>
                </div>
                <div class="hours-display">
                    <span>${attrData.totalHours.toFixed(1)}/${attrData.hoursToNextLevel.toFixed(1)} hrs</span>
                    <span>Level ${attrData.currentLevel}</span>
                </div>
            `;
            
            elements.attributesDashboard.appendChild(attrCard);
        });
    }
    
    /**
     * Render all quest sections
     * @param {Object} userProfile - The user profile
     * @param {Array} quests - The quest data
     */
    function renderQuestSections(userProfile, quests) {
        // Get available quests
        const availableQuests = QuestManager.getAvailableQuests(userProfile);
        
        // Get quests by type
        const trainingQuests = QuestManager.getQuestsByType(availableQuests, 'training');
        const sideQuests = QuestManager.getQuestsByType(availableQuests, 'side');
        const mainQuests = QuestManager.getQuestsByType(availableQuests, 'main');
        const exploreQuests = QuestManager.getQuestsByType(availableQuests, 'explore');
        
        // Get appropriate quests for daily section
        const appropriateQuests = QuestManager.getAppropriateQuests(userProfile, 3);
        
        // Get recommended quests
        DataManager.getRecommendedQuests(3).then(recommendedQuests => {
            // Render recommended quests
            renderQuestCards(recommendedQuests, elements.recommendedQuests);
        });
        
        // Get next challenge quest
        QuestManager.getNextChallengeQuest(userProfile).then(nextChallengeQuest => {
            // Render challenge quests
            renderQuestCards(nextChallengeQuest ? [nextChallengeQuest] : [], elements.challengeQuests);
        });
        
        // Get completed quests
        const completedQuests = QuestManager.getCompletedQuests(userProfile);
        
        // Render quest sections
        renderQuestCards(appropriateQuests, elements.availableQuests);
        renderQuestCards(completedQuests, elements.completedQuestsSection);
    }
    
    /**
     * Render quest cards in a container
     * @param {Array} quests - The quests to render
     * @param {HTMLElement} container - The container element
     */
    function renderQuestCards(quests, container) {
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // If no quests, show message
        if (!quests || quests.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No quests available in this section.';
            container.appendChild(emptyMessage);
            return;
        }
        
        // Render each quest
        quests.forEach(quest => {
            const card = createQuestCard(quest);
            container.appendChild(card);
        });
    }
    
    /**
     * Create a quest card element
     * @param {Object} quest - The quest data
     * @returns {HTMLElement} - The quest card element
     */
    function createQuestCard(quest) {
        const typeInfo = QuestManager.getQuestTypeInfo(quest.type);
        
        const card = document.createElement('div');
        card.className = `quest-card ${typeInfo.cssClass}-border`;
        card.setAttribute('data-quest-id', quest.id);
        card.onclick = () => openQuestDetail(quest.id);
        
        // Format time required using QuestManager
        const timeRequired = QuestManager.formatTimeRequired(quest.timeRequired);
        
        // Create rewards HTML
        const rewardsHtml = createRewardsHtml(quest.attributeRewards);
        
        card.innerHTML = `
            <div class="quest-header">
                <span class="quest-type ${typeInfo.cssClass}">${typeInfo.name}</span>
                <span class="quest-time">${timeRequired}</span>
            </div>
            <h3 class="quest-title">${quest.title}</h3>
            <p class="quest-description">${quest.description || 'Complete this quest to earn rewards.'}</p>
            <div class="rewards">
                ${rewardsHtml}
            </div>
        `;
        
        return card;
    }
    
    /**
     * Create HTML for quest rewards
     * @param {Object} rewards - The rewards object
     * @returns {string} - HTML for rewards
     */
    function createRewardsHtml(rewards) {
        // Always create individual pills for each attribute with a value > 0
        return Object.entries(rewards)
            .filter(([_, value]) => value > 0)
            .map(([attr, value]) => 
                `<span class="reward-pill ${attr}-reward">${attr.charAt(0).toUpperCase() + attr.slice(1)} +${value}</span>`
            )
            .join('');
    }
    
    /**
     * Open the quest detail modal
     * @param {string} questId - The quest ID
     */
    function openQuestDetail(questId) {
        const quest = QuestManager.getQuest(questId);
        
        if (!quest) {
            console.error(`Quest not found: ${questId}`);
            return;
        }
        
        // Store the current quest
        QuestManager.setCurrentQuest(questId);
        
        // Set the modal title
        elements.modalTitle.textContent = quest.title;
        
        // Create the modal content
        elements.modalContent.innerHTML = createQuestDetailHtml(quest);
        
        // Show the modal
        elements.questDetailModal.style.display = 'flex';
        
        // Add event listener to the complete button
        const completeButton = document.getElementById('complete-quest-button');
        if (completeButton) {
            completeButton.addEventListener('click', handleQuestComplete);
        }
        
        // Add event listener to the randomize button
        const randomizeButton = document.getElementById('randomize-button');
        if (randomizeButton) {
            randomizeButton.addEventListener('click', handleRandomize);
        }
    }
    
    /**
     * Create HTML for quest detail modal
     * @param {Object} quest - The quest data
     * @returns {string} - HTML for quest detail
     */
    function createQuestDetailHtml(quest) {
        const typeInfo = QuestManager.getQuestTypeInfo(quest.type);
        const timeRequired = QuestManager.formatTimeRequired(quest.timeRequired);
        const rewardsHtml = createRewardsHtml(quest.attributeRewards);
        
        // Create materials list
        const materialsHtml = quest.materials && quest.materials.length 
            ? `
                <h3>Materials Needed:</h3>
                <ul class="materials-list">
                    ${quest.materials.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `
            : '';
        
        // Create objectives list
        const objectivesHtml = quest.objectives && quest.objectives.length 
            ? `
                <h3>Quest Objectives:</h3>
                <ol class="objectives-list">
                    ${quest.objectives.map(item => `<li>${item}</li>`).join('')}
                </ol>
            `
            : '';
        
        // Create instructions list
        const instructionsHtml = quest.instructions && quest.instructions.length 
            ? `
                <h3>Instructions:</h3>
                <ol class="instructions-list">
                    ${quest.instructions.map((item, index) => 
                        `<li><span class="instruction-step">Step ${index + 1}:</span> ${item}</li>`
                    ).join('')}
                </ol>
            `
            : '';
        
        // Create learning focus
        const learningFocusHtml = quest.learningFocus 
            ? `
                <h3>Learning Focus:</h3>
                <p>${quest.learningFocus}</p>
            `
            : '';
        
        // Add techniques learned section if present
        let techniquesLearnedHtml = '';
        if (quest.techniquesLearned && quest.techniquesLearned.length) {
            techniquesLearnedHtml = `
                <h3>Techniques You'll Learn:</h3>
                <ul class="techniques-list">
            `;
            
            // Get all techniques from SkillsManager
            const allTechniques = SkillsManager.getAllTechniques();
            
            quest.techniquesLearned.forEach(techniqueId => {
                const technique = allTechniques[techniqueId];
                if (technique) {
                    techniquesLearnedHtml += `<li>${technique.name} (${technique.category})</li>`;
                } else {
                    techniquesLearnedHtml += `<li>${techniqueId}</li>`;
                }
            });
            
            techniquesLearnedHtml += `</ul>`;
        }
        
        return `
            <p><strong>Rank:</strong> ${quest.rank.title} Level ${quest.rank.level}</p>
            <p><strong>Type:</strong> ${typeInfo.name} - ${typeInfo.description}</p>
            <p><strong>Time Required:</strong> ${timeRequired}</p>
            <p><strong>Attribute Rewards:</strong></p>
            <div class="rewards">
                ${rewardsHtml}
            </div>
            
            ${materialsHtml}
            ${objectivesHtml}
            ${instructionsHtml}
            ${learningFocusHtml}
            ${techniquesLearnedHtml}
            
            <div class="random-element">
                <button id="randomize-button" class="randomize-button">Add Random Challenge</button>
                <div id="random-element-content"></div>
            </div>
            
            <button id="complete-quest-button" class="complete-button">Mark as Complete</button>
        `;
    }
    
    /**
     * Close the quest detail modal
     */
    function closeQuestDetail() {
        elements.questDetailModal.style.display = 'none';
        QuestManager.setCurrentQuest(null);
    }
    
    /**
     * Handle quest completion
     */
    async function handleQuestComplete() {
        const currentQuest = QuestManager.getCurrentQuest();
        
        if (!currentQuest) {
            console.error('No quest selected for completion');
            return;
        }
        
        // Disable the button while processing
        const completeButton = document.getElementById('complete-quest-button');
        if (completeButton) {
            completeButton.disabled = true;
            completeButton.textContent = 'Processing...';
        }
        
        // Complete the quest
        const result = await QuestManager.completeQuest(currentQuest.id);
        
        if (result.success) {
            // Get updated user profile
            const userProfile = DataManager.getUserProfile();
            
            // Update UI
            updateRankDisplay(userProfile);
            renderAttributesDashboard(userProfile);
            
            // Check if quest unlocks any skills
            updateQuestCompletionWithSkills(currentQuest.id, userProfile);
            
            // Get all quests
            const quests = await DataManager.getQuestData();
            
            // Re-render quest sections
            renderQuestSections(userProfile, quests);
            
            // Close the modal
            closeQuestDetail();
            
            // Show success notification
            showNotification(`Quest completed! ${createRewardsText(result.rewards)}`);
        } else {
            // Show error message
            showNotification(result.message || 'Failed to complete quest', 'error');
            
            // Re-enable the button
            if (completeButton) {
                completeButton.disabled = false;
                completeButton.textContent = 'Mark as Complete';
            }
        }
    }
    
    /**
     * Update quest completion with skills
     * @param {string} questId - Quest ID
     * @param {Object} userProfile - User profile
     */
    function updateQuestCompletionWithSkills(questId, userProfile) {
        // Get the quest
        DataManager.getQuestData().then(quests => {
            const quest = quests.find(q => q.id === questId);
            
            if (!quest) return;
            
            // Check if quest unlocks any techniques
            if (quest.techniquesLearned && Array.isArray(quest.techniquesLearned)) {
                quest.techniquesLearned.forEach(technique => {
                    // Don't add duplicates
                    if (!userProfile.masteredTechniques.includes(technique)) {
                        userProfile.masteredTechniques.push(technique);
                        
                        // Get technique name for notification
                        const techniques = SkillsManager.getAllTechniques();
                        const techName = techniques[technique]?.name || technique;
                        
                        // Show notification
                        showNotification(`New skill unlocked: ${techName}`);
                    }
                });
                
                // Save user profile
                DataManager.saveUserProfile();
            }
        });
    }
    
    /**
     * Create text for quest rewards
     * @param {Object} rewards - The rewards object
     * @returns {string} - Text for rewards
     */
    function createRewardsText(rewards) {
        return Object.entries(rewards)
            .map(([attr, value]) => `${attr.charAt(0).toUpperCase() + attr.slice(1)} +${value}`)
            .join(', ');
    }
    
    /**
     * Handle randomize button click
     */
    function handleRandomize() {
        const currentQuest = QuestManager.getCurrentQuest();
        
        if (!currentQuest) {
            return;
        }
        
        // Generate random element
        const randomElement = QuestManager.generateRandomElement(currentQuest);
        
        // Display the random element
        const container = document.getElementById('random-element-content');
        if (container) {
            container.innerHTML = `<p>${randomElement.text}</p>`;
        }
    }
    
    /**
     * Show a notification
     * @param {string} message - The message to show
     * @param {string} type - The notification type (success, error)
     */
    function showNotification(message, type = 'success') {
        elements.notificationMessage.textContent = message;
        elements.notification.className = `notification ${type}`;
        elements.notification.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(hideNotification, 3000);
    }
    
    /**
     * Hide the notification
     */
    function hideNotification() {
        elements.notification.classList.add('hidden');
    }
    
    /**
     * Toggle a collapsible section
     * @param {string} sectionId - The section ID
     */
    function toggleSection(sectionId) {
        console.log('Toggle section called for:', sectionId); // Debug log
        
        const section = document.getElementById(sectionId);
        const title = document.querySelector(`[data-section="${sectionId}"]`);
        
        if (!section) {
            console.error('Section element not found:', sectionId);
            return;
        }
        
        if (!title) {
            console.error('Title element not found for section:', sectionId);
            return;
        }
        
        // Toggle the hidden class on the section
        section.classList.toggle('hidden');
        
        // Toggle the collapsed class on the title
        title.classList.toggle('collapsed');
        
        // Update the toggle icon
        const toggleIcon = title.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = section.classList.contains('hidden') ? '+' : '−';
        }
        
        console.log('Section toggled. Hidden:', section.classList.contains('hidden')); // Debug log
    }
    
    /**
     * Refresh the UI with updated data
     */
    async function refreshUI() {
        // Get updated data
        const userProfile = DataManager.getUserProfile();
        const quests = await DataManager.getQuestData();
        
        // Update UI components
        updateRankDisplay(userProfile);
        renderAttributesDashboard(userProfile);
        renderQuestSections(userProfile, quests);
    }
    /**
 * Render the progress tab with detailed progression information
 * @param {Object} userProfile - The user profile
 */
function renderProgressTab(userProfile) {
    const progressTab = document.getElementById('progress-tab');
    if (!progressTab) return;
    
    // Clear existing content
    progressTab.innerHTML = '';
    
    // Add section title
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Progress Tracking';
    progressTab.appendChild(title);
    
    // Get user stats
    const stats = DataManager.getUserStats();
    
    // ---- RANK PROGRESS SECTION ----
    const rankSection = document.createElement('div');
    rankSection.className = 'progress-section';
    
    // Get current rank info
    const currentRank = userProfile.currentRank.title;
    const rankInfo = ProgressionSystem.getRankInfo(currentRank);
    
    if (!rankInfo) {
        console.error(`Rank information not found for ${currentRank}`);
        return;
    }
    
    // Get rank names and create visualization
    const rankNames = Object.keys(ProgressionSystem.RANKS);
    const currentRankIndex = rankNames.indexOf(currentRank);
    
    // Create rank visualization
    const rankViz = document.createElement('div');
    rankViz.className = 'rank-progress-visualization';
    
    // Determine how many ranks to show (max 4)
    const maxRanksToShow = 3;
    let startRank = Math.max(0, currentRankIndex - 1);
    let endRank = Math.min(rankNames.length - 1, startRank + maxRanksToShow - 1);
    
    // Adjust start rank if we're near the end
    if (endRank - startRank < maxRanksToShow - 1) {
        startRank = Math.max(0, endRank - (maxRanksToShow - 1));
    }
    
    // Create rank icons and connectors
    for (let i = startRank; i <= endRank; i++) {
        const rankName = rankNames[i];
        const rankData = ProgressionSystem.RANKS[rankName];
        
        // Create rank icon
        const rankIcon = document.createElement('div');
        rankIcon.className = 'rank-icon';
        if (i < currentRankIndex) rankIcon.classList.add('active');
        if (i === currentRankIndex) rankIcon.classList.add('current');

        rankViz.appendChild(rankIcon);
        // Add rank label
        //const rankLabel = document.createElement('span');
        //rankLabel.className = 'rank-label';
        //rankLabel.textContent = rankName;
        //rankIcon.appendChild(rankLabel);
        
        // rankViz.appendChild(rankIcon);
        
        // Add connector if not the last rank
        // if (i < endRank) {
            //const connector = document.createElement('div');
            //connector.className = 'rank-connector';
            //if (i < currentRankIndex) connector.classList.add('active');
            //rankViz.appendChild(connector);
        //}
    }
    
    rankSection.appendChild(rankViz);
    
    // Add current rank info - now with correct level display from progression system
    const rankTitle = document.createElement('h4');
    rankTitle.textContent = `${currentRank} (${userProfile.currentRank.color})`;
    rankSection.appendChild(rankTitle);
    
    // Add progress bar - now using the progressPercentage directly from the userProfile
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    // Use the correct overall rank progress percentage from the new system
    const overallProgressPercent = userProfile.currentRank.progressPercentage || 0;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar rank-progress';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${overallProgressPercent}%`;
    
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    
    // Add progress labels
    const progressLabels = document.createElement('div');
    progressLabels.className = 'progress-labels';
    
    // Display current rank progress for this rank
    const progressLabel = document.createElement('span');
    progressLabel.textContent = `Overall Rank Progress`;
    
    const percentLabel = document.createElement('span');
    percentLabel.textContent = `${Math.round(overallProgressPercent)}%`;
    
    progressLabels.appendChild(progressLabel);
    progressLabels.appendChild(percentLabel);
    
    progressContainer.appendChild(progressLabels);
    rankSection.appendChild(progressContainer);
    
    // Add next rank info
    const nextRankInfo = document.createElement('p');
    nextRankInfo.className = 'next-rank-info';
    nextRankInfo.textContent = `Next Rank: ${rankInfo.nextRank || "Max Rank Achieved"}`;
    rankSection.appendChild(nextRankInfo);
    
    // Get next rank information from ProgressionSystem
    const nextRankData = ProgressionSystem.getHoursForNextRank(userProfile);
    
    // Calculate average hours per attribute - use the proper calculation
    // Each attribute contributes 25% to overall progress
    const avgAttributeHours = nextRankData.totalHours / ProgressionSystem.ATTRIBUTES.length;
    const requiredHours = rankInfo.attributeHoursRequired;
    
    const hoursInfo = document.createElement('p');
    hoursInfo.className = 'hours-info';
    hoursInfo.textContent = `Average Attribute Hours: ${avgAttributeHours.toFixed(1)} / ${requiredHours}`;
    rankSection.appendChild(hoursInfo);
    
    // Calculate and display total accumulated hours across all attributes
    const totalHours = Object.values(userProfile.attributes)
        .reduce((sum, attr) => sum + attr.totalHours, 0);
    
    const totalHoursInfo = document.createElement('p');
    totalHoursInfo.className = 'hours-info';
    totalHoursInfo.textContent = `Total Accumulated Hours: ${totalHours.toFixed(1)}`;
    rankSection.appendChild(totalHoursInfo);
    
    progressTab.appendChild(rankSection);
    
    // ---- ATTRIBUTE DETAILS SECTION ----
    const attributesSection = document.createElement('div');
    attributesSection.className = 'progress-section';
    
    // Section header
    const attributesSectionHeader = document.createElement('h3');
    attributesSectionHeader.className = 'section-subtitle';
    attributesSectionHeader.textContent = 'Attribute Details';
    attributesSection.appendChild(attributesSectionHeader);
    
    // Create attribute grid
    const attributeGrid = document.createElement('div');
    attributeGrid.className = 'attribute-grid';
    
    // Add details for each attribute
    const attributes = ProgressionSystem.ATTRIBUTES;
    
    attributes.forEach(attrName => {
        const attrData = userProfile.attributes[attrName];
        if (!attrData) return;
        
        const attrDetail = document.createElement('div');
        attrDetail.className = `attribute-detail ${attrName}-border`;
        
        // Get attribute's current rank and level
        const attributeRank = attrData.currentRank || currentRank;
        const attributeLevel = attrData.currentLevel || 1;
        
        // Display waiting status if applicable
        let statusText = '';
        if (attrData.waitingForUserRankUp) {
            statusText = ` (Waiting for Rank Up)`;
        }
        
        // Create attribute header with icon and name
        const attrHeader = document.createElement('div');
        attrHeader.className = 'attribute-header';
        
        // Choose icon based on attribute
        let icon = '';
        switch(attrName) {
            case 'technique': icon = '🔪'; break;
            case 'ingredients': icon = '🥕'; break;
            case 'flavor': icon = '🌶️'; break;
            case 'management': icon = '⏱️'; break;
        }
        
        attrHeader.innerHTML = `
            <span class="attribute-icon ${attrName}-icon"></span>
            <h4>${attrName.charAt(0).toUpperCase() + attrName.slice(1)}</h4>
        `;
        
        attrDetail.appendChild(attrHeader);
        
        // Add attribute stats
        const attrStats = document.createElement('div');
        attrStats.className = 'attribute-stats';
        
        // Rank and level status
        const rankStat = document.createElement('div');
        rankStat.className = 'stat-row';
        rankStat.innerHTML = `
            <span class="stat-label">Rank:</span>
            <span class="stat-value">${attributeRank}${statusText}</span>
        `;
        attrStats.appendChild(rankStat);
        
        // Level stat
        const levelStat = document.createElement('div');
        levelStat.className = 'stat-row';
        levelStat.innerHTML = `
            <span class="stat-label">Level:</span>
            <span class="stat-value">${attributeLevel}</span>
        `;
        attrStats.appendChild(levelStat);
        
        // Total hours stat
        const hoursStat = document.createElement('div');
        hoursStat.className = 'stat-row';
        hoursStat.innerHTML = `
            <span class="stat-label">Total Hours:</span>
            <span class="stat-value">${attrData.totalHours.toFixed(1)}</span>
        `;
        attrStats.appendChild(hoursStat);
        
        attrDetail.appendChild(attrStats);
        
        // Add progress bar using the levelProgressPercentage
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = `progress-fill ${attrName}-fill`;
        progressFill.style.width = `${attrData.levelProgressPercentage}%`;
        
        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        
        // Add progress labels
        const progressLabels = document.createElement('div');
        progressLabels.className = 'progress-labels';
        
        // Show current progress toward next level
        const currentProgress = attrData.totalHours;
        const nextLevel = attrData.hoursToNextLevel;
        
        const hoursLabel = document.createElement('span');
        hoursLabel.textContent = `${currentProgress.toFixed(1)} / ${nextLevel.toFixed(1)} hrs`;
        
        const percentLabel = document.createElement('span');
        percentLabel.textContent = `${Math.round(attrData.levelProgressPercentage)}%`;
        
        progressLabels.appendChild(hoursLabel);
        progressLabels.appendChild(percentLabel);
        
        progressContainer.appendChild(progressLabels);
        attrDetail.appendChild(progressContainer);
        
        // Add rank progress information
        const rankProgressInfo = document.createElement('p');
        rankProgressInfo.className = 'next-level-info';
        rankProgressInfo.textContent = `Rank Progress: ${Math.round(attrData.rankProgressPercentage)}%`;
        attrDetail.appendChild(rankProgressInfo);
        
        attributeGrid.appendChild(attrDetail);
    });
    
    attributesSection.appendChild(attributeGrid);
    progressTab.appendChild(attributesSection);
    
    // The rest of the function (Skills Mastery, Recent Achievements, Overall Stats) can remain largely unchanged
    // I'm including them for completeness
    
    // ---- SKILLS MASTERY SECTION ----
    const skillsSection = document.createElement('div');
    skillsSection.className = 'progress-section';
    
    // Section header
    const skillsSectionHeader = document.createElement('h3');
    skillsSectionHeader.className = 'section-subtitle';
    skillsSectionHeader.textContent = 'Skills Mastery';
    skillsSection.appendChild(skillsSectionHeader);
    
    // Get all techniques
    const allTechniques = SkillsManager.getAllTechniques();
    const masteredTechniques = userProfile.masteredTechniques || [];
    
    // Group techniques by category
    const categoryCounts = {};
    
    // Initialize categories
    Object.keys(ProgressManager.TECHNIQUE_CATEGORIES).forEach(category => {
        categoryCounts[category] = {
            total: 0,
            mastered: 0
        };
    });
    
    // Count techniques
    Object.entries(allTechniques).forEach(([id, technique]) => {
        const category = technique.category;
        if (categoryCounts[category]) {
            categoryCounts[category].total++;
            
            if (masteredTechniques.includes(id)) {
                categoryCounts[category].mastered++;
            }
        }
    });
    
    // Create progress bars for each category
    Object.entries(categoryCounts).forEach(([category, counts]) => {
        const percentage = counts.total > 0 ? (counts.mastered / counts.total) * 100 : 0;
        const categoryData = ProgressManager.TECHNIQUE_CATEGORIES[category];
        
        const categoryProgress = document.createElement('div');
        categoryProgress.className = 'category-progress';
        
        // Category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span>${categoryData.icon}</span>
            <h4>${category}</h4>
        `;
        categoryProgress.appendChild(categoryHeader);
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        // Different colors for different categories
        let fillColor = '';
        switch(category) {
            case 'Knife Skills': fillColor = 'var(--technique-color)'; break;
            case 'Heat Management': fillColor = 'var(--flavor-color)'; break;
            case 'Flavor Building': fillColor = 'var(--accent-color-3)'; break;
            case 'Ingredient Knowledge': fillColor = 'var(--primary-color)'; break;
            case 'Kitchen Management': fillColor = 'var(--management-color)'; break;
            default: fillColor = 'var(--primary-color)';
        }
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = `${percentage}%`;
        progressFill.style.backgroundColor = fillColor;
        
        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressBar);
        
        // Progress labels
        const progressLabels = document.createElement('div');
        progressLabels.className = 'progress-labels';
        
        const countLabel = document.createElement('span');
        countLabel.textContent = `${counts.mastered} / ${counts.total} techniques`;
        
        const percentLabel = document.createElement('span');
        percentLabel.textContent = `${Math.round(percentage)}%`;
        
        progressLabels.appendChild(countLabel);
        progressLabels.appendChild(percentLabel);
        
        progressContainer.appendChild(progressLabels);
        categoryProgress.appendChild(progressContainer);
        
        // Category description
        const categoryDescription = document.createElement('p');
        categoryDescription.className = 'category-description';
        categoryDescription.textContent = categoryData.description;
        categoryProgress.appendChild(categoryDescription);
        
        skillsSection.appendChild(categoryProgress);
    });
    
    progressTab.appendChild(skillsSection);
    
    // ---- RECENT ACHIEVEMENTS SECTION ----
    const achievementsSection = document.createElement('div');
    achievementsSection.className = 'progress-section';
    
    // Section header
    const achievementsSectionHeader = document.createElement('h3');
    achievementsSectionHeader.className = 'section-subtitle';
    achievementsSectionHeader.textContent = 'Recent Achievements';
    achievementsSection.appendChild(achievementsSectionHeader);
    
    // Get recent achievements
    const recentAchievements = DataManager.getRecentAchievements(5);
    
    if (recentAchievements && recentAchievements.length > 0) {
        // Create achievements list
        const achievementsList = document.createElement('ul');
        achievementsList.className = 'recent-quests-list';
        
        // Process each achievement
        for (const achievement of recentAchievements) {
            const achievementItem = document.createElement('li');
            achievementItem.className = 'recent-quest-item';
            
            // Different display based on achievement type
            if (achievement.type === 'quest_complete') {
                // Get quest type info
                const typeInfo = QuestManager.getQuestTypeInfo(achievement.questType);
                
                achievementItem.innerHTML = `
                    <div class="quest-badge ${typeInfo.cssClass}">
                        <span>✓</span>
                    </div>
                    <div class="quest-info">
                        <h5 class="quest-title">${achievement.questTitle}</h5>
                        <p class="quest-type">${typeInfo.name} Quest</p>
                    </div>
                `;
            } else if (achievement.type === 'rank_up') {
                achievementItem.innerHTML = `
                    <div class="quest-badge" style="background-color:var(--accent-color-2);">
                        <span>⭐</span>
                    </div>
                    <div class="quest-info">
                        <h5 class="quest-title">Rank Advancement</h5>
                        <p class="quest-type">${achievement.previousRank} → ${achievement.newRank}</p>
                    </div>
                `;
            } else if (achievement.type === 'level_up') {
                achievementItem.innerHTML = `
                    <div class="quest-badge" style="background-color:var(--accent-color-3);">
                        <span>↑</span>
                    </div>
                    <div class="quest-info">
                        <h5 class="quest-title">Level Up</h5>
                        <p class="quest-type">${achievement.rank} Level ${achievement.previousLevel} → ${achievement.newLevel}</p>
                    </div>
                `;
            } else if (achievement.type === 'technique_learned') {
                // Get technique info
                const technique = SkillsManager.getAllTechniques()[achievement.techniqueId];
                
                if (technique) {
                    achievementItem.innerHTML = `
                        <div class="quest-badge" style="background-color:var(--technique-color);">
                            <span>+</span>
                        </div>
                        <div class="quest-info">
                            <h5 class="quest-title">New Technique Mastered</h5>
                            <p class="quest-type">${technique.name} (${technique.category})</p>
                        </div>
                    `;
                }
            }
            
            achievementsList.appendChild(achievementItem);
        }
        
        achievementsSection.appendChild(achievementsList);
    } else {
        // No achievements message
        const noAchievementsMessage = document.createElement('p');
        noAchievementsMessage.className = 'no-quests-message';
        noAchievementsMessage.textContent = 'Complete quests to see your achievements here!';
        achievementsSection.appendChild(noAchievementsMessage);
    }
    
    progressTab.appendChild(achievementsSection);
    
    // ---- OVERALL STATS SECTION ----
    const statsSection = document.createElement('div');
    statsSection.className = 'progress-section';
    
    // Section header
    const statsSectionHeader = document.createElement('h3');
    statsSectionHeader.className = 'section-subtitle';
    statsSectionHeader.textContent = 'Overall Statistics';
    statsSection.appendChild(statsSectionHeader);
    
    // Create stats grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-cards';
    
    // Add stat cards
    const statsData = [
        { label: 'Quests Completed', value: userProfile.completedQuests.length },
        { label: 'Techniques Mastered', value: userProfile.masteredTechniques.length },
        { label: 'Total Hours', value: totalHours.toFixed(1) }
    ];
    
    statsData.forEach(stat => {
        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        
        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = stat.value;
        
        const statLabel = document.createElement('div');
        statLabel.className = 'stat-label';
        statLabel.textContent = stat.label;
        
        statCard.appendChild(statValue);
        statCard.appendChild(statLabel);
        
        statsGrid.appendChild(statCard);
    });
    
    statsSection.appendChild(statsGrid);
    progressTab.appendChild(statsSection);
}

    /**
 * Render the skills tab
 * @param {Object} userProfile - The user profile
 */
function renderSkillsTab(userProfile) {
    // Get the skills container
    const skillsContainer = document.getElementById('skills-container');
    if (!skillsContainer) return;
    
    // Clear existing content
    skillsContainer.innerHTML = '';
    
    // Get skill tree data
    const skillTreeData = SkillsManager.generateSkillTreeData(userProfile);
    
    // Render category filters
    renderCategoryFilters(Object.keys(skillTreeData));
    
    // Render each category
    Object.entries(skillTreeData).forEach(([categoryName, categoryData]) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'skill-category';
        categorySection.id = `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span class="category-icon">${categoryData.icon}</span>
            <h3 class="category-name">${categoryName}</h3>
        `;
        
        categorySection.appendChild(categoryHeader);
        
        // Create category description
        const categoryDescription = document.createElement('p');
        categoryDescription.className = 'category-description';
        categoryDescription.textContent = categoryData.description;
        categorySection.appendChild(categoryDescription);
        
        // Create difficulty sections
        Object.entries(categoryData.skills).forEach(([difficulty, skills]) => {
            if (skills.length === 0) return;
            
            const difficultySection = document.createElement('div');
            difficultySection.className = 'difficulty-section';
            
            // Difficulty title
            const difficultyTitle = document.createElement('h4');
            difficultyTitle.className = 'difficulty-title';
            difficultyTitle.textContent = `${difficulty}`;
            difficultySection.appendChild(difficultyTitle);
            
            // Create skill tree
            const skillTree = document.createElement('div');
            skillTree.className = 'skill-tree';
            
            // Add skills to tree
            skills.forEach(skill => {
                const skillNode = document.createElement('div');
                skillNode.className = `skill-node ${skill.mastered ? 'mastered' : skill.available ? 'available' : 'locked'}`;
                skillNode.setAttribute('data-skill-id', skill.id);
                skillNode.setAttribute('data-prerequisites', JSON.stringify(skill.prerequisites || []));
                
                skillNode.innerHTML = `
                    <div class="skill-icon">${skill.icon || '🔪'}</div>
                    <div class="skill-name">${skill.name}</div>
                    ${skill.mastered ? '<div class="mastery-badge">✓</div>' : ''}
                `;
                
                // Add click handler for skill details
                if (skill.mastered || skill.available) {
                    skillNode.addEventListener('click', () => openSkillDetail(skill.id, userProfile));
                }
                
                skillTree.appendChild(skillNode);
            });
            
            difficultySection.appendChild(skillTree);
            categorySection.appendChild(difficultySection);
        });
        
        skillsContainer.appendChild(categorySection);
    });
    
    // Create connections between prerequisite skills (after all nodes are added to DOM)
    setTimeout(() => createSkillConnections(userProfile), 100);
}

/**
 * Render category filter buttons
 * @param {Array} categories - Category names
 */
function renderCategoryFilters(categories) {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;
    
    // Clear existing filters
    filterContainer.innerHTML = '';
    
    // Add "All" filter
    const allFilter = document.createElement('button');
    allFilter.className = 'category-filter active';
    allFilter.textContent = 'All';
    allFilter.addEventListener('click', () => filterSkillsByCategory('all'));
    filterContainer.appendChild(allFilter);
    
    // Add category filters
    categories.forEach(category => {
        const filter = document.createElement('button');
        filter.className = 'category-filter';
        filter.textContent = category;
        filter.addEventListener('click', () => filterSkillsByCategory(category));
        filterContainer.appendChild(filter);
    });
}

/**
 * Filter skills by category
 * @param {string} category - Category to filter by
 */
function filterSkillsByCategory(category) {
    // Update active filter
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.classList.toggle('active', filter.textContent === category || (category === 'all' && filter.textContent === 'All'));
    });
    
    // Show/hide categories
    document.querySelectorAll('.skill-category').forEach(categorySection => {
        if (category === 'all') {
            categorySection.style.display = 'block';
        } else {
            const categoryName = categorySection.querySelector('.category-name').textContent;
            categorySection.style.display = categoryName === category ? 'block' : 'none';
        }
    });
}

/**
 * Create visual connections between prerequisite skills
 * @param {Object} userProfile - The user profile
 */
function createSkillConnections(userProfile) {
    // Remove any existing connections
    document.querySelectorAll('.skill-connection').forEach(conn => conn.remove());
    
    // Get all skill nodes
    const skillNodes = document.querySelectorAll('.skill-node');
    
    // Process each node
    skillNodes.forEach(node => {
        const skillId = node.getAttribute('data-skill-id');
        let prerequisites;
        
        try {
            prerequisites = JSON.parse(node.getAttribute('data-prerequisites') || '[]');
        } catch (e) {
            prerequisites = [];
        }
        
        // Skip if no prerequisites
        if (!prerequisites || prerequisites.length === 0) return;
        
        // Create connections to each prerequisite
        prerequisites.forEach(prereqId => {
            const prereqNode = document.querySelector(`.skill-node[data-skill-id="${prereqId}"]`);
            if (!prereqNode) return;
            
            // Create connection line
            createConnectionLine(
                prereqNode, 
                node, 
                SkillsManager.isTechniqueMastered(prereqId, userProfile)
            );
        });
    });
}


/**
 * Open skill detail modal
 * @param {string} skillId - Skill ID to display
 * @param {Object} userProfile - User profile
 */
function openSkillDetail(skillId, userProfile) {
    // Get skill data
    const techniques = SkillsManager.getAllTechniques();
    const skill = techniques[skillId];
    
    if (!skill) {
        console.error(`Skill not found: ${skillId}`);
        return;
    }
    
    // Get the modal elements
    const modal = document.getElementById('skill-detail-modal');
    const modalTitle = document.getElementById('skill-modal-title');
    const modalContent = document.getElementById('skill-modal-content');
    
    if (!modal || !modalTitle || !modalContent) {
        console.error('Skill modal elements not found');
        return;
    }
    
    // Set modal title
    modalTitle.textContent = skill.name;
    
    // Get mastered and available status
    const isMastered = SkillsManager.isTechniqueMastered(skillId, userProfile);
    const isAvailable = SkillsManager.isTechniqueAvailable(skillId, userProfile);
    
    // Generate prerequisites HTML
    let prerequisitesHtml = '';
    if (skill.prerequisites && skill.prerequisites.length > 0) {
        prerequisitesHtml = `
            <h3>Prerequisites:</h3>
            <ul class="prerequisites-list">
                ${skill.prerequisites.map(prereqId => {
                    const prereq = techniques[prereqId];
                    const completed = SkillsManager.isTechniqueMastered(prereqId, userProfile);
                    return `
                        <li class="prerequisite-item">
                            <div class="prerequisite-icon ${completed ? 'completed' : 'missing'}">
                                ${completed ? '✓' : ''}
                            </div>
                            ${prereq ? prereq.name : prereqId}
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    }
    
    // Generate unlocked by HTML
    let unlockedByHtml = '';
    if (skill.unlockedBy && skill.unlockedBy.length > 0) {
        // Get quest data to get quest names
        DataManager.getQuestData().then(quests => {
            const questMap = {};
            quests.forEach(quest => {
                questMap[quest.id] = quest;
            });
            
            unlockedByHtml = `
                <h3>Unlocked by Quests:</h3>
                <ul class="quests-list">
                    ${skill.unlockedBy.map(questId => {
                        const quest = questMap[questId];
                        return `<li>${quest ? quest.title : questId}</li>`;
                    }).join('')}
                </ul>
            `;
            
            // Complete the modal content with quest info
            completeModalContent();
        });
    } else {
        // Complete the modal content without quest info
        completeModalContent();
    }
    
    function completeModalContent() {
        // Set modal content
        modalContent.innerHTML = `
            <p><strong>Category:</strong> ${skill.category}</p>
            <p><strong>Difficulty:</strong> ${skill.difficulty}</p>
            <p><strong>Description:</strong> ${skill.description}</p>
            
            ${prerequisitesHtml}
            ${unlockedByHtml}
            
            ${isMastered 
                ? '<p class="success-message"><strong>✓ You have mastered this skill!</strong></p>' 
                : isAvailable
                    ? '<button id="learn-skill-button" class="skill-learn-button">Learn Skill</button>'
                    : '<p class="locked-message">This skill is not yet available. Complete the prerequisites first.</p>'
            }
        `;
        
        // Add event listener to learn button if available
        const learnButton = document.getElementById('learn-skill-button');
        if (learnButton) {
            learnButton.addEventListener('click', () => {
                learnSkill(skillId, userProfile);
            });
        }
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

/**
 * Close skill detail modal
 */
function closeSkillDetail() {
    const modal = document.getElementById('skill-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Learn a new skill
 * @param {string} skillId - Skill ID to learn
 * @param {Object} userProfile - User profile
 */
function learnSkill(skillId, userProfile) {
    // Check if skill is available
    if (!SkillsManager.isTechniqueAvailable(skillId, userProfile)) {
        console.error(`Skill not available: ${skillId}`);
        return;
    }
    
    // Get skill data
    const techniques = SkillsManager.getAllTechniques();
    const skill = techniques[skillId];
    
    if (!skill) {
        console.error(`Skill not found: ${skillId}`);
        return;
    }
    
    // Add to mastered techniques 
    DataManager.addMasteredTechnique(skillId);
    
    // Close the modal
    closeSkillDetail();
    
    // Show notification if UIManager has a showNotification method
    if (typeof UIManager !== 'undefined' && typeof UIManager.showNotification === 'function') {
        UIManager.showNotification(`Skill mastered: ${skill.name}`);
    }
    
    // Refresh skills tab
    renderSkillsTab(DataManager.getUserProfile());
}
    
    // Define global functions needed by HTML
    window.openQuestDetail = openQuestDetail;
    window.closeQuestDetail = closeQuestDetail;
    window.toggleSection = toggleSection;
    window.hideNotification = hideNotification;
    window.openSkillDetail = function(skillId) {
    const userProfile = DataManager.getUserProfile();
    openSkillDetail(skillId, userProfile);
};
    window.closeSkillDetail = closeSkillDetail;
    
    // Public API
    return {
        initialize,
        refreshUI,
        showNotification,
        renderProgressTab,
        renderSkillsTab
    };
})();
