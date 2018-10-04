var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.Wave = function(base, modifier) {
	MIWeb.Curves.Curve.call(this);
	
	this.base = base || 'piano';
	this.modifier = modifier || 'smooth';
	this.loop = true;
	this.reset();
};
MIWeb.Composer.Synth.Wave.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Composer.Synth.Wave.prototype.constructor = MIWeb.Composer.Synth.Wave;
MIWeb.Composer.Synth.Wave.prototype.reset = function() {
    this.vars = {};
};
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
	return mod.call(this, base.call(this,x));
};
MIWeb.Composer.Synth.Wave.prototype.getControls = function() {
	return '\
	<label>Base Wave</label>\
	<select name="base">\
		<option value="cubic" ' + (this.base == 'cubic' ? 'selected' : '') + '>Cubic</option>\
		<option value="spikes" ' + (this.base == 'spikes' ? 'selected' : '') + '>Spikes</option>\
		<option value="sine" ' + (this.base == 'sine' ? 'selected' : '') + '>Sine</option>\
		<option value="piano" ' + (this.base == 'piano' ? 'selected' : '') + '>Piano</option>\
		<option value="organ" ' + (this.base == 'organ' ? 'selected' : '') + '>Organ</option>\
        <option value="acoustic" ' + (this.base == 'acoustic' ? 'selected' : '') + '>Acoustic</option>\
        <option value="edm" ' + (this.base == 'edm' ? 'selected' : '') + '>EDM</option>\
	</select>\
	<label>Wave Modifier</label>\
	<select name="modifier">\
		<option value="smooth" ' + (this.base == 'smooth' ? 'selected' : '') + '>Smooth</option>\
		<option value="clamp" ' + (this.base == 'clamp' ? 'selected' : '') + '>Clamp</option>\
		<option value="round" ' + (this.base == 'round' ? 'selected' : '') + '>Round</option>\
		<option value="steps" ' + (this.base == 'steps' ? 'selected' : '') + '>Steps</option>\
	</select>\
	\
	';
};


MIWeb.Composer.Synth.Wave.Modules = [
	function(t, x) { x = x || 0; return Math.sin(2 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return Math.sin(2 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return Math.sin(4 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return Math.sin(8 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return Math.sin(0.5 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return Math.sin(0.25 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return 0.5 * Math.sin(2 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return 0.5 * Math.sin(4 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return 0.5 * Math.sin(8 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return 0.5 * Math.sin(0.5 * Math.PI * t + x); },
    function(t, x) { x = x || 0; return 0.5 * Math.sin(0.25 * Math.PI * t + x); }
];


MIWeb.Composer.Synth.Wave.Base = {
	flat: function(t) {
		return 0;
	},
    cubic: function(t) {
		t = t % 1;
        //return t < 0.5 ? 1 : -1;
		return t < 0.125 || (t >= 0.375 && t < 0.625) || t >= 0.875 ? 0 : (t < 0.5 ? 1 : -1);
    },
	spikes: function(t) {
        t = t % 1;
		if(t < 0.25) {
			return t / 0.25;
		} else if(t < 0.5) {
			return 1 - (t - 0.25) / 0.25;
		} else if(t < 0.75) {
			return -(t - 0.5) / 0.25;
		}
        return -(1 - (t - 0.75) / 0.25)
	},
	sine: function(t) {
		return Math.sin(2 * Math.PI * t);
	},
	piano: function(t) {
		var f = 1;
		var base = MIWeb.Composer.Synth.Wave.Modules[0];
		
		return Math.sin(2 * Math.PI * t * f + (
			Math.pow(base(t, 0), 2)
			+ (0.75 * base(t, 0.25))
			+ (0.1 * base(t, 0.5))
		));
	},
    organ: function(t) {
        var f = 1;
        var base = MIWeb.Composer.Synth.Wave.Modules[0];

        return Math.sin(2 * Math.PI * t * f + (
            base(t,0)
            + (0.5 * base(t,0.25))
            + (0.25 * base(t,0.5))
        ));
    },
    acoustic: function(t) {
        var vars = this.vars;
        vars.valueTable = !vars.valueTable?[]:vars.valueTable;
        if(typeof(vars.playVal)=='undefined') { vars.playVal = 0; }
        if(typeof(vars.periodCount)=='undefined') { vars.periodCount = 0; }

        var valueTable = vars.valueTable;
        var playVal = vars.playVal;
        var periodCount = vars.periodCount;

        var period = this.synth.sampleRate / this.synth.getFrequency();
        var p_hundredth = Math.floor((period-Math.floor(period))*100);

        var resetPlay = false;

        if(valueTable.length<=Math.ceil(period)) {

            valueTable.push(Math.round(Math.random())*2-1);

            return valueTable[valueTable.length-1];

        } else {

            valueTable[playVal] = (valueTable[playVal>=(valueTable.length-1)?0:playVal+1] + valueTable[playVal]) * 0.5;

            if(playVal>=Math.floor(period)) {
                if(playVal<Math.ceil(period)) {
                    if((periodCount%100)>=p_hundredth) {
                        // Reset
                        resetPlay = true;
                        valueTable[playVal+1] = (valueTable[0] + valueTable[playVal+1]) * 0.5;
                        vars.periodCount++;
                    }
                } else {
                    resetPlay = true;
                }
            }

            var _return = valueTable[playVal];
            if(resetPlay) { vars.playVal = 0; } else { vars.playVal++; }

            return _return;

        }
    },
	edm: function(t) {
		var base = MIWeb.Composer.Synth.Wave.Modules[0];
		var mod = MIWeb.Composer.Synth.Wave.Modules.slice(1);
        return mod[0](
            t,
            mod[9](
                t,
                mod[2](
                    t,
                    Math.pow(base(t, 0), 3) +
                    Math.pow(base(t, 0.5), 5) +
                    Math.pow(base(t, 1), 7)
                )
            ) +
            mod[8](
                t,
                base(t, 1.75)
            )
        );
	}
};

MIWeb.Composer.Synth.Wave.Modifiers = {
	smooth: function(v) {
		return v;
	},
	clamp: function(t) {
		return t < 0 ? -1 : 1;
	},
	round: function(t) {
        return Math.round(t);
	},
    steps: function(t) {
        return Math.round(t * 4) / 4;
    }
};