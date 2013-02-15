var jMID = (function(jMID) {
  var _i = 0;

  var _remove = function(string) {
    var what, a = Array.prototype.slice.call(arguments, 1), L = a.length, ax;
    while (L && this[string].length) {
      what = a[--L];
      while ((ax = this[string].indexOf(what)) !== -1) {
        this[string].splice(ax, 1);
      }
    }
    return this;
  };

  jMID.Track = function(options) {
    this.events = [];
    this.notes = [];
    this.timing = {
      MicroSPB : 500000,
      MSPQN : 500,
      MSPT : 500 / 960
    };

    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }

    this.processNotes();
  };

  jMID.Track.prototype = {
    pushEvent : function(event) {
      this.events.push(event);
      return this;
    },
    pushNote : function(note) {
      this.notes.push(note);
      return this;
    },
    getEvents : function(index) {
      if (typeof index !== "undefined") {
        if (index >= 0 && index < this.events.length) {
          return this.events[index];
        } else {
          return null;
        }
      } else {
        return this.events;
      }
    },
    getNotes : function(index) {
      if (typeof index !== "undefined") {
        if (index >= 0 && index < this.notes.length) {
          return this.notes[index];
        } else {
          return null;
        }
      } else {
        return this.notes;
      }
    },
    removeEvents : function() {
      return _remove.apply(this, ["events"].concat(Array.prototype.slice.call(arguments)));
    },
    removeNotes : function() {
      return _remove.apply(this, ["notes"].concat(Array.prototype.slice.call(arguments)));
    },
    removeNote : function(note) {
      _remove.call(this, "notes", note);
    },
    removeEvent : function(event) {
      var index = this.events.indexOf(event);
      var nEv = this.events[index];

      _remove.call(this, "events", event);

      if (!nEv) return;
      this.calculateDelta(nEv);
    },
    cloneEvents : function() {
      return this.events.slice(0);
    }, 
    cloneNotes : function() {
      return this.notes.slice(0);
    },
    hasEvent : function(event) {
      return this.events.indexOf(event) !== -1;
    },
    hasNote : function(note) {
      return this.notes.indexOf(notes) !== -1;
    },
    insertEventAtTime : function(event) {
      var newIndex = this.positionEvent(event);

      if (this.events[newIndex + 1]) {
        this.calculateDelta(event, this.events[newIndex + 1]);
      } else {
        this.calculateDelta(event);
      }
    },
    insertNoteAtTime : function(note) {
      this.positionNote(note);
    },
    encode : function() {
      var startByte   = [0x4d, 0x54, 0x72, 0x6b];
      // var endByte     = [0x0, 0xFF, 0x2F, 0x0];
      var eventBytes  = [];
      var trackLength = 0;

      for (var i = 0, _len = this.events.length; i < _len; i++) {
        var event = this.getEvents(i);
        var bytes = event.encode();
        trackLength += bytes.length;
        Array.prototype.push.apply(eventBytes, bytes);
      }

      // trackLength += endByte.length;

      var lengthBytes = jMID.Util.stringToBytes(trackLength.toString(16), 4);

      return jMID.Util.bytesToString(startByte.concat(lengthBytes, eventBytes));
    },
    adjustEventTime : function(event, ms) {
      var event         = jMID.Util.isNumber(event) ? this.events[event] : event;
      var index         = this.events.indexOf(event);
      var nextEvent     = this.events[index + 1];
      var previousEvent = this.events[index - 1];
      var ticks         = Math.round(ms / this.timing.MSPT);
      var tempDelta, newIndex;

      // event.deltaTime += ticks;
      event.time += ms;
      if (this.hasEvent(event)) {
        this.events.splice(index, 1);
      }

      var newIndex = this.positionEvent(event);

      this.calculateDelta(nextEvent, event, this.events[newIndex + 1]);
    },
    positionEvent : function(event) {
      if (this.events.length === 0) {
        this.events.splice(0, 0, event);
        return 0;
      }

      for (var i = 0, _len = this.events.length; i < _len; i++) {
        var ev = this.events[i];
        if (event.time > ev.time) continue;
        break;
      }
      this.events.splice(i, 0, event);
      return i;
    },
    positionNote : function(note) {
      var index = this.notes.indexOf(note);

      if (index !== -1) {
        this.notes.splice(index, 1);
      }

      if (this.notes.length === 0) {
        this.notes.splice(0, 0, note);
        return 0;
      }

      for (var i = 0, _len = this.notes.length; i < _len; i++) {
        var ev = this.notes[i];
        if (note.start > ev.start) continue;
        break;
      }
      this.notes.splice(i, 0, note);
      return i;
    },
    calculateDelta : function() {
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0, _len = args.length; i < _len; i++) {
        var event = args[i];

        if (!event) continue;

        var index = this.events.indexOf(event);
        var pEv = this.events[index - 1];
        var nEv = this.events[index + 1];

        if (!pEv) {
          event.deltaTime = Math.round(event.time / this.timing.MSPT);
        } else {
          event.deltaTime = Math.round((event.time - pEv.time) / this.timing.MSPT);
        }
      }
    },
    switchEvents : function(event, otherEvent) {
      var index1 = this.events.indexOf(event);
      var index2 = this.events.indexOf(otherEvent);

      var temp = this.events.splice(index2, 1, event);
      this.events.splice(index1, 1, otherEvent);
    },
    processNotes : function() {
      var noteOns = {};
      this.notes = [];

      for (var i = 0, _len = this.events.length; i < _len; i++) {
        var event = this.events[i];
        if (event.subtype === "noteOn") {
          noteOns[event.noteNumber] = event;
        } else if (event.subtype === "noteOff") {
          if (event.noteNumber in noteOns) {
            new jMID.Note({
              noteOn : noteOns[event.noteNumber], 
              noteOff : event, 
              track : this
            });
            delete noteOns[event.noteNumber];
          }
        }
      }
    },
    processChannelEventTimes : function() {
      var MSPT = this.timing.MSPT;
      var runningTime = 0;
      var track = this;

      for (var x = 0, _len2 = track.events.length; x < _len2; x++) {
        var event = track.events[x];          
        var time = event.deltaTime * MSPT;

        event.set('time', runningTime + time);
        
        if (event.subtype === "endOfTrack") {
          track.duration = event.get('time');
        }
        runningTime += time;
      }
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Track);
  }

  return jMID;

}(jMID || {}));