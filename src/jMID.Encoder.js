var jMID = (function() {

  var _encodeHeader = function(header, string) {
    string += "MThd\x00\x00\x00\x00\x00\x06";
    string += header.format();
  };

  jMID.Encoder = function() {};

  jMID.Encoder.prototype = {
    encode : function(file) {
      var encoded = "";

      _encodeHeader(file.getHeader(), encoded);
    }
  };

  return jMID;

}(jMID || {}));