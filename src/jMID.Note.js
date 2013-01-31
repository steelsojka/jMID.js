var jMID = (function() {

  jMID.Note = function(noteOn, noteOff, track) {
    this.noteOn      = noteOn;
    this.noteOff     = noteOff;
    this.start       = noteOn.time;
    this.end         = noteOff.time;
    this.track       = track;
    this.velocity    = noteOn.velocity;
    this.noteNumber = noteOn.noteNumber;
    this.length      = noteOff.time - noteOn.time;
  };

  jMID.Note.prototype = {
    adjustTime : function(amount) {
      this.track.adjustEventTime(this.noteOn, amount);
      this.track.adjustEventTime(this.noteOff, amount);
      this.track.processNotes();
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
    }
  };

  return jMID;

}(jMID || {}));