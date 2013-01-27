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
		},
		bytesToString : function(array) {
			return String.fromCharCode.apply(null, array);
		},
		stringToBytes : function(string, bytes) {
	    if (bytes) {
	        while ((string.length / 2) < bytes) {
	        	string = "0" + string;
	        }
	    }

	    var byteArray = [];
	    for (var i = string.length - 1; i >= 0; i -= 2) {
	      var chars = i === 0 ? string[i] : string[i-1] + string[i];
	      byteArray.unshift(parseInt(chars, 16));
	    }

   	 return byteArray;
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