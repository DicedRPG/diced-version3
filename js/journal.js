/**
 * journal.js - Handles all journal-related functionality
 * This file manages journal entries display, creation, and management.
 */

// Journal manager namespace
const JournalManager = (() => {
    // Store for local journal data caching
    let journalData = [];
    let currentEntryId = null;
    
    /**
     * Initialize the journal manager
     * @param {Object} userProfile - The user profile containing journal entries
     */
    function initialize(userProfile) {
        if (userProfile && userProfile.journalEntries) {
            journalData = [...userProfile.journalEntries];
        }
    }
    
    /**
     * Get all journal entries
     * @returns {Array} - All journal entries
     */
    function getAllEntries() {
        const userProfile = DataManager.getUserProfile();
        return userProfile.journalEntries || [];
    }
    
    /**
     * Get entries related to a specific quest
     * @param {string} questId - The quest ID
     * @returns {Array} - Journal entries for the quest
     */
    function getEntriesByQuest(questId) {
        const entries = getAllEntries();
        return entries.filter(entry => entry.questId === questId);
    }
    
    /**
     * Create a new journal entry
     * @param {string} questId - The related quest ID
     * @param {string} content - The journal entry content
     * @param {Array} photos - Array of photo URLs (optional)
     * @returns {Promise<Object>} - Promise resolving to result object
     */
    async function createEntry(questId, content, photos = []) {
        return DataManager.addJournalEntry(questId, content, photos);
    }
    
    /**
     * Format a date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Set the current entry being viewed/edited
     * @param {string} entryId - The entry ID
     */
    function setCurrentEntry(entryId) {
        currentEntryId = entryId;
    }
    
    /**
     * Get the current entry
     * @returns {Object|null} - The current entry or null
     */
    function getCurrentEntry() {
        const entries = getAllEntries();
        return entries.find(entry => entry.id === currentEntryId) || null;
    }
    
    /**
     * Get completed quests for journal entry selection
     * @returns {Promise<Array>} - Promise resolving to array of completed quests
     */
    async function getCompletedQuestsForJournal() {
        const userProfile = DataManager.getUserProfile();
        const quests = await DataManager.getQuestData();
        
        return userProfile.completedQuests
            .map(id => quests.find(q => q.id === id))
            .filter(q => q !== undefined);
    }
    
    // Public API
    return {
        initialize,
        getAllEntries,
        getEntriesByQuest,
        createEntry,
        formatDate,
        setCurrentEntry,
        getCurrentEntry,
        getCompletedQuestsForJournal
    };
})();

