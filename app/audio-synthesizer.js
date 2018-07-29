var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

MIWeb.Audio.Synthesizer = function(wave, amplitude, frequency, note, octave, volume, duration, sampleRate) {
	this.wave = wave || new MIWeb.Curve();
	this.amplitudeCurve = amplitude || new MIWeb.Curve();
	this.frequencyCurve = frequency || new MIWeb.Curve();
	this.setNote(note || 'C');
	this.setOctave(octave || 4);
	this.setVolume(volume || 1);
	this.setDuration(duration || 2);
	this.setSampleRate(sampleRate || 44100);
	this.debug = false;
};
MIWeb.Audio.Synthesizer.prototype.setNote = function(note) {
	if(MIWeb.Audio.Synthesizer.Notes[note]) {
		this.note = MIWeb.Audio.Synthesizer.Notes[note];
	} else {
		this.note = note;
	}
};
MIWeb.Audio.Synthesizer.prototype.applyPreset = function(preset, property) {
	if(MIWeb.Audio.Synthesizer.Presets[preset]) {
		preset = MIWeb.Audio.Synthesizer.Presets[preset];
	}
	preset = JSON.parse(JSON.stringify(preset));
	
	if(property) {
		if(preset[property]) {
			this.applyProperty(property, preset[property]);
		} else {
			console.error("preset does not contain property '" + property + "'");
		}
	} else {
		for(var p in preset) {
			this.applyProperty(p, preset[p]);
		}
	}
};
MIWeb.Audio.Synthesizer.prototype.applyProperty = function(name, val) {
	if((name == 'wave' || name == 'amplitudeCurve' || name == 'frequencyCurve') && !(val instanceof MIWeb.Curve)) {
		var tmp = val;
		var val = new MIWeb.Curve();
		for(var p in tmp) {
			val[p] = tmp[p];
		}
	}
	
	this[name] = val;
};
MIWeb.Audio.Synthesizer.prototype.setOctave = function(octave) {
	this.octave = Math.max(1, Math.min(8, octave));
};
MIWeb.Audio.Synthesizer.prototype.setVolume = function(volume) {
	this.volume = Math.max(0, volume);
};
MIWeb.Audio.Synthesizer.prototype.setDuration = function(duration) {
	this.duration = Math.max(0.01, duration);
};
MIWeb.Audio.Synthesizer.prototype.setSampleRate = function(sampleRate) {
	this.sampleRate = Math.max(4000, sampleRate);
}
MIWeb.Audio.Synthesizer.prototype.getFrequency = function() {
	return this.note * Math.pow(2, this.octave - 4);
};
MIWeb.Audio.Synthesizer.prototype.getSampleCount = function() {
	return (this.duration * this.sampleRate) | 0;
};
MIWeb.Audio.Synthesizer.prototype.generate = function() {
	if(this.debug) { 
		var timer = (new Date).valueOf();
		var minFrequency,maxFrequency,minAmplitude,maxAmplitude,minValue,maxValue;
	}
	
	var frequency = this.getFrequency();
	var sampleCount = this.getSampleCount();
	var data = [];
	var t,f,a;
	for(var s = 0; s < sampleCount; s++) {
		t = s / sampleCount;
		f = frequency * this.frequencyCurve.getValue(t);
		f = frequency + (frequency * this.frequencyCurve.getValue(t));
		a = this.amplitudeCurve.getValue(t);
		data.push(
			this.volume *
			a *
			this.wave.getValue((s / this.sampleRate) * f)
		);
		
		if(this.debug) {
			if(s == 0) {
				minFrequency = maxFrequency = f;
				minAmplitude = maxAmplitude = a;
				minValue = maxValue = data[s];
			} else {
				minFrequency = Math.min(f, minFrequency);
				maxFrequency = Math.max(f, maxFrequency);
				minAmplitude = Math.min(a, minAmplitude);
				maxAmplitude = Math.max(a, maxAmplitude);
				minValue = Math.min(data[s], minValue);
				maxValue = Math.max(data[s], maxValue);
			}
		}
	}
	
	if(this.debug) { 
		console.log('frequency: ', f, '(min: ', minFrequency, ', max: ', maxFrequency, '), amplitude: ', (minAmplitude + (maxAmplitude - minAmplitude) / 2), ' (min: ',minAmplitude,', max: ', maxAmplitude, '), value: ', this.volume, ' (min: ',minValue,', max: ', maxValue, ')');
		console.log((new Date).valueOf() - timer, 'ms to generate'); 
	}
	
	return new MIWeb.Audio.Clip(this.sampleRate, data);
};

MIWeb.Audio.Synthesizer.Notes = {
	'C':261.63,
	'C#':277.18,
	'D':293.66,
	'D#':311.13,
	'E':329.63,
	'F':346.23,
	'F#':369.99,
	'G':392.00,
	'G#':415.30,
	'A':440.00,
	'A#':466.16,
	'B':493.88
};

