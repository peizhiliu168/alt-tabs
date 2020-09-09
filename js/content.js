console.log('content script running')

chrome.runtime.onMessage.addListener((request, sender, send_response) => {
    if (request.message == 'toggle_tabs_window'){
        var tabs_window = tabslist2html(request.data);
        $(tabs_window).appendTo('body');
        send_response({message: request.message, return: 0});
    } else if (request.message == 'untoggle_tabs_window'){
        // remove the html
        send_response({message: request.message, return: 0});
    }
})

// a helper function for <inject_window()> that takes in 
// a <tabs_stack> and convert that into html string that 
// can be displayed
function tabslist2html(tabs_list){
    var tabs_window_template = $.get(chrome.runtime.getURL('templates/tabs_window.html'));
    tabs_list.forEach((tab) => {
        var tab_template = $.get(chrome.runtime.getURL('templates/tab_template.html'));
        $(tab_template).find('.icon-capture').attr('src', tab.favIconUrl);
        $(tab_template).find('.tab-description').text(tab.title);
        $(tab_template).find('.tab-capture').attr('src', tab.preview_image_path);
        $(tab_template).appendTo($(tabs_window_template).find('#tabs-holder'));
    })
    return tabs_window_template;
}

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

/*$(document).ready(function() {
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
});*/   