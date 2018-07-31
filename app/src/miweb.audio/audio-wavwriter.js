var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

var URL = window.URL || window.webkitURL;
var Blob = window.Blob;

MIWeb.Audio.WAVWriter = function(bitsPerSample, scale, debug) {
	this.bitsPerSample = bitsPerSample | 16;
	this.scale = scale | 32768;
	this.debug = !!debug;
};
MIWeb.Audio.WAVWriter.prototype.pack = function(c, arg) { 
	return [new Uint8Array([arg, arg >> 8]), new Uint8Array([arg, arg >> 8, arg >> 16, arg >> 24])][c]; 
};
MIWeb.Audio.WAVWriter.prototype.write = function(clip) {
	var t = (new Date).valueOf();
	var src = clip.data;
	var numSamples = src.length;
	var bytesPerSample = Math.ceil(this.bitsPerSample / 8);
	var data = new Uint8Array(new ArrayBuffer(numSamples * 2));
	
	var v;
	for(var s = 0; s < numSamples; s++) {
		v = (src[s] * this.scale) | 0;
		data[s << 1] = v;
		data[(s << 1) + 1] = v >> 8;
	}
	
	var out = [
		'RIFF',
		this.pack(1, 4 + (8 + 24/* chunk 1 length */) + (8 + 8/* chunk 2 length */)), // Length
		'WAVE',
		// chunk 1
		'fmt ', // Sub-chunk identifier
		this.pack(1, 16), // Chunk length
		this.pack(0, 1), // Audio format (1 is linear quantization)
		this.pack(0, clip.channels),
		this.pack(1, clip.sampleRate),
		this.pack(1, clip.sampleRate * clip.channels * this.bitsPerSample / 8), // Byte rate
		this.pack(0, clip.channels * this.bitsPerSample / 8),
		this.pack(0, this.bitsPerSample),
		// chunk 2
		'data', // Sub-chunk identifier
		this.pack(1, data.length * clip.channels * this.bitsPerSample / 8), // Chunk length
		data
	];
	
	var blob = new Blob(out, {type: 'audio/wav'});
	var dataURI = URL.createObjectURL(blob);
	//this._fileCache[sound][octave-1][note][time] = dataURI;
	if(this.debug) { console.log((new Date).valueOf() - t, 'ms to generate'); }
	
	return dataURI;
};