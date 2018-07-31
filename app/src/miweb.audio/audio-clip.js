var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

MIWeb.Audio.Clip = function(sampleRate, data, channels) {
	this.sampleRate = sampleRate || 44100;
	this.data = data || [];
	this.channels = channels || 1;
};