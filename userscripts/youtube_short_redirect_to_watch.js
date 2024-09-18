// ==UserScript==
// @name         No Youtube Short V2
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Allows you to view Youtube shorts as normal videos
// @author       Ma-04
// @match       *://www.youtube.com/*
// @match       *://youtube.com/*

// @icon        https://image.noelshack.com/fichiers/2023/07/4/1676551143-noshort.png
// @grant       none
// @licence      MIT
// ==/UserScript==

(function() {

    function checkURL() {
        // Verifies if it's a short URL, not already redirected, and does not end with "shorts"
        if (window.location.href.includes("shorts") && !window.location.href.includes("redirected") && !window.location.href.endsWith("shorts")) {
            redirect() //redirects
        }
    
        setTimeout(checkURL, 500);
    }

    checkURL();


    function redirect() {
        // Redirects to a watch URL
        let url = window.location.href
        url = url.replace('shorts/', 'watch?v=')
        
        // Add the "redirected" parameter to the URL
        if (!url.includes("?")) {
            url += "?redirected=true";
        } else {
            url += "&redirected=true";
        }
    
        window.location.href = url;
    }


    'use strict';

})();