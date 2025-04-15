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
        }
        
        console.log(`Switched to ${tabName} tab`);
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
        
        // Only use "All Attributes" if ALL four attributes have the same non-zero value
        if (allSame && values.length === 4 && values[0] > 0) {
            return `<span class="reward-pill all-attributes-reward">All Attributes +${values[0]}</span>`;
        }
        
        // For the case where multiple (but not all) attributes have the same value
        if (allSame && values.length > 1 && values.length < 4) {
            // Get attribute names with non-zero values
            const attrNames = Object.entries(rewards)
                .filter(([_, val]) => val > 0)
                .map(([name, _]) => name.charAt(0).toUpperCase() + name.slice(1));
            
            return `<span class="reward-pill all-attributes-reward">${attrNames.join(' & ')} +${values[0]}</span>`;
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
    
    // ======================================================================
    // SKILLS UI FUNCTIONS
    // ======================================================================
    
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
                    
                    skillNode.innerHTML = `
                        <div class="skill-icon">${skill.icon}</div>
                        <div class="skill-name">${skill.name}</div>
                        ${skill.mastered ? '<div class="mastery-badge">✓</div>' : ''}
                    `;
                    
                    // Add click handler for skill details
                    if (!skill.locked) {
                        skillNode.addEventListener('click', () => openSkillDetail(skill.id, userProfile));
                    }
                    
                    skillTree.appendChild(skillNode);
                });
                
                difficultySection.appendChild(skillTree);
                categorySection.appendChild(difficultySection);
            });
            
            skillsContainer.appendChild(categorySection);
        });
        
        // Create connections between skills
        createSkillConnections(userProfile);
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
        // Get all technique data
        const techniques = SkillsManager.getAllTechniques();
        
        // Process each technique
        Object.entries(techniques).forEach(([id, technique]) => {
            if (!technique.prerequisites || technique.prerequisites.length === 0) return;
            
            // Get the skill node
            const skillNode = document.querySelector(`.skill-node[data-skill-id="${id}"]`);
            if (!skillNode) return;
            
            // Create connections to each prerequisite
            technique.prerequisites.forEach(prereqId => {
                const prereqNode = document.querySelector(`.skill-node[data-skill-id="${prereqId}"]`);
                if (!prereqNode) return;
                
                // Create connection line
                createConnectionLine(
                    prereqNode, 
                    skillNode, 
                    SkillsManager.isTechniqueMastered(prereqId, userProfile)
                );
            });
        });
    }
    
    /**
     * Create a visual connection line between two skill nodes
     * @param {HTMLElement} fromNode - Starting node
     * @param {HTMLElement} toNode - Ending node
     * @param {boolean} mastered - Whether the prerequisite is mastered
     */
    function createConnectionLine(fromNode, toNode, mastered) {
        // Get positions
        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();
        
        // Calculate positions relative to skills container
        const containerRect = document.getElementById('skills-container').getBoundingClientRect();
        
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top - containerRect.top;
        
        // Create connection element
        const connection = document.createElement('div');
        connection.className = `skill-connection ${mastered ? 'mastered' : ''}`;
        
        // Calculate length and angle
        const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
        
        // Set position and dimensions
        connection.style.width = `${length}px`;
        connection.style.height = '2px';
        connection.style.left = `${fromX}px`;
        connection.style.top = `${fromY}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = '0 0';
        
        // Add to container
        document.getElementById('skills-container').appendChild(connection);
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
        
        // Set modal title
        document.getElementById('skill-modal-title').textContent = skill.name;
        
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
            document.getElementById('skill-modal-content').innerHTML = `
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
        document.getElementById('skill-detail-modal').style.display = 'flex';
    }
    
    /**
     * Close skill detail modal
     */
    function closeSkillDetail() {
        document.getElementById('skill-detail-modal').style.display = 'none';
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
        
        // Add to mastered techniques
        if (!userProfile.masteredTechniques.includes(skillId)) {
            userProfile.masteredTechniques.push(skillId);
            
            // Save user profile
            DataManager.saveUserProfile();
            
            // Close the modal
            closeSkillDetail();
            
            // Show notification
            showNotification(`Skill mastered: ${skill.name}`);
            
            // Refresh skills tab
            renderSkillsTab(userProfile);
        }
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
        renderSkillsTab
    };
})();
