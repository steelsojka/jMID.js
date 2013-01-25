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
    var event = new jMID.Event();
    event.set('time', stream.readVarInt());
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
    event.set('type', jMID.Decoder.EventTypes.SYSEX);
    var length = stream.readVarInt();
    event.set('data', stream.read(length));
    return event;
  };

  var _parseMetaEvent = function(event, stream) {
    event.set('type', jMID.Decoder.EventTypes.META);

    var subType = stream.readInt8();
    var length  = stream.readVarInt();
    var types   = jMID.Decoder.SubEventTypes;

    for (var key in types) {
      var type = types[key];

      if (subType == type) {
        event.set('subtype', type);

        switch (type) {
          case types.SEQUENCE_NUMBER: 
            event.set('number', stream.readInt16()); break;

          case types.jMID_CHANNEL_PREFIX:
            event.set('channel', stream.readInt8()); break;
          
          case types.SET_TEMPO:
            event.set('microsecondsPreBeat', (stream.readInt8() << 16) +
                                        (stream.readInt8() << 8) +
                                        (stream.readInt8()));
            break;
          
          case types.SMPTE_OFFSET:
            var hour        = stream.readInt8();
            event.set({
              frameRate : {0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30}[hourByte & 0x60],
              hour      : hour & 0x1f,
              min       : stream.readInt8(),
              sec       : stream.readInt8(),
              frame     : stream.readInt8(),
              subframe  : stream.readInt8()
            });

            break;
          
          case types.TIME_SIGNATURE:
            event.set({
              numerator     : stream.readInt8(),
              denominator   : Math.pow(2, stream.readInt8()),
              metronome     : stream.readInt8(),
              thirtyseconds : stream.readInt8()
            });
            break;

          case types.KEY_SIGNATURE:
            event.set({
              key : stream.readInt8(true),
              scale : stream.readInt8()
            });
            break;

          case types.TEXT:
          case types.COPYRIGHT_NOTICE:
          case types.TRACK_NAME:
          case types.INSTRUMENT_NAME:
          case types.LYRICS:
          case types.MARKER:
          case types.CUE_POINT:
            event.set('text', stream.read(length));
            break;

          case types.END_OF_TRACK:
            break;

          case types.SEQUENCER_SPECIFIC:
          default:
            event.set('data', stream.read(length));
        }
        break;
      }
    }

    return event;
  };

  var _parseDividedSysexEvent = function() {
    event.set('type', jMID.Decoder.EventTypes.DIVIDED_SYSEX);
    var length = stream.readVarInt();
    event.set('data', stream.read(length));
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
    event.set('channel', eventByte & 0x0f);
    event.set('type', "channel");

    for (var key in types) {
      var type = types[key];

      if (eventType == type) {
        event.set('subtype', type);

        switch (type) {
          case types.NOTE_OFF:
            event.set('noteNumber', param1);
            event.set('velocity',  stream.readInt8());
            break;
          case types.NOTE_ON:
            event.set('noteNumber', param1);
            event.set('velocity', stream.readInt8());
            if (event.get('velocity') == 0) {
              event.set('subtype', types.NOTE_OFF);
            }
            break;
          case types.NOTE_AFTER_TOUCH:
            event.set('noteNumber', param1);
            event.set('amount', stream.readInt8());
            break;
          case types.CONTROLLER:
            event.set('controllerType', param1);
            event.set('value', stream.readInt8());
            break;
          case types.PROGRAM_CHANGE:
            event.set('programNumber', param1);
            break;
          case types.CHANNEL_AFTER_TOUCH:
            event.set('amount', param1);
            break;
          case types.PITCH_BEND:
            event.set('value', param1 + (stream.readInt8() << 7));
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