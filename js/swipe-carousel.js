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
      
      // Calculate the swipe progress as a percentage (0 to 1)
      // Limit to a reasonable range to prevent excessive movement
      const maxSwipe = 150; // Maximum effective swipe distance
      const progress = Math.max(-1, Math.min(1, deltaX / maxSwipe));
      
      // Apply transformation to each card based on its position
      cards.forEach(card => {
        // Get the original position class of this card
        let positionClass = '';
        if (card.classList.contains('rank-card-center')) positionClass = 'center';
        else if (card.classList.contains('rank-card-left')) positionClass = 'left';
        else if (card.classList.contains('rank-card-right')) positionClass = 'right';
        else if (card.classList.contains('rank-card-far-left')) positionClass = 'far-left';
        else if (card.classList.contains('rank-card-far-right')) positionClass = 'far-right';
        else positionClass = 'hidden';
        
        // Apply a transform that maintains the rotational movement
        const cardIndex = parseInt(card.getAttribute('data-rank-index'));
        
        // Reset any previous inline transform
        card.style.transform = '';
        
        // Remove all position classes temporarily
        card.classList.remove(
          'rank-card-center', 
          'rank-card-left', 
          'rank-card-right',
          'rank-card-far-left',
          'rank-card-far-right',
          'rank-card-hidden'
        );
        
        // Determine new position based on swipe direction and progress
        let newPositionClass = '';
        
        if (progress > 0) { // Swiping right (showing previous card)
          switch(positionClass) {
            case 'center':
              // Move toward right position
              newPositionClass = progress > 0.5 ? 'right' : 'center';
              card.classList.add(newPositionClass === 'right' ? 'rank-card-right' : 'rank-card-center');
              card.style.opacity = newPositionClass === 'right' ? 0.9 : 1;
              break;
            case 'left':
              // Move toward center position
              newPositionClass = progress > 0.5 ? 'center' : 'left';
              card.classList.add(newPositionClass === 'center' ? 'rank-card-center' : 'rank-card-left');
              card.style.opacity = newPositionClass === 'center' ? 1 : 0.9;
              break;
            case 'right':
              // Move toward far-right position
              newPositionClass = progress > 0.5 ? 'far-right' : 'right';
              card.classList.add(newPositionClass === 'far-right' ? 'rank-card-far-right' : 'rank-card-right');
              card.style.opacity = newPositionClass === 'far-right' ? 0.5 : 0.9;
              break;
            case 'far-left':
              // Move toward left position
              newPositionClass = progress > 0.5 ? 'left' : 'far-left';
              card.classList.add(newPositionClass === 'left' ? 'rank-card-left' : 'rank-card-far-left');
              card.style.opacity = newPositionClass === 'left' ? 0.9 : 0.5;
              break;
            case 'far-right':
              // Move toward hidden position
              newPositionClass = 'far-right';
              card.classList.add('rank-card-far-right');
              card.style.opacity = 0.5 * (1 - progress);
              break;
            case 'hidden':
              // Check if this should become visible
              if (cardIndex === currentCenterIndex - 3) {
                newPositionClass = progress > 0.7 ? 'far-left' : 'hidden';
                card.classList.add(newPositionClass === 'far-left' ? 'rank-card-far-left' : 'rank-card-hidden');
                card.style.opacity = newPositionClass === 'far-left' ? 0.5 * progress : 0;
              } else {
                card.classList.add('rank-card-hidden');
              }
              break;
          }
        } else if (progress < 0) { // Swiping left (showing next card)
          const absProgress = Math.abs(progress);
          switch(positionClass) {
            case 'center':
              // Move toward left position
              newPositionClass = absProgress > 0.5 ? 'left' : 'center';
              card.classList.add(newPositionClass === 'left' ? 'rank-card-left' : 'rank-card-center');
              card.style.opacity = newPositionClass === 'left' ? 0.9 : 1;
              break;
            case 'left':
              // Move toward far-left position
              newPositionClass = absProgress > 0.5 ? 'far-left' : 'left';
              card.classList.add(newPositionClass === 'far-left' ? 'rank-card-far-left' : 'rank-card-left');
              card.style.opacity = newPositionClass === 'far-left' ? 0.5 : 0.9;
              break;
            case 'right':
              // Move toward center position
              newPositionClass = absProgress > 0.5 ? 'center' : 'right';
              card.classList.add(newPositionClass === 'center' ? 'rank-card-center' : 'rank-card-right');
              card.style.opacity = newPositionClass === 'center' ? 1 : 0.9;
              break;
            case 'far-left':
              // Move toward hidden position
              newPositionClass = 'far-left';
              card.classList.add('rank-card-far-left');
              card.style.opacity = 0.5 * (1 - absProgress);
              break;
            case 'far-right':
              // Move toward right position
              newPositionClass = absProgress > 0.5 ? 'right' : 'far-right';
              card.classList.add(newPositionClass === 'right' ? 'rank-card-right' : 'rank-card-far-right');
              card.style.opacity = newPositionClass === 'right' ? 0.9 : 0.5;
              break;
            case 'hidden':
              // Check if this should become visible
              if (cardIndex === currentCenterIndex + 3) {
                newPositionClass = absProgress > 0.7 ? 'far-right' : 'hidden';
                card.classList.add(newPositionClass === 'far-right' ? 'rank-card-far-right' : 'rank-card-hidden');
                card.style.opacity = newPositionClass === 'far-right' ? 0.5 * absProgress : 0;
              } else {
                card.classList.add('rank-card-hidden');
              }
              break;
          }
        } else {
          // No movement, restore original class
          card.classList.add(`rank-card-${positionClass}`);
        }
      });
    }
    
    /**
     * Complete a swipe and snap to the appropriate card
     * @param {number} deltaX - The distance the user has swiped
     */
    function completeSwipe(deltaX) {
      // Calculate the absolute movement
      const absMovement = Math.abs(deltaX);
      
      // Determine if we should change the current card
      if (absMovement >= swipeThreshold) {
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
          // Remove the swiping class to allow normal transitions
          cardStack.classList.remove('swiping');
          
          // Reset all styles
          const cards = cardStack.querySelectorAll('.rank-card');
          cards.forEach(card => {
            card.style.transform = '';
            card.style.opacity = '';
          });
          
          // Call the existing rotate function with slight delay to ensure clean transition
          setTimeout(() => {
            rotateCardStack(targetIndex);
            
            // Update current index
            currentCenterIndex = targetIndex;
          }, 10);
        } else {
          // If we can't move further (at first or last card)
          // Reset all styles
          const cards = cardStack.querySelectorAll('.rank-card');
          cards.forEach(card => {
            // Keep the current position class
            let positionClass = '';
            if (card.classList.contains('rank-card-center')) positionClass = 'center';
            else if (card.classList.contains('rank-card-left')) positionClass = 'left';
            else if (card.classList.contains('rank-card-right')) positionClass = 'right';
            else if (card.classList.contains('rank-card-far-left')) positionClass = 'far-left';
            else if (card.classList.contains('rank-card-far-right')) positionClass = 'far-right';
            else positionClass = 'hidden';
            
            // Reset to original positions
            card.style.transform = '';
            card.style.opacity = '';
            
            // Remove the swiping class to allow normal transitions
            cardStack.classList.remove('swiping');
          });
          
          // Add a bounce effect
          cardStack.classList.add('bounce-effect');
          setTimeout(() => {
            cardStack.classList.remove('bounce-effect');
          }, 400);
        }
      } else {
        // Not enough movement to change cards
        // Reset all card styles
        const cards = cardStack.querySelectorAll('.rank-card');
        cards.forEach(card => {
          // Reset transforms and opacity
          card.style.transform = '';
          card.style.opacity = '';
        });
        
        // Remove the swiping class to allow normal transitions
        cardStack.classList.remove('swiping');
        
        // Add a small reset effect
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