// Add Journal tab rendering to UI Manager
(function extendUIManager() {
    // Original UI Manager reference
    const originalUIManager = window.UIManager || {};
    
    /**
     * Render the journal tab
     * @param {Object} userProfile - The user profile
     */
    function renderJournalTab(userProfile) {
        const journalTab = document.getElementById('journal-tab');
        if (!journalTab) return;
        
        // Initialize journal manager
        JournalManager.initialize(userProfile);
        
        // Clear existing content
        journalTab.innerHTML = '';
        
        // Add section title
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = 'Cooking Journal';
        journalTab.appendChild(title);
        
        // Add new entry button
        const newEntryButton = document.createElement('button');
        newEntryButton.className = 'new-entry-button';
        newEntryButton.textContent = '+ New Journal Entry';
        newEntryButton.addEventListener('click', openNewEntryForm);
        journalTab.appendChild(newEntryButton);
        
        // Journal entries container
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'journal-entries';
        entriesContainer.id = 'journal-entries-container';
        
        // Get all journal entries
        const entries = JournalManager.getAllEntries();
        
        // Sort entries by date (newest first)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (entries.length > 0) {
            // Render each entry
            entries.forEach(entry => {
                const entryCard = createJournalEntryCard(entry);
                entriesContainer.appendChild(entryCard);
            });
        } else {
            // No entries message
            const noEntries = document.createElement('div');
            noEntries.className = 'no-entries-message';
            noEntries.innerHTML = `
                <p>You haven't created any journal entries yet.</p>
                <p>Complete quests and document your culinary journey!</p>
            `;
            entriesContainer.appendChild(noEntries);
        }
        
        journalTab.appendChild(entriesContainer);
        
        // Create journal entry modal
        createJournalEntryModal();
    }
    
    /**
     * Create a journal entry card
     * @param {Object} entry - The journal entry
     * @returns {HTMLElement} - The entry card element
     */
    function createJournalEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'journal-entry-card';
        card.setAttribute('data-entry-id', entry.id);
        
        // Format date
        const formattedDate = JournalManager.formatDate(entry.date);
        
        // Create content with truncation for long entries
        let displayContent = entry.content;
        const maxLength = 200;
        let showMoreButton = '';
        
        if (displayContent.length > maxLength) {
            displayContent = displayContent.substring(0, maxLength) + '...';
            showMoreButton = `<button class="show-more-button">Read More</button>`;
        }
        
        // Determine quest type to apply appropriate styling
        let questTypeClass = '';
        DataManager.getQuestData().then(quests => {
            const quest = quests.find(q => q.id === entry.questId);
            if (quest) {
                const typeInfo = QuestManager.getQuestTypeInfo(quest.type);
                questTypeClass = typeInfo.cssClass;
                card.classList.add(questTypeClass + '-border');
            }
        });
        
        card.innerHTML = `
            <div class="entry-header">
                <h3 class="entry-title">${entry.questTitle}</h3>
                <span class="entry-date">${formattedDate}</span>
            </div>
            <div class="entry-content">
                <p>${displayContent}</p>
                ${showMoreButton}
            </div>
            ${entry.photos && entry.photos.length > 0 ? 
                `<div class="entry-photos">
                    ${entry.photos.map(photo => `<img src="${photo}" alt="Journal photo" />`).join('')}
                </div>` : ''
            }
        `;
        
        // Add click event for viewing the full entry
        card.addEventListener('click', (event) => {
            // Don't open entry view if clicking on "Read More" button
            if (event.target.classList.contains('show-more-button')) {
                event.preventDefault();
                openEntryView(entry.id);
                return;
            }
            
            // Otherwise open the entry view
            openEntryView(entry.id);
        });
        
        return card;
    }
    
    /**
     * Create the journal entry modal
     */
    function createJournalEntryModal() {
        // Check if modal already exists
        if (document.getElementById('journal-entry-modal')) {
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'journal-entry-modal';
        modal.className = 'journal-entry-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="journal-modal-title">Journal Entry</h2>
                    <button class="close-button" onclick="closeJournalEntryModal()">×</button>
                </div>
                <div id="journal-modal-content">
                    <!-- Content will be dynamically inserted here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Open the form to create a new journal entry
     */
    async function openNewEntryForm() {
        // Get the modal and content elements
        const modal = document.getElementById('journal-entry-modal');
        const modalTitle = document.getElementById('journal-modal-title');
        const modalContent = document.getElementById('journal-modal-content');
        
        if (!modal || !modalTitle || !modalContent) {
            console.error('Journal modal elements not found');
            return;
        }
        
        // Set modal title
        modalTitle.textContent = 'New Journal Entry';
        
        // Get completed quests for selection
        const completedQuests = await JournalManager.getCompletedQuestsForJournal();
        
        // Create quest options HTML
        let questOptionsHtml = '';
        
        if (completedQuests.length > 0) {
            questOptionsHtml = completedQuests.map(quest => 
                `<option value="${quest.id}">${quest.title}</option>`
            ).join('');
        } else {
            questOptionsHtml = '<option value="" disabled>No completed quests</option>';
        }
        
        // Set modal content
        modalContent.innerHTML = `
            <form id="new-journal-entry-form">
                <div class="form-group">
                    <label for="quest-select">Related Quest:</label>
                    <select id="quest-select" name="quest-select" required>
                        <option value="" disabled selected>Select a quest</option>
                        ${questOptionsHtml}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="entry-content">Journal Entry:</label>
                    <textarea id="entry-content" name="entry-content" rows="8" placeholder="Write about your cooking experience, challenges faced, techniques learned, etc." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Photos (Coming Soon):</label>
                    <p class="photo-upload-placeholder">Photo upload functionality will be added in a future update.</p>
                </div>
                
                <button type="submit" class="submit-entry-button">Save Journal Entry</button>
            </form>
        `;
        
        // Add submit event listener to the form
        const form = document.getElementById('new-journal-entry-form');
        if (form) {
            form.addEventListener('submit', handleJournalFormSubmit);
        }
        
        // Show the modal
        modal.style.display = 'flex';
    }
    
    /**
     * Handle journal form submission
     * @param {Event} event - The submit event
     */
    async function handleJournalFormSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const questId = document.getElementById('quest-select').value;
        const content = document.getElementById('entry-content').value;
        
        // Validate form
        if (!questId || !content) {
            alert('Please fill out all required fields');
            return;
        }
        
        // Create journal entry
        const result = await JournalManager.createEntry(questId, content);
        
        if (result.success) {
            // Close the modal
            closeJournalEntryModal();
            
            // Refresh the journal tab
            const userProfile = DataManager.getUserProfile();
            renderJournalTab(userProfile);
            
            // Show success notification
            if (typeof UIManager.showNotification === 'function') {
                UIManager.showNotification('Journal entry added successfully!');
            }
        } else {
            // Show error message
            alert(result.message || 'Failed to add journal entry');
        }
    }
    
    /**
     * Open the view for a specific journal entry
     * @param {string} entryId - The entry ID
     */
    function openEntryView(entryId) {
        // Set current entry
        JournalManager.setCurrentEntry(entryId);
        
        // Get the entry
        const entry = JournalManager.getCurrentEntry();
        
        if (!entry) {
            console.error(`Entry not found: ${entryId}`);
            return;
        }
        
        // Get the modal and content elements
        const modal = document.getElementById('journal-entry-modal');
        const modalTitle = document.getElementById('journal-modal-title');
        const modalContent = document.getElementById('journal-modal-content');
        
        if (!modal || !modalTitle || !modalContent) {
            console.error('Journal modal elements not found');
            return;
        }
        
        // Format date
        const formattedDate = JournalManager.formatDate(entry.date);
        
        // Set modal title
        modalTitle.textContent = entry.questTitle;
        
        // Set modal content
        modalContent.innerHTML = `
            <div class="entry-view">
                <div class="entry-metadata">
                    <span class="entry-date">${formattedDate}</span>
                </div>
                
                <div class="entry-full-content">
                    <p>${entry.content}</p>
                </div>
                
                ${entry.photos && entry.photos.length > 0 ? 
                    `<div class="entry-photos">
                        ${entry.photos.map(photo => `<img src="${photo}" alt="Journal photo" class="full-size" />`).join('')}
                    </div>` : ''
                }
            </div>
        `;
        
        // Show the modal
        modal.style.display = 'flex';
    }
    
    /**
     * Close the journal entry modal
     */
    function closeJournalEntryModal() {
        const modal = document.getElementById('journal-entry-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Clear current entry
        JournalManager.setCurrentEntry(null);
    }
    
    // Add our methods to the UIManager or create a new one
    window.UIManager = {
        ...(originalUIManager || {}),
        renderJournalTab
    };
    
    // Define global functions needed by HTML
    window.openNewEntryForm = openNewEntryForm;
    window.closeJournalEntryModal = closeJournalEntryModal;
})();
