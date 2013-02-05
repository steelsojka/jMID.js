var jMID = (function(jMID) {

  jMID.Emitter = function() {};

  jMID.Emitter.prototype = {
    on : function(event, listener) {
      var events = event.split(" ");
      this.__events = this.__events || {};
      for (var i = 0, _len = events.length; i < _len; i++) {
        this.__events[events[i]] = this.__events[events[i]] || [];
        this.__events[events[i]].push(listener);
      }
    },
    off : function(event, listener) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      this.__events[event].splice(this.__events[event].indexOf(listener), 1);
    }, 
    trigger : function(event) {
      this.__events = this.__events || {};
      if (!(event in this.__events)) return;
      for (var i = 0, _len = this.__events[event].length; i < _len; i++) {
        this.__events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
      }
    }
  };

  jMID.Emitter.register = function(obj) {
    for (var key in jMID.Emitter.prototype) {
      if (jMID.Emitter.prototype.hasOwnProperty(key)) {
        obj.prototype[key] = jMID.Emitter.prototype[key];
      }
    }
  };

  return jMID;

}(jMID || {}));