var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Frequency = function() {
	MIWeb.Curves.Curve.call(this);

    this.loop = true;
};
MIWeb.Composer.Synth.Frequency.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Frequency.prototype.constructor = MIWeb.Composer.Synth.Frequency;
MIWeb.Composer.Synth.Frequency.prototype.getLength = function() {
	return 1;
};
MIWeb.Composer.Synth.Frequency.prototype.getValue = function(x) {
	return 0;
};
MIWeb.Composer.Synth.Frequency.prototype.getControls = function() {
	return '\
	\
	';
};