// ==UserScript==
// @name        Facebook Video Speed Controller
// @namespace   http://tampermonkey.net/
// @version     1.0
// @description Set Facebook video speed to 2x
// @author      ma-04
// @match       *://*.facebook.com/*
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName.toLowerCase() === 'video') {
                        node.playbackRate = 2.0; // Change this to 1.5 for 1.5x speed
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();