function addAccompaningElements()  {
	// Add the dropdown (hidden) to the drop-down field(s)
	var suggestionContainer = jQuery("<div/>", {
		"class": "suggestion-container"
	});

	//Add suggestion-container, only to those who does not have it already
	var alreadyHaveContainer = $('.suggestion-container','.drop-down').parent();
	suggestionContainer.appendTo($(".drop-down").not(alreadyHaveContainer));
    
    //Add a drop-sidebutton to those who does not have this, in the same manner as we added the suggestion-container
    var dropSideButton = jQuery("<div/>", {
        "class": "glyphicon glyphicon-chevron-down drop-sidebutton"
    });
    
    var alreadyHaveDropButton = $('.drop-sidebutton','.drop-down').parent();
    dropSideButton.appendTo($(".drop-down").not(alreadyHaveDropButton));
    
    /**
    * Also, add the fields themselves if they should be missing
    * (Currently, there is no way to specify placeholder if the select-field isn't explicitly defined)
    **/
    var selectField = jQuery("<div/>", {
		"class": "select-field"
	});
    
    var alreadyHaveInputField = $('.select-field','.drop-down').parent();
    selectField.appendTo($(".drop-down").not(alreadyHaveInputField));
    
    
    // Add a x-thing for editable drop-downs
    var cancelButton = jQuery("<div/>", {
        "class": "glyphicon glyphicon-remove drop-cancelbutton"
    });
    
    cancelButton.appendTo($(".drop-down:has(input.select-field)"));
    
    $(".drop-cancelbutton").on("click",function(e) { 
            var dropdown = $(this).parents(".drop-down");
            clearDropdown.call(dropdown);
        });
    
    //For the newly added inputfields, the default selection item is the first one in the list
    $(".drop-down:not([defaultIndex])").not(alreadyHaveInputField).attr("defaultIndex",0);     
    
    //Add defaults to the select-fields that need them
    var inputFieldWithDefaultIndex = $('.select-field','.drop-down[defaultIndex]');
    
    $.each(inputFieldWithDefaultIndex,function(index,inputField) {
        //The index has to be increased by one since the :nth-child selector is 1-based, and that is ugly
        var defaultIndex = parseInt($(this).parent().attr("defaultIndex"));
        defaultIndex += 1;  
        var chosenSuggestion = $(".suggestion:nth-child(" + defaultIndex + ")",$(this).parent())
        chooseSuggestion.call(chosenSuggestion);
    });
    
    //Init in the same way the drop-downs where the default is specified by value
    var inputFieldWithDefaultValue = $('.select-field','.drop-down[defaultValue]');
    
    $.each(inputFieldWithDefaultValue,function(index,inputField) {
        var dropdown = $(this).parent();
        var defaultValue = dropdown.attr("defaultValue");
        var chosenSuggestion = $(".suggestion[value=\"" + defaultValue + "\"]",dropdown)
        chooseSuggestion.call(chosenSuggestion);
        
    });
    
    /**Disable autocomplete for free-text inputs since we already have a custom autocomplete. 
    Note that this does not always work for chrome. For Chrome, you usually have to have a form with autocomplete="off",
    or even more complicated solutions sometimes **/
    $("input.select-field",".drop-down").attr("autocomplete","off")
    
    //Set tab indexes which enables the regular (non-editable) dropdowns to be selected
    
    var focusableItems = $('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable], div.select-field');
    
    //Basically we loop through it all and set the tab order the same as the order we find things
    $.each(focusableItems,function(index,focusableItem){
       $(this).attr("tabindex",index); 
    });
   
    
}

// Adds a suggestion passing the .suggestion-container as context $(this)
var addSuggestion = function (text){

	var suggestion = jQuery("<div/>", {
		"class": "suggestion",
		text: text
	});
	//Set appropriate triggers
	suggestion.on("mousedown",chooseSuggestion);
	suggestion.on("mouseenter",highlightSuggestion);
	suggestion.on("mouseleave", deHighlightSuggestion);
	
	
	suggestion.appendTo($(this));
	
	return suggestion;
}

