var jMID = (function(jMID) {

  ///////////////////////////////////////////////////////
  ////////////////// Channel sub class /////////////// //
  ///////////////////////////////////////////////////////

  var Channel = function() {
    this.generatorsByNote = {};
    this.currentProgram = "";
  };

  Channel.prototype = {
    noteOn : function(note, velocity) {
      var gNote = this.generatorsByNote

      // if (this.generatorsByNote[note] && !generatorsByNote[note])
    }
  };

  //////////////////////////////////////////////////////////
  ////////////////////// jMID Player class ////////////// //
  //////////////////////////////////////////////////////////

  jMID.Player = function(decodedMidi, options) {
    this.BPM          = 120;
    this.channelCount = 16;
    this.synth = null;

    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }

    this.trackStates = [];
    this.TPB         = decodedMidi.header.ticksPerBeat;
    this.data        = decodedMidi;

    for (var i = 0, _len = decodedMidi.tracks.length; i < _len; i++) {
      trackStates[i] = {
        nextEventIndex : 0,
        ticksToNextEvent : decodedMidi.tracks[i].length ? decodedMidi.tracks[i][0].time : null
      };
    }
  };

  jMID.Player.prototype = {};

  return jMID;

}(jMID || {}));