// ==UserScript==
// @name         YouTube Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Control YouTube video speed with keyboard shortcuts without interfering with YouTube's UI
// @author       ma0-04
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const speedPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    let currentSpeedIndex = 3; // Default to index of 1x speed (which is 3 in our array)
    let updateUIEnabled = false; // Disable UI updates by default to avoid interference
    
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

    // Function to update video speed without interfering with YouTube's UI
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
            
            // Store the chosen speed in localStorage for persistence
            try {
                localStorage.setItem('youtube-speed-controller-speed', speed);
                localStorage.setItem('youtube-speed-controller-index', currentSpeedIndex);
            } catch (e) {
                console.error('Failed to save speed setting:', e);
            }
            
            return true;
        }
        return false;
    }

    // Toggle function for showing a message about UI update option
    function showUIToggleHelp() {
        const helpDisplay = document.createElement('div');
        helpDisplay.style.position = 'fixed';
        helpDisplay.style.top = '120px';
        helpDisplay.style.right = '20px';
        helpDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        helpDisplay.style.color = 'white';
        helpDisplay.style.padding = '10px';
        helpDisplay.style.borderRadius = '5px';
        helpDisplay.style.fontSize = '14px';
        helpDisplay.style.zIndex = '9999';
        helpDisplay.style.maxWidth = '300px';
        helpDisplay.style.lineHeight = '1.4';
        
        helpDisplay.innerHTML = `
            <p><b>YouTube Speed Controller Info:</b></p>
            <p>UI updates are currently <b>${updateUIEnabled ? 'enabled' : 'disabled'}</b>.</p>
            <p>Press <b>Shift + \\</b> to ${updateUIEnabled ? 'disable' : 'enable'} YouTube UI updates.</p>
            <p>Keyboard shortcuts:</p>
            <p>[ - Decrease speed</p>
            <p>] - Increase speed</p>
            <p>\\ - Reset to 1x speed</p>
            <p>Shift + \\ - Toggle UI updates</p>
        `;
        
        document.body.appendChild(helpDisplay);
        
        // Remove the help display after 5 seconds
        setTimeout(() => {
            document.body.removeChild(helpDisplay);
        }, 5000);
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
                
            case '\\': // Reset to normal speed (1x) or toggle UI update mode with Shift
                if (e.shiftKey) {
                    // Toggle UI update mode
                    updateUIEnabled = !updateUIEnabled;
                    try {
                        localStorage.setItem('youtube-speed-controller-ui-update', updateUIEnabled);
                    } catch (e) {
                        console.error('Failed to save UI update setting:', e);
                    }
                    showUIToggleHelp();
                } else {
                    // Reset to normal speed
                    currentSpeedIndex = 3; // Index for 1x speed
                    updateVideoSpeed(speedPresets[currentSpeedIndex]);
                }
                break;
                
            case '?': // Show help if Shift+? is pressed
                if (e.shiftKey) {
                    showUIToggleHelp();
                }
                break;
        }
    });

    // Check for video element and set initial speed when navigating to new videos
    function initializeSpeed() {
        // Try to load saved settings
        try {
            const savedIndex = localStorage.getItem('youtube-speed-controller-index');
            const savedUiUpdate = localStorage.getItem('youtube-speed-controller-ui-update');
            
            if (savedIndex !== null) {
                currentSpeedIndex = parseInt(savedIndex, 10);
            }
            
            if (savedUiUpdate !== null) {
                updateUIEnabled = savedUiUpdate === 'true';
            }
        } catch (e) {
            console.error('Failed to load saved settings:', e);
        }
        
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            // Just set the playback rate directly without messing with the UI
            videos.forEach(video => {
                video.playbackRate = speedPresets[currentSpeedIndex];
            });
            
            // Show brief speed indicator
            speedDisplay.textContent = `Speed: ${speedPresets[currentSpeedIndex]}x`;
            speedDisplay.style.opacity = '1';
            setTimeout(() => {
                speedDisplay.style.opacity = '0';
            }, 2000);
        }
    }

    // Initialize when the script loads
    setTimeout(initializeSpeed, 1500);

    // Watch for YouTube SPA navigation
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && 
                document.querySelector('video') && 
                document.querySelector('video').playbackRate !== speedPresets[currentSpeedIndex]) {
                setTimeout(initializeSpeed, 500);
                break;
            }
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
})();