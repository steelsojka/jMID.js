var jMID = (function(jMID) {

	var util;

	jMID.Event = function() {
		util = jMID.Util;
	};

	jMID.Event.prototype = {
		set : function() {
			var args = arguments;

			if (util.isObject(args[0])) {
				for (var key in args[0]) {
					if (args[0].hasOwnProperty(key)) {
						this[key] = args[0][key];
					}
				}
			} else if (util.isString(args[0])) {
				this[args[0]] = args[1];
			} else {
				return null;
			}
		},
		get : function(value) {
			return this[value];
		}
	};

	return jMID;

}(jMID || {}));