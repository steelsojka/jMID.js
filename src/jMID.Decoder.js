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
    var types = jMID.Decoder.EventTypes;

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
    event.type = jMID.Decoder.EventTypes.SYSEX;
    var length = stream.readVarInt();
    event.data = stream.read(length);
    return event;
  };

  var _parseMetaEvent = function(event, stream) {
    event.type = jMID.Decoder.EventTypes.META;

    var subType = stream.readInt8();
    var length  = stream.readVarInt();
    var types   = jMID.Decoder.SubEventTypes;

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
    event.type = jMID.Decoder.EventTypes.DIVIDED_SYSEX;
    var length = stream.readVarInt();
    event.data = stream.read(length);
    return event;
  };

  var _parseChannelEvent = function(eventByte, event, stream) {
    var param1;
    var types = jMID.Decoder.SubEventTypes;

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

  jMID.Decoder.EventTypes = {
    META          : 0xff,
    SYSEX         : 0xf0,
    DIVIDED_SYSEX : 0xf7
  };

  jMID.Decoder.SubEventTypes = {
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

}(jMID || {}));