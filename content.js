/*
    The content script is in charge of capturing the
    keyboard events that occur in the document and 
    passing them on to the background.
*/

/*// establish a long-term connection with the background
let port = chrome.runtime.connect()*/

// keycodes to be pressed
var alt_key_code = 18;
var tab_key_code = 81;

// event listener for when a key is pressed down
/*document.addEventListener("keydown", (event) => {
    if (event.keyCode == alt_key_code){
        chrome.runtime.sendMessage({"key_event":"alt_key_down"});
    } else if (event.keyCode == tab_key_code){
        chrome.runtime.sendMessage({"key_event":"tab_key_down"});
    }
})


// event listener for when a key is released up
document.addEventListener("keyup", (event) => {
    if (event.keyCode == alt_key_code){
        chrome.runtime.sendMessage({"key_event":"alt_key_up"});
    } else if (event.keyCode == tab_key_code){
        chrome.runtime.sendMessage({"key_event":"tab_key_up"});
    }
})*/

$(document).ready(function() {
    $(document).keydown(function(e) {   
    e.preventDefault();  
    if (e.which == alt_key_code) {
        chrome.runtime.sendMessage({"key_event":"alt_key_down"});
    } else if (e.which == tab_key_code){
        chrome.runtime.sendMessage({"key_event":"tab_key_down"});
    }
    });

    $(document).keyup(function(e) {   
        e.preventDefault();  
        if (e.which == alt_key_code) {
            chrome.runtime.sendMessage({"key_event":"alt_key_up"});
        } else if (e.which == tab_key_code){
            chrome.runtime.sendMessage({"key_event":"tab_key_up"});
        }
        });
});