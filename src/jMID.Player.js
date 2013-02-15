var jMID = (function(jMID) {

  /**
   * This module manages the timing and playback of a specific MIDI file.
   * Pass in a webkitAudioContext object if you have one or this will create one for you.
   * Listen for the 'event' event to handle events as they occur/
   * @example
   *
   * var player = new jMID.Player({
   *   file : myFile, // jMID.File
   * });
   *
   * player.on('event', function(e) {
   *   console.log(e);
   * })
   */

  //////////////////////////////////////////////////////////////
  /////////////////// EventQueue sub class /////////////////////
  //////////////////////////////////////////////////////////////

  var EventQueue = function(eventArray) {
    this.events = eventArray;
    this.queue = [];
    this.nextEvent = null;
  };

  EventQueue.prototype = {
    setQueue : function(time, iterator) {
      this.queue = this.events.filter(function(e, i, array) {
        return e.time >= time;
      });
      // this.nextEvent = this.queue[0] ? this.queue[0] : null;
    },
    queueNext : function() {
      this.queue.shift();
      this.nextEvent = this.queue.length ? this.queue[0] : null;      
    },
    getNextEvent : function() {
      return this.nextEvent;
    },
    triggerEvent : function() {
      this.trigger('eventTriggered', this.nextEvent);
      this.queueNext();
    },
    checkEvent : function(time) {
      if (this.queue.length < 1) {
        this.trigger('queueEmpty');
      }

      if (this.nextEvent === null) return;

      if (time >= this.nextEvent.time) {
        this.triggerEvent();
      }
    }
  };

  jMID.Emitter.register(EventQueue);

  var _endOfTrackTimeout = function() {
    var _this = this;
    var time = this.file.duration - this.currentPosition * 1000;

    _this.onTrackEndTimeout = setTimeout(_this.onTrackEnd, time);
  };

  //////////////////////////////////////////////////////////
  ////////////////////// jMID Player class /////////////////
  //////////////////////////////////////////////////////////

  jMID.Player = function(options) {
    if (!options.file) throw new Error("File is required");

    this.context         = options.context || new webkitAudioContext();
    this.currentPosition = 0;
    this.startTime       = 0;
    this.needsRequeue    = true;
    this.tracks          = [];
    this.schedules       = [];
    this.loop            = false;
    this.bufferSize      = options.bufferSize || 512;
    this.scriptNode      = this.context.createScriptProcessor(this.bufferSize, 1, 1);
    this.isPlaying       = false;
    this.onTrackEnd      = this.onTrackEnd.bind(this);
    this.endTimeout;

    this.scriptNode.connect(this.context.destination);

    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }

    this.initializeQueues();
    this.scriptNode.onaudioprocess = this.onAudioProcess.bind(this);
  };

  jMID.Player.prototype = {
    onAudioProcess : function(e) {
      if (this.isPlaying) {
        this.currentPosition = (this.getContextTime() - this.startContextTime) + this.startPosition;
        // for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        //   this.tracks[i].checkEvent(this.currentPosition * 1000); // Convert to milliseconds          
        // }
      }
    },
    initializeQueues : function() {
      this.tracks = [];
      for (var i = 0, _len = this.file.tracks.length; i < _len; i++) {
        this.tracks.push(new EventQueue(this.file.tracks[i].getEvents()));
        this.tracks[i].setQueue(this.currentPosition * 1000);
        this.tracks[i].on('eventTriggered', this.onEventTrigger.bind(this));
        this.tracks[i].on('queueEmpty', this.onQueueEmpty.bind(this));
      }
    },
    onQueueEmpty : function() {
      var isEmpty;
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        if (this.tracks[i].queue.length > 0) {
          isEmpty = false;
          break;
        } else {
          isEmpty = true;
        }
      }

      if (isEmpty) {
        this.trigger('endOfFile');
        this.stop();
        if (this.loop) {
          this.play();
        }
      }
    },
    onEventTrigger : function(e) {
      this.trigger('event', e);
    },
    addSchedule : function(func) {
      this.schedules.push(func);
    },
    removeSchedule : function(func) {
      this.schedules.splice(this.schedules.indexOf(func), 1);
    },
    scheduleEvents : function(iterator) {
      var track;
      var _this = this;
      jMID.Util.asyncLoop({
        length : this.tracks.length,
        func : function(_next, i) {
          track = _this.tracks[i];
          track.setQueue(_this.currentPosition * 1000);
          jMID.Util.asyncLoop({
            length : track.queue.length,
            func : function(next, j) {
              var e = track.queue[j];
              iterator.call(_this, e, ((e.time / 1000) - _this.currentPosition) + _this.getContextTime());
              next();
            },
            callback : function() {

            }
          });
          _next();
        },
        callback : function() {

        }
      });
    },
    queueEvents : function() {
      for (var i = 0, _len = this.tracks.length; i < _len; i++) {
        this.tracks[i].setQueue(this.currentPosition * 1000);
      }
    },
    getContextTime : function() {
      return this.context.currentTime;
    },
    getCurrentTime : function() {
      return this.currentPosition;
    },
    gotoPosition : function(time) {
      this.currentPosition = time;
      this.queueEvents();
    },
    onTrackEnd : function() {
      this.stop(this.loop);
      this.trigger('endOfTrack');
      if (this.loop) {
        this.trigger('loop');
        this.play();
      }
    },
    setLoop : function(bool) {
      this.loop = bool;
    },
    play : function() {
      for (var i = 0, _len = this.schedules.length; i < _len; i++) {
        this.scheduleEvents(this.schedules[i]);
      }

      _endOfTrackTimeout.call(this);
      
      this.startContextTime = this.getContextTime();
      this.startPosition = this.currentPosition;
      this.isPlaying = true;
      this.trigger('play');
    },
    pause : function() {
      this.isPlaying = false;
      this.trigger('pause');
      clearTimeout(this.onTrackEndTimeout);
    },
    stop : function(silent) {
      clearTimeout(this.onTrackEndTimeout);
      this.currentPosition = 0;
      this.isPlaying = false;
      this.needsRequeue = true;
      if (!silent) {
        this.trigger('stop');
      }
      // this.queueEvents();
    }
  };

  jMID.Emitter.register(jMID.Player);

  return jMID;

}(jMID || {}));