MIWeb.Audio.Synthesizer.Waves = {
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

MIWeb.Audio.Synthesizer.Presets = {
	/*constant: {
		wave: new MIWeb.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop')
	},*/
	sine: {
		wave: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.25,"y":1},"controlLeft":{"x":-0.125,"y":0},"controlRight":{"x":0.125,"y":0}},
			{"point":{"x":0.5,"y":0},"controlLeft":{"x":-0.017,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		/*amplitudeCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0, y: 0}}
		], '')*/
		amplitudeCurve: new MIWeb.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop')
	},
	piano: {
		wave: new MIWeb.Curve([
			{point: {x: 0, y: 0.0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.015, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.0}, controlLeft: {x: -0.015, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: -0.25}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], ''),
		duration: 1.5
	},
	organ: {
		wave: new MIWeb.Curve([
			{point: {x: 0, y: 0.225}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.02, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.225}, controlLeft: {x: -0.02, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.001,"y":0.5}},
			{"point":{"x":0.3527762863814007,"y":1},"controlLeft":{"x":-0.20118618037433356,"y":0.0010600706713781438},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.3593639575971731,"y":0.1176678445229682},"controlRight":{"x":0,"y":0}}
		],''),
		duration: 2
	},
	violin: {
		wave: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.04442438188144986,"y":0.014510486451557225}},
			{"point":{"x":0.1,"y":-0.2},"controlLeft":{"x":-0.025,"y":0},"controlRight":{"x":0.0657243816254417,"y":0.000706713780918744}},
			{"point":{"x":0.2,"y":0.9},"controlLeft":{"x":-0.06537102473498235,"y":0.00035335689045934426},"controlRight":{"x":0.06749116607773853,"y":0.0031802120141342094}},
			{"point":{"x":0.3,"y":-0.5},"controlLeft":{"x":-0.0607773851590106,"y":0.003886925795053009},"controlRight":{"x":0.038162544169611345,"y":0.0010600706713780883}},
			{"point":{"x":0.4,"y":-0.1},"controlLeft":{"x":-0.03639575971731451,"y":-0.00035335689045935814},"controlRight":{"x":0.03992932862190812,"y":-0.00035335689045935814}},
			{"point":{"x":0.5,"y":-0.75},"controlLeft":{"x":-0.04310954063604239,"y":-0.0005300353356890719},"controlRight":{"x":0.0558303886925795,"y":-0.006183745583038913}},
			{"point":{"x":0.6,"y":1},"controlLeft":{"x":-0.04982332155477032,"y":-0.0007067137809186885},"controlRight":{"x":0.06486994084805042,"y":0.0035343172769766174}},
			{"point":{"x":0.7,"y":-1},"controlLeft":{"x":-0.05239143496661236,"y":0.0035398132814080663},"controlRight":{"x":0.043891486287687576,"y":0.0035398132814080663}},
			{"point":{"x":0.8,"y":-0.8},"controlLeft":{"x":-0.04194926058668014,"y":-0.0010624935848655426},"controlRight":{"x":0.05150181004249332,"y":-0.0010624935848655426}},
			{"point":{"x":0.9,"y":-0.9},"controlLeft":{"x":-0.04000263808212723,"y":-0.003009116089418451},"controlRight":{"x":0.05628028317217271,"y":0.0026545851608344995}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.04938341807808022,"y":0.00035123332592488355},"controlRight":{"x":0,"y":0}}
		], 'loop'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.001,"y":0.5}},
			{"point":{"x":0.2364293890101159,"y":1},"controlLeft":{"x":-0.2364293890101159,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.3593639575971731,"y":0.1176678445229682},"controlRight":{"x":0,"y":0}}
		], '')
	},
	jump: {
		wave: new MIWeb.Curve([
			{"point":{"x":0,"y":0.225},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.02,"y":0.2}},
			{"point":{"x":0.1,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":-3.1982265396987613}},
			{"point":{"x":0.3,"y":-0.35},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.075,"y":0}},
			{"point":{"x":0.48,"y":0.23},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.010768237480081322,"y":-1.494611577006979}},
			{"point":{"x":0.725,"y":-1},"controlLeft":{"x":-0.1,"y":0},"controlRight":{"x":0.15,"y":0}},
			{"point":{"x":1,"y":0.225},"controlLeft":{"x":-0.02,"y":-0.2},"controlRight":{"x":0,"y":0}}
		],'loop'),
		frequencyCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":1},"controlLeft":{"x":-0.007979626485568936,"y":-0.6597623089983025},"controlRight":{"x":0,"y":0}}
		], ''),
		amplitudeCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: -0.25}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], ''),
		duration: 0.5
	},
	warp: {
		wave: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.25,"y":1},"controlLeft":{"x":-0.125,"y":0},"controlRight":{"x":0.125,"y":0}},
			{"point":{"x":0.5,"y":0},"controlLeft":{"x":-0.017,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		frequencyCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":1},"controlLeft":{"x":-0.007979626485568936,"y":-0.6597623089983025},"controlRight":{"x":0,"y":0}}
		], ''),
		amplitudeCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.05,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":0}},
			{"point":{"x":0.1,"y":0},"controlLeft":{"x":0,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		duration: 0.75
	},
	engine: {
		wave: new MIWeb.Curve([
			{point: {x: 0, y: 0.225}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.02, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.225}, controlLeft: {x: -0.02, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.05,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":0}},
			{"point":{"x":0.1,"y":0},"controlLeft":{"x":0,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		duration: 0.5,
		//note: 277.18,
		octave: 2
	}
};