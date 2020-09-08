/*
    Class and helper function definitions
*/

// a stack datasturcture to record the current tabs
class Stack{
    
    // initializes stack object
    constructor(predicate){
        this.data = [];
        this.top = 0;
        this.predicate = predicate;
    }

    // given an element, determine if that element is already in the stack. 
    // if it is, move the item to the top of the stack, if it isn't append 
    // the new item to the top of the stack
    push(element){
        var index = this.data.findIndex(this.predicate, element);

        if (index == -1){
            this.data[this.top] = element;
            this.top ++;
            return;
        }

        var new_data = this.data.slice(0,index)
        new_data = new_data.concat(this.data.slice(index + 1, this.top))
        new_data[this.top - 1] = this.data[index]
        
        this.data = new_data
    }

    // replaces one element with another
    replace(old_element, new_element){
        var index = this.data.findIndex(this.predicate, old_element);
        if (index != -1){
            this.data[index] = new_element;
        }
    }

    // pops an element off the top of the stack
    pop(){
        if (this.is_empty()){
            return;
        }

        this.top --;
        var result = this.data[this.top];
        return result;
    }

    // removes element off the stack given an element
    remove(element){
        var index = this.data.findIndex(this.predicate, element);

        if (index != -1){
            var new_data = this.data.slice(0, index);
            new_data = new_data.concat(this.data.slice(index + 1, this.top));
            this.data = new_data;
            this.top --;
        }
    }

    // take a peek at the element at the very top
    peek(){
        return this.data[this.top - 1];
    }

    // return all the elements on the stack as an ordered list
    // with the top-most element in the front
    get_stack(){
        var ret_arr = Array.from(this.data);
        return ret_arr.reverse()
    }

    // return all the elements on the stack in the reversed order,
    // with the top-most element in the end
    get_stack_true(){
        return this.data
    }

    // checks if the stack is empty
    is_empty(){
        return this.top === 0;
    }

    // returns the length of the stack
    length(){
        return this.top;
    }

    // prints out the elements of the stack for debugging
    print(){
        for (var i = this.top - 1; i >=0; i --){
            console.log(this.data[i]);
        }
    }
}

function test_pred(element, index){
    return element == this;
}

// function used to compare two chrome tabs to see if they're are 
// the same tab
function tab_pred(tab){
    return tab.id == this.id;
}










/*
    Begin main functions...
*/
// start alt tabs when it is first installed
chrome.runtime.onInstalled.addListener(() => {
    start_alt_tabs();
})

// start alt tabs when profile with extension starts up
chrome.runtime.onStartup.addListener(() => {
    start_alt_tabs();
})

// global variable of Stack instance to store the stack of tabs
var tabs_stack = new Stack(tab_pred);

// to be executed on extension startup
function start_alt_tabs(){
    // fill tabs_stack by pushing all the tabs onto stack
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            tab.preview_image_path = '../images/default_tabs_preview.png';
            tabs_stack.push(tab);
        });
    })

    // now repush the current tab user is on to make it the top of stack
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        tabs.forEach(tab =>{
            tabs_stack.push(tab);
        })
    })

    // get the recent tab preview and change the preview image
    chrome.tabs.captureVisibleTab((url) => {
        if (url != null){
            tabs_stack.get_stack()[0].preview_image_path = url;
        }
    })
    
}




/*
    Callback functions...
*/

// push new tab onto stack when it's created
chrome.tabs.onCreated.addListener((tab) => {
    console.log("tab created");
    tabs_stack.push(tab);
})

// when a tab is updated
chrome.tabs.onUpdated.addListener((tab_id, change_info, tab) => {
    console.log("tab updated");
    tabs_stack.replace(tab, tab);
})

// push update tab onto stack when selection is changed
chrome.tabs.onActivated.addListener((active_info) => {
    console.log("tab activated");
    chrome.tabs.query({windowId: active_info.windowId, active: true}, (tabs) => {
        tabs.forEach(tab => {
            tabs_stack.push(tab);
        })
    })
    chrome.tabs.captureVisibleTab((url) => {
        if (url != null){
            tabs_stack.get_stack()[0].preview_image_path = url;
        }
    })
})

