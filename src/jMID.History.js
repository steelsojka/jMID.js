var jMID = (function(jMID) {
  var filter;
  if (!Array.prototype.filter) {
    filter = function(fun /*, thisp */) {
      "use strict";
   
      if (this == null)
        throw new TypeError();
   
      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun != "function")
        throw new TypeError();
   
      var res = [];
      var thisp = arguments[1];
      for (var i = 0; i < len; i++)
      {
        if (i in t)
        {
          var val = t[i]; // in case fun mutates this
          if (fun.call(thisp, val, i, t))
            res.push(val);
        }
      }
   
      return res;
    };
  } else {
    filter = Array.prototype.filter;
  }

  var _id = 0;

  var _parseEvent = function(event) {
    var obj = {};
    for (var key in event) {
      if (event.hasOwnProperty(key)) {
        obj[key] = event[key];
      }
    }
    return obj;
  };

  var _forEachEvent = function(file, iterator) {
    var track, event, _return;
    for (var i = 0, _len = file.tracks.length; i < _len; i++) {
      track = file.tracks[i];
      for (var x = 0, _len2 = track.events.length; x < _len2; x++) {
        event = track.events[x];
        _return = iterator.call(this, event);
        if (_return) break;
      }
      if (_return) break;
    }
  };

  var _stamp = function() {
    _forEachEvent.call(this, this.file, function(event) {
      event.__id = ++_id;
    });
  };

  var _compare = function(state1, state2) {
    var event, oldEvent, results = [], hasChanged, exists;

    for (var i = 0, _len = state2.data.length; i < _len; i++) {
      hasChanged = false;
      exists = false;
      event = state2.data[i];
      for (var x = 0, _len2 = state1.data.length; x < _len2; x++) {
        oldEvent = state1.data[x];
        if (oldEvent.__id !== event.__id) continue;
        exists = true;
        for (var key in event) {
          if (event.hasOwnProperty(key)) {
            if (event[key] !== oldEvent[key]) {
              results.push(event);
              hasChanged = true;
              break;
            }
          }
        }
        if (hasChanged) break;
      }
      if (!exists) {
        results.push(event);
      }
    }
    return results;
  };

  _applyState = function(index) {
    var event, res, state, eventFound;
    var changed = this.state;
    var ids = changed.data.map(function(a) { return a.__id; });
    var tracks = this.file.tracks.map(function(a) { return a.events; });
    var events = [].concat.apply([], tracks);
    events = filter.call(events, function(a) {
      return ids.indexOf(a.__id) !== -1;
    });

    for (var i = events.length - 1; i >= 0; i--) {
      var e = events[i];
      for (var x = this.states.length - 1; x >= 0; x--) {
        var stateData = this.states[x].data;
        var stateEvent = stateData.filter(function(a) { return a.__id === e.__id});
        if (stateEvent.length > 0) {
          eventFound = true;
          for (var prop in stateEvent[0]) {
            if (stateEvent[0].hasOwnProperty(prop)) {
              e[prop] = stateEvent[0][prop];
            }
          }
          break;
        } 
      }
    };

    // for (var x = changed.data.length - 1; x >= 0; x--) {
    //   event = changed[x];
    //   for (var i = this.states.length - 2; i >= 0; i--) {
    //     state = this.states[i];
    //     res = state.filter(function(a) { return a.__id === event.__id; });
    //     if (res.length !== 0) break;
    //   };

    // };

    // var event;
    // var totals = 0;
    // var state = this.states[index];
    // _forEachEvent(this.file, function(e) {
    //   for (var i = 0, _len = state.data.length; i < _len; i++) {
    //     event = state.data[i];
    //     if (event.__id === e.__id) {
    //       for (var prop in e) {
    //         if (e.hasOwnProperty(prop)) {
    //           e[prop] = event[prop];
    //         }
    //       }
    //       totals++;
    //     }
    //   }
    //   if (totals === state.data.length) {
    //     return true;
    //   }
    // });
  };

  var State = function(data) {
    this.data = data || [];
  };

  State.prototype = {
    push : function(event) {
      this.data.push(_parseEvent(event));
    }
  };

  jMID.History = function(file) {
    this.file = file;
    this.states = [];
    this.index = 0;
    _stamp.call(this);
    this.state = this.getState();
  };

  jMID.History.prototype = {
    getState : function() {
      var state = new State();
      _forEachEvent.call(this, this.file, function(event) {
        state.push(event);
      });
      return state;
    },
    saveState : function() {
      var differences = _compare(this.state, this.getState());
      this.states.push(this.state);
      this.index = this.states.length - 1;
      this.state = new State(differences);
    },
    undo : function() {
      _applyState.call(this, this.index - 1);
      this.index--;
      this.state = this.states[this.index];
      this.file.trigger("undo");
    },
    redo : function() {
      _applyState.call(this, this.index + 1);
      this.index++;
      this.state = this.states[this.index];
      this.file.trigger("redo");
    }
  };

  jMID.History.register = function(file) {
    file.history = new jMID.History(file);
  };

  var insertFn = jMID.Track.prototype.insertEventAtTime;

  jMID.Track.prototype.insertEventAtTime = function(event) {
    event.__id = ++_id;
    insertFn.call(this, event);
  }; 

  return jMID;

}(jMID || {}));