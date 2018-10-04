var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Amplitude = function() {
	MIWeb.Curves.Curve.call(this);
	
	this.applyPreset('fade');
};
MIWeb.Composer.Synth.Amplitude.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Amplitude.prototype.constructor = MIWeb.Composer.Synth.Amplitude;
MIWeb.Composer.Synth.Amplitude.prototype.applyPreset = function(preset) {
    if(MIWeb.Composer.Synth.Amplitude.Presets[preset]) {
    	preset = MIWeb.Composer.Synth.Amplitude.Presets[preset];
	}

	for(var att in preset) {
		this[att] = preset[att];
	}
};
MIWeb.Composer.Synth.Amplitude.prototype.getLength = function() {
	return 1;
};
MIWeb.Composer.Synth.Amplitude.prototype.getValue = function(x) {
	if(x <= this.attack) {
		return x / this.attack;
	} else if(x <= this.attack + this.decay) {
		var d = (x - this.attack) / this.decay;
        if(this.decayBend < 0) d = 1 - d;
		if(this.decayBend) {
			d = Math.pow(d, Math.abs(this.decayBend) + 1);
		}
        if(this.decayBend < 0) d = 1 - d;
		return 1 - d * (1 - this.sustain);
	} else if(x > 1 - this.release) {
		var r = (x - (1 - this.release)) / this.release;
        if(this.releaseBend < 0) r = 1 - r;
        if(this.releaseBend) {
            r = Math.pow(r, Math.abs(this.releaseBend) + 1);
        }
        if(this.releaseBend < 0) r = 1 - r;
		return (1 - r) * this.sustain;
	}
	return this.sustain;
};
MIWeb.Composer.Synth.Amplitude.prototype.getControls = function() {
	return '\
	<div class="curve-control-row">\
		<label>Attack <span class="value-attack">' + this.attack + '</span></label>\
		<input name="attack" type="range" min="0" max="1" step="0.01" value="' + this.attack + '" >\
		<label>Decay <span class="value-decay">' + this.decay + '</span></label>\
		<input name="decay" type="range" min="0" max="1" step="0.01" value="' + this.decay + '" >\
		<label>Decay Bend <span class="value-decayBend">' + this.decayBend + '</span></label>\
		<input name="decayBend" type="range" min="-1" max="1" step="0.1" value="' + this.decayBend + '" >\
	</div>\
	<div class="curve-control-row">\
		<label>Sustain <span class="value-sustain">' + this.sustain + '</span></label>\
		<input name="sustain" type="range" min="0" max="1" step="0.01" value="' + this.sustain + '" >\
		<label>Release <span class="value-release">' + this.release + '</span></label>\
		<input name="release" type="range" min="0" max="1" step="0.01" value="' + this.release + '" >\
		<label>Release Bend <span class="value-releaseBend">' + this.releaseBend + '</span></label>\
		<input name="releaseBend" type="range" min="-1" max="1" step="0.1" value="' + this.releaseBend + '" >\
	</div>\
	';
};
MIWeb.Composer.Synth.Amplitude.Presets = {
    fade: {
        attack: 0.01,
        decay: 0.99,
        decayBend: -1,
        sustain: 0,
        release: 0,
		releaseBend: 0
    },
    smoothFade: {
        attack: 0.3,
        decay: 0.7,
        decayBend: -1,
        sustain: 0,
        release: 0,
        releaseBend: 0
    },
    linearSustain: {
    	attack: 0.01,
		decay: 0.04,
		decayBend: 0,
		sustain: 0.5,
		release: 0.05,
        releaseBend: 0
	}
};