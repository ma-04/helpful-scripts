// ==UserScript==
// @name         YouTube Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Control YouTube video speed with keyboard shortcuts
// @author       ma0-04
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    let currentSpeedIndex = 2; // Default to index of 1x speed (which is 3 in our array)
    
    // Create a floating speed display
    const speedDisplay = document.createElement('div');
    speedDisplay.style.position = 'fixed';
    speedDisplay.style.top = '70px';
    speedDisplay.style.right = '20px';
    speedDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    speedDisplay.style.color = 'white';
    speedDisplay.style.padding = '10px';
    speedDisplay.style.borderRadius = '5px';
    speedDisplay.style.fontSize = '18px';
    speedDisplay.style.fontWeight = 'bold';
    speedDisplay.style.zIndex = '9999';
    speedDisplay.style.opacity = '0';
    speedDisplay.style.transition = 'opacity 0.5s';
    document.body.appendChild(speedDisplay);

    // Function to update video speed
    function updateVideoSpeed(speed) {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            videos.forEach(video => {
                video.playbackRate = speed;
            });
            
            // Update and show the speed display
            speedDisplay.textContent = `Speed: ${speed}x`;
            speedDisplay.style.opacity = '1';
            
            // Hide the display after 2 seconds
            setTimeout(() => {
                speedDisplay.style.opacity = '0';
            }, 2000);
            
            return true;
        }
        return false;
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only proceed if we're not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }
        
        // Check which key was pressed
        switch(e.key) {
            case ']': // Increase speed
                if (currentSpeedIndex < speedPresets.length - 1) {
                    currentSpeedIndex++;
                    updateVideoSpeed(speedPresets[currentSpeedIndex]);
                }
                break;
                
            case '[': // Decrease speed
                if (currentSpeedIndex > 0) {
                    currentSpeedIndex--;
                    updateVideoSpeed(speedPresets[currentSpeedIndex]);
                }
                break;
                
            case '\\': // Reset to normal speed (1x)
                currentSpeedIndex = 3; // Index for 1x speed
                updateVideoSpeed(speedPresets[currentSpeedIndex]);
                break;
        }
    });

    // Check for video element and set initial speed when navigating to new videos
    function initializeSpeed() {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            updateVideoSpeed(speedPresets[currentSpeedIndex]);
        }
    }

    // Initialize when the script loads
    setTimeout(initializeSpeed, 1500);

    // Watch for YouTube SPA navigation
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                setTimeout(initializeSpeed, 1500);
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
})();