/**
 * ui.js - Handles all user interface interactions
 * This file manages DOM manipulations, rendering, and UI event handling.
 * UPDATED: Skills and Journal features removed, Progress tab restored
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
        // Create notification element if it doesn't exist
        if (!elements.notification) {
            const notification = document.createElement('div');
            notification.className = `notification ${type} hidden`;
            notification.id = 'notification';
            
            const notificationContent = document.createElement('div');
            notificationContent.className = 'notification-content';
            
            const notificationMessage = document.createElement('div');
            notificationMessage.id = 'notification-message';
            notificationMessage.textContent = message;
            
            notificationContent.appendChild(notificationMessage);
            notification.appendChild(notificationContent);
            
            document.body.appendChild(notification);
            
            elements.notification = notification;
            elements.notificationMessage = notificationMessage;
        }
        
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
        if (elements.notification) {
            elements.notification.classList.add('hidden');
        }
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
     * Create rank cards carousel component
     * @param {Object} userProfile - The user profile
     * @returns {HTMLElement} - The carousel section element
     */
    function createRankCardsCarousel(userProfile) {
        // Get current rank from user profile
        const currentRank = userProfile.currentRank.title;
        
        // Get all ranks from progression system
        const allRanks = Object.keys(ProgressionSystem.RANKS);
        const currentRankIndex = allRanks.indexOf(currentRank);
        
        // Create the carousel container
        const carouselSection = document.createElement('div');
        carouselSection.className = 'progress-section';
        
        // Add section title
        const carouselTitle = document.createElement('h3');
        carouselTitle.className = 'section-subtitle';
        carouselTitle.textContent = 'Rank Progression';
        carouselSection.appendChild(carouselTitle);
        
        // Create the card stack container
        const cardStackContainer = document.createElement('div');
        cardStackContainer.className = 'rank-card-stack-container';
        
        // Create the card stack
        const cardStack = document.createElement('div');
        cardStack.className = 'rank-card-stack';
        cardStack.id = 'rankCardStack';
        
        // Determine which ranks to display (all ranks)
        allRanks.forEach((rankName, index) => {
            const rankData = ProgressionSystem.RANKS[rankName];
            
            // Determine card position class
            let positionClass = 'rank-card-hidden';
            let zIndex = 0;
            
            if (index === currentRankIndex) {
                positionClass = 'rank-card-center';
                zIndex = 100;
            } else if (index === currentRankIndex - 1) {
                positionClass = 'rank-card-left';
                zIndex = 90;
            } else if (index === currentRankIndex + 1) {
                positionClass = 'rank-card-right';
                zIndex = 90;
            } else if (index === currentRankIndex - 2) {
                positionClass = 'rank-card-far-left';
                zIndex = 80;
            } else if (index === currentRankIndex + 2) {
                positionClass = 'rank-card-far-right';
                zIndex = 80;
            }
            
            // Create the card element
            const rankCard = document.createElement('div');
            rankCard.className = `rank-card ${positionClass}`;
            rankCard.setAttribute('data-rank-index', index);
            rankCard.style.zIndex = zIndex;
            
            // Add color class based on rank color
            const rankColor = rankData.color.toLowerCase();
            rankCard.classList.add(`rank-${rankColor}`);
            
            // Add "completed" class if this rank is lower than current
            if (index < currentRankIndex) {
                rankCard.classList.add('rank-completed');
            }
            
            // Add card content
            rankCard.innerHTML = `
                <div class="rank-card-icon">
                    <div class="hexagon-container">
                        <div class="hexagon ${rankColor}">
                            <div class="hexagon-content">
                                <div class="knife-icon"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="rank-card-title">${rankName}</div>
                <div class="rank-card-subtitle">(${rankData.color})</div>
            `;
            
            // Add click handler for left and right cards
            if (positionClass === 'rank-card-left' || positionClass === 'rank-card-right') {
                rankCard.addEventListener('click', () => {
                    rotateCardStack(index);
                });
            }
            
            // Add the card to the stack
            cardStack.appendChild(rankCard);
        });
        
        // Add the card stack to container
        cardStackContainer.appendChild(cardStack);
        
        // Add navigation controls (optional)
        const navControls = document.createElement('div');
        navControls.className = 'rank-card-nav';
        navControls.innerHTML = `
            <button id="prevRankBtn" class="rank-nav-btn ${currentRankIndex === 0 ? 'disabled' : ''}">← Previous</button>
            <button id="nextRankBtn" class="rank-nav-btn ${currentRankIndex === allRanks.length - 1 ? 'disabled' : ''}">Next →</button>
        `;
        cardStackContainer.appendChild(navControls);
        
        // Add the container to section
        carouselSection.appendChild(cardStackContainer);
        
        // Add event listeners for navigation buttons
        setTimeout(() => {
            const prevBtn = document.getElementById('prevRankBtn');
            const nextBtn = document.getElementById('nextRankBtn');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentRankIndex > 0) {
                        rotateCardStack(currentRankIndex - 1);
                    }
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentRankIndex < allRanks.length - 1) {
                        rotateCardStack(currentRankIndex + 1);
                    }
                });
            }
        }, 0);
        
        return carouselSection;
    }

    /**
     * Rotate the card stack
     * @param {number} targetIndex - The target rank index
     */
    function rotateCardStack(targetIndex) {
        const cardStack = document.getElementById('rankCardStack');
        if (!cardStack) return;
        
        // Get all cards
        const cards = cardStack.querySelectorAll('.rank-card');
        if (!cards.length) return;
        
        // Get current center card index
        let currentCenterIndex = -1;
        cards.forEach((card) => {
            if (card.classList.contains('rank-card-center')) {
                currentCenterIndex = parseInt(card.getAttribute('data-rank-index'));
            }
        });
        
        if (currentCenterIndex === -1) return;
        
        // Add transition class to enable animations
        cardStack.classList.add('transitioning');
        
        // Update card positions and add/remove click handlers
        cards.forEach(card => {
            const cardIndex = parseInt(card.getAttribute('data-rank-index'));
            
            // Remove existing click handler by cloning the card content
            const oldHtml = card.innerHTML;
            card.innerHTML = oldHtml;
            
            // Remove all position classes
            card.classList.remove(
                'rank-card-center', 
                'rank-card-left', 
                'rank-card-right',
                'rank-card-far-left',
                'rank-card-far-right',
                'rank-card-hidden'
            );
            
            // Set new position class
            let newClass = 'rank-card-hidden';
            let zIndex = 0;
            
            if (cardIndex === targetIndex) {
                newClass = 'rank-card-center';
                zIndex = 100;
                card.style.cursor = 'default';
            } else if (cardIndex === targetIndex - 1) {
                newClass = 'rank-card-left';
                zIndex = 90;
                card.style.cursor = 'pointer';
                card.addEventListener('click', function() {
                    rotateCardStack(cardIndex);
                });
            } else if (cardIndex === targetIndex + 1) {
                newClass = 'rank-card-right';
                zIndex = 90;
                card.style.cursor = 'pointer';
                card.addEventListener('click', function() {
                    rotateCardStack(cardIndex);
                });
            } else if (cardIndex === targetIndex - 2) {
                newClass = 'rank-card-far-left';
                zIndex = 80;
                card.style.cursor = 'default';
            } else if (cardIndex === targetIndex + 2) {
                newClass = 'rank-card-far-right';
                zIndex = 80;
                card.style.cursor = 'default';
            }
            
            card.classList.add(newClass);
            card.style.zIndex = zIndex;
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prevRankBtn');
        const nextBtn = document.getElementById('nextRankBtn');
        const allRanks = Object.keys(ProgressionSystem.RANKS);
        
        if (prevBtn) {
            // Remove old event listeners by replacing with a clone
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            
            // Add new event listener if not at the first rank
            if (targetIndex > 0) {
                newPrevBtn.classList.remove('disabled');
                newPrevBtn.addEventListener('click', function() {
                    rotateCardStack(targetIndex - 1);
                });
            } else {
                newPrevBtn.classList.add('disabled');
            }
        }
        
        if (nextBtn) {
            // Remove old event listeners by replacing with a clone
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            // Add new event listener if not at the last rank
            if (targetIndex < allRanks.length - 1) {
                newNextBtn.classList.remove('disabled');
                newNextBtn.addEventListener('click', function() {
                    rotateCardStack(targetIndex + 1);
                });
            } else {
                newNextBtn.classList.add('disabled');
            }
        }
        
        // Remove transition class after animation completes
        setTimeout(() => {
            cardStack.classList.remove('transitioning');
        }, 600); // Should match transition duration in CSS
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
        // Replace the old rank visualization with our new card stack
        const rankSection = createRankCardsCarousel(userProfile);
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
            { label: 'Hours Accumulated', value: stats.totalHours.toFixed(1) },
            { label: 'Current Rank', value: `${userProfile.currentRank.title} ${userProfile.currentRank.level}` }
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
    
    // Define global functions needed by HTML
    window.openQuestDetail = openQuestDetail;
    window.closeQuestDetail = closeQuestDetail;
    window.toggleSection = toggleSection;
    window.hideNotification = hideNotification;
    
    // Public API
    return {
        initialize,
        refreshUI,
        showNotification,
        renderProgressTab
    };
})();
