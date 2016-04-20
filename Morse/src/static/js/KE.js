   
    /*
	// ############
	//   Buttons - Event handlers
	// ############
	*/
$(document).on("ready",function(e){
    
    
    $("#generate-recommendation").on("click",function(e){
    	var setting = $("#setting-selection").text();
    	query(setting);
    	//getMaxGenre();
    	//getFavCast();
	});
});
	
//Toggles content as defined in attribute "show"
function toggleContent(e){
    e.preventDefault();
    var content = $("#" + $(this).attr("show"));
    console.log(content);
    content.toggle();
    
    if(content.is(":hidden")){
        $(this).text($(this).attr("showText"));
    } else {
        $(this).text($(this).attr("hideText"));
    }
}

function demo(string){
    console.log("This is the string:" + string);
}

function query(setting){	
	//Family = 15, Comedy = 71, Horror = 6, Science fiction = 99, Romance film = 27, Romance = 95, Romantic comedy = 96, 
	//Romantic drama = 97, Action = 47, Action-adventure = 48, Animation = 38, CGI = 39, Children's = 37
	var allGenres = ["78","40","90","91"];
	//Family, Comedy, Science fiction, Horror, Action, Action-adventure
	var nonRomanticGenres = ["21", "87", "3","78","40","90","91","99"];
	//Romance film, Romance, Romantic comedy, Romantic drama
	var nonFamilyGenres = ["78","40","18","6","104","90","91"];
	//Family, Comedy, Science fiction, Children's, Animation, CGI
    /**
            FILTER (?object = <http://data.linkedmdb.org/film_genre/15>) 
      FILTER (?object = <http://data.linkedmdb.org/film_genre/71>) 
      FILTER (?object = <http://data.linkedmdb.org/film_genre/99>) 
      FILTER (?object = <http://data.linkedmdb.org/film_genre/6>) 
      FILTER (?object = <http://data.linkedmdb.org/film_genre/47>) 
      FILTER (?object = <http://data.linkedmdb.org/film_genre/48>)**/
    var genreSelection = allGenres;
    
	if (setting == 'Date') {
					genreSelection = nonRomanticGenres;
				}
				else if (setting == 'Family') {
					genreSelection = nonFamilyGenres;
				}
    var randomNumber = Math.floor(Math.random()*50);
	/*var query = 'SELECT ?movies WHERE {?movies <http://data.linkedmdb.org/movie/genre> <http://data.linkedmdb.org/film_genre/'+genre+'>.\
	?movies <http://purl.org/dc/terms/title> ?titles. \
		?movies <http://purl.org/dc/terms/date> ?date;\
		FILTER (?date > "2000")\
        }\
	OFFSET '+randomNumber+'\
	LIMIT 20';
	*/
    var genreFilterExpression = '';
    $.each(genreSelection,function(index,genreIndex){
       genreFilterExpression +=  ' FILTER (?object != <http://data.linkedmdb.org/film_genre/' + genreIndex + '>)'
    });
    
    var objectRelations = [["<http://data.linkedmdb.org/movie/genre>","film_genre"],["<http://data.linkedmdb.org/movie/actor>","actor"],
                           ["<http://data.linkedmdb.org/movie/director>", "director"], ["<http://data.linkedmdb.org/movie/producer>","producer"]];
    
    var preferences = {};
    
    var successfulQueries = 0;
                           
    var endpoint = 'http://localhost:8080/openrdf-sesame/repositories/morse';
	var format = 'json';
                           
    $.each(objectRelations,function(index,relationInfo){
        var filterExpression = '';
        var relation = relationInfo[0];
        var relationName = relationInfo[1];
        
        if(relationName == "film_genre"){
            filterExpression = genreFilterExpression;
        }
        var query = 'SELECT  ?object (SUM (?rating) AS ?totalRating)\
            WHERE {?movies <http://data.morse.org/userid/wzg600/rating> ?rating.\
            ?movies ' + relation + ' ?object.' + filterExpression
             + ' ?movies <http://purl.org/dc/terms/date> ?date;\
            FILTER (?date > "2000")} GROUP BY ?object\
            ORDER BY DESC(?totalRating)\
            LIMIT 1';
        console.log(query);
        $.get('/sparql',data={'endpoint': endpoint, 'query': query, 'format': format}, function(json){		
            console.log(json);	
            var topObject = json.results.bindings[0].object.value;
            console.log(topObject);
            successfulQueries += 1;
            preferences[index] = [relationInfo[0],"<" + topObject + ">"]
            
            if(Object.keys(preferences).length == Object.keys(objectRelations).length){ //If all queries finished
                exctractTopResultsFromData(preferences,genreSelection,0);
            }
        });
      });
}

