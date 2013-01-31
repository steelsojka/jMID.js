var jMID = (function(jMID) {

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
    cloneEvents : function() {
      return this.events.slice(0);
    }, 
    cloneNotes : function() {
      return this.notes.slice(0);
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
      this.events.splice(index, 1);

      for (var i = 0, _len = this.events.length; i < _len; i++) {
        var ev = this.events[i];
        if (event.time >= ev.time) continue;

        this.events.splice(i, 0, event);
        newIndex = i;

        break;
      }

      this.calculateDelta(nextEvent, event, this.events[newIndex + 1]);
    },
    calculateDelta : function() {
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0, _len = args.length; i < _len; i++) {
        var event = args[i];
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
            this.notes.push(new jMID.Note(noteOns[event.noteNumber], event, this));
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
        runningTime += time;
      }
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Track);
  }

  return jMID;

}(jMID || {}));