document.write(obj[0].name);document.write(obj[0].name);document.write(obj[0].name);document.write(obj[0].name);document.write(obj[0].name);document.write(obj[0].name);document.write(obj[0].name);/*
 * Put our stuff in a function to keep the global
 * namespace clean.
 * 
 * We add one identifier to whatever is passed to 
 * exports.
 */
(function(exports) {

    var ListModel = function() {
        this._tags = [];

        // Add a key/value pair or reject and return an error message
        this.addPair = function(key, value) {
            if (typeof key === 'undefined' || typeof value === 'undefined') {
                return "Input is undefined.";
            } else if (key.length >= value.length) {
                return "Length of key must be less than length of value.";
            } else {
                this._tags.push([key, value]);
                this.notify([key, value]);
                return null;             
            }
        }

        this.getPairs = function() {
            return this._tags;
        }

        this.deleteItem = function(idx) {
            this._tags.splice(idx, 1);
            this.notify();
        }
    }

    // Add observer functionality to ListModel objects
    _.assignIn(ListModel.prototype, {
        // Add an observer to the list
        addObserver: function(observer) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            this._observers.push(observer);
            observer(this, null);
        },

        // Notify all the observers on the list
        notify: function(args) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            _.forEach(this._observers, function(obs) {
                obs(this, args);
            });
        }
    });


    /*
     * A view of the list of pairs model.  
     * model:  the model we're observing
     * div:  the HTML div where the list goes
     */
    var ListView = function(model, div) {
        var that = this;
        this.updateView = function(obs, args) {
            var pairs = model.getPairs();

            // Display each pair
            var myDiv = $(div + " .list");
            myDiv.empty();
            _.forEach(pairs, function(pair, idx){
                // Get the template.  It isn't parsed, so can't be 
                // manipulated until after it's been added to the DOM.
                var t = $("template#list_item");
                // turn the html from the template into a DOM element
                var elem = $(t.html());

                elem.find(".key").html(pair[0]);
                elem.find(".value").html(pair[1]);
                elem.find(".btn").click(that.makeDeleteItemController(idx));
                myDiv.append(elem);
            });
            that.appendInputRow();
        };

        this.makeDeleteItemController = function(idx) {
            return function() {
                model.deleteItem(idx);
            }
        };

        // Append a blank input row to the div
        this.appendInputRow = function() {
            var template = $("template#list_input").html();
            $(div + " .list").append(template);
            var row = $(div).find(".input_row");
            row.find(".key").focus();

            // What to do when the add button is clicked.
            // That is, a controller.
            row.find("#addItemBtn").click(function() {
                console.log("click! in " + div);
                var key = row.find(".key").val();
                var value = row.find(".value").val();
                var err = model.addPair(key, value);
                if (err !== null) {
                    row.find(".error").html(err).show();

                } else {
                    row.find(".error").hide();
                }
                row.find(".key").focus();
            });
        };

        model.addObserver(this.updateView);
    }

    var SummaryView = function(model, div) {
        this.updateView = function(obs, args) {
            $(div + " span").html(model.getPairs().length);
        };

        model.addObserver(this.updateView);
    }

    var DebugView = function(model, div) {
        model.addObserver(function(obs, args) {
            console.log("DebugNotify: args=" + args + "; list=" + model.getPairs());
        });
    }

    exports.doit = function() {
        var model1 = new ListModel();
        var inputView = new ListView(model1, "div#lv1");
        var summaryView = new SummaryView(model1, "div#sv1");
        var debugView = new DebugView(model1, null);

        var model2 = new ListModel();
        var inputView = new ListView(model2, "div#lv2");
        var summaryView = new SummaryView(model2, "div#sv2");
        var debugView = new DebugView(model2, null);

    }

})(window);
// JavaScript Document