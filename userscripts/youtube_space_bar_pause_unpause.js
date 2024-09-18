// ==UserScript==
// @name        YouTube Spacebar to K
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description Bind spacebar to 'k' on YouTube
// @author      Ma-04
// @match       *://*.youtube.com/*
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('keydown', function(event) {
        if (event.keyCode === 32 && event.target.tagName.toLowerCase() !== 'input') { // 32 is the key code for spacebar
            event.preventDefault(); // prevent the default action
            var kEvent = new KeyboardEvent('keydown', { 'keyCode': 75, 'which': 75 }); // 75 is the key code for 'k'
            window.dispatchEvent(kEvent); // dispatch the 'k' event
        }
    });
})();