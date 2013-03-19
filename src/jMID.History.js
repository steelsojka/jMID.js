var jMID = (function(jMID) {
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
    var track, event;
    for (var i = 0, _len = file.tracks.length; i < _len; i++) {
      track = file.tracks[i];
      for (var x = 0, _len2 = track.events.length; x < _len2; x++) {
        event = track.events[x];
        iterator.call(this, event);
      }
    }
  };

  var _stamp = function() {
    _forEachEvent.call(this, this.file, function(event) {
      event.__id = ++_id;
    });
  };

  var _compare = function(state1, state2) {
    var event, oldEvent, results = [], hasChanged;

    for (var i = 0, _len = state2.data.length; i < _len; i++) {
      hasChanged = false;
      event = state2.data[i];
      for (var x = 0, _len = state1.data.length; x < _len; x++) {
        oldEvent = state1.data[x];
        if (oldEvent.__id !== event.__id) continue;
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
    }
    return results;
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
      this.states.push(new State(differences));
    }
  };

  jMID.History.register = function(file) {
    file._history = new jMID.History(file);
  };

  return jMID;

}(jMID || {}));