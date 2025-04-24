/* Swipe Carousel CSS for DICED App */

/* Default transition for card movements */
.rank-card-stack .rank-card {
    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Remove transitions during active swiping for immediate feedback */
.rank-card-stack.swiping .rank-card {
    transition: none !important;
}

/* Visual feedback when dragging */
.rank-card-stack.is-dragging,
.rank-card-stack.is-touching {
    cursor: grabbing;
}

/* Bounce effect when trying to swipe past the first or last card */
@keyframes bounce-effect {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(5px); }
    50% { transform: translateX(-5px); }
    75% { transform: translateX(3px); }
}

.rank-card-stack.bounce-effect {
    animation: bounce-effect 0.4s ease;
}

/* Reset effect when a swipe doesn't reach the threshold */
@keyframes reset-effect {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
}

.rank-card-stack.reset-effect {
    animation: reset-effect 0.4s ease;
}

/* Make cards tilt slightly when swiping for more visual feedback */
.rank-card-stack.swiping .rank-card-center {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

/* Increase shadow intensity for active card during swiping */
.rank-card-stack.is-dragging .rank-card-center,
.rank-card-stack.is-touching .rank-card-center {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

/* Ensure the card stack has proper touch handling */
.rank-card-stack-container {
    touch-action: none;
    user-select: none;
}

/* Highlight the edges of the cards to indicate swipe direction */
.rank-card-stack.swiping .rank-card-left,
.rank-card-stack.swiping .rank-card-right {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

/* Add smooth transition when returning from swiping state */
.rank-card-stack:not(.swiping) .rank-card {
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

/* Ensure cards stay visible during swipe */
.rank-card-stack.swiping .rank-card-hidden {
    opacity: 0.3;
    pointer-events: none;
}
