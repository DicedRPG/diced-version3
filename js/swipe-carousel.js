/**
 * Touch/Swipe Carousel for DICED App
 * Adds swipe functionality to the rank card carousel
 */

// Card Carousel Touch/Swipe Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Wait for the carousel to be created
  const initSwipeCarousel = function() {
    const cardStack = document.getElementById('rankCardStack');
    if (!cardStack) {
      // If carousel doesn't exist yet, try again in a moment
      setTimeout(initSwipeCarousel, 500);
      return;
    }

    // Variables to track touch/swipe
    let startX = 0;
    let currentX = 0;
    let touchStarted = false;
    let currentCenterIndex = 0;
    let swipeThreshold = 50; // Minimum distance to register a swipe
    let swipeProgress = 0; // Tracks the current swipe progress (0-1)
    
    // Get the center card to determine current index
    function updateCurrentIndex() {
      const centerCard = cardStack.querySelector('.rank-card-center');
      if (centerCard) {
        currentCenterIndex = parseInt(centerCard.getAttribute('data-rank-index'));
      }
    }
    
    // Update the initial index
    updateCurrentIndex();
    
    // Add touch event listeners to the card stack
    cardStack.addEventListener('touchstart', handleTouchStart, { passive: false });
    cardStack.addEventListener('touchmove', handleTouchMove, { passive: false });
    cardStack.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Also support mouse drag for desktop testing
    cardStack.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    let isDragging = false;
    
    // Mouse event handlers (for desktop testing)
    function handleMouseDown(e) {
      isDragging = true;
      startX = e.clientX;
      currentX = startX;
      
      // Add dragging class to indicate active drag
      cardStack.classList.add('is-dragging');
      
      // Prevent default behavior
      e.preventDefault();
    }
    
    function handleMouseMove(e) {
      if (!isDragging) return;
      
      currentX = e.clientX;
      const deltaX = currentX - startX;
      
      // Update swipe progress between -1 and 1
      swipeProgress = Math.max(-1, Math.min(1, deltaX / 100));
      
      // Apply visual feedback during the swipe
      applySwipeEffect(deltaX);
      
      // Prevent default behavior
      e.preventDefault();
    }
    
    function handleMouseUp(e) {
      if (!isDragging) return;
      
      isDragging = false;
      const deltaX = currentX - startX;
      
      // Remove dragging class
      cardStack.classList.remove('is-dragging');
      
      // Complete the swipe
      completeSwipe(deltaX);
      
      // Reset swipe progress
      swipeProgress = 0;
      
      // Prevent default behavior
      e.preventDefault();
    }
    
    // Touch event handlers
    function handleTouchStart(e) {
      touchStarted = true;
      startX = e.touches[0].clientX;
      currentX = startX;
      
      // Add class to indicate active touch
      cardStack.classList.add('is-touching');
      
      // Prevent default to avoid scrolling while swiping
      e.preventDefault();
    }
    
    function handleTouchMove(e) {
      if (!touchStarted) return;
      
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      
      // Update swipe progress between -1 and 1
      swipeProgress = Math.max(-1, Math.min(1, deltaX / 100));
      
      // Apply visual feedback during the swipe
      applySwipeEffect(deltaX);
      
      // Prevent default to avoid scrolling while swiping
      e.preventDefault();
    }
    
    function handleTouchEnd(e) {
      if (!touchStarted) return;
      
      touchStarted = false;
      const deltaX = currentX - startX;
      
      // Remove touching class
      cardStack.classList.remove('is-touching');
      
      // Complete the swipe
      completeSwipe(deltaX);
      
      // Reset swipe progress
      swipeProgress = 0;
      
      // Prevent default behavior
      e.preventDefault();
    }
    
    /**
     * Apply visual feedback during a swipe
     * @param {number} deltaX - The distance the user has swiped
     */
    function applySwipeEffect(deltaX) {
      // Add a transitioning class to disable other transitions during swipe
      cardStack.classList.add('swiping');
      
      // Get all cards
      const cards = cardStack.querySelectorAll('.rank-card');
      if (!cards.length) return;
      
      // Apply transformation to each card based on its position
      cards.forEach(card => {
        const cardIndex = parseInt(card.getAttribute('data-rank-index'));
        let transformAmount = 0;
        
        // Determine how much to transform based on card position
        if (card.classList.contains('rank-card-center')) {
          // Center card - move in the direction of the swipe
          transformAmount = deltaX * 0.3;
        } else if (card.classList.contains('rank-card-left')) {
          // Left card - come into view when swiping right
          transformAmount = deltaX > 0 ? deltaX * 0.5 : deltaX * 0.1;
        } else if (card.classList.contains('rank-card-right')) {
          // Right card - come into view when swiping left
          transformAmount = deltaX < 0 ? deltaX * 0.5 : deltaX * 0.1;
        } else if (card.classList.contains('rank-card-far-left')) {
          // Far left card - slight movement
          transformAmount = deltaX > 0 ? deltaX * 0.2 : 0;
        } else if (card.classList.contains('rank-card-far-right')) {
          // Far right card - slight movement
          transformAmount = deltaX < 0 ? deltaX * 0.2 : 0;
        }
        
        // Apply the transform
        const currentTransform = getComputedStyle(card).transform;
        if (currentTransform && currentTransform !== 'none') {
          // We need to add our translation to the existing transform
          card.style.transform = currentTransform + ` translateX(${transformAmount}px)`;
        }
      });
    }
    
    /**
     * Complete a swipe and snap to the appropriate card
     * @param {number} deltaX - The distance the user has swiped
     */
    function completeSwipe(deltaX) {
      // Remove the swiping class to enable normal transitions
      cardStack.classList.remove('swiping');
      
      // Reset all card styles to remove the temporary transforms
      const cards = cardStack.querySelectorAll('.rank-card');
      cards.forEach(card => {
        card.style.transform = '';
      });
      
      // Determine if we should change the current card
      if (Math.abs(deltaX) >= swipeThreshold) {
        // Calculate target index
        let targetIndex = currentCenterIndex;
        
        if (deltaX > 0) {
          // Swipe right - go to previous card
          targetIndex = Math.max(0, currentCenterIndex - 1);
        } else {
          // Swipe left - go to next card
          const allRanks = Object.keys(ProgressionSystem.RANKS);
          targetIndex = Math.min(allRanks.length - 1, currentCenterIndex + 1);
        }
        
        // Only rotate if the target index is different
        if (targetIndex !== currentCenterIndex) {
          // Call the existing rotate function
          rotateCardStack(targetIndex);
          
          // Update current index
          currentCenterIndex = targetIndex;
        } else {
          // If we can't move further, add a bounce effect
          cardStack.classList.add('bounce-effect');
          setTimeout(() => {
            cardStack.classList.remove('bounce-effect');
          }, 400);
        }
      } else {
        // Not enough movement to change cards, just reset positions
        // Add a small bounce effect to indicate the swipe didn't register
        cardStack.classList.add('reset-effect');
        setTimeout(() => {
          cardStack.classList.remove('reset-effect');
        }, 400);
      }
    }
    
    console.log('Swipe carousel initialized!');
  };
  
  // Start initialization
  initSwipeCarousel();
});