//Function for de-selecting any item in the drop-down. The drop-down is passed  as the context $(this)
function clearDropdown() {
    
    var selectField = $(this).children(".select-field");
    
    if(selectField.is("input")){ // If it is a free-form select
        selectField.val("");
    } else if(selectField.is("div")) { //If it is a traditional select
        restoreInputField.call(selectField);       //Restore it back to its placeholder
    }
    if(selectField.hasClass("selected")){
        selectField.removeClass("selected");
        $(this).trigger("inputInvalid");
    }
}

//Convenience method for getting the text out of a select field. the field is passed as $(this). Returns the string that it contains
function readSelectField() {
    if($(this).is("input")){
        return $(this).val();   
    } 
    return $(this).text();
}

//Sorts the suggestions in a suggestioncontainer alphabetically. The suggestion-container is passed  as the context $(this)
function sortSuggestionContainer() {
	
    var sortingFunction = null;
    
    switch($(this).attr("sort")){   //The sorting can be done in different ways
        case "numerically":
            sortingFunction  = function(a,b){
                return (a < b   ) ? -1 : 1;
	       }  
            
        break;
	    case "alphabetically":         //Default is the same as alphabetically at the moment
        default:
            sortingFunction  = function(a,b){
                var compA = $(a).text().toUpperCase();
                var compB = $(b).text().toUpperCase();
                return (compA < compB) ? -1 : 1;
	       }  
        break;
    }
    
    if(sortingFunction != null){
        console.log("sorting");
        var suggestions = $(this).children();

        suggestions.sort(sortingFunction);
        //Empty the previous unsorted suggestions and insert the new ones
        $(this).empty();
        $(this).append(suggestions);
    }
}


/**
 * Adds content as an array of strings to a dropdown suggestion container. The suggestion container is passed as the context $(this). 
 * @params: strArray: contains an array of strings as are to be shown in the drop-down. 
 * 			tipArray (optional): contains an array of strings which are used to show tooltips at the different suggestions
 * 			dataArray (optional): contains arbitrary data which will be saved as dropdown.data(strArray[i],dataArray[i]) 
 */ 
function setupSuggestionContainer(strArray, tipArray, dataArray){

	
	var suggestionContainer;
	var dropdown = $(this).parent();
	var selectField = $(".select-field",dropdown);
	
	$(this).empty();
	
	
	//avoid that $.each destroys things when changing $(this)
	var containerRef = $(this);
	
	//We calculate the maximum width that the suggestion container can have by extracting the string that take up the most space.
	var maxWidth = 0;
	
	$.each(strArray,function(index,textString) {
		
		//Create the object itself (will be hidden initially because the parent is hidden)
		var className = "suggestion";
		var suggestion = jQuery("<div/>", {
			"class": className,
			text: textString
		});
		
		//If the tooltipsarray is defined, then we make this work here.
		if(tipArray){
			suggestion.addClass("tipExists");
			suggestion.attr("tip",tipArray[index]);

		}
		
		//Attach the data if it exists
		if(dataArray){
			dropdown.data(textString,dataArray[index]);
		}

		var thisWidth = suggestion.textWidth();
		
		if(thisWidth > maxWidth) {
			maxWidth = thisWidth;
		}
		
		suggestion.appendTo(containerRef);
		
	});
	var extraMargin = 5;
	var marginsAndPaddings = selectField.outerWidth(true)-selectField.width();
	selectField.css("min-width",maxWidth + marginsAndPaddings + extraMargin);
	
	//Finally, sort the suggestions alphabetically
	sortSuggestionContainer.call($(this));
	
	//Collect the cute little children we just created
	var newSuggestions = $(".suggestion",$(this));
	
	//Set appropriate triggers
	newSuggestions.on("mousedown",chooseSuggestion)
		.on("mouseenter",highlightSuggestion)
		.on("mouseleave", deHighlightSuggestion);			
	
	setToolTipEventHandlers.call(newSuggestions);
		
}