function exctractTopResultsFromData(preferences,excludedGenres,noTries){
    var endpoint = 'http://localhost:8080/openrdf-sesame/repositories/morse';
	var format = 'json';
    
    var whereClause = 'WHERE {';
    
    var needNewMovie = false;
    var hasFoundMovie = false;
        
    var genreFilterExpression = '';
    
    $.each(excludedGenres,function(index,genreIndex){
        
       genreFilterExpression +=  'FILTER NOT EXISTS{?movie <http://data.linkedmdb.org/movie/genre> <http://data.linkedmdb.org/film_genre/' + genreIndex + '>.} ';
    });
    
    genreFilterExpression += "";
    var noRelations = 0;
    $.each(preferences,function(index,relationInfo){
        noRelations += 1;
        
        if(noRelations <= Object.keys(preferences).length - noTries) { //Loosen the criteria as we go along
            whereClause +=  "?movie " + relationInfo[0] + " " + relationInfo[1] + ". ";
        }
    });
    
    whereClause += " ?movie rdfs:label ?movieName. " +  genreFilterExpression + "FILTER NOT EXISTS{?movie <http://data.morse.org/userid/wzg600/rating> ?any} }";

    var query = 'SELECT  ?movie ?movieName ' + whereClause + "";
    console.log(query);


    $.get('/sparql',data={'endpoint': endpoint, 'query': query, 'format': format}, function(json){
        needNewMovie = true;
        console.log(json);

        if(!$.isEmptyObject(json.results.bindings)){
            var randomEntryIndex = Math.floor(Math.random()*json.results.bindings.length);
            var movieName = json.results.bindings[randomEntryIndex].movieName.value;
            var movie = json.results.bindings[randomEntryIndex].movie.value;
            console.log(movieName);
            console.log(movie);
            getImdbLink(movie);
        } else{
            console.log("nothing found");
            exctractTopResultsFromData(preferences,excludedGenres,noTries+1);
        }
    });
}

function getName(lmdbLink){	
	var query = 'SELECT ?titles WHERE {<'+lmdbLink+'> <http://purl.org/dc/terms/title> ?titles}';
	var endpoint = 'http://localhost:8080/openrdf-sesame/repositories/morse';
	var format = 'JSON';

	$.get('/sparql',data={'endpoint': endpoint, 'query': query, 'format': format}, function(json){		
	console.log(json);	
	var movieTitle = json.results.bindings[0].titles.value;
	$('#movie-name').html(movieTitle)
	});
}

function getImdbLink(lmdbLink){
	var query = 'SELECT ?imdb_title WHERE {<'+lmdbLink+'> <http://xmlns.com/foaf/0.1/page> ?imdb_title;}';
	var endpoint = 'http://localhost:8080/openrdf-sesame/repositories/morse';
	var format = 'json';
    
    console.log(query);
	$.get('/sparql',data={'endpoint': endpoint, 'query': query, 'format': format}, function(json){		
		console.log(json);	
        $("#movie-poster").empty();
        if(Object.keys(json.results.bindings).length > 1){
            var str = json.results.bindings[1].imdb_title.value;
            var separator = 'http://www.imdb.com/title/';
            var imdbLink = str.split(separator).pop();
            var omdbPoster = 'http://img.omdbapi.com/?i=' + imdbLink + '&h=500&apikey=ffabf1bb'
            var posterItem = jQuery("<img/>", {
               "src" : omdbPoster  
            }).appendTo($("#movie-poster"));
        }
        $(".movie-info-container").show();
        getName(lmdbLink);
	});
}

function rate(lmdbLink, integer){ 
    var query = 'INSERT DATA {'+lmdbLink+' <http://data.morse.org/userid/wzg600/rating> "'+integer+'"^^xsd:integer.}';
    var endpoint = 'http://localhost:8080/openrdf-sesame/repositories/morse/statements';
    var format = 'JSON';
    console.log(query);
    $.get('/sparql',data={'endpoint': endpoint, 'query': query, 'format': format}, function(json){      
    });
}
