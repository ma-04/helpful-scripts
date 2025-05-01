// ==UserScript==
// @name         YouTube Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Control YouTube video speed with keyboard shortcuts and update YouTube's UI
// @author       ma0-04
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    let currentSpeedIndex = 3; // Default to index of 1x speed (which is 3 in our array)
    
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

    // Function to update YouTube's playback speed UI
    function updateYouTubeSpeedUI(speed) {
        // Try to find the settings menu and click it
        let settingsButton = document.querySelector('.ytp-settings-button');
        if (settingsButton) {
            // Click settings button to open menu
            settingsButton.click();
            
            // Short delay to let the menu appear
            setTimeout(() => {
                // Find and click the "Playback speed" option in the menu
                const menuItems = document.querySelectorAll('.ytp-menuitem');
                for (const item of menuItems) {
                    if (item.textContent.includes('Playback speed') || item.textContent.includes('Speed')) {
                        item.click();
                        
                        // Short delay to let speed options appear
                        setTimeout(() => {
                            // Find and click the closest speed option
                            const speedOptions = document.querySelectorAll('.ytp-menuitem');
                            let closestOption = null;
                            let closestDiff = Infinity;
                            
                            // Find the menu item that's closest to our target speed
                            for (const option of speedOptions) {
                                const speedText = option.textContent.trim();
                                const match = speedText.match(/(\d+(\.\d+)?)×/);
                                if (match) {
                                    const optionSpeed = parseFloat(match[1]);
                                    const diff = Math.abs(optionSpeed - speed);
                                    
                                    if (diff < closestDiff) {
                                        closestDiff = diff;
                                        closestOption = option;
                                    }
                                }
                            }
                            
                            // Click the closest option if found
                            if (closestOption) {
                                closestOption.click();
                            } else {
                                // If we couldn't find a match, just close the menu
                                settingsButton.click();
                            }
                        }, 100);
                    }
                }
                
                // If we didn't find the playback speed option, close the menu
                if (!document.querySelector('.ytp-panel-menu').textContent.includes('Playback speed')) {
                    settingsButton.click();
                }
            }, 100);
        }
    }

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
            
            // Try to update YouTube's UI to match our speed
            updateYouTubeSpeedUI(speed);
            
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