// When an entry is clicked, this function triggers and adds the text to the input bar
var chooseSuggestion = function(e){
	
	var suggestionString = $(this).text();
	var dropdown = $(this).parents(".drop-down");
	var selectEntry = dropdown.children(".select-field");
	
	
	// If we are dealing with a editable drop down combination... Change the text of the text field
	if(selectEntry.is("input")){
		selectEntry.val(suggestionString);
	   
	} else { //Otherwise, change the value of the static field
        
		selectEntry.text(suggestionString);
		
	}
	
    //If there is an associated tooltip, then remove the box, to make the interface feel nicer
    
    if($(this).hasClass("tipExists")){
        hideTip.call($(this));
    }
	
	//When the suggestion has been chosen, remove the menu and change the style
	hideDropdown.call(this);
	selectEntry.addClass("selected");
	/**
	 * Trigger the custom event inputValid. It is important to have square brackets around the second argument because it is considered as an argument list, so we only have
	 * one "extra" argument
	 */
	dropdown.trigger("inputValid",[$(this)]);
    
    //Mark this newly selected suggestion as chosen and unmark the rest
    $(".suggestion.chosen",dropdown).removeClass("chosen");
    $(this).addClass("chosen");
}



//A suggestion is highlighted by triggering this function
var highlightSuggestion = function(e) {
	//console.log("Highlight trigger");
	// de-highlight all other suggestions in order to prevent wierd stuff from happening
	deHighlightAllSuggestions();
	$(this).addClass("focused");
}

//The suggestion is de-highlighted by triggering this function
var deHighlightSuggestion = function(e) {
	//console.log("deHighlight trigger");
	$(this).removeClass("focused");
}

//All suggestions are de-highlighted with this function
function deHighlightAllSuggestions(){
	$(".focused").removeClass("focused");
}

/**
 * This function moves from one suggestion to another by triggering from key presses or chooses an item by enter-press
 * 
 * @args: thisReferrer: Pass the $(this)-referrer as an argument to make it work within the context of a trigger
 * 
 */
var handleKeyPress = function(e) {
    
	var isKeyDown = (e.keyCode == 40);
	var isKeyUp = (e.keyCode == 38);
	var isEnter = (e.keyCode == 13);
	
	var suggestionContainer = $(".suggestion-container",$(this).parent());
	var isDropdownVisible = suggestionContainer.is(":visible");
	
	if (isKeyDown || isKeyUp) {
        e.preventDefault();
		var selectedSuggestion = $(".focused",$(this).parent());
		var newSelectedSuggestion = null;
        
        
		
		if (!isDropdownVisible){
			showDropdown.call(this);
			}
		
		// Check if there is none currently selected, or, perhaps something has gone wrong and there currently are two selected
		if(selectedSuggestion.length != 1){
			
			// Select the first one, the slice is necessary to keep it an array, otherwise we can not do ordinary jquery functions to it
			newSelectedSuggestion = $(".suggestion",$(".suggestion-container",$(this).parent())).slice(0,1);
			
		} else {
			if(isKeyDown) {
				newSelectedSuggestion = selectedSuggestion.loopNext(".suggestion:visible");
			} else {
				newSelectedSuggestion = selectedSuggestion.loopPrev(".suggestion:visible");
			}
			// Check if scroll-level needs to be adjusted because the newly selected suggestion is outside vision of scroll viewport within the element
			
			var DOMnewSelectedSuggestion = newSelectedSuggestion[0];
			var DOMsuggestionContainer = suggestionContainer[0];
			
            
			//First, check if we need to scroll down
			var scrollReq = Math.max((DOMnewSelectedSuggestion.offsetTop + DOMnewSelectedSuggestion.offsetHeight) - 
				(DOMsuggestionContainer.scrollTop+DOMsuggestionContainer.offsetHeight),0) +
			//To this, add the bit that we would need to scroll up (both should not be non-zero, of course)
				Math.min((DOMnewSelectedSuggestion.offsetTop) - 
						(DOMsuggestionContainer.scrollTop),0);
			
			//Do we need to scroll anywhere?
			if(scrollReq != 0 ){
				//Scroll down by accessing regular jquery-selector
				/**
				 * Temporarily disable mouseenter since it triggers when scrolling and another element can instead by highlighted which is not wished for
				 * This requires a very ugly solution. First, turn mouseevents off and clear the events. 
				 * Then set the next triggers to turn off triggers and then turn on them again.
				 * The net result from this is that event firers will be turned off once. Also, we turn on a mousemove trigger at the 
				 * second time it triggers which helps when the mouse currently inside a suggestion
				 */
                $(".suggestion").off("mousemove");     
				$(".suggestion").off("mouseenter")
					.off("mouseleave")
					.on("mouseenter",function(e) {
						$(".suggestion").off("mouseenter")
							.on("mouseenter",highlightSuggestion)
							.on("mousemove",function(e) {
                                
                                $(this).on("mousemove",function(e) {
                                    
                                    highlightSuggestion.call(this);
                                    $(".suggestion").off("mousemove"); 
                                });
								
								});
					})
					.on("mouseleave",function(e) {
						$(".suggestion").off("mouseleave")
							.on("mouseleave",deHighlightSuggestion)  
					});
				suggestionContainer.scrollTop(DOMsuggestionContainer.scrollTop+scrollReq);
				
				
			}
		}
		
		highlightSuggestion.call(newSelectedSuggestion);
		// We need to call the tooltip show manually here
		if(newSelectedSuggestion.hasClass("tipExists")){
			displayTip.call(newSelectedSuggestion);
		}
		
	} else if (isEnter) {
		
		var selectedSuggestion = $(".focused");
		var focusIsSet = (selectedSuggestion.length == 1);
		
		// If drop down is not visible or nothing is selected, rely on default behaviour
		if(!isDropdownVisible || !focusIsSet){
			return;
		}
		
		//Otherwise, stop default behaviour and instead input to the text field what is currently selected
		e.preventDefault();
		
		chooseSuggestion.call(selectedSuggestion);
		// Also hide drop down
		hideDropdown.call(this);
	}
	
	
}

