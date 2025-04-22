/**
 * app.js - Main application entry point
 * This file initializes the application and coordinates the other modules.
 */

// Main application initialization
(async function() {
    /**
     * Initialize the application
     */
    async function initializeApp() {
        try {
            // Show loading state or splash screen here if needed
            
            // Initialize data first (loads user profile and quest data)
            const initialData = await DataManager.initialize();
            
            // Initialize the quest manager with quest data
            QuestManager.initialize(initialData.questData);
            
            // Initialize the UI with user profile and quest data
            UIManager.initialize(initialData.userProfile, initialData.questData);
            
            console.log('DICED Culinary RPG initialized successfully!');
            
            // For development/debugging
            window.DICED = {
                DataManager,
                QuestManager,
                ProgressManager,
                UIManager,
                resetData: function() {
                    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                        DataManager.resetUserProgress();
                        location.reload();
                    }
                }
            };
            
        } catch (error) {
            console.error('Error initializing DICED app:', error);
            
            // Show error message to user
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message">
                        <h2>Error Loading DICED</h2>
                        <p>There was a problem loading the application. Please try again later.</p>
                        <button onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        }
    }
    
    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
})();
