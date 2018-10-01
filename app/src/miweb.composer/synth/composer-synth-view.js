var MIWeb = MIWeb || {};
MIWeb.Composer = MIWeb.Composer || {};
MIWeb.Composer.Synth = MIWeb.Composer.Synth || {};

MIWeb.Composer.Synth.View = function(container) {
	this.container = container;
	
	this.render();
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
	
	this.renderCurve(curveContainer, new MIWeb.Composer.Synth.Wave(), 'Wave');
	this.renderCurve(curveContainer, new MIWeb.Composer.Synth.Amplitude(), 'Amplitude');
	this.renderCurve(curveContainer, new MIWeb.Composer.Synth.Frequency(), 'Frequency');
};
MIWeb.Composer.Synth.View.prototype.renderCurve = function(curveContainer, curve, title) {
	var curveWrapper = document.createElement('div');
	curveWrapper.className = 'curve-wrapper';
	
	var curveTitle = document.createElement('h2');
	curveTitle.className = 'curve-title';
	curveTitle.innerHTML = title;
	curveWrapper.appendChild(curveTitle);
	
	curveContainer.appendChild(curveWrapper);
};
MIWeb.Composer.Synth.View.prototype.renderKeyboard = function() {
	var keyboardWrapper = document.createElement('div');
	keyboardWrapper.className = 'keyboard-wrapper';
	
	this.container.appendChild(keyboardWrapper);
	
	this.keyboard = new MIWeb.Audio.UI.Keyboard(keyboardWrapper);
};
MIWeb.Composer.Synth.View.prototype.renderOptions = function() {
};