//Shows the dropdown menu and modifies the visibility of the suggestions
var showDropdown = function(e){
	
    

	/** Get the suggestion container. This is tricky access, because the element causing the showdropdown can be nested among deeper structures in the 
	 * .drop-down. Although, the .suggestion-container will always be immediately below the .drop-down
	 */
	var dropdown = $(this).parents(".drop-down");
	var suggestionContainer =  dropdown.children(".suggestion-container");
	
    
	
	//Hide other menus that might be showing up
	$('.suggestion-container').not(suggestionContainer).hide();

	
	//The selection-field
	var selectField = dropdown.children(".select-field");
	
	var noEntriesText = selectField.attr("empty-list") ?  selectField.attr("empty-list") : "No entries were found.";
	
    
    //If there has been a new entry added from a previously emptied list, we have to remove the .no-found message
    if(suggestionContainer.children().length > 1 && suggestionContainer.children(".no-found").length > 0){
        suggestionContainer.children(".no-found").remove();
    }
    
	if(selectField.is("input")) {
        
        
		// Searching using regular expressions for strings that begin with the specified input
		var inputText = selectField.val();
		var regExp = new RegExp(inputText,"i");	
		
		var exactMatch = false;
		
		$.each(suggestionContainer.children(),function(index,suggestion) {
			
			//make object from DOM to jquery object and extract its string
			suggestion = $(suggestion);
			stringEntry = suggestion.text();
			
			// Search for strings beginning with the entered word
			var regExpResult = stringEntry.search(regExp);
			
			
			if(regExpResult == 0){
				suggestion.show();
				if(stringEntry.toUpperCase() == inputText.toUpperCase()){
					exactMatch = true;
					// If an exact match has been found, change input text to match caps setting of suggestions
					selectField.val(stringEntry);
					//Also see if we have to change class and trigger inputValid custom event
					if(!selectField.hasClass("selected")){
						selectField.addClass("selected");
						console.log($(suggestion));
						dropdown.trigger("inputValid",[suggestion]);
					}
				}
			} else {
				suggestion.hide();
			}
		});
		// change classes and trigger event if we have an exact match
		if(!exactMatch){
			if(selectField.hasClass("selected")){
				selectField.removeClass("selected");
				dropdown.trigger("inputInvalid");
			}	
		}
	} else {	//Static drop-down
		$.each(suggestionContainer.children(),function(index,suggestion) {
			// The common behaviour is to show the currently chosen option as the selected one, which is implemented here
			if(selectField.text() == suggestion.innerHTML){
				highlightSuggestion.call(suggestion);
			}
		});
	}
	
	suggestionContainer.show("fast");
	
	
	// If there were no hits found
	if( suggestionContainer.children().length == 0 ){
		jQuery("<div/>", {
			"class": "suggestion no-found",
			text: noEntriesText
		}).appendTo(suggestionContainer);
	}
};

