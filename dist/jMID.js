/**
 * jMID.js v0.1
 *
 * A javascript library for reading, manipulating, and writing MIDI files
 * @author Steven Sojka - Thursday, January 31, 2013
 *
 * MIT Licensed
 */
var jMID = (function(jMID) {

  ///////////////////////////////////////////////////////////////
  /////////////////// Static variables //////////////////////////
  ///////////////////////////////////////////////////////////////

  jMID.EventTypes = {
    META          : 0xff,
    SYSEX         : 0xf0,
    DIVIDED_SYSEX : 0xf7
  };

  jMID.SubEventTypes = {
    SEQUENCE_NUMBER     : 0x00,
    TEXT                : 0x01,
    COPYRIGHT_NOTICE    : 0x02,
    TRACK_NAME          : 0x03,
    INSTRUMENT_NAME     : 0x04,
    LYRICS              : 0x05,
    MARKER              : 0x06,
    CUE_POINT           : 0x07,
    MIDI_CHANNEL_PREFIX : 0x20,
    END_OF_TRACK        : 0x2f,
    SET_TEMPO           : 0x51,
    SMPTE_OFFSET        : 0x54,
    TIME_SIGNATURE      : 0x58,
    KEY_SIGNATURE       : 0x59,
    SEQUENCER_SPECIFIC  : 0x7f,
    NOTE_OFF            : 0x08,
    NOTE_ON             : 0x09,
    NOTE_AFTER_TOUCH    : 0x0a,
    CONTROLLER          : 0x0b,
    PROGRAM_CHANGE      : 0x0c,
    CHANNEL_AFTER_TOUCH : 0x0d,
    PITCH_BEND          : 0x0e
  };

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  var aProto = Array.prototype;

  jMID.Util = {
    isObject : function(obj) {
      return obj === Object(obj);
    },
    asciiToHex : function(str) {
      var temp = "";
      for (var i = 0, _len = str.length; i < _len; i++) {
        temp += str.charCodeAt(i).toString(16);
      }
      return temp;
    },
    hexToAscii : function(hex) {
      
      var str = "";
      for (var i = 0, _len = hex.length; i < _len; i++) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        hex[i]
      }
      return str;
    },
    hexToBinary : function(hex) {
      return hex.toString(2);
    },
    bytesToString : function(array) {
      var str = "";

      for (var i = 0, _len = array.length; i < _len; i++) {
        if (jMID.Util.isString(array[i])) {
          str += array[i];
        } else {
          str += String.fromCharCode(array[i]);
        }
      }
      return str;
    },
    stringToBytes : function(string, bytes) {
      if (bytes) {
        while ((string.length / 2) < bytes) {
          string = "0" + string;
        }
      }

      var byteArray = [];
      for (var i = string.length - 1; i >= 0; i -= 2) {
        var chars = i === 0 ? string[i] : string[i-1] + string[i];
        byteArray.unshift(parseInt(chars, 16));
      }

     return byteArray;
    },
    writeVarInt : function(ticks) {
      var buffer = ticks & 0x7F;

      while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ((ticks & 0x7F) | 0x80);
      }

      var bytes = [];
      while (true) {
        bytes.push(buffer & 0xff);

        if (buffer & 0x80) {
          buffer >>= 8;
        } else {
          break;
        }
      }
      return bytes;
    },
    getType : function(type) {
      var types = jMID.SubEventTypes;

      switch (type) {
        case "sequenceNumber"    :  return types.SEQUENCER_NUMBER;
        case "text"              :  return types.TEXT;
        case "copyrightNotice"   :  return types.COPYRIGHT_NOTICE;
        case "trackName"         :  return types.TRACK_NAME;
        case "instrumentName"    :  return types.INSTRUMENT_NAME;
        case "lyrics"            :  return types.LYRICS;
        case "marker"            :  return types.MARKER;
        case "cuePoint"          :  return types.CUE_POINT;
        case "midiChannelPrefix" :  return types.MIDI_CHANNEL_PREFIX;
        case "endOfTrack"        :  return types.END_OF_TRACK;
        case "setTempo"          :  return types.SET_TEMPO;
        case "smpteOffset"       :  return types.SMPTE_OFFSET;
        case "timeSignature"     :  return types.TIME_SIGNATURE;
        case "sequencerSpecific" :  return types.SEQUENCER_SPECIFIC;
        case "noteOff"           :  return types.NOTE_OFF;
        case "noteOn"            :  return types.NOTE_ON;
        case "noteAfterTouch"    :  return types.NOTE_AFTER_TOUCH;
        case "controller"        :  return types.CONTROLLER;
        case "programChange"     :  return types.PROGRAM_CHANGE;
        case "channelAfterTouch" :  return types.CHANNEL_AFTER_TOUCH;
        case "pitchBend"         :  return types.PITCH_BEND;
      }
    },
    forAllEvents : function(tracks, iterator) {
      var self = this;
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      this.forEachTrack(tracks, function(track, index) {
        self.forEachEvent.apply(self, [track, iterator, index].concat(args));
      });
    },
    forAllNotes : function(tracks, iterator) {
      var self = this;
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      this.forEachTrack(tracks, function(track, index) {
        self.forEachNote.apply(self, [track, iterator, index].concat(args));
      });
    },
    forEachTrack : function(tracks, iterator) {
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      for (var i = 0, _len = tracks.length; i < _len; i++) {
        iterator.apply(this, [tracks[i], i].concat(args));
      }
    },
    forEachNote : function(track, iterator) {
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      for (var i = 0, _len = track.notes.length; i < _len; i++) {
        iterator.apply(this, [track.notes[i], i].concat(args));
      }
    },
    forEachEvent : function(track, iterator) {
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      for (var i = 0, _len = track.events.length; i < _len; i++) {
        iterator.apply(this, [track.events[i], i].concat(args));
      }
    },
    inRange : function(value, min, max) {
      return value >= min && value <= max;
    }
  };

  var isTypes = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp']
  for (var i = isTypes.length - 1; i >= 0; i--) {
    (function(name) {
      jMID.Util['is' + name] = function(obj) {
        return toString.call(obj) == '[object ' + name + ']';
      }
    }(isTypes[i]));

  };

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  jMID.Emitter = function() {};

  jMID.Emitter.prototype = {
    on : function(event, listener) {
      this.__events = this.__events || {};
      this.__events[event] = this.__events[event] || [];
      this.__events[event].push(listener);
    },
    off : function(event, listener) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      this.__events[event].splice(this.__events[event].indexOf(listener), 1);
    }, 
    trigger : function(event) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      for (var i = 0, _len = this.__events[event].length; i < _len; i++) {
        this.__events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  jMID.Emitter.register = function(obj) {
    for (var key in jMID.Emitter.prototype) {
      if (jMID.Emitter.prototype.hasOwnProperty(key)) {
        obj.prototype[key] = jMID.Emitter.prototype[key];
      }
    }
  };

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  var _encodeChannelEvent = function(event) {
    var byteArray = [];

    var typeByte = jMID.Util.getType(event.subtype);
    var typeChannelByte = parseInt(typeByte.toString(16) + event.channel.toString(16), 16);

    Array.prototype.push.apply(byteArray, jMID.Util.writeVarInt(event.deltaTime));
    byteArray.push(typeChannelByte);

    switch (event.subtype) {
      case 'noteOn':
      case 'noteOff':
        byteArray.push(event.noteNumber, event.velocity); break;
      case 'noteAfterTouch':
        byteArray.push(event.noteNumber, event.amount); break;
      case 'controller':
        byteArray.push(event.controllerType, event.value); break;
      case 'programChange':
        byteArry.push(event.programNumber); break;
      case 'channelAfterTouch':
        byteArray.push(event.amount); break;
      case 'pitchBend':
        byteArray.push(event.course, event.fine); break;
    }
    
    return byteArray;
  };

  var _encodeMetaEvent = function(event) {
    var byteArray = [];
    Array.prototype.push.apply(byteArray, jMID.Util.writeVarInt(event.deltaTime));
    byteArray.push(0xff, jMID.Util.getType(event.subtype));
    
    switch (event.subtype) {
      case 'sequenceNumber': byteArray.push(1, event.number); break;
      case 'midiChannelPrefix': byteArray.push(1, event.channel); break;
      case 'setTempo': 
        byteArray.push(3,
          (event.microsecondsPerBeat & 0xff0000) >> 16,
          (event.microsecondsPerBeat & 0x00ff00) >> 8,
          (event.microsecondsPerBeat & 0x0000ff)
        ); 
        break;
      case 'smpteOffset': 
        byteArray.push(5, event.hourByte, event.min, event.sec, event.frame, event.subframe); 
        break;
      case 'timeSignature': 
        byteArray.push(4, event.numerator, Math.log(event.denominator) / Math.log(2), event.metronome, event.thirtyseconds); 
        break;
      case 'keySignature': byteArray.push(2, event.key, event.scale); break;
      case 'copyrightNotice':
      case 'text':
      case 'trackName':
      case 'instrumentName':
      case 'lyrics':
      case 'marker':
      case 'cuePoint':
        var text = event.text.split("");
        Array.prototype.push.apply(byteArray, [text.length].concat(text)); break;
      case 'sequencerSpecific':
      case 'unknown':
        byteArray.push(1, event.data); break;
      case 'endOfTrack': byteArray.push(0); break;
    }

    return byteArray;
  };

  jMID.Event = function() {};

  jMID.Event.prototype = {
    set : function() {
      var util = jMID.Util;
      var args = arguments;

      if (util.isObject(args[0])) {
        for (var key in args[0]) {
          if (args[0].hasOwnProperty(key)) {
            this[key] = args[0][key];
          }
        }
      } else if (util.isString(args[0])) {
        this[args[0]] = args[1];
      } else {
        return null;
      }
    },
    get : function(value) {
      return this[value];
    },
    encode : function() {
      if (this.type === "meta") {
        return _encodeMetaEvent(this);
      } else {
        return _encodeChannelEvent(this);
      }
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Event);
  }

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

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

}(jMID || {}));var jMID = (function(jMID) {

  var _toMilliseconds = function(ms) { return ms / 1000; };
  var _toSeconds = function(ms) { return ms / 1000000; };

  jMID.File = function(decoded) {
    for (var key in decoded) {
      if (decoded.hasOwnProperty(key)) {
        this[key] = decoded[key];
      }
    }

    this.timeSignature = { // Defaults
      beatsPerBar : 4,
      beatValue : 4
    };

    this.timing = {
      MicroSPB : 500000
    };

    this.processMetaEvents();
    
    for (var i = this.tracks.length - 1; i >= 0; i--) {
      this.tracks[i].timing = this.timing;
    };

    this.processChannelEventTimes();
    this.processNotes();
  };

  jMID.File.prototype = {
    processMetaEvents : function() {
      var meta = jMID.Query(this).filter("type:meta")
                                 .not("subtype:endOfTrack, subtype:trackName")
                                 .toArray();
      
      for (var i = 0, _len = meta.length; i < _len; i++) {
        switch (meta[i].subtype) {
          case "timeSignature":
            this.timeSignature.beatsPerBar = meta[i].numerator;
            this.timeSignature.beatValue = meta[i].denominator;
            break;
          case "setTempo":
            this.timing.MicroSPB = meta[i].microsecondsPerBeat;
            break;
        }
      }

      this.calculateBPM();
      this.timing.MSPQN = this.timing.MicroSPB / 1000;
      this.timing.MSPT = this.timing.MSPQN / this.header.ticksPerBeat;
    },
    processChannelEventTimes : function() {      
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        this.tracks[i].processChannelEventTimes();
      }
    },
    processNotes : function() {
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        this.tracks[i].processNotes();
      }
    },
    calculateBPM : function() {
      var microsecondsPerMinute = 60000000;
      this.timing.BPM = (microsecondsPerMinute / this.timing.MicroSPB) *
                        (this.timeSignature.beatValue / 4);
    },
    getTrack : function(i) {
      return this.tracks[i];
    },
    getHeader : function() {
      return this.header;
    },
    encode : function() {
      return new jMID.Encoder().encode(this);
    },
    base64Encode : function() {
      return btoa(this.encode());
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.File);
  }

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  jMID.Note = function(noteOn, noteOff, track) {
    this.noteOn      = noteOn;
    this.noteOff     = noteOff;
    this.start       = noteOn.time;
    this.end         = noteOff.time;
    this.track       = track;
    this.velocity    = noteOn.velocity;
    this.noteNumber  = noteOn.noteNumber;
    this.length      = noteOff.time - noteOn.time;
  };

  jMID.Note.prototype = {
    adjustTime : function(amount) {
      this.track.adjustEventTime(this.noteOn, amount);
      this.track.adjustEventTime(this.noteOff, amount);
      this.track.processNotes();
    },
    adjustLength : function(amount) {
      this.track.adjustEventTime(this.noteOff, amount);
      this.length = this.noteOff.time - this.noteOn.time;
      this.end = this.noteOff.time;
    },
    adjustNoteNumber : function(amount) {
      this.setNoteNumber(this.noteNumber + amount);
    },
    setNoteNumber : function(noteNumber) {
      this.noteOn.noteNumber  = noteNumber;
      this.noteOff.noteNumber = noteNumber;
      this.noteNumber         = noteNumber;
    },
    setVelocity : function(velocity) {
      this.noteOn.velocity = velocity;
      this.velocity = velocity;
    },
    setChannel : function(channel) {
      if (!jMID.Util.inRange(channel, 0, 15)) return;
      this.noteOn.channel = channel;
      this.noteOff.channel = channel;
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Note);
  }

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  jMID.Stream = function(string) {
    this.index = 0;
    this.string = string;
  };

  jMID.Stream.prototype = {
    read : function(length) {
      var res = this.string.substr(this.index, length);
      this.index += length;
      return res;
    },
    readInt32 : function() {
      var str = this.string;
      var i   = this.index;
      var res = (str.charCodeAt(i) << 24) +
                (str.charCodeAt(i + 1) << 16) +
                (str.charCodeAt(i + 2) << 8) +
                (str.charCodeAt(i + 3));

      this.index += 4;
      return res;
    },
    readInt16 : function() {
      var str = this.string;
      var i   = this.index;
      var res = (str.charCodeAt(i) << 8) +
                (str.charCodeAt(i + 1));

      this.index += 2;
      return res;
    },
    readInt8 : function(signed) {
      var res = this.string.charCodeAt(this.index);
      this.index += 1;

      return signed && res > 127 ? res - 256 : res; 
    },
    eof : function() {
      return this.index >= this.string.length;
    },
    readVarInt : function() {
      var res = 0;
      while (true) {
        var a = this.readInt8();
        if (a & 0x80) {
          res += (a & 0x7f);
          res <<= 7;
        } else {
          return res + a;
        }
      }
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Stream);
  }

  return jMID; // Export

}(jMID || {}));var jMID = (function() {

  var HEADER_CHUNKID     = "\x4d\x54\x68\x64";
  var HEADER_CHUNK_SIZE  = "\x00\x00\x00\x06"; 
  var HEADER_TYPE0       = "\x00\x00";
  var HEADER_TYPE1       = "\x00\x01";
  var HEADER_SPEED       = "\x00\x80";

  var types = ["meta", "sysex", "dividedSysex"];
  var subtypes = ["sequenceNumber", "text", "copyrightNotice", "trackName", "instrumentName",             
                 "lyrics", "marker", "cuePoint", "midiChannelPrefix", "endOfTrack", "setTempo",
                 "smpteOffset", "timeSignature", "keySignature", "sequencerSpecific", "noteOff",
                 "noteOn", "noteAfterTouch", "controller", "programChange", "channelAfterTouch",
                 "pitchBend"];

  var _encodeHeader = function(header, string) {
    var util = jMID.Util;

    string += HEADER_CHUNKID + HEADER_CHUNK_SIZE;
    string += header.format === 0 ? HEADER_TYPE0 : HEADER_TYPE1;
    string += util.bytesToString(util.stringToBytes(header.trackCount.toString(), 2));
    string += util.bytesToString([header.ticksPerBeat >> 8, header.ticksPerBeat & 0xff00 >> 8]);

    return string;
  };


  jMID.Encoder = function() {};

  jMID.Encoder.prototype = {
    encode : function(file) {
      var encoded = "";

      encoded = _encodeHeader(file.getHeader(), encoded);

      for (var i = 0, _len = file.tracks.length; i < _len; i++) {
        var data = file.tracks[i].encode();
        encoded += data;
      }

      return encoded;
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Encoder);
  }

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  //////////////////////////////////////////////////////////////////
  ////////////////////////// Private Methods ///////////////////////
  //////////////////////////////////////////////////////////////////

  var _readEvent = function(stream) {
    var event = new jMID.Event();
    event.set('deltaTime', stream.readVarInt());
    var eventByte = stream.readInt8();
    var types = jMID.EventTypes;

    if ((eventByte & 0xf0) == 0xf0) {
      switch (eventByte) {
        case types.META          : _parseMetaEvent.call(this, event, stream); break;
        case types.SYSEX         : _parseSysexEvent.call(this, event, stream); break;
        case types.DIVIDED_SYSEX : _parseDividedSysexEvent.call(this, event, stream); break;
        default                  : throw new Error("Unrecognized event");
      }
    } else {
      _parseChannelEvent.call(this, eventByte, event, stream);
    }

    return event;
  };

  var _parseSysexEvent = function(event, stream) {
    event.set('type', 'sysex');
    var length = stream.readVarInt();
    event.set('data', stream.read(length));
    return event;
  };

  var _parseMetaEvent = function(event, stream) {
    event.set('type', 'meta');

    var subType = stream.readInt8();
    var length  = stream.readVarInt();
    var types   = jMID.SubEventTypes;

    for (var key in types) {
      var type = types[key];

      if (subType == type) {

        switch (type) {
          case types.SEQUENCE_NUMBER: 
            event.set('number', stream.readInt16()); break;
            event.set('subtype', 'sequenceNumber');

          case types.MIDI_CHANNEL_PREFIX:
            event.set('channel', stream.readInt8()); break;
            event.set('subtype', 'midiChannelPrefix');
          
          case types.SET_TEMPO:
            event.set('microsecondsPerBeat', (stream.readInt8() << 16) +
                                        (stream.readInt8() << 8) +
                                        (stream.readInt8()));
            event.set('subtype', 'setTempo');
            break;
          
          case types.SMPTE_OFFSET:
            var hour        = stream.readInt8();
            event.set({
              hourByte  : hour,
              frameRate : {0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30}[hour & 0x60],
              hour      : hour & 0x1f,
              min       : stream.readInt8(),
              sec       : stream.readInt8(),
              frame     : stream.readInt8(),
              subframe  : stream.readInt8(),
              subtype   : 'smpteOffset'
            });

            break;
          
          case types.TIME_SIGNATURE:
            event.set({
              numerator     : stream.readInt8(),
              denominator   : Math.pow(2, stream.readInt8()),
              metronome     : stream.readInt8(),
              thirtyseconds : stream.readInt8(),
              subtype       : 'timeSignature'
            });
            break;

          case types.KEY_SIGNATURE:
            event.set({
              key : stream.readInt8(true),
              scale : stream.readInt8(),
              subtype : 'keySignature'
            });
            break;

          case types.TEXT:
            event.set({subtype : 'text', text : stream.read(length)}); break;
          case types.COPYRIGHT_NOTICE:
            event.set({subtype : 'copyrightNotice', text : stream.read(length)}); break;
          case types.TRACK_NAME:
            event.set({subtype : 'trackName', text : stream.read(length)}); break;
          case types.INSTRUMENT_NAME:
            event.set({subtype : 'instrumentName', text : stream.read(length)}); break;
          case types.LYRICS:
            event.set({subtype : 'lyrics', text : stream.read(length)}); break;
          case types.MARKER:
            event.set({subtype : 'marker', text : stream.read(length)}); break;
          case types.CUE_POINT:
            event.set({subtype : 'cuePoint', text : stream.read(length)}); break;
          case types.END_OF_TRACK:
            event.set('subtype', 'endOfTrack'); break;
          case types.SEQUENCER_SPECIFIC:
            event.set({subtype : 'sequencerSpecific', data : stream.read(length)}); break;
          default:
            event.set({subtype : 'unknown', data : stream.read(length)}); break;
        }
        break;
      }
    }

    return event;
  };

  var _parseDividedSysexEvent = function() {
    event.set('type', 'dividedSysex');
    var length = stream.readVarInt();
    event.set('data', stream.read(length));
    return event;
  };

  var _parseChannelEvent = function(eventByte, event, stream) {
    var param1;
    var types = jMID.SubEventTypes;

    if ((eventByte & 0x80) == 0) {
      param1 = eventByte;
      eventByte = this._lastEventType;
    } else {
      param1 = stream.readInt8();
      this._lastEventType = eventByte;
    }

    var eventType = eventByte >> 4;
    event.set('channel', eventByte & 0x0f);
    event.set('type', "channel");

    for (var key in types) {
      var type = types[key];

      if (eventType == type) {
        // event.set('subtype', type);

        switch (type) {
          case types.NOTE_OFF:
            event.set('noteNumber', param1);
            event.set('subtype', 'noteOff');
            event.set('velocity',  stream.readInt8());
            break;
          case types.NOTE_ON:
            event.set('noteNumber', param1);
            event.set('subtype', 'noteOn');
            event.set('velocity', stream.readInt8());
            if (event.get('velocity') == 0) {
              event.set('subtype', 'noteOff');
            }
            break;
          case types.NOTE_AFTER_TOUCH:
            event.set('noteNumber', param1);
            event.set('subtype', 'noteAfterTouch');
            event.set('amount', stream.readInt8());
            break;
          case types.CONTROLLER:
            event.set('subtype', 'controller');
            event.set('controllerType', param1);
            event.set('value', stream.readInt8());
            break;
          case types.PROGRAM_CHANGE:
            event.set('subtype', 'programChange');
            event.set('programNumber', param1);
            break;
          case types.CHANNEL_AFTER_TOUCH:
            event.set('subtype', 'channelAfterTouch');
            event.set('amount', param1);
            break;
          case types.PITCH_BEND:
            event.set('subtype', 'pitchBend');
            event.set('coarse', param1);
            event.set('fine', stream.readInt8());
            event.set('value', event.coarse + (event.fine << 7));
            break;
        }

      }
    }

    return event;

  };

  var _readChunk = function(stream) {
    var id = stream.read(4); 
    var length = stream.readInt32();

    return {
      id : id,
      length : length,
      data : stream.read(length)
    };
  };

  /////////////////////////////////////////////////////////////////////
  /////////////////////// jMID Decoder Class //////////////////////////
  ////////////////////////////////////////////////////////////////////

  jMID.Decoder = function() {};

  jMID.Decoder.prototype = {
    decode : function(_stream) {
      var header       = _readChunk(_stream);
      var headerStream = new jMID.Stream(header.data);
      var format       = headerStream.readInt16();
      var trackCount   = headerStream.readInt16();
      var time         = headerStream.readInt16();

      var tracks = [];
      var _header = {
        format : format,
        trackCount : trackCount,
        ticksPerBeat : time
      };
      for (var i = 0; i < trackCount; i++) {
        tracks[i] = new jMID.Track();
        var chunk = _readChunk(_stream);
        var stream = new jMID.Stream(chunk.data);
        while (!stream.eof()) {
          tracks[i].pushEvent(_readEvent.call(this, stream));
        }
      }

      return new jMID.File({
        header : _header,
        tracks : tracks
      });
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Decoder);
  }

  return jMID; // Export

}(jMID || {}));var jMID = (function(jMID) {

  var _parseQuery = function(query) {
    if (!query) return;

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



  var _search = function(query, noteSearch) {
    var queries = _parseQuery(query);
    var tracks = [];
    

    for (var y = 0, _len3 = this._results.tracks.length; y < _len3; y++) {
     var track = this._results.tracks[y];
     tracks.push(new jMID.Track({timing : track.timing}));
     var items = this.noteSearch ? track.getNotes() : track.getEvents();

      if (!query) {
        tracks[y] = track;
        continue;
      } 
        
      for (var z = 0, _len4 = items.length; z < _len4; z++) {
        var event = this.noteSearch ? track.getNotes(z) : track.getEvents(z);
        var isValid = true;

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
            if (this.noteSearch) {
              tracks[y].pushNote(event);
            } else {
              tracks[y].pushEvent(event);
            }
          } 
        }
      }
    }

    return {
      tracks : tracks
    };
  };

  var jMIDQueryResult = function(decodedMidi, results, noteSearch) {
    this.noteSearch = noteSearch;
    this._results = results ? results : {tracks : decodedMidi.tracks.slice(0)};
    this._file = decodedMidi;
  };

  jMIDQueryResult.prototype = {
    filter : function(query) {
      var results = _search.call(this, query);
      return new jMIDQueryResult(this._file, results, this.noteSearch);
    },
    not : function(query) {
      var resultsToRemove = _search.call(this, query);
      var results = this._results;
      var newResults = [];

      for (var i = 0, _len = results.tracks.length; i < _len; i++) {
        var track = results.tracks[i];
        var newTrack = new jMID.Track();

        if (!this.noteSearch) {
          newTrack.events = track.cloneEvents();
          newTrack.removeEvents.apply(newTrack, resultsToRemove.tracks[i].getEvents());
        } else {
          newTrack.notes = track.cloneNotes();
          newTrack.removeNotes.apply(newTrack, resultsToRemove.tracks[i].getNotes());
        }

        newResults.push(newTrack);
      }

      return new jMIDQueryResult(this._file, {tracks : newResults}, this.noteSearch);
    },
    toArray: function() {
      var events = [];

      for (var i = 0, _len = this._results.tracks.length; i < _len; i++) {
        var list = this._results.tracks[i];
        events = events.concat(this.noteSearch ? list.notes : list.events);
      }

      return events;
    },
    increment : function(prop, amount) {
      var func = this.noteSearch ? "forAllNotes" : "forAllEvents";

      jMID.Util[func](this._results.tracks, function(e) {
        if (prop in e) {
          e[prop] += amount;
        }
      });

      return this;
    },
    set : function(prop, value) {
      var func = this.noteSearch ? "forAllNotes" : "forAllEvents";

      jMID.Util[func](this._results.tracks, function(e) {
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
      return new jMIDQueryResult(this._file, {tracks : [new jMID.Track({
        events : [this.get.apply(this, arguments)],
        timing : track.timing
      })]});
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
    notes : function(query) {
      this.noteSearch = true;
      var results = _search.call(this, query);
      return new jMIDQueryResult(this._file, results, true);
    },
    adjustTime : function(amount) {
      if (!this.noteSearch) return this;

      jMID.Util.forAllNotes(this._results.tracks, function(e, i, track) {
        e.adjustTime(amount);
      });

      return this;
    },
    adjustNoteNumber : function(amount) {
      if (!this.noteSearch) return this;

      jMID.Util.forAllNotes(this._results.tracks, function(e, i, track) {
        e.adjustNoteNumber(amount);
      });

      return this;
    },
    apply : function() {
      if (this.noteSearch) return this;

      for (var i = 0, _len = this._results.tracks.length; i < _len; i++) {
        var track = this._results.tracks[i];
        this._file.tracks[i] = new jMID.Track({
          events : track.cloneEvents(),
          timing : this._file.tracks[i].timing
        });
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

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Query);
  }

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  //////////////////////////////////////////////////
  ////////////// Private Methods ///////////////////
  //////////////////////////////////////////////////

  var _isDefined = function(object) {
    return typeof object !== "undefined";
  };
  var _inRange = function(min, max, value) {
    return Math.max(Math.min(value, max), min);
  };
  var _inBounds = function(min, max, value) {
    return value >= min && value <= max;
  };
  var conf = {
    NOTES : ['C ','C#','D ','D#','E ','F ','F#','G ','G#','A ','A#','B '],
    BASE_A4 : 440
  };

  //////////////////////////////////////////////////////
  /////////////////// jMID Converter Class /////////////
  //////////////////////////////////////////////////////

  jMID.Converter = function() {
    this.setType(jMID.Converter.Types.NOTE_TO_FREQUENCY);
  };

  jMID.Converter.prototype = {
    noteToFrequency : function(note) {
      if (_inBounds(0, 119, note)) {
        return conf.BASE_A4 * Math.pow(2, (note - 69) / 12);
      } else {
        return -1;
      }
    },
    noteToName : function(note) {
      if (_inBounds(0, 119, note)) {
        return (conf.NOTES[note % 12] + (Math.round(note / 12)).toString()).replace(/\s+/g, '');
      } else {
        return '---';
      }
    },
    frequencyToNote : function(freq) {
      return Math.round(12 * (Math.log(freq / conf.BASE_A4) / Math.log(2))) + 69;
    },
    nameToNote : function(string) { 
      var c, i, s, _len;

      if (string.length === 2) {
        s = string[0] + " " + string[1];
      } else if (string.length > 2) {
        return -1;
      }
      s.toUpperCase();
      c = -1;
      for (i = 0, _len = conf.NOTES.length; i < _len; i++) {
        if (conf.NOTES[i] === s[0] + s[1]) {
          c = i;
          break;
        }
      }
      try {
        i = parseInt(s[2], 10);
        return i * 12 + c;
      } catch(err) {
        return -1;
      }

      if (c < 0) return -1;
    },
    convert : function(value) {
      switch (this._type) {
        case 0: return this.noteToFrequency(value);
        case 1: return this.noteToName(value);
        case 2: return this.frequencyToNote(value);
        case 3: return this.nameToNote(value);
      }
    },
    setType : function(type) {
      this._type = type;
    }
  };

  //////////////////////////////////////////////////////////
  //////////////////// Static variables ////////////////////
  //////////////////////////////////////////////////////////

  jMID.Converter.Types = {
    NOTE_TO_FREQUENCY : 0,
    NOTE_TO_NAME      : 1,
    FREQUENCY_TO_NOTE : 2,
    NAME_TO_NOTE      : 3
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Converter);
  }

  return jMID;

}(jMID || {}));
