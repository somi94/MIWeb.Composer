var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Wave = function(base, modifier) {
	MIWeb.Curves.Curve.call(this);
	
	this.base = base || 'piano';
	this.modifier = modifier || 'smooth';
};
MIWeb.Composer.Synth.Wave.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Wave.prototype.constructor = MIWeb.Composer.Synth.Wave;
MIWeb.Composer.Synth.Wave.prototype.getLength = function() {
	return 1;
};
MIWeb.Composer.Synth.Wave.prototype.getBaseWave = function() {
	var base = this.base;
	if(MIWeb.Composer.Synth.Wave.Base[base]) {
		base = MIWeb.Composer.Synth.Wave.Base[base];
	}
	return base;
};
MIWeb.Composer.Synth.Wave.prototype.getModifier = function() {
	var mod = this.modifier;
	if(MIWeb.Composer.Synth.Wave.Modifiers[mod]) {
		mod = MIWeb.Composer.Synth.Wave.Modifiers[mod];
	}
	return mod;
};
MIWeb.Composer.Synth.Wave.prototype.getValue = function(x) {
	var base = this.getBaseWave();
	var mod = this.getModifier();
	return mod(base(x));
};
MIWeb.Composer.Synth.Wave.prototype.getControls = function() {
	return '\
	<select name="base">\
		<option value="flat" ' + (this.base == 'flat' ? 'selected' : '') + '>Flat</option>\
		<option value="sine" ' + (this.base == 'sine' ? 'selected' : '') + '>Sine</option>\
		<option value="piano" ' + (this.base == 'piano' ? 'selected' : '') + '>Piano</option>\
	</select>\
	<select name="modifier">\
		<option value="smooth" ' + (this.base == 'smooth' ? 'selected' : '') + '>Smooth</option>\
		<option value="blocks" ' + (this.base == 'blocks' ? 'selected' : '') + '>Blocks</option>\
	</select>\
	\
	';
};


MIWeb.Composer.Synth.Wave.Base = {
	flat: function(t) {
		return 0;
	},
	sine: function(t) {
		return Math.sin(2 * Math.PI * t);
	},
	piano: function(t) {
		var f = 1;
		var base = function(x){
			return Math.sin(2 * Math.PI * t * f + x);
		};
		
		return 1 * Math.sin(2 * Math.PI * t * f + (
			Math.pow(base(0), 2)
			+ (0.75 * base(0.25))
			+ (0.1 * base(0.5))
		));
	}
};

MIWeb.Composer.Synth.Wave.Modifiers = {
	smooth: function(v) {
		return v;
	},
	blocks: function(t) {
		return Math.round(v * 2) / 2;
	}
};