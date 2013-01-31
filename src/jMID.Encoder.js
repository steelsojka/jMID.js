var jMID = (function() {

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

}(jMID || {}));