// update tab when the tab is detached
chrome.tabs.onDetached.addListener((tab_id) => {
    chrome.tabs.get(tab_id, (tab) => {
        tabs_stack.replace(tab, tab);
    })
})

// update tab when the tab is attached
chrome.tabs.onAttached.addListener((tab_id) => {
    chrome.tabs.get(tab_id, (tab) => {
        tabs_stack.replace(tab, tab);
    })
})

// remove tab from stack when the tab is closing. Since the 
// actual tab is closed before the event is issued, we must 
// do a search in the tabs_stack for the tab instead of using 
// tab.query
chrome.tabs.onRemoved.addListener((tab_id, remove_info) => {
    console.log("tab removed");
    var removed_tab;
    for (var i = 0; i < tabs_stack.length(); i++){
        if (tabs_stack.get_stack_true()[i].id == tab_id){
            removed_tab = tabs_stack.get_stack_true()[i];
        }
    }
    
    if (!removed_tab){
        Error('removed tab does not exist in stack!');
    } else{
        tabs_stack.remove(removed_tab);
    }
})

// replace tab with new tab when onReplaced is called, the
// idea of getting the old tab is the same as the the callback
// for onRemoved
chrome.tabs.onReplaced.addListener((added_id, removed_id) => {
    console.log("tab replaced");
    var added_tab;
    chrome.tabs.get((tab) => {added_tab = tab});

    var removed_tab;
    for (var i = 0; i < tabs_stack.length(); i++){
        if (tabs_stack.get_stack_true()[i].id == removed_id){
            removed_tab = tabs_stack.get_stack_true()[i];
        }
    }
    
    if (!removed_tab){
        Error('removed tab does not exist in stack!');
    } else{
        tabs_stack.replace(removed_tab, added_tab);
    }
})

chrome.windows.onFocusChanged.addListener((window_id) => {
    if (window_id != chrome.windows.WINDOW_ID_NONE){
        chrome.tabs.query({windowId: window_id, active: true}, (tabs) => {
            tabs.forEach(tab => {
                tabs_stack.push(tab);
            })
        })
    }
})

// switch tabs when the command toggle-tabs-switching is 
// present from user using shortcut. If the command is 
// toggle-tabs-window, display a window wilt all the recent
// tabs
chrome.commands.onCommand.addListener(function(command) {
    if (command == 'toggle-tabs-switching'){
        if (tabs_stack.length() > 1){
            var new_tab = tabs_stack.get_stack()[1];
            console.log(new_tab.windowId);
            chrome.windows.update(new_tab.windowId, {focused: true});
            chrome.tabs.update(new_tab.id, {active: true, highlighted: true});
        }
    } else if (command == 'toggle-tabs-window'){
        if (tabs_window_toggled == false){
            toggle_tabs_window();
        }
        else{
            // move the tabs right
        }
    }
});

// global variable to indciate whether the tabs window overlay is on
var tabs_window_toggled = false;

// function responsible for sending message to content.js to toggle 
// the tabs window
function toggle_tabs_window(){
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        var tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, {message: 'toggle_tabs_window', data: tabs_stack.get_stack()}, (response) => {
            if (response.message == 'toggle_tabs_window', response.success == 0){
                tabs_window_toggled = true;
            }
        })
    })
}

// function responsible for sending message to content.js to untoggle 
// the tabs window
function untoggle_tabs_window(){
    chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
        var tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, {message: 'untoggle_tabs_window', data: tabs_stack.get_stack()}, (response) => {
            if (response.message == 'untoggle_tabs_window' && response.return == 0){
                tabs_window_toggled = false;
            }
        })
    })
}

  /*ar alt_down = false;
  var tab_down = false;
  chrome.runtime.onMessage.addListener((message, sender) => {
      if (message.key_event == "alt_key_down"){
          alt_down = true;
      }
      if (message.key_event == "alt_key_up"){
          alt_down = false;
      }
      if (message.key_event == "tab_key_down"){
          tab_down = true;
      }
      if (message.key_event == "tab_key_up"){
          tab_down = false;
      }
      
      console.log(alt_down);
      console.log(tab_down);

      if (alt_down && tab_down){
        if (tabs_stack.length() > 1){
            var new_tab = tabs_stack.get_stack()[1];
            chrome.tabs.update(new_tab.id, {active: true});
        }
      }
  })*/
