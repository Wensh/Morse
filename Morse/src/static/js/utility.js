//This function is currently not used
$(".expandBtn").on("click", function(e) {
    e.preventDefault();
    var $this = $(this);
    var $collapse = $this.closest(".collapse-group").find(".collapse");
    $collapse.collapse("toggle");
});

//Helper-function, selects the next sibling in a circular manner (imported from stack overflow)
$.fn.loopNext = function(selector){
    var selector = selector || '';
    return this.next(selector).length ? this.next(selector) : this.siblings(selector).addBack(selector).first();
}

//Helper-function, selects the previous sibling in a circular manner (modified from stack overflow)
$.fn.loopPrev = function(selector){
    var selector = selector || '';
    return this.prev(selector).length ? this.prev(selector) : this.siblings(selector).addBack(selector).last();
}

//Utility-function for calculating text width
$.fn.textWidth = function(text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
    return $.fn.textWidth.fakeEl.width();
};

// Function for turning the font of an object into a string that can be read by the above function
function getFontInfo(){
	var fontInfo = $(this).css("font");
	
	if(fontInfo == ""){
		fontInfo = $(this).css("font-style") + " " + $(this).css("font-variant") + " " + $(this).css("font-weight") + " " + $(this).css("font-size") + "/"
			+ $(this).css("line-height") + " " + $(this).css("font-family");
	}
	return fontInfo;
}

(function($){
  $.event.special.destroyed = {
    remove: function(o) {
      if (o.handler) {
        o.handler()
      }
    }
  }
})(jQuery);


//Checks if dict1 is a subset of dict2
function isDictionarySubset(dict1,dict2){
    if(dict1.length==0)
    {
        return false;
    }
    result = true;
    $.each(dict1,function(key,value){
        if(!(key in dict2)){ 
            result = false;
            return;
        }
        if(dict2[key] != value){
            result = false;
            return;
        }
    });
    return result;
}

//Decodes get data into an associative array
function decodeGetData() {
    var getDataStrings = window.location.href.split("?")[1].split("&");            //This should be an array of strings on the form "a=b" 
	var getDataEntries = {}
    
    
    $.each(getDataStrings,function(index,stringEntry) {
        stringEntry = stringEntry.split("=");
        var identifier = stringEntry[0];
        var value = stringEntry[1];
        
        //Specially handle the values passed as an array
        if(identifier.match("[\[\]]$")){
            //Remove the brackets themselves
           identifier = identifier.slice(0,-2);
            
            //Create a new array for these if needed
            if(!(identifier in getDataEntries)){
                getDataEntries[identifier] = [];
            }
            
            getDataEntries[identifier].push(value);
           
        } else { //Else, input it as normal
            getDataEntries[identifier] = value;
        }
        
        
        
        
    });
    
    return getDataEntries;
}

/** Function count the occurrences of substring in a string; (from stack overflow)
 * @param {String} string   Required. The string;
 * @param {String} subString    Required. The string to search for;
 * @param {Boolean} allowOverlapping    Optional. Default: false;
 */
function occurrences(string, subString, allowOverlapping){

    string+=""; subString+="";
    if(subString.length<=0) return string.length+1;

    var n=0, pos=0;
    var step=(allowOverlapping)?(1):(subString.length);

    while(true){
        pos=string.indexOf(subString,pos);
        if(pos>=0){ n++; pos+=step; } else break;
    }
    return(n);
}

//Toggles content as defined in attribute "show"
function toggleContent(e){
    e.preventDefault();
    console.log("clicked");
    var content = $("#" + $(this).attr("show"));
    console.log(content);
    content.toggle();
    
    if(content.is(":hidden")){
        $(this).text($(this).attr("showText"));
    } else {
        $(this).text($(this).attr("hideText"));
    }
    
    
}



$(document).on("ready",function(e){
    
    $(".visible-on-hover").parent().on("mouseenter",function(e){ $(this).children(".visible-on-hover").show() } );
    $(".visible-on-hover").parent().on("mouseleave",function(e){ $(this).children(".visible-on-hover").hide() } );
    $(".show-hidden").on("click",toggleContent);
    
    //Hide everything initially
    $.each($(".show-hidden"),function(index,content){
        var showId = $(content).attr("show");
        $("#" + showId).hide();
        $(content).text($(content).attr("showText"));
    });
});