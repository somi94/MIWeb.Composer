var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.View = function(container) {
	this.container = container;
	
	this.wave = new MIWeb.Composer.Synth.Wave();
	this.amplitude = new MIWeb.Composer.Synth.Amplitude();
	this.frequency = new MIWeb.Composer.Synth.Frequency();

	//initialize the synthesizer
	this.synth = new MIWeb.Audio.Synthesizer(this.wave, this.amplitude, this.frequency);
	this.synth.debug = false;

	//initialize the wav writer
	this.wavWriter = new MIWeb.Audio.WAVWriter();
	
	this.render();
};
MIWeb.Composer.Synth.View.prototype.setNote = function(note, octave) {
	this.synth.setNote(note);
	this.synth.setOctave(octave);
	
	var activeClass = "active";
	
	var activeKey = this.keyboard.container.querySelector('.key.' + activeClass);
	if(activeKey) {
		//activeKey.className = activeKey.className.replace(new RegExp('(\b)' + activeClass + '(\b)'),"$1$2");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + ' '),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + ' '),"");
	}
	
	var key = this.keyboard.container.querySelector('.key[data-note="' + note + '"][data-octave="' + octave + '"]');
	if(key) {
		var classArr = key.className.split(" ");
		if(classArr.indexOf(activeClass) == -1) {
			key.className += " " + activeClass;
		}
	}
};
MIWeb.Composer.Synth.View.prototype.play = function() {
	var timer = (new Date).valueOf();
		
	//this.synth.setVolume(container.querySelector(".volume").value / 100);
	//this.synth.setDuration(parseFloat(container.querySelector(".duration").value));
	this.synth.setVolume(1);
	this.synth.setDuration(1);

	var src = '';
	var local = true;
	if(local) {
		//console.log("prepared (" + ((new Date).valueOf() - timer) + "ms)");
		var data = this.synth.generate();
		//console.log("generated (" + ((new Date).valueOf() - timer) + "ms)");
		src = this.wavWriter.write(data);
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
};
MIWeb.Composer.Synth.View.prototype.render = function() {
	//1. render curves
	this.renderCurves();
	//2. render keyboard
	this.renderKeyboard();
	//3. render options
	this.renderOptions();
};
MIWeb.Composer.Synth.View.prototype.renderCurves = function() {
	var curveContainer = document.createElement('div');
	curveContainer.className = 'curve-container';
	
	this.container.appendChild(curveContainer);
	
	this.renderCurve(curveContainer, this.wave, 'Wave');
	this.renderCurve(curveContainer, this.amplitude, 'Amplitude');
	this.renderCurve(curveContainer, this.frequency, 'Frequency');
};
MIWeb.Composer.Synth.View.prototype.renderCurve = function(curveContainer, curve, title) {
	var curveWrapper = document.createElement('div');
	curveWrapper.className = 'curve-wrapper';
	
	var curveTitle = document.createElement('h2');
	curveTitle.className = 'curve-title';
	curveTitle.innerHTML = title;
	curveWrapper.appendChild(curveTitle);
	
	var curveViewWrapper = document.createElement('div');
	curveViewWrapper.className = 'curve-view-wrapper';
	curveViewWrapper.curveView = new MIWeb.Curves.CurveView(curveViewWrapper, curve);
	curveWrapper.appendChild(curveViewWrapper);
	
	var curveControlWrapper = document.createElement('div');
	curveControlWrapper.className = 'curve-control-wrapper';
	curveControlWrapper.innerHTML = curve.getControls();
	curveWrapper.appendChild(curveControlWrapper);
	var controls = curveControlWrapper.querySelectorAll('input,select');
	for(var c = 0; c < controls.length; c++) {
		controls[c].onchange = function() {
			var attr = this.getAttribute('name');
			var val = this.value;
			
			curve[attr] = val;
		};
	}
	
	curveContainer.appendChild(curveWrapper);
};
MIWeb.Composer.Synth.View.prototype.renderKeyboard = function() {
	var keyboardWrapper = document.createElement('div');
	keyboardWrapper.className = 'keyboard-wrapper';
	
	this.container.appendChild(keyboardWrapper);
	
	var view = this;
	this.keyboard = new MIWeb.Audio.UI.Keyboard(keyboardWrapper, 3, 3, function(e) {
		view.setNote(e.detail.note, e.detail.octave);
		view.play();
	});
};
MIWeb.Composer.Synth.View.prototype.renderOptions = function() {
};