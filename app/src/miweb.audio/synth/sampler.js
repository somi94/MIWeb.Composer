
var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};
MIWeb.Audio.Synth = MIWeb.Audio.Synth || {};

MIWeb.Audio.Synth.Sampler = function(options) {
  this.options = options || new MIWeb.Audio.Synth.SamplerOptions();
};

MIWeb.Audio.Synth.Sampler.prototype.generate = function() {
  var sampleCount = this.options.getSampleCount();
  
  this.init();
  
  var data = [];
  for(var s = 0; s < sampleCount; s++) {
    data.push(this.getValue(s / sampleCount));
  }

  return new MIWeb.Audio.Clip(sampleRate, data);
};

MIWeb.Audio.Synth.Sampler.prototype.init = function() {
};
MIWeb.Audio.Synth.Sampler.prototype.getValue = function(t) {
  return 
    this.options.volume 
    * this.getAmplitude(t) 
    * this.getWave(t * this.options.duration * this.getFrequency(t));
};
MIWeb.Audio.Synth.Sampler.prototype.getAmplitude = function(t) {
  return 1;
};
MIWeb.Audio.Synth.Sampler.prototype.getFrequency = function(t) {
  return this.options.getFrequency();
};
MIWeb.Audio.Synth.Sampler.prototype.getWave = function(t) {
  return Math.sin(2 * Math.PI * t);
};
