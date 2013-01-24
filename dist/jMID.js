/**
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
/**
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
    var event = {};
    event.time = stream.readVarInt();
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
    event.type = jMID.EventTypes.SYSEX;
    var length = stream.readVarInt();
    event.data = stream.read(length);
    return event;
  };

  var _parseMetaEvent = function(event, stream) {
    event.type = jMID.EventTypes.META;

    var subType = stream.readInt8();
    var length  = stream.readVarInt();
    var types   = jMID.SubEventTypes;
    var fRates  = jMID.FrameRates;

    for (var key in types) {
      var type = types[key];

      if (subType == type) {
        event.subtype = type;

        switch (type) {
          case types.SEQUENCE_NUMBER: 
            event.number = stream.readInt16(); break;

          case types.jMID_CHANNEL_PREFIX:
            event.channel = stream.readInt8(); break;
          
          case types.SET_TEMPO:
            event.microsecondsPreBeat = (stream.readInt8() << 16) +
                                        (stream.readInt8() << 8) +
                                        (stream.readInt8());
            break;
          
          case types.SMPTE_OFFSET:
            var hour        = stream.readInt8();
            event.frameRate = {0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30}[hourByte & 0x60];
            event.hour      = hour & 0x1f;
            event.min       = stream.readInt8();
            event.sec       = stream.readInt8();
            event.frame     = stream.readInt8();
            event.subframe  = stream.readInt8();
            break;
          
          case types.TIME_SIGNATURE:
            event.numerator     = stream.readInt8();
            event.denominator   = Math.pow(2, stream.readInt8());
            event.metronome     = stream.readInt8();
            event.thirtyseconds = stream.readInt8();
            break;

          case types.KEY_SIGNATURE:
            event.key = stream.readInt8(true);
            event.scale = stream.readInt8();
            break;

          case types.TEXT:
          case types.COPYRIGHT_NOTICE:
          case types.TRACK_NAME:
          case types.INSTRUMENT_NAME:
          case types.LYRICS:
          case types.MARKER:
          case types.CUE_POINT:
            event.text = stream.read(length);
            break;

          case types.END_OF_TRACK:
            break;

          case types.SEQUENCER_SPECIFIC:
          default:
            event.data = stream.read(length);
        }
        break;
      }
    }

    return event;
  };

  var _parseDividedSysexEvent = function() {
    event.type = jMID.EventTypes.DIVIDED_SYSEX;
    var length = stream.readVarInt();
    event.data = stream.read(length);
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
    event.channel = eventByte & 0x0f;
    event.type = "channel";

    for (var key in types) {
      var type = types[key];

      if (eventType == type) {
        event.subtype = type;

        switch (type) {
          case types.NOTE_OFF:
            event.noteNumber = param1;
            event.velocity = stream.readInt8();
            break;
          case types.NOTE_ON:
            event.noteNumber = param1;
            event.velocity = stream.readInt8();
            if (event.velocity == 0) {
              event.subtype = types.NOTE_OFF;
            }
            break;
          case types.NOTE_AFTER_TOUCH:
            event.noteNumber = param1;
            event.amount = stream.readInt8();
            break;
          case types.CONTROLLER:
            event.controllerType = param1;
            event.value = stream.readInt8();
            break;
          case types.PROGRAM_CHANGE:
            event.programNumber = param1;
            break;
          case types.CHANNEL_AFTER_TOUCH:
            event.amount = param1;
            break;
          case types.PITCH_BEND:
            event.value = param1 + (stream.readInt8() << 7);
            break;
        }

      }
    }

    return event;

  };

  var _readChunk = function() {
    var id = this.stream.read(4);
    var length = this.stream.readInt32();

    return {
      id : id,
      length : length,
      data : this.stream.read(length)
    };
  };

  /////////////////////////////////////////////////////////////////////
  /////////////////////// jMID Decoder Class //////////////////////////
  ////////////////////////////////////////////////////////////////////

  jMID.Decoder = function(stream) {
    this.stream = stream;
    this.decode();
  };

  jMID.Decoder.prototype = {
    decode : function() {
      var header       = _readChunk.call(this);
      var headerStream = new jMID.Stream(header.data);
      var format       = headerStream.readInt16();
      var trackCount   = headerStream.readInt16();
      var time         = headerStream.readInt16();

      this.tracks = [];
      this.header = {
        format : format,
        trackCount : trackCount,
        ticksPerBeat : time
      };
      for (var i = 0; i < trackCount; i++) {
        this.tracks[i] = [];
        var chunk = _readChunk.call(this);
        var stream = new jMID.Stream(chunk.data);
        while (!stream.eof()) {
          this.tracks[i].push(_readEvent.call(this, stream));
        } 
      }
    }
  };

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
    jMID_CHANNEL_PREFIX : 0x20,
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


  return jMID; // Export

}(jMID || {}));var jMID = (function(jMID) {

  ///////////////////////////////////////////////////////
  ////////////////// Channel sub class /////////////// //
  ///////////////////////////////////////////////////////

  var Channel = function() {
    this.generatorsByNote = {};
    this.currentProgram = "";
  };

  Channel.prototype = {
    noteOn : function(note, velocity) {
      var gNote = this.generatorsByNote

      // if (this.generatorsByNote[note] && !generatorsByNote[note])
    }
  };

  //////////////////////////////////////////////////////////
  ////////////////////// jMID Player class ////////////// //
  //////////////////////////////////////////////////////////

  jMID.Player = function(decodedMidi, options) {
    this.BPM          = 120;
    this.channelCount = 16;
    this.synth = null;

    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }

    this.trackStates = [];
    this.TPB         = decodedMidi.header.ticksPerBeat;
    this.data        = decodedMidi;

    for (var i = 0, _len = decodedMidi.tracks.length; i < _len; i++) {
      trackStates[i] = {
        nextEventIndex : 0,
        ticksToNextEvent : decodedMidi.tracks[i].length ? decodedMidi.tracks[i][0].time : null
      };
    }
  };

  jMID.Player.prototype = {};

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

}(jMID || {}));