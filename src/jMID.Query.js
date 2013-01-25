var jMID = (function(jMID) {

  var _parseQuery = function(query) {
    var _queries = query.split(",").map(function(a) { return a.trim(); });
    var conditions = [];

    for (var i = 0, _len = _queries.length; i < _len; i++) {
      conditions.push(_queries[i].split(" "));
    };

    return conditions;
  };

  var _getOperator = function(string) {
    var operators = [":", ">", ">=", "<", "<="];
    for (var i = operators.length - 1; i >= 0; i--) {
      if (string.search(operators[i]) !== -1) {
        return operators[i];
      }
    };
  };

  var _remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
      }
    }
    return this;
  };

  var _search = function(query) {
    var queries = _parseQuery(query);
    var tracks = [];
    
    for (var i = 0, _len = queries.length; i < _len; i++) {
      var conditions = queries[i];

      for (var y = 0, _len3 = this._results.tracks.length; y < _len3; y++) {
       var track = this._results.tracks[y];
       tracks.push(new Array());
       
        for (var z = 0, _len4 = track.length; z < _len4; z++) {
          var event = track[z];
          var isValid = false;
     
          for (var x = 0, _len2 = conditions.length; x < _len2; x++) {
            var operator = _getOperator(conditions[x]);
            var condition = conditions[x].split(operator);
            var key = condition[0];
            var value = condition[1];

            switch(operator) {
              case ":" : isValid = event[key] == value; break;
              case ">" : isValid = event[key] > value; break;
              case ">=": isValid = event[key] >= value; break;
              case "<" : isValid = event[key] < value; break;
              case "<=": isValid = event[key] <= value; break;
            }

            if (!isValid) break;;
          }
          if (isValid) {
            tracks[y].push(event);
          }
        }
      }
    }

    return {
      tracks : tracks
    };
  };

  var jMIDQueryResult = function(decodedMidi, results) {

    this._results = results ? results : {tracks : decodedMidi.tracks.slice(0)};
    this._decoder = decodedMidi;
  };

  jMIDQueryResult.prototype = {
    filter : function(query) {
      var results = _search.call(this, query);
      return new jMIDQueryResult(this._decoder, results);
    },
    remove : function(query) {
      var results = query ? _search.call(this, query) : this._results;

      for (var i = 0, _len = results.tracks.length; i < _len; i++) {
        var track = results.tracks[i];
        _remove.apply(this._decoder.tracks[i], track);
      }

      return new jMIDQueryResult(this._decoder);
    }
  };

  jMID.Query = function(decodedMidi) {
    if (!decodedMidi) {
      throw new Error("Midi is needed for querying");
      return;
    }

    return new jMIDQueryResult(decodedMidi);
  };

  return jMID;

}(jMID || {}));