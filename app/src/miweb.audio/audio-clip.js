var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

MIWeb.Audio.Clip = function(sampleRate, data, channels) {
	this.sampleRate = sampleRate || 44100;
	this.data = data || [];
	this.channels = channels || 1;
};

MIWeb.Audio.Clip.prototype.getDuration = function() {
	return this.data.length / this.sampleRate;	
};

MIWeb.Audio.Clip.prototype.getSample = function(s) {
	return s < 0 || s > this.data.length ? 0 : this.data[s];	
};

MIWeb.Audio.Clip.prototype.getSampleAt = function(t, interp) {
	return this.getSampleAtRelative(t / this.getDuration(), interp);
};

MIWeb.Audio.Clip.prototype.getSampleAtRelative = function(tr, interp) {
	tr = Math.max(0, Math.min(tr, 1));
	var p = tr * (this.data.length - 2);
	var s = Math.floor(p);
	if(!interp) {
		return this.data[s];	
	}
	
	return this.data[s] + (this.data[s + 1] - this.data[s]) * (p - s);
};
