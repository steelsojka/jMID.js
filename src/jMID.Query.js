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
    var temp = this.slice(0);
    var what, a = arguments, L = a.length, ax;
    while (L && temp.length) {
      what = a[--L];
      while ((ax = temp.indexOf(what)) !== -1) {
        temp.splice(ax, 1);
      }
    }
    return temp;
  };

  var _search = function(query) {
    var queries = _parseQuery(query);
    var tracks = [];
    

    for (var y = 0, _len3 = this._results.tracks.length; y < _len3; y++) {
     var track = this._results.tracks[y];
     tracks.push(new jMID.Track());
     
      for (var z = 0, _len4 = track.getEvents().length; z < _len4; z++) {
        var event = track.getEvents(z);
        var isValid = false;
        
        for (var i = 0, _len = queries.length; i < _len; i++) {
          var conditions = queries[i];

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
            tracks[y].pushEvent(event);
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
    this._file = decodedMidi;
  };

  jMIDQueryResult.prototype = {
    filter : function(query) {
      var results = _search.call(this, query);
      return new jMIDQueryResult(this._file, results);
    },
    not : function(query) {
      var results = query ? _search.call(this, query) : this._results;
      var newResults = [];

      for (var i = 0, _len = results.tracks.length; i < _len; i++) {
        var track = results.tracks[i];
        var newTrack = new jMID.Track(track.cloneEvents());
        newTrack.removeEvents.apply(newTrack, this._results.tracks[i].getEvents());
        newResults.push(newTrack);
      }

      return new jMIDQueryResult(this._file, {tracks : newResults});
    },
    apply : function() {
      for (var i = 0, _len = this._results.tracks.length; i < _len; i++) {
        var track = this._results.tracks[i];
        this._file.tracks[i] = new jMID.Track(track.cloneEvents());
      }

      return new jMIDQueryResult(this._file);
    }
  };

  jMID.Query = function(midiFile) {
    if (!midiFile) {
      throw new Error("jMID.File is needed for querying");
      return;
    }

    return new jMIDQueryResult(midiFile);
  };

  return jMID;

}(jMID || {}));