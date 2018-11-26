var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};
MIWeb.Audio.Synth = MIWeb.Audio.Synth || {};

MIWeb.Audio.Synth.Notes = {
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

MIWeb.Audio.Synth.SampleOptions = function(note, octave, volume, duration, sampleRate) {
    this.note = note;
    this.octave = octave;
    this.volume = volume;
    this.duration = duration;
    this.sampleRate = sampleRate;
    
    this.validate();
};
MIWeb.Audio.Synth.SampleOptions.prototype.validate = function(sampleRate) {
    this.setNote(this.note || 'C');
    this.setOctave(this.octave || 4);
    this.setVolume(this.volume || 1);
    this.setDuration(this.duration || 2);
    this.setSampleRate(this.sampleRate || 44100);
};

//setters
MIWeb.Audio.Synth.SampleOptions.prototype.setNote = function(note) {
    if(MIWeb.Audio.Synth.Notes[note]) {
        this.note = MIWeb.Audio.Synth.Notes[note];
    } else {
        this.note = note;
    }
};
MIWeb.Audio.Synth.SampleOptions.prototype.setOctave = function(octave) {
	  this.octave = Math.max(1, Math.min(8, octave));
};
MIWeb.Audio.Synth.SampleOptions.prototype.setVolume = function(volume) {
	  this.volume = Math.max(0, volume);
};
MIWeb.Audio.Synth.SampleOptions.prototype.setDuration = function(duration) {
	  this.duration = Math.max(0.01, duration);
};
MIWeb.Audio.Synth.SampleOptions.prototype.setSampleRate = function(sampleRate) {
	  this.sampleRate = Math.max(4000, sampleRate);
};

//getters
MIWeb.Audio.Synth.SampleOptions.prototype.getFrequency = function() {
    return this.note * Math.pow(2, this.octave - 4);
};
MIWeb.Audio.Synth.SampleOptions.prototype.getSampleCount = function() {
    return (this.duration * this.sampleRate) | 0;
};
