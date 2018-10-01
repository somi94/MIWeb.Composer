//todo:
//use session to store state
//curves: freestyle / controlled (amplitude: attack, decay, sustain, release; frequency: speed, accel, jerk; http://sfbgames.com/chiptone/)
//update keyboard octave on preset load
//multiple curves (combine curves)
//presets: 
//  instruments: guitar, trumpet, drum
//  sfx: coin, power up, punch, explosion, zap, hurt, blip, win, lose

var container = document.querySelector('.synth');

/*var frames = [];
var srcWave = new MIWeb.PianoCurve();
for(var i = 0; i <= 100; i++) {
	var t = (i / 100);
	frames.push({
		point: {x: t, y: srcWave.getValue(t)},
		controlLeft: {x: 0, y: 0},
		controlRight: {x: 0, y: 0}
	});
}
var wave = new MIWeb.Curve(frames, 'loop');*/

//initialize the synthesizer
var synth = new MIWeb.Audio.Synthesizer(new MIWeb.Curves.FrameCurve(),new MIWeb.Curves.ControlCurve(),new MIWeb.Curves.ControlCurve());
synth.debug = false;

//initialize the wav writer
var wavWriter = new MIWeb.Audio.WAVWriter();

//initialize the curve editors
var waveEditor = new MIWeb.Curves.FrameCurveEditor(container.querySelector('.curve.wave'), synth.wave, {}, false);
var frequencyEditor = new MIWeb.Curves.ControlCurveEditor(container.querySelector('.curve.frequency'), synth.frequencyCurve, {
    template: [
        {x: 0, y: 0, d: 1},
        {x: 0.25, y: 0, d: 1},
        {x: 0.5, y: 0, d: 1},
        {x: 0.75, y: 0, d: 1},
        {x: 1, y: 0, d: 1}
    ],
    controls: [
        {label: 'Pitch Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 1, prop: 'x'}]},
        {label: 'Pitch Level', targets: [{ctrl: 1, prop: 'y'},{ctrl: 2, prop: 'y'}]},
        {label: 'Pitch Damp', min: 0, targets: [{ctrl: 1, prop: 'd'}]},
        {label: 'Pitch Sustain', min: 0, type: 'delta', targets: [{ctrl: 2, prop: 'x'}]},
        {label: 'End Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 3, prop: 'x'}]},
        {label: 'End Level', targets: [{ctrl: 3, prop: 'y'},{ctrl: 4, prop: 'y'}]},
        {label: 'End Damp', min: 0, targets: [{ctrl: 3, prop: 'd'}]}
    ]
}, false);
var amplitudeEditor = new MIWeb.Curves.ControlCurveEditor(container.querySelector('.curve.amplitude'), synth.amplitudeCurve, {
    template: [
        {x: 0, y: 0, d: 1},
		{x: 0.002, y: 1, d: 1},
		{x: 0.2, y: 0.5, d: 1},
		{x: 0.5, y: 0.5, d: 1},
		{x: 1, y: 0, d: 1}
	],
	controls: [
		{label: 'Attack Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 1, prop: 'x'}]},
        {label: 'Attack Damp', min: 0, targets: [{ctrl: 1, prop: 'd'}]},
		{label: 'Decay Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 2, prop: 'x'}]},
        {label: 'Decay Damp', min: 0, targets: [{ctrl: 2, prop: 'd'}]},
		{label: 'Sustain Level', min: 0, max: 1, targets: [{ctrl: 2, prop: 'y'},{ctrl: 3, prop: 'y'}]},
        {label: 'Sustain Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 3, prop: 'x'}]},
        {label: 'Death Length', min: 0, max: 1, type: 'delta', targets: [{ctrl: 4, prop: 'x'}]},
        {label: 'Death Damp', min: 0, targets: [{ctrl: 4, prop: 'd'}]}
	]
}, false);

//initialize the keyboard
var keyboard = new MIWeb.Audio.UI.Keyboard(container.querySelector(".keyboard"), 3, 3, function(e) {
	setNote(e.detail.note, e.detail.octave);
	play();
});

//play function: updates synthesizer & plays the sound
function play() {
	var timer = (new Date).valueOf();
		
	synth.setVolume(container.querySelector(".volume").value / 100);
	synth.setDuration(parseFloat(container.querySelector(".duration").value));

	var src = '';
	var local = true;
	if(local) {
		//console.log("prepared (" + ((new Date).valueOf() - timer) + "ms)");
		var data = synth.generate();
		//console.log("generated (" + ((new Date).valueOf() - timer) + "ms)");
		src = wavWriter.write(data);
		//console.log("written (" + ((new Date).valueOf() - timer) + "ms)");
		/*audio.onended = function() {
			console.log("ended");
		};*/
	} else {
		/*var json = JSON.stringify(synth);
		json = json.replace('"frames"','"f"');
		json = json.replace('"point"','"p"');
		json = json.replace('"controlLeft"','"l"');
		json = json.replace('"controlRight"','"r"');
		console.log(json);*/
		var setup = btoa(JSON.stringify(synth));
		console.log(setup);
		src = 'synth/' + setup + '.wav';
	}
	
	var audio = new Audio(src);
	audio.onplay = function() {
		console.log("played (" + ((new Date).valueOf() - timer) + "ms)");
	};
	audio.play();
}

//setNote function: updates synthesizer & keyboards active key
function setNote(note, octave) {
	synth.setNote(note);
	synth.setOctave(octave);
	
	var activeClass = "active";
	
	var activeKey = keyboard.container.querySelector('.key.' + activeClass);
	if(activeKey) {
		//activeKey.className = activeKey.className.replace(new RegExp('(\b)' + activeClass + '(\b)'),"$1$2");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + ' '),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + ' '),"");
	}
	
	var key = keyboard.container.querySelector('.key[data-note="' + note + '"][data-octave="' + octave + '"]');
	if(key) {
		var classArr = key.className.split(" ");
		if(classArr.indexOf(activeClass) == -1) {
			key.className += " " + activeClass;
		}
	}
}

//applyPreset function: updates synthesizer, wave editors and option inputs
function applyPreset(preset, property) {
	synth.applyPreset(preset, property);
	
	waveEditor.setCurve(synth.wave);
	frequencyEditor.setCurve(synth.frequencyCurve);
	amplitudeEditor.setCurve(synth.amplitudeCurve);
	
	container.querySelector(".volume").value = Math.max(0, Math.min(100, Math.round(synth.volume * 100)));
	container.querySelector(".duration").value = Math.max(0, synth.duration);
}

//setup preset buttons
var presetButtons = container.querySelectorAll(".preset");
for(var p = 0; p < presetButtons.length; p++) {
	presetButtons[p].onclick = function() {
		var preset = this.getAttribute('data-preset');
		if(!preset) {
			console.error("preset button has no preset defined.");
			return;
		}
		if(!MIWeb.Audio.Synthesizer.Presets[preset]) {
			console.error("preset button has unknown preset: '" + preset + "'.");
			return;
		}
		
		var property = null;
		if(this.hasAttribute('data-property')) {
			property = this.getAttribute('data-property');
		}
		
		if(!confirm("Replace " + (property || 'values') + " with preset '" + this.innerHTML + "'?")) {
			return;
		}
		
		applyPreset(preset, property);
		play();
	};
}

//setup play button
container.querySelector(".play").onclick = function() {
	play();
};

//setup download button
container.querySelector(".download").onclick = function() {
	var data = wavWriter.write(synth.generate());
	
	var link = document.createElement("a");
	link.download = "sample.wav";
	link.href = data;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
};

//setup save button
container.querySelector(".save").onclick = function() {
	var data = "data:text/json," + JSON.stringify(synth);
	
	var link = document.createElement("a");
	link.download = "sample.json";
	link.href = data;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
};

//setup load button
container.querySelector(".load").onclick = function() {
	var input = document.createElement("input");
	input.type = 'file';
	input.onchange = function(e) {
		var file = e.target.files[0];
		if(file) {
			var reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = function (evt) {
				var options = JSON.parse(evt.target.result);
				if(!options) {
					alert("error parsing file");
				}
				applyPreset(options);
				play();
			}
			reader.onerror = function (evt) {
				alert("error reading file");
			}
		}
	};
	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
	delete input;
};

//initialize the synthesizer
synth.volume = 0.5;
setNote('C', 4);
//applyPreset('piano');
applyPreset({
	wave: new MIWeb.Curves.FrameCurve(
        [{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.015,"y":0.2}},{"point":{"x":0.1,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0.075,"y":0}},{"point":{"x":0.3,"y":-0.35},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.075,"y":0}},{"point":{"x":0.48,"y":0.23},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.075,"y":0}},{"point":{"x":0.725,"y":-1},"controlLeft":{"x":-0.1,"y":0},"controlRight":{"x":0.15,"y":0}},{"point":{"x":1,"y":0},"controlLeft":{"x":-0.015,"y":-0.2},"controlRight":{"x":0,"y":0}}],
		'loop'
	),
	frequencyCurve: new MIWeb.Curves.ControlCurve(
		[{"x":0,"y":0,"d":1},{"x":0.25,"y":0,"d":1},{"x":0.5,"y":0,"d":1},{"x":0.75,"y":0,"d":1},{"x":1,"y":0,"d":1}],
		'loop'
	),
	amplitudeCurve: new MIWeb.Curves.ControlCurve(
		[{"x":0,"y":0,"d":1},{"x":0.002,"y":1,"d":1},{"x":0.002,"y":1,"d":1},{"x":0.002,"y":1,"d":1},{"x":1,"y":0,"d":0.25}]
	)
});