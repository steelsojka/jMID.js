var jMID = (function(jMID) {

  /**
   * TODO: There is an unknown error happening when MIDI file data is brought in
   * through an AJAX call instead of through the File API. Fix it.
   */

  //////////////////////////////////////////////////////////////////
  ////////////////////////// Private Methods ///////////////////////
  //////////////////////////////////////////////////////////////////

  var _readEvent = function(stream, track) {
    var event = new jMID.Event({
      track : track
    });
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
          tracks[i].pushEvent(_readEvent.call(this, stream, tracks[i]));
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

}(jMID || {}));