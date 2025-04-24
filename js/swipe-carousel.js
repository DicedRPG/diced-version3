/**
 * Touch Swipe functionality for DICED Rank Card Carousel
 * This extends the existing rotateCardStack function with touch swipe support
 */

// Initialize swipe functionality once the DOM is loaded
function initSwipeCardStack() {
    // Get the card stack container
    const cardStack = document.getElementById('rankCardStack');
    if (!cardStack) {
        console.error('Card stack element not found');
        return;
    }
    
    // Variables to track swipe
    let touchStartX = 0;
    let touchEndX = 0;
    const MIN_SWIPE_DISTANCE = 50; // Minimum distance (in px) to consider as a swipe
    let isSwiping = false;
    let startTime = 0;
    let currentCenterIndex = 0;
    
    // Touch start event - record starting position
    cardStack.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        startTime = Date.now();
        isSwiping = true;
        
        // Find current center card index
        const centerCard = cardStack.querySelector('.rank-card-center');
        if (centerCard) {
            currentCenterIndex = parseInt(centerCard.getAttribute('data-rank-index'));
        }
        
        // Add active-swipe class for visual feedback during swipe
        cardStack.classList.add('active-swipe');
        
        // Prevent default to avoid scrolling during swipe
        event.preventDefault();
    }, { passive: false });
    
    // Touch move event - update current position and provide visual feedback
    cardStack.addEventListener('touchmove', function(event) {
        if (!isSwiping) return;
        
        const currentX = event.touches[0].clientX;
        const deltaX = currentX - touchStartX;
        
        // Provide some visual feedback of the swipe by slightly moving cards
        // This is subtle and doesn't replace the main animation
        const cards = cardStack.querySelectorAll('.rank-card');
        
        cards.forEach(card => {
            const cardIndex = parseInt(card.getAttribute('data-rank-index'));
            const positionClass = getCardPositionClass(card);
            
            // Only apply transform to visible cards
            if (positionClass !== 'rank-card-hidden') {
                // Calculate a resistance factor based on card position
                let resistanceFactor = 0.2; // Default resistance
                
                if (positionClass === 'rank-card-center') {
                    resistanceFactor = 0.3;
                } else if (positionClass === 'rank-card-left' || positionClass === 'rank-card-right') {
                    resistanceFactor = 0.2;
                } else {
                    resistanceFactor = 0.1;
                }
                
                // Apply a temporary transform during the swipe
                // This is a subtle effect that will be reset when the swipe ends
                card.style.transform = card.style.transform.replace(/translateX\([^)]*\)/, 
                    `translateX(calc(${getBaseTranslateX(positionClass)} + ${deltaX * resistanceFactor}px))`);
            }
        });
        
        // Prevent default to avoid scrolling while swiping
        event.preventDefault();
    }, { passive: false });
    
    // Touch end event - determine if it was a swipe and in which direction
    cardStack.addEventListener('touchend', function(event) {
        if (!isSwiping) return;
        
        touchEndX = event.changedTouches[0].clientX;
        isSwiping = false;
        cardStack.classList.remove('active-swipe');
        
        // Reset any temporary transforms
        const cards = cardStack.querySelectorAll('.rank-card');
        cards.forEach(card => {
            card.style.transform = ''; // Remove inline styles
        });
        
        // Calculate swipe distance and duration
        const swipeDistance = touchEndX - touchStartX;
        const swipeDuration = Date.now() - startTime;
        
        // Check if it's a valid swipe (enough distance and not too slow)
        if (Math.abs(swipeDistance) >= MIN_SWIPE_DISTANCE && swipeDuration < 1000) {
            // Determine swipe direction
            if (swipeDistance > 0) {
                // Swiped right - show previous card
                if (currentCenterIndex > 0) {
                    rotateCardStack(currentCenterIndex - 1);
                }
            } else {
                // Swiped left - show next card
                const allRanks = Object.keys(ProgressionSystem.RANKS);
                if (currentCenterIndex < allRanks.length - 1) {
                    rotateCardStack(currentCenterIndex + 1);
                }
            }
        } else {
            // Not a valid swipe, restore the original position
            rotateCardStack(currentCenterIndex);
        }
    });
    
    // Helper function to get the base translate X value for different card positions
    function getBaseTranslateX(positionClass) {
        switch (positionClass) {
            case 'rank-card-center': return '-50%';
            case 'rank-card-left': return '-130%';
            case 'rank-card-right': return '30%';
            case 'rank-card-far-left': return '-180%';
            case 'rank-card-far-right': return '80%';
            case 'rank-card-hidden': return '-50%';
            default: return '-50%';
        }
    }
    
    // Helper function to determine card position class
    function getCardPositionClass(card) {
        if (card.classList.contains('rank-card-center')) return 'rank-card-center';
        if (card.classList.contains('rank-card-left')) return 'rank-card-left';
        if (card.classList.contains('rank-card-right')) return 'rank-card-right';
        if (card.classList.contains('rank-card-far-left')) return 'rank-card-far-left';
        if (card.classList.contains('rank-card-far-right')) return 'rank-card-far-right';
        return 'rank-card-hidden';
    }
    
    // Add a class to indicate swipe is supported
    cardStack.classList.add('swipe-enabled');
    
    console.log('Swipe functionality initialized for rank cards');
}

// Initialize the swipe functionality when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // We'll wait a bit to ensure the card stack is fully initialized
    setTimeout(initSwipeCardStack, 1000);
});

// Additional CSS styles for swipe effects
function addSwipeStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Swipe indicator styles */
        .rank-card-stack.swipe-enabled {
            cursor: grab;
        }
        
        .rank-card-stack.active-swipe {
            cursor: grabbing;
        }
        
        /* Optimize for touch - prevent text selection during swipe */
        .rank-card-stack.swipe-enabled .rank-card {
            user-select: none;
            -webkit-user-select: none;
        }
        
        /* Mobile optimization */
        @media (max-width: 768px) {
            .rank-card-stack.swipe-enabled::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 15px;
                right: 15px;
                height: 40px;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .rank-card-stack.swipe-enabled::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 20px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                transform: translateY(-50%);
                background-color: rgba(255,255,255,0.2);
                z-index: 10;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            /* Show swipe hint on first load */
            .rank-card-stack.swipe-enabled.show-hint::after,
            .rank-card-stack.swipe-enabled.show-hint::before {
                opacity: 1;
                animation: swipeHint 1.5s ease-in-out 0.5s;
            }
            
            @keyframes swipeHint {
                0% { left: 20px; }
                50% { left: calc(100% - 50px); }
                100% { left: 20px; }
            }
        }
    `;
    document.head.appendChild(styleElement);
}

// Show a swipe hint for first-time users
function showSwipeHint() {
    const cardStack = document.getElementById('rankCardStack');
    if (!cardStack) return;
    
    // Check if we've shown the hint before
    const hintShown = localStorage.getItem('diced_swipe_hint_shown');
    
    if (!hintShown) {
        // Add hint class to show animation
        cardStack.classList.add('show-hint');
        
        // Remove hint after animation completes
        setTimeout(() => {
            cardStack.classList.remove('show-hint');
            localStorage.setItem('diced_swipe_hint_shown', 'true');
        }, 3000);
    }
}

// Call this to add the styles when the page loads
document.addEventListener('DOMContentLoaded', function() {
    addSwipeStyles();
    
    // Show hint after a delay
    setTimeout(showSwipeHint, 2000);
});
