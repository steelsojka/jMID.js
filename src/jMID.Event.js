var jMID = (function(jMID) {


  var _encodeChannelEvent = function(event) {
    var byteArray = [];

    var typeByte = jMID.Util.getType(event.subtype);
    var typeChannelByte = parseInt(typeByte.toString(16) + event.channel.toString(16), 16);

    Array.prototype.push.apply(byteArray, jMID.Util.writeVarInt(event.time));
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
    var byteArray = [event.time, 0xff, jMID.Util.getType(event.subtype)];

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

}(jMID || {}));