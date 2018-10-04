var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Frequency = function() {
	MIWeb.Curves.Curve.call(this);

    this.loop = true;
	this.applyPreset('flat');
};
MIWeb.Composer.Synth.Frequency.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Frequency.prototype.constructor = MIWeb.Composer.Synth.Frequency;
MIWeb.Composer.Synth.Frequency.prototype.applyPreset = function(preset) {
    if(MIWeb.Composer.Synth.Amplitude.Presets[preset]) {
    	preset = MIWeb.Composer.Synth.Amplitude.Presets[preset];
	}

	for(var att in preset) {
		this[att] = preset[att];
	}
};
MIWeb.Composer.Synth.Frequency.prototype.getLength = function() {
	return 1;
};
MIWeb.Composer.Synth.Frequency.prototype.getValue = function(x) {
	var v = 0;
	if(this.sine) {
		v = Math.sin(x * 2 * Math.PI * this.sine);
	}
	if(this.raise) {
		var r = x % 1;
        if(this.raiseBend < 0) r = 1 - r;
        if(this.raiseBend) {
            r = Math.pow(r, Math.abs(this.raiseBend) + 1);
        }
        if(this.raiseBend < 0) r = 1 - r;
        v += r * this.raise;
	}

	return v;
};
MIWeb.Composer.Synth.Frequency.prototype.getControls = function() {
	return '\
	<div class="curve-control-row">\
		<label>Sine <span class="value-sine">' + this.sine + '</span></label>\
		<input name="sine" type="range" min="0" max="10" step="0.5" value="' + this.sine + '" >\
		<label>Raise <span class="value-raise">' + this.raise + '</span></label>\
		<input name="raise" type="range" min="-1" max="1" step="0.1" value="' + this.raise + '" >\
		<label>Raise Bend <span class="value-raiseBend">' + this.raiseBend + '</span></label>\
		<input name="raiseBend" type="range" min="-1" max="1" step="0.1" value="' + this.raiseBend + '" >\
	</div>\
	';
};
MIWeb.Composer.Synth.Frequency.Presets = {
    flat: {
        sine: 0,
		raise: 0,
		raiseBend: 0
    }
};