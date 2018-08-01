var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.ControlCurve = function(controls) {
	MIWeb.Curves.Curve.call(this);
	
	this.controls = controls || [];
	/*this.attack = attack || attack === 0 ? attack : 0.002;
	this.decay = decay || decay === 0 ? decay : 1 - this.attack;*/
};
MIWeb.Curves.ControlCurve.prototype = Object.create(MIWeb.Curves.Curve.prototype);
MIWeb.Curves.ControlCurve.prototype.constructor = MIWeb.Curves.ControlCurve;
MIWeb.Curves.ControlCurve.prototype.getLength = function() {
	return this.controls.length ? this.controls[this.controls.length - 1].x : 1;
};
MIWeb.Curves.ControlCurve.prototype.getValue = function(x) {
	var last = {
		x: 0,
		y: 0,
		d: 1
	};
	for(var c = 0; c < this.controls.length; c++) {
		if(x >= last.x && x <= this.controls[c].x) {
			var d = this.controls[c].x - last.x;
			var p = d != 0 ? (x - last.x) / d : 0; 
			
			var y = p * (this.controls[c].y - last.y);
			
			return last.y + Math.pow(p, this.controls[c].d) * (this.controls[c].y - last.y);
		}
		last = this.controls[c];
	}
	
	return 0;
	
	/*if(x <= this.attack) {
		return x / this.attack;
	}
	
	x -= this.attack;	
	if(x <= this.decay) {
		//return 1 - x / this.decay;
		var dampen = 0.1;
		
		return 1 - Math.pow(x / this.decay, dampen);
	}
	return 0;*/
};