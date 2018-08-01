var MIWeb = MIWeb || {};
MIWeb.Utilities = MIWeb.Utilities || {};

MIWeb.Utilities.Object = function() {};
MIWeb.Utilities.Object.merge = function() {
	var array =
		MIWeb.Utilities.Object.isArray(arguments[0]) ||
		(!MIWeb.Utilities.Object.isObject(arguments[0]) && MIWeb.Utilities.Object.isArray(arguments[1]))
	;
	var result = arguments[0] || (array ? [] : {});
	for(var o = 1; o < arguments.length; o++) {
		if(
			(!array && !MIWeb.Utilities.Object.isObject(arguments[o])) ||
			(array && !MIWeb.Utilities.Object.isArray(arguments[o]))
		) {
			continue;
        }
		if(array) {
			for(var i = 0; i < arguments[o].length; i++) {
                var v = arguments[o][i];
                if(MIWeb.Utilities.Object.isObject(v) || MIWeb.Utilities.Object.isArray(v)) {
                    v = MIWeb.Utilities.Object.merge(null, v);
                }
				result.push(v);
			}
        } else {
            for(var k in arguments[o]) {
                var v = arguments[o][k];
                if(MIWeb.Utilities.Object.isObject(v) || MIWeb.Utilities.Object.isArray(v)) {
                    if(result[k]) {
                        v = MIWeb.Utilities.Object.merge(result[k], v);
                    } else {
                        v = MIWeb.Utilities.Object.merge(null, v);
                    }
                }
                result[k] = v;
            }
		}
	}
	return result;
};
MIWeb.Utilities.Object.isObject = function(val) {
	return val === Object(val);
};
MIWeb.Utilities.Object.isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};