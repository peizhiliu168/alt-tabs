/*
    initializations
*/

console.log('content script running')

// the selection index is used to keep track
// of where the current highlighted tab in the 
// tabs window is 
var selection_index = null;

/*
    messaging between content and background
*/

// recieves all the messages from the background
chrome.runtime.onMessage.addListener((request, sender, send_response) => {
    if (request.message == 'toggle_tabs_window'){
        inject_window(request.data);
        send_response({message: request.message, return: 0});
    } else if (request.message == 'untoggle_tabs_window_no_change'){
        untoggle_no_change();
        send_response({message: request.message, return: 0});
    } else if (request.message == 'untoggle_tabs_window_changed'){
        let tab_id = request.data[selection_index].id;
        untoggle_changed(tab_id);
        send_response({message: request.message, return: 0});
    } else if (request.message == 'move_tab_selection'){
        change_selection(request.step);
    }
})

// untoggles/ejects the tabs window and sends message 
// to backround
async function untoggle_no_change(){
    await chrome.runtime.sendMessage({message: 'untoggle_no_change'}, (response) => {
        if (response.message != 'untoggle_no_change' || response.return != 0){
            console.error('untoggle_no_change: message not received!');
            return;
        }
    })
    
    try{
        eject_window();
    } catch(err){
        console.log('No window to eject.');
    }
}

// untoggle/ejects the tabs window and sends message
// to backend containing the tab id of the currently
// selected window
async function untoggle_changed(tab_id){
    await chrome.runtime.sendMessage({message: 'untoggle_changed', tab_id: tab_id}, (response) => {
        if (response.message != 'untoggle_changed' || response.return != 0){
            console.error('untoggle_changed: message not received!');
            return;
        }
    })
    eject_window();
}

/*
    User interaction events listeners...
*/

// specifically listen for key presses
$(document).on('keydown', '#tabs-window', (e) => {
    console.log(e.key)
    if (e.key === 'Escape'){
        untoggle_no_change();
    }else if (e.key === 'Enter'){
        let selected_tab = $('.single-tab')[selection_index];
        let selected_tab_id = parseInt($(selected_tab).attr('id'), 10);
        untoggle_changed(selected_tab_id);
    }else if (e.key === 'ArrowLeft'){
        change_selection(-1);
    }else if (e.key === 'ArrowRight'){
        change_selection(1);
    }
})

// detect for clicks
$(document).on('click', '#tabs-window', (e) => {
    var $clicked_element = $(event.target);

    if ($clicked_element.attr('id') === 'tabs-window'){
        untoggle_no_change();
    }else if($clicked_element.closest('.single-tab').attr('class') == 'single-tab'){
        let tab_id = parseInt($clicked_element.closest('.single-tab').attr('id'), 10);
        untoggle_changed(tab_id);
    }
})

/* 
    helper functions...
*/

// injects the tabs window into the page, set the selection index
// to be 0, and update the tab window border to reflect the selection
async function inject_window(tabs_list){
    selection_index = 0;
    await tabslist2html(tabs_list);
    await update_selection();
    $('#tabs-window').focus();
}

// helper function that changes the selected tab in the
// tabs window using the selection index
async function update_selection(){
    var $single_tab = $('.single-tab');
    if (selection_index != null){
        $single_tab.each((index, element) =>{
            $(element).css("border-color", "transparent");
        })
    }
    $($single_tab[selection_index]).css("border-color", "white");
}

// a helper function for <inject_window()> that takes in 
// a <tabs_stack> and convert that into html string that 
// is displayed
async function tabslist2html(tabs_list){
    await draw_tabs_holder();
    await draw_tabs(tabs_list);
}

// helper function for <tabslist2html()> that injects the 
// tabs holder into the page html
async function draw_tabs_holder(){
    await $.get(chrome.runtime.getURL('templates/tabs_window.html'), (tabs_window_template_string) => {
        var $tabs_window_template = $(tabs_window_template_string);
        $tabs_window_template.find('link').attr('href', chrome.runtime.getURL('styles/tabs_window.css'));
        $tabs_window_template.appendTo('body');
    });
}

// helper function for <tabslist2html()> that injects the 
// individual tabs in order into the page html
async function draw_tabs(tabs_list){
    for (var i = 0; i < tabs_list.length; i++){
        var tab = tabs_list[i];
        await $.get(chrome.runtime.getURL('templates/tab_template.html'), (tab_string) => {
            var $tab = $(tab_string);
            $tab.attr('id', tab.id.toString());
            $tab.find('.icon-capture').attr('src', tab.favIconUrl);
            $tab.find('.tab-description').text(tab.title);
            console.log(tab.title)
            if (tab.preview_image_path == null){
                $tab.find('.tab-capture').attr('src', chrome.runtime.getURL('images/default_tabs_preview.png'));
            }else{
                $tab.find('.tab-capture').attr('src', tab.preview_image_path);
            }
            $tab.appendTo('#tabs-holder');
        });
    }
}

// simple function that ejects the tabs window from the page
// the user is viewing
async function eject_window(){
    selection_index = null;
    $('#tabs-window').remove();
}

// function that changes the highlighted tab in the tab window by 
// the <step> amount
async function change_selection(step){
    var tabs_list_len = $('.single-tab').length;
    // because js modulo is retarded
    selection_index  = (((selection_index + step) % tabs_list_len) + tabs_list_len) % tabs_list_len;
    await update_selection();
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