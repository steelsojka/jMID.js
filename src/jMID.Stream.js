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

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Stream);
  }

  return jMID; // Export

}(jMID || {}));