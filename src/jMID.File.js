var jMID = (function(jMID) {

	jMID.File = function(decoded) {
		for (var key in decoded) {
			if (decoded.hasOwnProperty(key)) {
				this[key] = decoded[key];
			}
		}
	};

	jMID.File.prototype = {

	};

	return jMID;

}(jMID || {}));