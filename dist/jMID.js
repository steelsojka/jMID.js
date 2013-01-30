var jMID = (function(jMID) {

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
      console.log(hex);
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
    forEachTrack : function(tracks, iterator) {
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      for (var i = 0, _len = tracks.length; i < _len; i++) {
        iterator.apply(this, [tracks[i], i].concat(args));
      }
    },
    forEachEvent : function(track, iterator) {
      var args = aProto.slice.call(arguments);
      args.splice(0, 2);

      for (var i = 0, _len = track.events.length; i < _len; i++) {
        iterator.apply(this, [track.events[i], i].concat(args));
      }
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

  return jMID;

}(jMID || {}));var jMID = (function(jMID) {

  jMID.Track = function(events) {
    this.events = events || [];
  };

  jMID.Track.prototype = {
    pushEvent : function(event) {
      this.events.push(event);
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
    removeEvents : function() {
      var what, a = arguments, L = a.length, ax;
      while (L && this.events.length) {
        what = a[--L];
        while ((ax = this.events.indexOf(what)) !== -1) {
          this.events.splice(ax, 1);
        }
      }
      return this;
    },
    cloneEvents : function() {
      return this.events.slice(0);
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
    }
  };

  return jMID;

}(jMID || {}));/**
 * jMID.Stream class
 *
 * Used to read binary files
 *
 * @author Steven Sojka
 *
 * Much help from jasmid.js
 */

var jMID = (function(jMID) {

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

  return jMID; // Export

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
    this.processChannelEventTimes();
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
      var MSPT = this.timing.MSPT;
      
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        var track = this.tracks[i];
        var runningTime = 0;

        for (var x = 0, _len2 = track.events.length; x < _len2; x++) {
          var event = track.events[x];          
          var time = event.deltaTime * MSPT;

          event.set('time', runningTime + time);
          runningTime += time;
        }
      }
    },
    calculateBPM : function() {
      var microsecondsPerMinute = 60000000;
      this.timing.BPM = (microsecondsPerMinute / this.timing.MicroSPB) *
                        (this.timeSignature.beatValue / 4);
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

  return jMID;

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

  jMID.Encoder.Notes = { 
    G9: 0x7F, Gb9: 0x7E, F9: 0x7D, E9: 0x7C, Eb9: 0x7B,
    D9: 0x7A, Db9: 0x79, C9: 0x78, B8: 0x77, Bb8: 0x76, A8: 0x75, Ab8: 0x74,
    G8: 0x73, Gb8: 0x72, F8: 0x71, E8: 0x70, Eb8: 0x6F, D8: 0x6E, Db8: 0x6D,
    C8: 0x6C, B7: 0x6B, Bb7: 0x6A, A7: 0x69, Ab7: 0x68, G7: 0x67, Gb7: 0x66,
    F7: 0x65, E7: 0x64, Eb7: 0x63, D7: 0x62, Db7: 0x61, C7: 0x60, B6: 0x5F,
    Bb6: 0x5E, A6: 0x5D, Ab6: 0x5C, G6: 0x5B, Gb6: 0x5A, F6: 0x59, E6: 0x58,
    Eb6: 0x57, D6: 0x56, Db6: 0x55, C6: 0x54, B5: 0x53, Bb5: 0x52, A5: 0x51,
    Ab5: 0x50, G5: 0x4F, Gb5: 0x4E, F5: 0x4D, E5: 0x4C, Eb5: 0x4B, D5: 0x4A,
    Db5: 0x49, C5: 0x48, B4: 0x47, Bb4: 0x46, A4: 0x45, Ab4: 0x44, G4: 0x43,
    Gb4: 0x42, F4: 0x41, E4: 0x40, Eb4: 0x3F, D4: 0x3E, Db4: 0x3D, C4: 0x3C,
    B3: 0x3B,  Bb3: 0x3A, A3: 0x39, Ab3: 0x38, G3: 0x37, Gb3: 0x36, F3: 0x35,
    E3: 0x34, Eb3: 0x33, D3: 0x32, Db3: 0x31, C3: 0x30, B2: 0x2F, Bb2: 0x2E,
    A2: 0x2D, Ab2: 0x2C, G2: 0x2B, Gb2: 0x2A, F2: 0x29, E2: 0x28, Eb2: 0x27,
    D2: 0x26, Db2: 0x25, C2: 0x24, B1: 0x23, Bb1: 0x22, A1: 0x21, Ab1: 0x20,
    G1: 0x1F, Gb1: 0x1E, F1: 0x1D, E1: 0x1C, Eb1: 0x1B, D1: 0x1A, Db1: 0x19,
    C1: 0x18, B0: 0x17, Bb0: 0x16, A0: 0x15, Ab0: 0x14, G0: 0x13, Gb0: 0x12,
    F0: 0x11, E0: 0x10, Eb0: 0x0F, D0: 0x0E, Db0: 0x0D, C0: 0x0C 
  };

  return jMID;

}(jMID || {}));/**
 * jMID.Decoder class
 *
 * Decodes a binary MIDI file and returns and array of tracks
 * with events
 *
 * @author Steven Sojka
 * @dependencies: jMID.Stream.js
 *
 * Much help from jasmid.js
 */

var jMID = (function(jMID) {

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

  return jMID; // Export

}(jMID || {}));var jMID = (function(jMID) {

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

}(jMID || {}));/**
 * Converts MIDI notes to frequencys and vice versa
 *
 * @author Steven Sojka
 */

var jMID = (function(jMID) {

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

  return jMID;

}(jMID || {}));
