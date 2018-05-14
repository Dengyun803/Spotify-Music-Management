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
	
	function isInArray(value, array) {
		return array.indexOf(value) > -1;
	}
	/*
	 * Get the playlists of the logged-in user.
	 */
	function getPlaylists(callback) {
		console.log('getPlaylists');
		var url = 'https://api.spotify.com/v1/me/playlists';
		$.ajax(url, {
			dataType: 'json',
			headers: {
				'Authorization': 'Bearer ' + g_access_token
			},
			success: function(r) {
				console.log('got playlist response', r);
				callback(r.items);
			},
			error: function(r) {
				callback(null);
			}
		});
	} 

	
	/*
	 * Redirect to Spotify to login.  Spotify will show a login page, if
	 * the user hasn't already authorized this app (identified by client_id).
	 * 
	 */
	var doLogin = function(callback) {
		var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
			'&response_type=token' +
			'&scope=playlist-read-private' +
			'&redirect_uri=' + encodeURIComponent(redirect_uri);

		console.log("doLogin url = " + url);
		window.location = url;
	};

	/*
	 * What to do once the user is logged in.
	 */
	
	function Model() {
        this.playlists = [];
		this.songlists = [];
		this.taglists = [];
        this.observers = [];
    }

    Model.prototype.getPlaylists = function() { 
        var that = this;

        // Get the list of playlists from spotify
        getPlaylists(function(playlists){

            // Got the playlists.  Now get the tracks for each one.  Need
            // to go back to the spotify server, so these will return in 
            // the future.  Put those futures into a list for later processing.
            var futures = _.map(playlists, function(playlist){
                return $.ajax(playlist.tracks.href, {
                    dataType: 'json',
                    headers: {
                        'Authorization': 'Bearer ' + g_access_token
                    }
                });
            });

            // When all of the futures are finished, execute an anonymous
            // function to print them all out (for debugging) and, more 
            // importantly, put them into a data structure suitable for the 
            // model.
            $.when.apply($,futures).done(function(){
                // arguments is available in every function and represents the 
                // array of arguments passed to the function.  $.when passes
                // the results of each future, in the same order as supplied to
                // $.when.
                var data = arguments;
                // debugging    
                _.forEach(data, function(pl, idx) {
                    console.log(playlists[idx].name);
					$('#playlists').append('<li>' + playlists[idx].name + '</li>');
                    _.forEach(pl[0].items, function(t){
                        console.log("  " + t.track.name);
						that.songlists.push(t.track.name);
                    });
					
                });

                var myData = _.map(data, function(pl, idx) {
                    return {
                        name: playlists[idx].name,
                        tracks: _.map(pl[0].items, function(t) {
                            return t.track.name;
                        })
                    };
                });
                
                that.playlists = myData;
                that.notifyObservers();
            }); 
        });
    };

	Model.prototype.getTaglists = function(){
		 var that = this;
		 $.get('http://localhost:3000/Tags', function(data, status){
			 var i = 0;
			 _.forEach(data, function(){
				 that.taglists.push(data[i].name);
				 $('#tags').append('<li>' + data[i].name + '</li>');
				 $('#tagboxs').append('<input type="checkBox" class="tagforassign" name="' + data[i].name + '">' + data[i].name + '<br />');
				 i++;
		     });
		 });
		 that.notifyObservers();
			 
	 };
	
	Model.prototype.getSonglists = function() {
		var that = this;
		$.get('http://localhost:3000/Songs', function(data, status){
			var localSonglist = [];
			var j=0;
			_.forEach(data, function(){
				localSonglist.push(data[j].name);
				j++;
			});
			console.log(localSonglist);
			console.log(that.songlists);
			for (var i=0; i<that.songlists.length; i++){
				
				if (!isInArray(that.songlists[i], localSonglist)){
					var t = JSON.stringify([]);
					var postbox = {"name" : that.songlists[i], "tags" : t, "rating" : 0 };
					$.post("http://localhost:3000/Songs", postbox, null);
				}
			}
			for (var l=0; l<localSonglist.length; l++){
				if (!isInArray(localSonglist[l], that.songlists)){
					console.log(localSonglist[l] + " is not in cloud song list");
					data.forEach(function(elements){
					if (elements.name === localSonglist[l]) {
						console.log("the id of " + localSonglist[l] +" is " + elements.id);
						$.ajax({
							url: "http://localhost:3000/Songs/" + elements.id,
					 		type: 'DELETE',
							success: function(result) {
							 // Do something with the result
								console.log("deleted "+ localSonglist[l]);
							}	
					 	});
					}
				});
				}
			}	
			
		});
	};
	
	Model.prototype.addTag = function(tagName){
		var that = this;
		if (typeof tagName === 'undefined') {
            return "Input is undefined.";
		} else if (isInArray(tagName, that.taglists)){
			return "This tag is already existed.";
		} else {
			that.taglists.push(tagName);
			var postbox = {"name" : tagName, "content" : [] };
			$.post("http://localhost:3000/Tags", postbox, null);
            that.notifyObservers();
            return null; 
		}
	};
	
	Model.prototype.deleteTag = function(tagName){
		var that = this;
		if (typeof tagName === 'undefined') {
            return "Input is undefined.";
		} else if (!isInArray(tagName, that.taglists)){
			return "This tag does not exist.";
		} else {
			that.taglists.pop(tagName);
			$.get('http://localhost:3000/Tags', function(data, status){
			 var i = 0;
			 _.forEach(data, function(){
				 that.taglists.push(data[i].name);
				 $('#tags').append('<li>' + data[i].name + '</li>');
				 var id = data[i].id;
				 console.log(id);
				 if (data[i].name === tagName) {
					 $.ajax({
						url: "http://localhost:3000/Tags/" + id,
					 	type: 'DELETE',
						success: function(result) {
							 // Do something with the result
							console.log('delete successful');
						}	
					 });
					 
				 }
				 i++;
		     });
		 });
		/*	$.ajax({
				url: "http://localhost:3000/Songs",
				type: 'GET',
				success: function(data){
					data.forEach(function(element)){
						element.tags
					}
				}
			});*/
            that.notifyObservers();
            return null; 
		}
	};
	
	_.assignIn(Model.prototype, {
        // Add an observer to the list
        addObserver: function(observer) {
            if (_.isUndefined(this.observers)) {
                this.observers = [];
            }
            this.observers.push(observer);
            observer(this, null);
        },

        // Notify all the observers on the list
        notifyObservers: function(args) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            _.forEach(this._observers, function(obs) {
                obs(this, args);
            });
        }
    });

	Model.prototype.getTags = function(){
		var that = this;
		return that.taglists;
	};
		
	
	
 	var model = new Model();
	
    function loggedIn() {
        $('#login').hide();
		$('#assignboard').hide();
        $('#loggedin').show();

        model.getPlaylists();
		model.getTaglists();
		
		
    }
