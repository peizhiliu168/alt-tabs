/*
    Initializations
*/

//console.log('content script running')

// the selection index is used to keep track
// of where the current highlighted tab in the 
// tabs window is 
var selection_index = null;

// calculate the maximum number of tabs in tabs window
// when the window is first loaded or when it is resized
var max_num_tabs = 5;
$(window).on('load resize', () => {
    var ratio_constant = 5 / (16 / 9);
    const vw = window.outerWidth;
    const vh = window.outerHeight;
    const ratio = vw / vh;

    if (vw && vh){
        if ($('#tabs-window').length){
            max_num_tabs = Math.floor(ratio_constant * ratio);
            modify_displayed();
        } else{
            const ratio = vw / vh;
            max_num_tabs = Math.floor(ratio_constant * ratio);
        }
    }
})


/*
    Messaging between content and background
*/

// receives all the messages from the background
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
// to background
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
        //console.log('No window to eject.');
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
    //console.log(e.key)
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

// detection for clicks
$(document).on('click', '#tabs-window', (e) => {
    var $clicked_element = $(event.target);

    if ($clicked_element.attr('id') === 'tabs-window'){
        untoggle_no_change();
    }else if($clicked_element.closest('.single-tab').attr('class') == 'single-tab'){
        let tab_id = parseInt($clicked_element.closest('.single-tab').attr('id'), 10);
        untoggle_changed(tab_id);
    }
})

// detection for mouse entering 
$(document).on('mouseenter', '.single-tab', (e) => {
    var $hovered_tab = $(e.target).closest('.single-tab');
    var $selected_tab = $($('.single-tab')[selection_index])
    if ($selected_tab.attr('id') != $hovered_tab.attr('id')){
        $hovered_tab.css("border-color", "white");
    }
})

// detection for mouse leaving
$(document).on('mouseleave', '.single-tab', (e) => {
    var $hovered_tab = $(e.target).closest('.single-tab');
    var $selected_tab = $($('.single-tab')[selection_index])
    if ($selected_tab.attr('id') != $hovered_tab.attr('id')){
        $hovered_tab.css("border-color", "transparent");
    }    
})


/* 
    Helper functions...
*/

// injects the tabs window into the page, set the selection index
// to be 0, and update the tab window border to reflect the selection
async function inject_window(tabs_list){
    selection_index = 0;
    await tabslist2html(tabs_list);
    update_selection();
    modify_displayed();
    fix_tabs_description();
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
            $tab.find('.tab-description').text(tab.title);
            //console.log(tab.title)

            if (tab.favIconUrl == null || tab.favIconUrl == ''){
                $tab.find('.icon-capture').attr('src', chrome.runtime.getURL('images/logo.png'));
            }else{
                $tab.find('.icon-capture').attr('src', tab.favIconUrl);
            }
            if (tab.preview_image_path == null){
                $tab.find('.tab-capture').attr('src', chrome.runtime.getURL('images/default_tabs_preview.png'));
            }else{
                $tab.find('.tab-capture').attr('src', tab.preview_image_path);
            }
            $tab.css('display', 'none');

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
    // because js modulo doesn't work properly :/
    selection_index  = (((selection_index + step) % tabs_list_len) + tabs_list_len) % tabs_list_len;
    await update_selection();
    modify_displayed();
}

// get the n tabs that will be displayed in the window, returns
// two numbers in a list that represent the beginning and end indices
// respectively and inclusively
function displayed_tabs_range(){
    var max_index = $('.single-tab').length - 1;
    if (max_index + 1 <= max_num_tabs){
        return [0, max_index];
    }

    var range = get_displayed_tab_range();

    if (selection_index == 0 || range == null){
        return [0, max_num_tabs - 1];
    } else{
        //console.log(range);
        if (selection_index < range[0]){
            return [selection_index, selection_index + (max_num_tabs - 1)]
        } else if (selection_index > range[1]){
            return [selection_index - (max_num_tabs - 1), selection_index];
        } else{
            return range;
        }
        
    }
}

// changes the styles <display> of '.single-tab' element to 'flex' 
// if it is within the range, or to 'none' if it is not in the 
// range
async function modify_displayed(){
    var range = displayed_tabs_range();
    var $tabs_list = $('.single-tab');
    for (var i = 0; i < $tabs_list.length; i++){
        if (i >= range[0] && i <= range[1]){
            var $tab = $($tabs_list[i]);
            $tab.css('display', 'block');
        }else{
            var $tab = $($tabs_list[i]);
            $tab.css('display', 'none');
        }
    }
    fix_tabs_description();
}

// get the current range of the displayed tabs
function get_displayed_tab_range(){
    var start;
    var end;

    var $tabs_list = $('.single-tab');

    if ($tabs_list.length == 0){
        return null;
    }

    for (var i = 0; i < $tabs_list.length; i++){
        var $tab = $($tabs_list[i]);
        if ($tab.css('display') == 'block'){
            start = i
            break;
        }
    }

    for (var i = $tabs_list.length; i >= 0; i--){
        var $tab = $($tabs_list[i]);
        if ($tab.css('display') == 'block'){
            end = i
            break;
        }
    } 
    
    return [start, end];
}

/*
    Weird styling that I can't do in css
*/
// fixes the size of the tab descriptions when the window loads or 
// resizes
$(window).on('load resize', () => {
    fix_tabs_description();
})

// function used to fix the tab descriptions by setting the width of 
// <.tab-icon-description> elements to be the width of the tab capture 
// images
function fix_tabs_description(){
    if ($('#tabs-window').length){
        $('.single-tab').each((index, element) => {
            if ($(element).css('display') != 'none'){
                var width = $(element).find('.tab-capture').css('width');
                $(element).find('.tab-icon-description').css('width', width);
            }
        })
    }
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