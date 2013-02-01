var jMID = (function(jMID) {

  jMID.Note = function(_options) {
    this.track  = null;
    this.length = 0;
    var options = _options || {};

    if (options.noteOn) {
      this.noteOn = options.noteOn;
    } else {
      this.noteOn = new jMID.Event({
        type       : "channel",
        subtype    : "noteOn",
        deltaTime  : 0,
        time       : options.time || 0,
        velocity   : options.velocity || 90,
        noteNumber : options.noteNumber || 32,
        track      : options.track || null
      });
    }

    if (options.noteOff) {
      this.noteOff = options.noteOff;
    } else {
      this.noteOff = new jMID.Event({
        type       : "channel",
        subtype    : "noteOff",
        deltaTime  : 0,
        time       : options.length ? this.noteOn.time + options.length : this.noteOn.time + 100,
        velocity   : this.noteOn.velocity,
        noteNumber : this.noteOn.noteNumber,
        track      : options.track || null
      });
    }
      
    this.end        = this.noteOff.time;
    this.start      = this.noteOn.time;
    this.velocity   = this.noteOn.velocity;
    this.noteNumber = this.noteOn.noteNumber;
    this.length     = this.noteOff.time - this.noteOn.time;

    if (options.track) {
      this.track = options.track;

      if (!this.track.hasEvent(this.noteOn)) {
        this.track.insertEventAtTime(this.noteOn);
      }
      if (!this.track.hasEvent(this.noteOff)) {
        this.track.insertEventAtTime(this.noteOff);
      }

      this.track.insertNoteAtTime(this);
    }
  };

  jMID.Note.prototype = {
    adjustTime : function(amount) {
      this.track.adjustEventTime(this.noteOn, amount);
      this.track.adjustEventTime(this.noteOff, amount);
      this.track.positionNote(this);
    },
    adjustLength : function(amount) {
      this.track.adjustEventTime(this.noteOff, amount);
      this.length = this.noteOff.time - this.noteOn.time;
      this.end = this.noteOff.time;
    },
    adjustNoteNumber : function(amount) {
      this.setNoteNumber(this.noteNumber + amount);
    },
    setNoteNumber : function(noteNumber) {
      this.noteOn.noteNumber  = noteNumber;
      this.noteOff.noteNumber = noteNumber;
      this.noteNumber         = noteNumber;
    },
    setVelocity : function(velocity) {
      this.noteOn.velocity = velocity;
      this.velocity = velocity;
    },
    setChannel : function(channel) {
      if (!jMID.Util.inRange(channel, 0, 15)) return;
      this.noteOn.channel = channel;
      this.noteOff.channel = channel;
      this.channel = channel;
    },
    remove : function() {
      if (this.track !== null) {
        this.track.removeEvent(this.noteOn);
        this.track.removeEvent(this.noteOff);
        this.track.removeNote(this);
      }
    }
  };

  if (jMID.Emitter) {
    jMID.Emitter.register(jMID.Note);
  }

  return jMID;

}(jMID || {}));