//	var inputView = new ListView(model, "div#lv1");
	/*
	 * Export startApp to the window so it can be called from the HTML's
	 * onLoad event.
	 */
	exports.startApp = function() {
		console.log('start app.');

		console.log('location = ' + location);

		// Parse the URL to get access token, if there is one.
		var hash = location.hash.replace(/#/g, '');
		var all = hash.split('&');
		var args = {};
		all.forEach(function(keyvalue) {
			var idx = keyvalue.indexOf('=');
			var key = keyvalue.substring(0, idx);
			var val = keyvalue.substring(idx + 1);
			args[key] = val;
		});
		console.log('args', args);

		if (typeof(args['access_token']) == 'undefined') {
			$('#start').click(function() {
				doLogin(function() {});
			});
			$('#login').show();
			$('#assignboard').hide();
			$('#loggedin').hide();
		} else {
			g_access_token = args['access_token'];
			loggedIn();
			$('#logout').click(function() {
				var url = 'https://www.spotify.com/us/logout/';
				console.log("doLogout url = " + url);
				window.location = url;
				window.location = redirect_uri;
			});
			$('#search').click(function() {
				var url = 'http://localhost:3000/search.html';
				window.location = url;
			});
			$('#assign').click(function() {
				$('#login').hide();
				$('#assignboard').show();
				$('#loggedin').hide();
			});
			$('#addTag').click(function() {
				var err = model.addTag($('#inputbox').val());
				if ( err === null ) {
					$('.error').hide();
					location.reload();
				} else {
					$('.error').show();
					$('.error').empty();
					$('.error').append('<p>' + err + '</p>');
				}
				
			});
			$('#deleteTag').click(function() {
				var err = model.deleteTag($('#inputbox').val());
				if ( err === null ) {
					$('.error').hide();
					location.reload();
				} else {
					$('.error').show();
					$('.error').empty();
					$('.error').append('<p>' + err + '</p>');
				}
			});
			$('#synchronize').click(function(){
				model.getSonglists();
			});
			$('#backtoindex').click(function(){
				$('#login').hide();
				$('#assignboard').hide();
				$('#loggedin').show();
			});
			$('#confirm').click(function(){
				var selectsong = $('#inputbox2').val();
				if (!isInArray(selectsong, model.songlists)) {
					alert(selectsong + " is not in your playlist!");
				} else {
					var checkedValue = [];
					var rate = 0;
					var deleteId = 0;
					console.log($('input[name="assign rating"]:checked').val());
					$('.tagforassign:checked').each(function(){
						checkedValue.push($(this)["0"].name);
					});
					rate = $('input[name="assign rating"]:checked').val();
					$.ajax({
						url: "http://localhost:3000/Songs",
						type: 'GET',
						success: function(data){
							data.forEach(function(element){
								if (element.name === selectsong) {
									console.log(element.id);
									deleteId = element.id;
									if (typeof(rate) === 'undefined') {
										rate = element.rating;
									}
									if (checkedValue === []) {
										checkedValue = [" "];
									}
									console.log(deleteId);
									if (deleteId !== 0){
										$.ajax({
											url: "http://localhost:3000/Songs/" + deleteId,
											type: 'DELETE',
											success: function(result) {
											// Do something with the result
											console.log("deleted "+ selectsong);
											}	
										});
									}
									var tagspag = JSON.stringify(checkedValue);
									
									$.post("http://localhost:3000/Songs", {"name": selectsong, "tags": tagspag, 
										"rating" : rate}, null, "json");
								}
							});
						}
					});
					alert("assign success!");
				}
				
			});
		}
	};
	
})(window);
