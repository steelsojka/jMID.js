var jMID = (function(exports) {

  var _checkCallbacks = function(e) {
    var x = this._callbacks.length;
    var _time = this.context.currentTime;
    var callbacks = this._callbacks;
    var callback, removed;

    while (x--) {
      callback = callbacks[x];
      if (callback[0] <= _time) {
        removed = callbacks.splice(callbacks.indexOf(callback), 1)[0];
        if (removed[2]) {
          removed[1].call(removed[2], e);
        } else {
          removed[1](e);
        }
      }
    }
  };

  var AudioTimer = function(context, buffer) {
    if (buffer == null) buffer = 512;
    this._callbacks = [];
    this.context = context || new webkitAudioContext();
    this.node = this.context.createScriptProcessor(buffer, 1, 1);
    this.node.onaudioprocess = _checkCallbacks.bind(this);
    this.node.connect(this.context.destination);
  };

  AudioTimer.prototype = {
    callbackAtTime : function(time, callback, context) {
      this._callbacks.push([time, callback, context]);
    },
    removeCallbackAtTime : function(callback, time) {
      var callbacks = this._callbacks;
      var x = callbacks.length;
      var _callback;

      while (x--) {
        _callback = callbacks[x];
        if (_callback[1] === callback) {
          if (time !== undefined) {
            if (time === _callback[0]) {
              callbacks.splice(callbacks.indexOf(_callback), 1);
            }
          } else {
            callbacks.splice(callbacks.indexOf(_callback), 1);
          }
        }
      }
    }
  };

  exports.AudioTimer = AudioTimer;

  return exports;

}(jMID || {}));