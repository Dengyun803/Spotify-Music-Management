/*
 *  Starter code for University of Waterloo CS349 Fall 2016.
 *  
 *  bwbecker 20161113
 *  
 *  Some code adapted from https://github.com/possan/playlistcreator-example
 */
"use strict";

// An anonymous function that is executed passing "window" to the
// parameter "exports".  That is, it exports startApp to the window
// environment.
(function(exports) {
	var client_id = '321abc7c924447799d7fc5a7f197f835';		// Fill in with your value from Spotify
	var redirect_uri = 'http://localhost:3000/index.html';
	var g_access_token = '';
	var boardkind = 'searchboard';
	var taglists = [];
	function isInArray(value, array) {
		return array.indexOf(value) > -1;
	}
	function toArray(string){
		var arr = [];
		var s = "";
		for (var i=0; i<string.length; i++){
			if (string[i] === '[') {
				
			} else if (string[i]==='\"') {
				
			} else if (string[i]===',' || string[i] === ']') {
				if (s!=="") {
					arr.push(s);
				}
			} else {
				s = s+string[i];
			}
		}
		return arr;
	}
	function getTags(){
		$.get('http://localhost:3000/Tags', function(data, status){
			 var i = 0;
			 _.forEach(data, function(){
				 taglists.push(data[i].name);
				 $('#tags').append('<input type="checkBox" class="tagforsearch" name="' + data[i].name + '">' + data[i].name + '<br />');
				 i++;
		     });
		 });
	}

	function showBoard(){
		switch (boardkind)
			{
				case 'searchboard':
					$('#resultboard').hide();
					$('#searchboard').show();
					$('#songboard').hide();
					break;
				case 'resultboard':
					$('#resultboard').show();
					$('#searchboard').hide();
					$('#songboard').hide();
					break;
				case 'songboard':
					$('#resultboard').hide();
					$('#searchboard').hide();
					$('#songboard').show();
					break;
				default:
					break;
			}
	}
	
	exports.startApp = function() {
		getTags();
		showBoard();
		$('.backbtn').click(function() {
			if (boardkind === 'resultboard') {
				boardkind = 'searchboard';
			} else {
				boardkind = 'resultboard';
			}
			showBoard();
			
		});
		
		$('#back').click(function() {
			
			window.history.back();
		});
		
		
		$('#search').click(function() {
			boardkind = 'resultboard';
			var result_list = [];
			var search_kind = $('input[name="search tag"]:checked').val();
			console.log(search_kind);
			var min_rating = $('input[name="search rating"]:checked').val();
			console.log(min_rating);
			var search_tags = [];
			$('.tagforsearch:checked').each(function(){
				
				search_tags.push($(this)["0"].name);
				
			});
			console.log(search_tags);
			$.ajax({
				url : "http://localhost:3000/Songs",
				type: 'GET',
				success: function(data){
					data.forEach(function(element){
						var s = toArray(element.tags);
						console.log(s.length);
						if (search_kind === 'any'){
							
							for (var i=0; i<s.length; i++) {
								if (isInArray(s[i], search_tags) && element.rating >= min_rating) {
									result_list.push(element.name);
									console.log('pushed');
									break;
								}
							}
						} else {
							var satisfy = 1;
							for (var j=0; j<search_tags; j++){
								if (!isInArray(search_tags[j], s) || element.rating < min_rating){
									satisfy = 0;
								}
							}
							if (satisfy === 1) {
								result_list.push(element.name);
							}
						}
					});
					result_list.forEach(function(element){
						$('#songlist').append('<li>' + element + '</li>');
					});
					showBoard();	
				}
			});
			
		});
		
		$('#songs').click(function() {
			boardkind = 'songboard';
			showBoard();
		});
	};

})(window);
