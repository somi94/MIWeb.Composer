var MIWeb = MIWeb || {};
MIWeb.Utilities = MIWeb.Utilities || {};

MIWeb.Utilities.Object = function() {};
MIWeb.Utilities.Object.merge = function() {
	var result = MIWeb.Utilities.Object.isObject(arguments[0]) ? arguments[0] : {};
	for(var o = 1; o < arguments.length; o++) {
		if(!MIWeb.Utilities.Object.isObject(arguments[o])) {
			continue;
		}
		for(var k in arguments[o]) {
			var v = arguments[o][k];
			if(MIWeb.Utilities.Object.isObject(v)) {
				if(result[k]) {
					v = MIWeb.Utilities.Object.merge(result[k], v);
				} else {
					v = MIWeb.Utilities.Object.merge({}, v);
				}
			}
			result[k] = v;
		}
	}
	return result;
};
MIWeb.Utilities.Object.isObject = function(val) {
	return val === Object(val);
};