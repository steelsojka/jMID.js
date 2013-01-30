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
      var resultsToRemove = _search.call(this, query);
      var results = this._results;
      var newResults = [];

      for (var i = 0, _len = results.tracks.length; i < _len; i++) {
        var track = results.tracks[i];
        var newTrack = new jMID.Track(track.cloneEvents());
        newTrack.removeEvents.apply(newTrack, resultsToRemove.tracks[i].getEvents());
        newResults.push(newTrack);
      }

      return new jMIDQueryResult(this._file, {tracks : newResults});
    },
    toArray: function() {
      var events = [];

      for (var i = 0, _len = this._results.tracks.length; i < _len; i++) {
        var list = this._results.tracks[i];
        events = events.concat(list.events);
      }

      return events;
    },
    increment : function(prop, amount) {
      jMID.Util.forAllEvents(this._results.tracks, function(e) {
        if (prop in e) {
          e[prop] += amount;
        }
      });

      return this;
    },
    set : function(prop, value) {
      jMID.Util.forAllEvents(this._results.tracks, function(e) {
        if (prop in e) {
          e[prop] = value;
        }
      });

      return this;
    },
    get : function(track, index) {
      return this._results.tracks[track].events[index];
    },
    eq : function(track, index) {
      return new jMIDQueryResult(this._file, {tracks : [new jMID.Track([this.get.apply(this, arguments)])]});
    },
    encodeEvents : function(toBytes) {
      var tracks = [];

      jMID.Util.forAllEvents(this._results.tracks, function(e, i, track) {
        if (!tracks[track]) tracks[track] = [];
        tracks[track].push(!toBytes ? jMID.Util.bytesToString(e.encode()) : e.encode());
      });

      return tracks;
    },
    encodeTracks : function(toBytes) {
      var tracks = [];

      jMID.Util.forEachTrack(this._results.tracks, function(e, i) {
        if (!tracks[i]) tracks[i] = [];
        tracks[i].push(!toBytes ? e.encode() : jMID.Util.stringToBytes(e.encode()));
      });

      return tracks;
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
    if (!midiFile && !midiFile instanceof jMID.File) {
      throw new Error("jMID.File is needed for querying");
      return;
    }

    return new jMIDQueryResult(midiFile);
  };

  return jMID;

}(jMID || {}));