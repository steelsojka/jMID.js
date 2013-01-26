var jMID = (function(jMID) {

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

	var util;

	jMID.Event = function() {
		util = jMID.Util;
	};

	jMID.Event.prototype = {
		set : function() {
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

	jMID.File = function(decoded) {
		for (var key in decoded) {
			if (decoded.hasOwnProperty(key)) {
				this[key] = decoded[key];
			}
		}
	};

	jMID.File.prototype = {

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
    event.set('type', 'sysex');
    var length = stream.readVarInt();
    event.set('data', stream.read(length));
    return event;
  };

  var _parseMetaEvent = function(event, stream) {
    event.set('type', 'meta');

    var subType = stream.readInt8();
    var length  = stream.readVarInt();
    var types   = jMID.Decoder.SubEventTypes;

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
            event.set('microsecondsPreBeat', (stream.readInt8() << 16) +
                                        (stream.readInt8() << 8) +
                                        (stream.readInt8()));
            event.set('subtype', 'setTempo');
            break;
          
          case types.SMPTE_OFFSET:
            var hour        = stream.readInt8();
            event.set({
              frameRate : {0x00: 24, 0x20: 25, 0x40: 29, 0x60: 30}[hourByte & 0x60],
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
            event.set('value', param1 + (stream.readInt8() << 7));
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
        tracks[i] = [];
        var chunk = _readChunk(_stream);
        var stream = new jMID.Stream(chunk.data);
        while (!stream.eof()) {
          tracks[i].push(_readEvent.call(this, stream));
        } 
      }

      return new jMID.File({
        header : _header,
        tracks : tracks
      });
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
     tracks.push(new Array());
     
      for (var z = 0, _len4 = track.length; z < _len4; z++) {
        var event = track[z];
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
            tracks[y].push(event);
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
      var results = query ? _search.call(this, query) : this._results;
      var newResults = [];

      for (var i = 0, _len = results.tracks.length; i < _len; i++) {
        var track = results.tracks[i];
        newResults.push(_remove.apply(this._results.tracks[i], track));
      }

      return new jMIDQueryResult(this._file, {tracks : newResults});
    },
    apply : function() {
      for (var i = 0, _len = this._results.tracks.length; i < _len; i++) {
        var track = this._results.tracks[i];
        this._file.tracks[i] = track.slice(0);
      }

      return new jMIDQueryResult(this._file);
    }
  };

  jMID.Query = function(midiFile) {
    if (!midiFile) {
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
