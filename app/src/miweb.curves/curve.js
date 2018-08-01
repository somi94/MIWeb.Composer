var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.Curve = function() {
};
/*MIWeb.Curves.Curve.prototype.getFrames = function(loopCount) {
};
MIWeb.Curves.Curve.prototype.getFrame = function(f) {
};*/
MIWeb.Curves.Curve.prototype.getLength = function() {
	return 1;
};
MIWeb.Curves.Curve.prototype.getValue = function(x) {
	return 0;
};