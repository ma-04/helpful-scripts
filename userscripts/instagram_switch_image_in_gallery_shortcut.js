// ==UserScript==
// @name     Instagram Image Switcher
// @version  1
// @grant    none
// @include  https://www.instagram.com/*
// ==/UserScript==

document.addEventListener('keydown', function(event) {
    const key = event.key.toUpperCase();
    const leftArrow = document.querySelector('button[aria-label="Go back"]');
    const rightArrow = document.querySelector('button[aria-label="Next"]');
    const upArrow = document.querySelector('button[aria-label="Go back"]');
    const downArrow = document.querySelector('button[aria-label="Next"]');

    switch(key) {
        case 'A':
            if(leftArrow) leftArrow.click();
            break;
        case 'D':
            if(rightArrow) rightArrow.click();
            break;
        case 'W':
            if(upArrow) upArrow.click();
            break;
        case 'S':
            if(downArrow) downArrow.click();
            break;
    }
});