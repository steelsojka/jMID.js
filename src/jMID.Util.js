var jMID = (function(jMID) {

	jMID.Util = {
		isObject : function(obj) {
			return obj === Object(obj);
		},
		asciiToHex : function(str) {
			var temp = "";
			for (var i = 0, _len = str.length; i < _len; i++) {
				temp += str.charCodeAt(i).toString(16);
			}
			return temp;
		},
		hexToAscii : function(hex) {
			var str = "";
			for (var i = 0, _len = hex.length; i < _len; i++) {
		    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
				hex[i]
			}
		  return str;
		},
		hexToBinary : function(hex) {
			return hex.toString(2);
		}
	};

	var isTypes = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp']
	for (var i = isTypes.length - 1; i >= 0; i--) {
		(function(name) {
			jMID.Util['is' + name] = function(obj) {
				return toString.call(obj) == '[object ' + name + ']';
			}
		}(isTypes[i]));

	};

	return jMID;

}(jMID || {}));