var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};
MIWeb.Audio.UI = MIWeb.Audio || {};

MIWeb.Audio.UI.Keyboard = function(container, octave, octaveCount, onplay, noControls) {
	this.container = container;
	this.drawControls = !noControls;
	this.setOctaveCount(octaveCount || 1);
	this.setOctave(octave || 4);
	this.draw();
	//this.playEvent = new CustomEvent('play', {note: 'C', octave: this.octave});
	if(onplay) {
		this.container.addEventListener('play', onplay, false);
	}
};
MIWeb.Audio.UI.Keyboard.prototype.setOctave = function(octave) {
	this.octave = Math.max(1, Math.min(9 - this.octaveCount, octave));
};
MIWeb.Audio.UI.Keyboard.prototype.setOctaveCount = function(octaveCount) {
	this.octaveCount = Math.max(1, Math.min(8, octaveCount));
	this.setOctave(this.octave);
};
MIWeb.Audio.UI.Keyboard.prototype.draw = function() {
	//validate options
	this.setOctaveCount(this.octaveCount);
	
	//setup container
	var containerClass = "keyboard";
	var classArr = this.container.className.split(" ");
    if(classArr.indexOf(containerClass) == -1) {
        this.container.className += " " + containerClass;
    }
	
	//render keys
	this.container.innerHTML = this.renderKeys();
	
	if(this.drawControls) {	
		//render controls
		this.container.innerHTML += this.renderControls();
		
		//add control events
		var controls = this.container.querySelectorAll('input');
		for(var e = 0; e < controls.length; e++) {
			var keyboard = this;
			controls[e].onchange = function() {
				keyboard[this.getAttribute('name')] = this.value;
				keyboard.draw();
			};
		}
	}

	//add key events
	var keyElements = this.container.querySelectorAll('.key');
	for(var e = 0; e < keyElements.length; e++) {
		var keyboard = this;
		keyElements[e].onclick = function() {
			keyboard.container.dispatchEvent(new CustomEvent('play', {detail: {
				note: this.getAttribute('data-note'), 
				octave: this.getAttribute('data-octave')
			}}));
		};
	}
};
MIWeb.Audio.UI.Keyboard.prototype.renderKeys = function() {
	var baseKeys = '';
	var sharpKeys = '';
	
	var baseNotes = ['C','D','E','F','G','A','B'];
	var sharpNotes = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];
	
	var noteCount = baseNotes.length;
	var keyCount = noteCount * this.octaveCount;
	for(var k = 0; k < keyCount; k++) {
		var noteIndex = k % noteCount;
		var octave = Math.floor(k / noteCount) + this.octave;
		
		baseKeys += '<div class="key" data-note="' + baseNotes[noteIndex] + '" data-octave="' + octave + '" style="position: absolute; top: 0; bottom: 0; left: ' + (k / keyCount * 100) + '%; right: ' + (100 - (k + 1) / keyCount * 100) + '%;"><label>' + baseNotes[noteIndex] + octave + '</label></div>';
		if(sharpNotes[noteIndex]) {
			sharpKeys += '<div class="key sharp" data-note="' + sharpNotes[noteIndex] + '" data-octave="' + octave + '" style="position: absolute; top: 0; bottom: 25%; left: ' + ((k + 0.5) / keyCount * 100) + '%; right: ' + (100 - (k + 1.5) / keyCount * 100) + '%;"><label>' + sharpNotes[noteIndex] + octave + '</label></div>';
		}
	}
	
	return '<div class="keys">' + baseKeys + sharpKeys + '</div>';
};
MIWeb.Audio.UI.Keyboard.prototype.renderControls = function() {
	var controls = '';
	
	controls += '<div><label>Octave Range</label><input name="octaveCount" type="range" min="1" max="8" value="' + this.octaveCount + '" /><span>' + this.octaveCount + '</span></div>';
	controls += '<div><label>Base Octave</label><input name="octave" type="range" min="1" max="' + (9 - this.octaveCount) + '" value="' + this.octave + '" /><span>' + this.octave + '</span></div>';
	
	return '<div class="controls">' + controls + '</div>';
};