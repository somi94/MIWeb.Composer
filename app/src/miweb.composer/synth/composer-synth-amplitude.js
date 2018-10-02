var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Amplitude = function(attack,decay,sustain,release) {
	MIWeb.Curves.Curve.call(this);
	
	this.attack = attack || 0.025;
	this.decay = decay || 0.075;
	this.sustain = sustain || 0.5;
	this.release = release || 0.1;
};
MIWeb.Composer.Synth.Amplitude.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Amplitude.prototype.constructor = MIWeb.Composer.Synth.Amplitude;
MIWeb.Composer.Synth.Amplitude.prototype.getLength = function() {
	return 1;
};
MIWeb.Composer.Synth.Amplitude.prototype.getValue = function(x) {
	if(x < this.attack) {
		return x / this.attack;
	} else if(x < this.attack + this.decay) {
		return (1 - (x - this.attack) / this.decay) * (1 - this.sustain) + this.sustain;
	} else if(x > 1 - this.release) {
		return (1 - (x - (1 - this.release)) / this.release) * this.sustain;
	}
	return this.sustain;
};
MIWeb.Composer.Synth.Amplitude.prototype.getControls = function() {
	return '\
		<label>Attack</label><input name="attack" type="range" min="0" max="1" step="0.01" value="' + this.attack + '" >\
		<label>Decay</label><input name="decay" type="range" min="0" max="1" step="0.01" value="' + this.decay + '" >\
		<label>Sustain</label><input name="sustain" type="range" min="0" max="1" step="0.01" value="' + this.sustain + '" >\
		<label>Release</label><input name="release" type="range" min="0" max="1" step="0.01" value="' + this.release + '" >\
	\
	';
};