var jMID = (function(jMID) {

  var _toMilliseconds = function(ms) { return ms / 1000; };
  var _toSeconds = function(ms) { return ms / 1000000; };

  jMID.File = function(decoded) {
    for (var key in decoded) {
      if (decoded.hasOwnProperty(key)) {
        this[key] = decoded[key];
      }
    }

    this.timeSignature = { // Defaults
      beatsPerBar : 4,
      beatValue : 4
    };

    this.timing = {
      MicroSPB : 500000,
      MSPQN : 500,
      MSPT : 500 / 960
    };

    if (!this.header) {
      this.header = {
        format : 0,
        trackCount : 1,
        ticksPerBeat : 960
      };
    };

    if (this.tracks) {
      this.processMetaEvents();
      
      for (var i = this.tracks.length - 1; i >= 0; i--) {
        this.tracks[i].timing = this.timing;
      };

      this.processChannelEventTimes();
      this.processNotes();      
    } else {
      this.tracks = [new jMID.Track()];
      this.header.trackCount = 1;
      this.calculateBPM();
    }

  };

  jMID.File.prototype = {
    processMetaEvents : function() {
      var meta = jMID.Query(this).filter("type:meta")
                                 .not("subtype:endOfTrack, subtype:trackName")
                                 .toArray();
      
      for (var i = 0, _len = meta.length; i < _len; i++) {
        switch (meta[i].subtype) {
          case "timeSignature":
            this.timeSignature.beatsPerBar = meta[i].numerator;
            this.timeSignature.beatValue = meta[i].denominator;
            break;
          case "setTempo":
            this.timing.MicroSPB = meta[i].microsecondsPerBeat;
            break;
        }
      }

      this.calculateBPM();
      this.timing.MSPQN = this.timing.MicroSPB / 1000;
      this.timing.MSPT = this.timing.MSPQN / this.header.ticksPerBeat;
    },
    processChannelEventTimes : function() { 
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        this.tracks[i].processChannelEventTimes();
      }
    },
    processNotes : function() {
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        this.tracks[i].processNotes();
      }
    },
    calculateBPM : function() {
      var microsecondsPerMinute = 60000000;
      this.timing.BPM = (microsecondsPerMinute / this.timing.MicroSPB) *
                        (this.timeSignature.beatValue / 4);
    },
    createTrack : function(events) {
      this.tracks.push(new jMID.Track(events));
    },
    removeTrack : function(i) {
      this.tracks.splice(i, 1);
    },
    getTrack : function(i) {
      return this.tracks[i];
    },
    getHeader : function() {
      return this.header;
    },
    encode : function() {
      return new jMID.Encoder().encode(this);
    },
    base64Encode : function() {
      return btoa(this.encode());
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.File);
  }

  return jMID;

}(jMID || {}));