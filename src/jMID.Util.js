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
    asyncLoop : function(o) {
      var i = -1;
      var next = function() {
        if (++i === o.length) { o.callback(); return; }
        o.func(next, i);
      };
      next();
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

}(jMID || {}));