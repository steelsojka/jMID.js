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
    NOTES : ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
    BASE_A4 : 440
  };

  var _generateNoteTable = function() {
    var x = 0, i = 0;
    var _arr = [];
    var _nLen = conf.NOTES.length
    while (x < 128) {
      _arr[x] = conf.NOTES[i] + Math.floor(x / 12);
      i++;
      if (i >= _nLen) i = 0;
      x++;
    }
    return _arr;
  }

  //////////////////////////////////////////////////////
  /////////////////// jMID Converter Class /////////////
  //////////////////////////////////////////////////////

  jMID.Converter = {
    _type : 0,
    noteToFrequency : function(note) {
      if (_inBounds(0, 127, note)) {
        return conf.BASE_A4 * Math.pow(2, (note - 69) / 12);
      } else {
        return -1;
      }
    },
    noteToName : function(note) {
      if (parseInt(note, 10) === NaN) return note;
      
      if (_inBounds(0, 127, note)) {
        return this.Notes[note];
        // return (conf.NOTES[note % 12] + (Math.round(note / 12)).toString()).replace(/\s+/g, '');
      } else {
        return '---';
      }
    },
    frequencyToNote : function(freq) {
      return Math.round(12 * (Math.log(freq / conf.BASE_A4) / Math.log(2))) + 69;
    },
    nameToNote : function(string) {
      return this.Notes.indexOf(string);
      // var c, i, s, _len;

      // if (string.length === 2) {
      //   s = string[0] + " " + string[1];
      // } else if (string.length > 2) {
      //   return -1;
      // }
      // s.toUpperCase();
      // c = -1;
      // for (i = 0, _len = conf.NOTES.length; i < _len; i++) {
      //   if (conf.NOTES[i] === s[0] + s[1]) {
      //     c = i;
      //     break;
      //   }
      // }
      // try {
      //   i = parseInt(s[2], 10);
      //   return i * 12 + c;
      // } catch(err) {
      //   return -1;
      // }

      // if (c < 0) return -1;
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

  jMID.Converter.Notes = _generateNoteTable();

  jMID.Converter.Types = {
    NOTE_TO_FREQUENCY : 0,
    NOTE_TO_NAME      : 1,
    FREQUENCY_TO_NOTE : 2,
    NAME_TO_NOTE      : 3
  };

  return jMID;

}(jMID || {}));
