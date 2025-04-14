/**
 * ui.js - Handles all user interface interactions
 * This file manages DOM manipulations, rendering, and UI event handling.
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
        notificationMessage: document.getElementById('notification-message')
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
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    function setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
        
        // Section toggles
        document.querySelectorAll('.section-title.collapsed').forEach(title => {
            title.addEventListener('click', event => {
                const sectionId = event.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                toggleSection(sectionId);
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
        
        // Handle tab switching logic here
        const tabName = event.currentTarget.getAttribute('data-tab');
        console.log(`Switching to ${tabName} tab`);
        
        // Future implementation for tab switching
    }
    
    /**
     * Update the user's rank display
     * @param {Object} userProfile - The user profile
     */
    function updateRankDisplay(userProfile) {
        if (elements.rankDisplay) {
            elements.rankDisplay.textContent = `${userProfile.currentRank.title} (${userProfile.currentRank.color}) • Level ${userProfile.currentRank.level}`;
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
            attrCard.className = 'attribute-card';
            
            const percentage = attrData.progressPercentage || 0;
            
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
        
        // Get appropriate quests for daily section (mix of types)
        const appropriateQuests = ProgressManager.getAppropriateQuests(userProfile, availableQuests, 3);
        
        // Get recommended quests
        DataManager.getRecommendedQuests(3).then(recommendedQuests => {
            // Render recommended quests
            renderQuestCards(recommendedQuests, elements.recommendedQuests);
        });
        
        // Get next challenge quest
        const nextChallengeQuest = ProgressManager.getNextChallengeQuest(userProfile, quests);
        
        // Get completed quests
        const completedQuests = QuestManager.getCompletedQuests(userProfile);
        
        // Render quest sections
        renderQuestCards(appropriateQuests, elements.availableQuests);
        renderQuestCards(nextChallengeQuest ? [nextChallengeQuest] : [], elements.challengeQuests);
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
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.setAttribute('data-quest-id', quest.id);
        card.onclick = () => openQuestDetail(quest.id);
        
        const typeInfo = QuestManager.getQuestTypeInfo(quest.type);
        
        // Format time required
        const timeRequired = ProgressManager.formatTimeRequired(quest.timeRequired);
        
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
        // Check if all attributes have the same value
        const values = Object.values(rewards).filter(val => val > 0);
        const allSame = values.every(val => val === values[0]);
        
        if (allSame && Object.keys(rewards).length === 4 && values.length > 0) {
            return `<span class="reward-pill all-attributes-reward">All Attributes +${values[0]}</span>`;
        }
        
        // Otherwise, create individual pills
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
        const timeRequired = ProgressManager.formatTimeRequired(quest.timeRequired);
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
        const section = document.getElementById(sectionId);
        const title = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
        
        if (section && title) {
            section.classList.toggle('hidden');
            title.classList.toggle('collapsed');
            
            // Update the toggle icon
            const toggleIcon = title.querySelector('.toggle-icon');
            if (toggleIcon) {
                toggleIcon.textContent = section.classList.contains('hidden') ? '+' : '−';
            }
        }
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
    
    // Define global functions needed by HTML
    window.openQuestDetail = openQuestDetail;
    window.closeQuestDetail = closeQuestDetail;
    window.toggleSection = toggleSection;
    window.hideNotification = hideNotification;
    
    // Public API
    return {
        initialize,
        refreshUI,
        showNotification
    };
})();
