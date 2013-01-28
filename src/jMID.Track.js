var jMID = (function(jMID) {

  jMID.Track = function(events) {
    this.events = events || [];
  };

  jMID.Track.prototype = {
    pushEvent : function(event) {
      this.events.push(event);
      return this;
    },
    getEvents : function(index) {
      if (typeof index !== "undefined") {
        if (index >= 0 && index < this.events.length) {
          return this.events[index];
        } else {
          return null;
        }
      } else {
        return this.events;
      }
    },
    removeEvents : function() {
      var what, a = arguments, L = a.length, ax;
      while (L && this.events.length) {
        what = a[--L];
        while ((ax = this.events.indexOf(what)) !== -1) {
          this.events.splice(ax, 1);
        }
      }
      return this;
    },
    cloneEvents : function() {
      return this.events.slice(0);
    },
    encode : function() {
      var startByte   = [0x4d, 0x54, 0x72, 0x6b];
      // var endByte     = [0x0, 0xFF, 0x2F, 0x0];
      var eventBytes  = [];
      var trackLength = 0;

      for (var i = 0, _len = this.events.length; i < _len; i++) {
        var event = this.getEvents(i);
        var bytes = event.encode();
        trackLength += bytes.length;
        Array.prototype.push.apply(eventBytes, bytes);
      }

      // trackLength += endByte.length;

      var lengthBytes = jMID.Util.stringToBytes(trackLength.toString(16), 4);

      return jMID.Util.bytesToString(startByte.concat(lengthBytes, eventBytes));
    }
  };

  return jMID;

}(jMID || {}));