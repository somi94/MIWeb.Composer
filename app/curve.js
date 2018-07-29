var MIWeb = MIWeb || {};

MIWeb.Curve = function(frames, end) {
	this.frames = frames || [];
	this.end = end;
};
MIWeb.Curve.prototype.getFrames = function(loopCount) {
	var frameCount = this.frames.length;
	var frames = this.frames.slice(0);
	
	if(this.end != 'loop' && this.end != 'ping-pong-x' && this.end != 'ping-pong-y' && this.end != 'ping-pong-xy') {
		return frames;
	}
	
	var loopX = frames[frameCount - 1].point.x;
	
	for(var l = 0; l < loopCount; l++) {
		for(var f = 0; f < frameCount; f++) {
			frames.push(this.getFrame((l + 1) * frameCount + f));
		}
	}
	
	return frames;
};
MIWeb.Curve.prototype.getFrame = function(f) {
	var frames = this.frames;
	var frameCount = frames.length;
	var l = this.end ? Math.floor(f / frameCount) : 0;
	var loopX = frames[frameCount - 1].point.x;
	var flipX = (this.end == 'ping-pong-x' && l % 2 == 1) || (this.end == 'ping-pong-xy' && l % 2 == 1);
	var flipY = (this.end == 'ping-pong-y' && l % 2 == 1) || (this.end == 'ping-pong-xy' && l % 4 > 1);
	
	var index = f;
	index = this.end ? index - l * frameCount : (index >= frameCount ? frameCount - 1 : index);
	index = flipX ? frameCount - 1 - index : index;
	
	return {
		point: {
			x: flipX ? loopX * (l + 1) - frames[index].point.x : frames[index].point.x + loopX * l, 
			y: frames[index].point.y * (flipY ? -1 : 1)
		}, 
		controlLeft: flipX ? {
			x: frames[index].controlRight.x * (flipX ? -1 : 1),
			y: frames[index].controlRight.y * (flipY ? -1 : 1)
		} : {
			x: frames[index].controlLeft.x,
			y: frames[index].controlLeft.y * (flipY ? -1 : 1)
		}, 
		controlRight: flipX ? {
			x: frames[index].controlLeft.x * (flipX ? -1 : 1),
			y: frames[index].controlLeft.y * (flipY ? -1 : 1)
		} : {
			x: frames[index].controlRight.x,
			y: frames[index].controlRight.y * (flipY ? -1 : 1)
		},
		virtual: f >= frameCount
	};
};
MIWeb.Curve.prototype.getValue = function(x) {
	var p = [];
	var px = 0;
	var tx = 0;
	var frameCount = this.frames.length;
	var curveLength = this.frames[frameCount - 1].point.x;
	var curveNum = Math.floor(x / curveLength);
	
	for(var f = 0; f < frameCount; f++) {
		var frame = this.getFrame(curveNum * frameCount + f);
		var nextFrame = this.getFrame(curveNum * frameCount + f + 1);
		if(frame.point.x <= x && nextFrame.point.x >= x) {
			p = [
				frame.point,
				{x: frame.point.x + frame.controlRight.x, y: frame.point.y + frame.controlRight.y},
				{x: nextFrame.point.x + nextFrame.controlLeft.x, y: nextFrame.point.y + nextFrame.controlLeft.y},
				nextFrame.point
			];
			px = x - frame.point.x;
			tx = px / (nextFrame.point.x - frame.point.x);
			/*var dx = nextFrame.point.x - frame.point.x;
			var dy = nextFrame.point.y - frame.point.y;
			var tx = (x - frame.point.x) / dx;
			var y = dy * tx + frame.point.y;
			t = Math.sqrt(Math.pow(x - frame.point.x,2) + Math.pow(y - frame.point.y,2)) / Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));*/
			break;
		}
	}
	
	if(tx <= 0) {
		if(p.length) {
			return p[0].y;
		}
		return this.frames[0].y;
	}
	if(tx >= 1) {
		if(p.length) {
			return p[p.length - 1].y;
		}
		return this.frames[this.frames.length - 1].y;
	}
	
	var xTolerance = 0.0001; //adjust as you please
	var xTarget = x;
	var myBezier = function(t) {
		var mt = 1 - t;
		var 
			mt2 = mt * mt,
			t2 = t * t,
			a,
			b,
			c,
			d = 0
		;
		
		a = mt2 * mt;
		b = mt2 * t * 3;
		c = mt * t2 * 3;
		d = t * t2;
		
		return {
			x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
			y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y
		};
		//return bezier(0, 0, x1, y1, x2, y2, 1, 1, t);
	};

	//we could do something less stupid, but since the x is monotonic
	//increasing given the problem constraints, we'll do a binary search.

	//establish bounds
	var lower = 0;
	var upper = 1;
	var percent = (upper + lower) / 2;

	//get initial x
	var testX = myBezier(percent).x;

	//loop until completion
	while(Math.abs(xTarget - testX) > xTolerance) {
		if(xTarget > testX) 
			lower = percent;
		else 
			upper = percent;

		percent = (upper + lower) / 2;
		testX = myBezier(percent).x;
	}
	//we're within tolerance of the desired x value.
	//return the y value.
	return myBezier(percent).y;
	
	/*
	//below: get {x,y} by t
	var mt = 1 - t;
	var 
		mt2 = mt * mt,
		t2 = t * t,
		a,
		b,
		c,
		d = 0
	;
	
	a = mt2 * mt;
	b = mt2 * t * 3;
	c = mt * t2 * 3;
	d = t * t2;
	
	return a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y;*/
	
	/*// shortcuts
	if (t === 0) {
		return this.curve.frames[0].point.y;
	}
	if (t >= 1) {
		return this.curve.frames[this.curve.frames.length - 1].point.y;
	}

	var p = this.points;
	var mt = 1 - t;

	// linear?
	if (this.order === 1) {
	ret = {
	x: mt * p[0].x + t * p[1].x,
	y: mt * p[0].y + t * p[1].y
	};
	if (this._3d) {
	ret.z = mt * p[0].z + t * p[1].z;
	}
	return ret;
	}

	// quadratic/cubic curve?
	if (this.order < 4) {
		var mt2 = mt * mt,
		t2 = t * t,
		a,
		b,
		c,
		d = 0;
		if (this.order === 2) {
		p = [p[0], p[1], p[2], ZERO];
		a = mt2;
		b = mt * t * 2;
		c = t2;
		} else if (this.order === 3) {
		a = mt2 * mt;
		b = mt2 * t * 3;
		c = mt * t2 * 3;
		d = t * t2;
		}
		var ret = {
		x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
		y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y
		};
		if (this._3d) {
		ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
		}
		return ret;
	}

	// higher order curves: use de Casteljau's computation
	var dCpts = JSON.parse(JSON.stringify(this.points));
	while (dCpts.length > 1) {
	for (var i = 0; i < dCpts.length - 1; i++) {
	dCpts[i] = {
	x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
	y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t
	};
	if (typeof dCpts[i].z !== "undefined") {
	dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
	}
	}
	dCpts.splice(dCpts.length - 1, 1);
	}
	return dCpts[0];*/
};