//Hide the current drop-down
var hideDropdown = function(e) {
	$(this).parents(".drop-down").children(".suggestion-container").hide();
}

// This is a function which works on a global scale and is not directly triggered by any event, to hide all dropdowns
function hideAllDropdowns(){
	$(".suggestion-container").hide();
}

//toggle dropdown visibility
var toggleDropDown = function(e) {
    console.log("toggling dropdown");
	var dropdown = $(this).parents(".drop-down");
	var selectField = dropdown.children(".select-field")
	var isDropdownVisible = dropdown.children(".suggestion-container").is(":visible");
	
	if(isDropdownVisible){
		hideDropdown.call(this);
	} else {
		showDropdown.call(this);
		//Also, focus text-field because it's nice to do
		selectField.focus();
	}
	
}

//Restores a field that needs to go back to its placeholder text (should not be called for inputs)
function restoreInputField(){
	$(this).text($(this).attr("placeholder"));
	//if($(this).hasClass("selected")){
	//	$(this).removeClass("selected");
	//	$(this).parent().trigger("inputInvalid");
	//}
}


//Show x-button, where context $(this) is the drop-down
function showXButton() {
    $(".drop-cancelbutton",$(this)).show();
}

//Hide x-button, where context $(this) is the drop-down
function hideXButton() {
    $(".drop-cancelbutton",$(this)).hide();
}

//This function sets the chosen-index attribute according to which suggestion was chosen
function setChosenIndexAndValue(event,chosenItem){
    $(this).attr("chosen-index",chosenItem.index());
    $(this).attr("chosen-item",chosenItem.attr("value")); //TODO: Verify if this works and maybe change name of function if it does
}
function unsetChosenIndexAndValue(e){
    $(this).removeAttr("chosen-index");
    $(this).removeAttr("chosen-item"); //TODO: Verify if this works and maybe change name of function if it does
}
function unsetChosenIndex(event){
    $(this).removeAttr("chosen-index");
    
}

//Sets the appropriate triggers for a suggestion, passed as $(this)
function setSuggestionTriggers(){
    $(this).on("mousedown",chooseSuggestion)
		.on("mouseenter",highlightSuggestion)
		.on("mouseleave", deHighlightSuggestion);
}

/** 
 * 
 * The document on ready is required when the script is included in the <head> in order to prevent
 * premature loading so that the divs are not initialized
 * 
 */
$(document).on("ready",function(e){
	
    //These triggers has to be set first, because otherwise the default option won't trigger them. What a mess this is :)
    $(".drop-down").on("inputValid",setChosenIndexAndValue);
    $(".drop-down").on("inputInvalid",unsetChosenIndexAndValue);
    
    //Special for the editable drop-downs: hide/show the cancel buttons
    $(".drop-down:has(input.select-field)").on("inputValid",showXButton);
    $(".drop-down:has(input.select-field)").on("inputInvalid",hideXButton);
    
	$.each($(".select-field",'.drop-down').not($('input')),function(index,inputField){
		restoreInputField.call($(this));
	});
	
	// If there hasn't been suggestion containers, buttons, select-fields or cancel-buttons added manually in the HTML, we add them now.
	addAccompaningElements();
	// We make sure that the free-text suggestions are alphabetically sorted
	$.each($(".drop-down:has(input.select-field)"),function(index,dropdown){
		sortSuggestionContainer.call($(dropdown).children(".suggestion-container"));
	});


	//When clicked outside a dropdown, hide it (de-select)
	$(document).click(function(event) { 
	    if(!$(event.target).closest(".drop-down").length) {
	    	hideAllDropdowns();
	    }
	});
	
	//Set appropriate triggers
	setSuggestionTriggers.call($(".suggestion"));
	
    $(".select-field").on("focus",showDropdown);
    
	$(".drop-down input").on("input propertychange",showDropdown)
		
		.on("keydown",handleKeyPress)
		.on("blur",hideDropdown);
	$(".drop-sidebutton").on("click",toggleDropDown);
	//$("div.select-field").on("click",toggleDropDown);          //Enables that click on the field itself shows drop down
    

    
    
});