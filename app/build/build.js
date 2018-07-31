var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.Curve = function(frames, end) {
	this.frames = frames || [];
	this.end = end;
};
MIWeb.Curves.Curve.prototype.getFrames = function(loopCount) {
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
MIWeb.Curves.Curve.prototype.getFrame = function(f) {
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
MIWeb.Curves.Curve.prototype.getValue = function(x) {
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
};//TODO:
//solve auto resizing window behaviour while dragging (zoom levels (=steps)?)
//add/remove frames
//show full synth source(=config) (formatted json)
//make synth source editable
//play button in popup
//handle size?
//make loops easier?
//improve presets
//dont render everything again on draw, dont redraw on drag/input

var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.CurveEditor = function(container, curve, options, maximize) {
	var config = {
		dotSize: 5,
		drawAxes: true,
		drawGrid: true,
		drawHandles: true,
		drawDots: true,
		drawLoop: true,
		drawControls: true,
		axesWeight: 2,
		gridWeight: 1,
		curveColor: "black",
		handleColor: "#f00",
		handleSelectedColor: "#0f0",
		gridColor: "#666",
		loopColor: "#ccc",
		size: {x: null, y: null},
		minimizable: true,
		maximizeMode: 'popup',
		dragable: true,
		keepAspectRatio: false,
		minimizeOptions: {
			drawGrid: false,
			drawHandles: false,
			drawDots: false,
			drawControls: false,
			axesWeight: 1,
			curveColor: "#ccc"/*,
			size: {x: 200, y: 50}*/
		}
	};
	
	if(options) {
		for(var optionName in options) { 
			config[optionName] = options[optionName]; 
		}
	}
	
	this.defaultConfig = config;
	this.config = config;
	
	this.source = container;
	this.container = container;
	this.popup = null;
	this.minimized = !maximize;
	this.setCurve(curve);
};
MIWeb.Curves.CurveEditor.prototype.setCurve = function(curve) {
	this.curve = curve;
	this.selected = -1;
	this.lastSelected = -1;
	this.grabbed = false;
	this.draw();
};
MIWeb.Curves.CurveEditor.prototype.draw = function() {
	var editor = this;
		
	if(this.defaultConfig.minimizable && this.minimized && this.defaultConfig.minimizeOptions) {
		var config = {};
		for(var optionName in this.defaultConfig) { 
			config[optionName] = this.defaultConfig[optionName]; 
		}
		for(var optionName in this.defaultConfig.minimizeOptions) { 
			config[optionName] = this.defaultConfig.minimizeOptions[optionName]; 
		}
		this.config = config;
	} else {
		this.config = this.defaultConfig;
	}
	
	if(!this.minimized) {
		if(this.config.maximizeMode == 'popup' && !this.popup) {
			this.popup = document.createElement("div");
			this.popup.className = "curve-popup";
			
			var popupOverlay = document.createElement("div");
			popupOverlay.className = "curve-popup-overlay";
			popupOverlay.onclick = function() {
				editor.minimized = true;
				editor.draw();
			};
			this.popup.appendChild(popupOverlay);
			
			var popupContent = document.createElement("div");
			popupContent.className = "curve-popup-content curve";
			this.popup.appendChild(popupContent);
			
			document.body.appendChild(this.popup);
			
			this.container = popupContent;
		} else if(this.config.maximizeMode != 'popup' && this.popup) {
			this.popup.parentElement.removeChild(this.popup);
			this.popup = null;
			this.container = this.source;
		}
	} else {
		if(this.popup) {
			this.popup.parentElement.removeChild(this.popup);
			this.popup = null;
		}
		this.container = this.source;
	}
	
	this.container.style.width = this.config.size && this.config.size.x ? this.config.size.x + "px" : "";
	this.container.style.height = this.config.size && this.config.size.y ? this.config.size.y + "px" : "";
	
	//prepare: fetch input values & calculate dimensions
	this.setupCurveContext();
	if(this.curveContext.canvasSize.x < 0 || this.curveContext.canvasSize.y <= 0) {
		return;
	}
	
	//draw canvas
	this.renderCanvas();
	
	this.renderBackground(this.config.drawAxes, this.config.drawGrid);
	
	//render curve
	this.renderCurve();
	
	//add controls
	if(this.config.drawControls) {
		this.renderControls();
	} else if(this.controls) {
		this.controls.parentElement.removeChild(this.controls);
		this.controls = null;
	}
	
	this.renderWindowOptions();
	
	//resize
	window.onresize = function(event) {
		editor.draw();
	};
	
	//drag & drop
	if(this.config.dragable && this.config.drawControls) {
		var svg = this.container.getElementsByTagName("svg")[0];
		svg.onmouseout = function() {
			//editor.grabbed = false;
		};
		svg.onmouseup = function() {
			editor.grabbed = false;
		};
		svg.onmousemove = function(e) {
			if(e.buttons && e.button === 0 && editor.grabbed) {
				//var x = e.pageX - editor.container.offsetLeft;
				//var y = e.pageY - editor.container.offsetTop;
				//x -= editor.curveContext.offset.x;
				//y = (editor.curveContext.canvasSize.y - y) - editor.curveContext.offset.y;
				//x /= editor.curveContext.pxPerUnit;
				//y /= editor.curveContext.pxPerUnit;
				//var x = e.clientX / editor.curveContext.pxPerUnit / editor.curveContext.scale.x;
				//var y = e.clientY / editor.curveContext.pxPerUnit / editor.curveContext.scale.y;
				var x = e.movementX / editor.curveContext.pxPerUnit / editor.curveContext.scale.x;
				var y = -e.movementY / editor.curveContext.pxPerUnit / editor.curveContext.scale.y;

				var frame = editor.curve.frames[editor.grabbed[0]];
				if(editor.grabbed[1] == 0) {
					frame.point.x += x;
					frame.point.y += y;
				} else {
					//x -= frame.point.x;
					//y -= frame.point.y;
					if(editor.grabbed[1] == 1) {
						frame.controlLeft.x += x;
						frame.controlLeft.y += y;
					} else if(editor.grabbed[1] == 2) {
						frame.controlRight.x += x;
						frame.controlRight.y += y;
					}
				}
				
				editor.curve.frames[editor.grabbed[0]] = frame;
				editor.draw();
			}
		};
	}
	
	this.lastSelected = this.selected;
};
MIWeb.Curves.CurveEditor.prototype.setupCurveContext = function() {
	var frameCount = this.curve.frames.length;
	
	this.curveContext = {
		scale: {x: 1, y: 1},
		//offset: {x: 0, y: 0},
		canvasSize: {x: this.container.clientWidth, y: this.container.clientHeight},
		bounds: {
			min: {x: -1, y: -1},
			max: {x: 1, y: 1},
			size: {x: 2, y: 2},
			center: {x: 0, y: 0}
		},
		fullBounds: {
			min: {x: -1, y: -1},
			max: {x: 1, y: 1},
			size: {x: 2, y: 2},
			center: {x: 0, y: 0}
		},
		pxPerUnit: 100
	};
	
	if(this.curveContext.canvasSize.x < 0 || this.curveContext.canvasSize.y <= 0 || !this.curve || !this.curve.frames) {
		return;
	}
	
	for(var f = 0; f < frameCount; f++) {
		var frame = this.curve.frames[f];
		frame.controlLeft.x = Math.min(0,Math.max(frame.controlLeft.x, f > 0 ? this.curve.frames[f - 1].point.x - frame.point.x : 0));
		frame.controlRight.x = Math.max(0,Math.min(frame.controlRight.x, f < frameCount - 1 ? this.curve.frames[f + 1].point.x - frame.point.x : 0));
		this.curve.frames[f] = frame;
		
		if(f == 0) {
			this.curveContext.fullBounds.min = {
				x: Math.min(frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x),
				y: Math.min(frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y)
			};
			this.curveContext.fullBounds.max = {
				x: Math.max(frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x),
				y: Math.max(frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y)
			};
		} else {
			this.curveContext.fullBounds.min.x = Math.min(this.curveContext.fullBounds.min.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			this.curveContext.fullBounds.max.x = Math.max(this.curveContext.fullBounds.max.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			this.curveContext.fullBounds.min.y = Math.min(this.curveContext.fullBounds.min.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
			this.curveContext.fullBounds.max.y = Math.max(this.curveContext.fullBounds.max.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
		}
	}
	
	if(this.curve.end == 'ping-pong-y' || this.curve.end == 'ping-pong-xy') {
		var fullExtentsY = Math.max(Math.abs(this.curveContext.fullBounds.min.y), Math.abs(this.curveContext.fullBounds.max.y));
		this.curveContext.fullBounds.min.y = -fullExtentsY;
		this.curveContext.fullBounds.max.y = fullExtentsY;
	}
	
	var padding = {
		x: (this.curveContext.fullBounds.max.x - this.curveContext.fullBounds.min.x) * 0.1 || 0.1,
		y: (this.curveContext.fullBounds.max.y - this.curveContext.fullBounds.min.y) * 0.1 || 0.1,
	};
	this.curveContext.fullBounds.min.x -= padding.x;
	this.curveContext.fullBounds.max.x += padding.x;
	this.curveContext.fullBounds.min.y -= padding.y;
	this.curveContext.fullBounds.max.y += padding.y;
	
	this.curveContext.fullBounds.size.x = (this.curveContext.fullBounds.max.x - this.curveContext.fullBounds.min.x)/* * sizeX*/;
	this.curveContext.fullBounds.size.y = (this.curveContext.fullBounds.max.y - this.curveContext.fullBounds.min.y)/* * sizeY*/;
	
	this.curveContext.fullBounds.center.x = this.curveContext.fullBounds.min.x + this.curveContext.fullBounds.size.x / 2;
	this.curveContext.fullBounds.center.y = this.curveContext.fullBounds.min.y + this.curveContext.fullBounds.size.y / 2;
	
	/*this.curveContext.pxPerUnit = Math.min(
		this.curveContext.canvasSize.x / (this.curveContext.fullBounds.size.x || 1),
		this.curveContext.canvasSize.y / (this.curveContext.fullBounds.size.y || 1)
	);*/
	this.curveContext.pxPerUnit = Math.min(this.curveContext.canvasSize.x,this.curveContext.canvasSize.y) / Math.max(this.curveContext.fullBounds.size.x, this.curveContext.fullBounds.size.y);
	
	this.curveContext.scale = {
		x: this.curveContext.canvasSize.x > this.curveContext.canvasSize.y ? this.curveContext.canvasSize.x / this.curveContext.canvasSize.y : 1,
		y: this.curveContext.canvasSize.y > this.curveContext.canvasSize.x ? this.curveContext.canvasSize.y / this.curveContext.canvasSize.x : 1
	};
	
	if(this.config.keepAspectRatio) {
		this.curveContext.scale.x = Math.min(this.curveContext.scale.x,this.curveContext.scale.y);
		this.curveContext.scale.y = this.curveContext.scale.x;
	}
	
	console.log(this.curveContext);
};
MIWeb.Curves.CurveEditor.prototype.renderCanvas = function() {
	this.canvas = this.container.querySelector('svg [data-id="canvas"]');
	if(!this.canvas) {
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		
		this.canvas = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.canvas.setAttribute('data-id','canvas');
		svg.appendChild(this.canvas);
		
		if(this.container.children.length) {
			this.container.insertBefore(svg, this.container.children[0]);
		} else {
			this.container.appendChild(svg);
		}
	}
	var canvasSize = this.curveContext.canvasSize;
	var bounds = this.curveContext.fullBounds;
	var scale = this.curveContext.scale;
	var ppu = this.curveContext.pxPerUnit;
	var padding = /*Math.floor(ppu / 4)*/0;
	this.canvas.setAttribute('transform','translate(' + 
		(/*canvasSize.x / 2 + */(-bounds.min.x) * (ppu - padding)) + ' ' + 
		(canvasSize.y / 2 + (bounds.max.y - (bounds.max.y - bounds.min.y) * 0.5) * (ppu - padding)) +
	') scale(' +
		(ppu - padding) + ' ' +
		-(ppu - padding) +
	')');
};
MIWeb.Curves.CurveEditor.prototype.renderBackground = function(axes,grid) {
	if(!axes && !grid) {
		return '';
	}
	
	var scale = this.curveContext.scale;
	var canvasSize = this.curveContext.canvasSize;
	var bounds = this.curveContext.fullBounds;
	var ppu = this.curveContext.pxPerUnit;
	
	this.background = this.container.querySelector('[data-id="background"]');
	if(!this.background) {
		this.background = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.background.setAttribute('data-id','background');
		if(this.canvas.children.length) {
			this.canvas.insertBefore(this.background, this.canvas.children[0]);
		} else {
			this.canvas.appendChild(this.background);
		}
	}
	
	var canvas = '';

    var size = {
        x: this.curveContext.canvasSize.x / ppu,
        y: this.curveContext.canvasSize.y / ppu
    };
	var gridBounds = {
		min: {
			x: bounds.min.x/* - size.x*/,
			y: bounds.min.y/* - size.y*/
		},
		max: {
			x: bounds.min.x + size.x,
			y: bounds.min.y + size.y
		},
		center: {
			x: bounds.center.x,
			y: bounds.center.y
		}
	};
	
	if(axes) {
		canvas += '<path d="M 0 ' + (gridBounds.center.y - canvasSize.y / ppu / 2) + ' L 0 ' + (gridBounds.center.y + canvasSize.y / ppu / 2) + '" stroke-width="' + (this.config.axesWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
		canvas += '<path d="M ' + (gridBounds.center.x - canvasSize.x / ppu / 2) * scale.x + ' 0 L ' + (gridBounds.center.x + canvasSize.x / ppu / 2) * scale.x + ' 0" stroke-width="' + (this.config.axesWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
	}
	
	if(grid) {
		//var units = Math.min(canvasSize.x,canvasSize.y) / scale;
		var pixelsPerCell = 100;
		var gridSizeDesired = {
			x: (canvasSize.x / ppu) / (canvasSize.x / pixelsPerCell),
			y: (canvasSize.y / ppu) / (canvasSize.y / pixelsPerCell)
		};
		var gridSize = {
			x: Math.pow(10,Math.round(Math.log10(gridSizeDesired.x))),
			y: Math.pow(10,Math.round(Math.log10(gridSizeDesired.y)))
		};
		if(gridSizeDesired.x < gridSize.x * 0.75) gridSize.x /= 2;
		if(gridSizeDesired.y < gridSize.y * 0.75) gridSize.y /= 2;
		
		var gridCountX = canvasSize.x / (gridSize.x * ppu) / scale.x + 2;
		var gridCountY = canvasSize.y / (gridSize.y * ppu) / scale.y + 2;
		var gridExtentX = Math.ceil(gridCountX / 2);
		var gridExtentY = Math.ceil(gridCountY / 2);
		var gridStartX = Math.floor(gridBounds.min.x / gridSize.x) * gridSize.x - gridSize.x;
		//var gridStartX = Math.floor((gridBounds.center.x - (canvasSize.x / ppu / scale.x / 2)) / gridSize.x) * gridSize.x;
		var gridStartY = Math.floor((gridBounds.center.y - (canvasSize.y / ppu / scale.y / 2)) / gridSize.y) * gridSize.y - gridSize.y;
		
		for(var g = 0; g < gridCountX; g++) {
			var x = g * gridSize.x * scale.x + gridStartX * scale.x;
			if(x != 0) {
				canvas += '<path d="M ' + x + ' ' + (gridBounds.center.y - gridExtentY) + ' L ' + x + ' ' + (gridBounds.center.y + gridExtentY) + '" stroke-width="' + (this.config.gridWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
			}
			canvas += '<text x="' + (x + 5 / ppu) + '" y="' + (-10 / ppu) + '" fill="' + this.config.gridColor + '"  font-size="' + (16 / ppu) + '" transform="scale(1,-1)">' + (Math.round(x / scale.x * 100) / 100) + '</text>';
		}

        for(var g = 0; g < gridCountY; g++) {
            var y = g * gridSize.y * scale.y + gridStartY * scale.y;
            if(y == 0) {
                continue;
            }
            canvas += '<path d="M ' + (gridBounds.center.x * scale.x - gridExtentX) + ' ' + y + ' L ' + (gridBounds.center.x * scale.x + gridExtentX) + ' ' + y + '" stroke-width="' + (this.config.gridWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
            canvas += '<text x="' + (5 / ppu) + '" y="' + (-y - 10 / ppu) + '" fill="' + this.config.gridColor + '"  font-size="' + (16 / ppu) + '" transform="scale(1,-1)">' + (Math.round(y / scale.y * 100) / 100) + '</text>';
        }
		
		/*for(var g = gridStartY; g < gridCountY - gridStartY; g++) {
			if(g == 0) {
				continue;
			}
			var y = canvasSize.y - (g * gridSize.y * ppu);
			canvas += '<path d="M 0 ' + y + ' L ' + canvasSize.x + ' ' + y + '" stroke-width="' + (this.config.gridWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
			canvas += '<text x="' + 0 + '" y="' + (y - 10) + '" fill="' + this.config.gridColor + '">' + (Math.round(g * gridSize.y * 100) / 100) + '</text>';
		}*/
	}
	
	this.background.innerHTML = canvas;
};
MIWeb.Curves.CurveEditor.prototype.renderCurve = function(frames) {
	var frames = this.getCurveFrames();
	
	this.frameViews = Array.apply(null, this.container.querySelectorAll('[data-id="frame"]'));
	if(!this.frameViews) {
		this.frameViews = [];
	}
	
	if(frames.length > this.frameViews.length) {
		//create new views
		var dragable = [];
		for(var f = this.frameViews.length; f < frames.length; f++) {
			this.frameViews[f] = document.createElementNS("http://www.w3.org/2000/svg", "g");
			this.frameViews[f].setAttribute('data-id','frame');
			this.frameViews[f].parts = {};
			
			var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttribute('fill', 'transparent');
			this.frameViews[f].parts.path = path;
			this.frameViews[f].appendChild(path);
			
			var pathHandleL = document.createElementNS("http://www.w3.org/2000/svg", "path");
			pathHandleL.setAttribute('fill', 'transparent');
			this.frameViews[f].parts.pathHandleL = pathHandleL;
			this.frameViews[f].appendChild(pathHandleL);
			
			var pathHandleR = document.createElementNS("http://www.w3.org/2000/svg", "path");
			pathHandleR.setAttribute('fill', 'transparent');
			this.frameViews[f].parts.pathHandleR = pathHandleR;
			this.frameViews[f].appendChild(pathHandleR);
			
			var pointHandleL = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			pointHandleL.setAttribute('data-frame', f);
			pointHandleL.setAttribute('data-grab', 1);
			dragable.push(pointHandleL);
			this.frameViews[f].parts.pointHandleL = pointHandleL;
			this.frameViews[f].appendChild(pointHandleL);
			
			var pointHandleR = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			pointHandleR.setAttribute('data-frame', f);
			pointHandleR.setAttribute('data-grab', 2);
			dragable.push(pointHandleR);
			this.frameViews[f].parts.pointHandleR = pointHandleR;
			this.frameViews[f].appendChild(pointHandleR);
			
			var point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			point.setAttribute('data-frame', f);
			point.setAttribute('data-grab', 0);
			dragable.push(point);
			this.frameViews[f].parts.point = point;
			this.frameViews[f].appendChild(point);
			
			this.canvas.appendChild(this.frameViews[f]);
		}
		
		var editor = this;
		for(var d = 0; d < dragable.length; d++) {
			dragable[d].onclick = function(e) {
				editor.selected = e.target.getAttribute("data-frame");
				editor.draw();
			};
			
			if(this.config.dragable && dragable[d].hasAttribute("data-grab")) {
				dragable[d].onmousedown = function(e) {
					editor.selected = e.target.getAttribute("data-frame");
					editor.grabbed = [e.target.getAttribute("data-frame"),e.target.getAttribute("data-grab")];
				};
			}
		}
	} else if(frames.length < this.frameViews.length) {
		//remove old views
		for(var f = frames.length; f < this.frameViews.length; f++) {
			this.frameViews[f].parentNode.removeChild(this.frameViews[f]);
		}
		this.frameViews = this.frameViews.slice(0, frames.length);
	}
	
	//update existing views
	var scale = this.curveContext.scale;
	var ppu = this.curveContext.pxPerUnit;
	for(var f = 0; f < frames.length; f++) {
		var point = {
			x: frames[f].point.x * scale.x,
			y: frames[f].point.y * scale.y
		};
		var handle = {
			x: frames[f].controlRight.x * scale.x + point.x,
			y: frames[f].controlRight.y * scale.y + point.y
		};
		
		if(f < frames.length - 1) {
			var nextPoint = {
				x: frames[f + 1].point.x * scale.x,
				y: frames[f + 1].point.y * scale.y
			};
			var nextHandle = {
				x: frames[f + 1].controlLeft.x * scale.x + nextPoint.x,
				y: frames[f + 1].controlLeft.y * scale.y + nextPoint.y
			};
		
			this.frameViews[f].parts.path.setAttribute('d',
				"M" + point.x + " " + point.y + 
				" C " + handle.x + " " + handle.y + 
				", " + nextHandle.x + " " + nextHandle.y + 
				", " + nextPoint.x + " " + nextPoint.y
			);
			this.frameViews[f].parts.path.setAttribute('stroke', (frames[f + 1].virtual ? this.config.loopColor : this.config.curveColor));
		} else {
			this.frameViews[f].parts.path.setAttribute('d','');
		}
		this.frameViews[f].parts.path.setAttribute('stroke-width',this.config.gridWeight / ppu);
		
		var stroke = "";
		if(f == this.selected) {
			stroke = this.config.curveColor;
		}
			
		if(this.config.drawDots && !frames[f].virtual) {
			this.frameViews[f].parts.point.setAttribute('cx', point.x);
			this.frameViews[f].parts.point.setAttribute('cy', point.y);
			this.frameViews[f].parts.point.setAttribute('r', this.config.dotSize / ppu);
			this.frameViews[f].parts.point.setAttribute('stroke', stroke);
			this.frameViews[f].parts.point.setAttribute('stroke-width',this.config.gridWeight / ppu);
		} else {
			this.frameViews[f].parts.point.setAttribute('r',0);
			this.frameViews[f].parts.point.setAttribute('stroke-width',0);
		}
		
		if(this.config.drawHandles && !frames[f].virtual) {
			var handleColor = f == this.selected ? this.config.handleSelectedColor : this.config.handleColor;
	
			this.frameViews[f].parts.pathHandleL.setAttribute('d',
				"M" + point.x + " " + point.y + 
				" L " + (point.x + frames[f].controlLeft.x * scale.x) + " " + (point.y + frames[f].controlLeft.y * scale.y)
			);
			this.frameViews[f].parts.pathHandleL.setAttribute('stroke', handleColor);
			this.frameViews[f].parts.pathHandleL.setAttribute('stroke-width',this.config.gridWeight / ppu);
			
			this.frameViews[f].parts.pathHandleR.setAttribute('d',
				"M" + point.x + " " + point.y + 
				" L " + (point.x + frames[f].controlRight.x * scale.x) + " " + (point.y + frames[f].controlRight.y * scale.y)
			);
			this.frameViews[f].parts.pathHandleR.setAttribute('stroke', handleColor);
			this.frameViews[f].parts.pathHandleR.setAttribute('stroke-width',this.config.gridWeight / ppu);
			
			this.frameViews[f].parts.pointHandleL.setAttribute('cx', point.x + frames[f].controlLeft.x * scale.x);
			this.frameViews[f].parts.pointHandleL.setAttribute('cy', point.y + frames[f].controlLeft.y * scale.y);
			this.frameViews[f].parts.pointHandleL.setAttribute('r', this.config.dotSize / ppu);
			this.frameViews[f].parts.pointHandleL.setAttribute('fill', handleColor);
			this.frameViews[f].parts.pointHandleL.setAttribute('stroke', stroke);
			this.frameViews[f].parts.pointHandleL.setAttribute('stroke-width',this.config.gridWeight / ppu);
			
			this.frameViews[f].parts.pointHandleR.setAttribute('cx', point.x + frames[f].controlRight.x * scale.x);
			this.frameViews[f].parts.pointHandleR.setAttribute('cy', point.y + frames[f].controlRight.y * scale.y);
			this.frameViews[f].parts.pointHandleR.setAttribute('r', this.config.dotSize / ppu);
			this.frameViews[f].parts.pointHandleR.setAttribute('fill', handleColor);
			this.frameViews[f].parts.pointHandleR.setAttribute('stroke', stroke);
			this.frameViews[f].parts.pointHandleR.setAttribute('stroke-width',this.config.gridWeight / ppu);
		} else {
			this.frameViews[f].parts.pointHandleL.setAttribute('r', 0);
			this.frameViews[f].parts.pointHandleL.setAttribute('stroke-width',0);
			this.frameViews[f].parts.pointHandleR.setAttribute('r', 0);
			this.frameViews[f].parts.pointHandleR.setAttribute('stroke-width',0);
			this.frameViews[f].parts.pathHandleL.setAttribute('d', '');
			this.frameViews[f].parts.pathHandleR.setAttribute('d', '');
		}
	}
};
MIWeb.Curves.CurveEditor.prototype.renderControls = function() {
	this.controls = this.container.querySelector('.controls');
	if(!this.controls) {
		this.controls = document.createElement("div");
		this.controls.className = 'controls';
		this.container.appendChild(this.controls);
	}
	
	var selectedFrame = this.selected >= 0 && this.selected < this.curve.frames.length ? this.curve.frames[this.selected] : null;
	var controls = '';
	controls += '<div class="option"><label>end</label>';
	controls += '<select name="curve-end" onchange="draw();">';
	controls += '<option value="">None</option>';
	controls += '<option value="loop" ' + (this.curve.end == 'loop' ? 'selected' : '') + '>Loop</option>';
	controls += '<option value="ping-pong-x" ' + (this.curve.end == 'ping-pong-x' ? 'selected' : '') + '>Ping Pong X</option>';
	controls += '<option value="ping-pong-y" ' + (this.curve.end == 'ping-pong-y' ? 'selected' : '') + '>Ping Pong Y</option>';
	controls += '<option value="ping-pong-xy" ' + (this.curve.end == 'ping-pong-xy' ? 'selected' : '') + '>Ping Pong XY</option>';
	controls += '</select></div>';
	if(selectedFrame) {
		controls += '<div class="option vector2"><label>point</label>';
		controls += '<input type="text" name="frame-point-x" value="' + (selectedFrame ? selectedFrame.point.x : '') + '" />';
		controls += '<input type="text" name="frame-point-y" value="' + (selectedFrame ? selectedFrame.point.y : '') + '" /></div>';
		controls += '<div class="option vector2"><label>handle left</label>';
		controls += '<input type="text" name="frame-controlLeft-x" value="' + (selectedFrame ? selectedFrame.controlLeft.x : '') + '" />';
		controls += '<input type="text" name="frame-controlLeft-y" value="' + (selectedFrame ? selectedFrame.controlLeft.y : '') + '" /></div>';
		controls += '<div class="option vector2"><label>handle right</label>';
		controls += '<input type="text" name="frame-controlRight-x" value="' + (selectedFrame ? selectedFrame.controlRight.x : '') + '" />';
		controls += '<input type="text" name="frame-controlRight-y" value="' + (selectedFrame ? selectedFrame.controlRight.y : '') + '" /></div>';
	}
	
	this.controls.innerHTML = controls;
	
	//add input events
	if(this.config.drawControls) {
		var controls = this.controls.querySelectorAll("input, select");
		var editor = this;
		for(var c = 0; c < controls.length; c++) {
			controls[c].onchange = function() {
				//var selectedFrame = editor.selected >= 0 && editor.selected < editor.curve.frames.length ? editor.curve.frames[editor.selected] : null;
				var target = editor;
				var propertySplit = this.getAttribute('name').split('-');
				if(propertySplit[0] == 'frame') {
					target = editor.selected >= 0 && editor.selected < editor.curve.frames.length ? editor.curve.frames[editor.selected] : null;
					propertySplit = propertySplit.slice(1);
				}
				
				if(!target || !propertySplit) {
					return;
				}
				
				for(var p = 0; p < propertySplit.length - 1; p++) {
					if(!target[propertySplit[p]]) {
						return;
					}
					target = target[propertySplit[p]];
				}
				
				var val = this.value;
				if(!isNaN(parseFloat(val)) && isFinite(val)) {
					val = parseFloat(val);
				}
				
				target[propertySplit[propertySplit.length - 1]] = val;		
				editor.draw();
			};
		}
	}
};
MIWeb.Curves.CurveEditor.prototype.renderWindowOptions = function() {
	this.windowOptions = this.container.querySelector('.curve-window-controls');
	if(!this.windowOptions) {
		this.windowOptions = document.createElement('div');
		this.windowOptions.className = 'curve-window-controls';
		this.container.appendChild(this.windowOptions);
	}
	
	var windowOptions = '';
	if(!this.minimized) {
		windowOptions += '<button class="display-code">&lt;/&gt;</button>';
	}
	if(this.config.minimizable) {
		windowOptions += '<button class="minimize">' + (this.minimized ? '&#8599;' : "&#8601;") + '</button>';
	}
		
	this.windowOptions.innerHTML = windowOptions;
	var editor = this;
		
	if(!this.minimized) {
		this.windowOptions.querySelector('button.display-code').onclick = function() {
			var printFrames = [];
			for(var p = 0; p < editor.curve.frames.length; p++) {
				printFrames.push(JSON.stringify(editor.curve.frames[p]));
			}
			alert("[\n\t" + printFrames.join(",\n\t") + "\n]");
		};
	}
	if(this.config.minimizable) {
		this.windowOptions.querySelector('button.minimize').onclick = function() {
			editor.minimized = !editor.minimized;
			editor.draw();
		};
	}
};
MIWeb.Curves.CurveEditor.prototype.getCurveFrames = function() {
	if(!this.curve.frames || !this.curve.frames.length) {
		return [];
	}
	
	var loopCount = 0;
	if(this.config.drawLoop) {
		var loopX = this.curve.frames[this.curve.frames.length - 1].point.x;
		loopCount = this.curveContext.canvasSize.x / this.curveContext.pxPerUnit / loopX;
	}
	
	return this.curve.getFrames(loopCount);
};var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

MIWeb.Audio.Clip = function(sampleRate, data, channels) {
	this.sampleRate = sampleRate || 44100;
	this.data = data || [];
	this.channels = channels || 1;
};var MIWeb = MIWeb || {};
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
};var MIWeb = MIWeb || {};
MIWeb.Audio = MIWeb.Audio || {};

MIWeb.Audio.Synthesizer = function(wave, amplitude, frequency, note, octave, volume, duration, sampleRate) {
	this.wave = wave || new MIWeb.Curves.Curve();
	this.amplitudeCurve = amplitude || new MIWeb.Curves.Curve();
	this.frequencyCurve = frequency || new MIWeb.Curves.Curve();
	this.setNote(note || 'C');
	this.setOctave(octave || 4);
	this.setVolume(volume || 1);
	this.setDuration(duration || 2);
	this.setSampleRate(sampleRate || 44100);
	this.debug = false;
};
MIWeb.Audio.Synthesizer.prototype.setNote = function(note) {
	if(MIWeb.Audio.Synthesizer.Notes[note]) {
		this.note = MIWeb.Audio.Synthesizer.Notes[note];
	} else {
		this.note = note;
	}
};
MIWeb.Audio.Synthesizer.prototype.applyPreset = function(preset, property) {
	if(MIWeb.Audio.Synthesizer.Presets[preset]) {
		preset = MIWeb.Audio.Synthesizer.Presets[preset];
	}
	preset = JSON.parse(JSON.stringify(preset));
	
	if(property) {
		if(preset[property]) {
			this.applyProperty(property, preset[property]);
		} else {
			console.error("preset does not contain property '" + property + "'");
		}
	} else {
		for(var p in preset) {
			this.applyProperty(p, preset[p]);
		}
	}
};
MIWeb.Audio.Synthesizer.prototype.applyProperty = function(name, val) {
	if((name == 'wave' || name == 'amplitudeCurve' || name == 'frequencyCurve') && !(val instanceof MIWeb.Curves.Curve)) {
		var tmp = val;
		var val = new MIWeb.Curves.Curve();
		for(var p in tmp) {
			val[p] = tmp[p];
		}
	}
	
	this[name] = val;
};
MIWeb.Audio.Synthesizer.prototype.setOctave = function(octave) {
	this.octave = Math.max(1, Math.min(8, octave));
};
MIWeb.Audio.Synthesizer.prototype.setVolume = function(volume) {
	this.volume = Math.max(0, volume);
};
MIWeb.Audio.Synthesizer.prototype.setDuration = function(duration) {
	this.duration = Math.max(0.01, duration);
};
MIWeb.Audio.Synthesizer.prototype.setSampleRate = function(sampleRate) {
	this.sampleRate = Math.max(4000, sampleRate);
}
MIWeb.Audio.Synthesizer.prototype.getFrequency = function() {
	return this.note * Math.pow(2, this.octave - 4);
};
MIWeb.Audio.Synthesizer.prototype.getSampleCount = function() {
	return (this.duration * this.sampleRate) | 0;
};
MIWeb.Audio.Synthesizer.prototype.generate = function() {
	if(this.debug) { 
		var timer = (new Date).valueOf();
		var minFrequency,maxFrequency,minAmplitude,maxAmplitude,minValue,maxValue;
	}
	
	var frequency = this.getFrequency();
	var sampleCount = this.getSampleCount();
	var data = [];
	var t,f,a;
	for(var s = 0; s < sampleCount; s++) {
		t = s / sampleCount;
		//f = frequency * this.frequencyCurve.getValue(t);
		f = frequency + (frequency * this.frequencyCurve.getValue(t));
		a = this.amplitudeCurve.getValue(t);
		data.push(
			this.volume *
			a *
			this.wave.getValue((s / this.sampleRate) * f)
		);
		
		if(this.debug) {
			if(s == 0) {
				minFrequency = maxFrequency = f;
				minAmplitude = maxAmplitude = a;
				minValue = maxValue = data[s];
			} else {
				minFrequency = Math.min(f, minFrequency);
				maxFrequency = Math.max(f, maxFrequency);
				minAmplitude = Math.min(a, minAmplitude);
				maxAmplitude = Math.max(a, maxAmplitude);
				minValue = Math.min(data[s], minValue);
				maxValue = Math.max(data[s], maxValue);
			}
		}
	}
	
	if(this.debug) { 
		console.log('frequency: ', f, '(min: ', minFrequency, ', max: ', maxFrequency, '), amplitude: ', (minAmplitude + (maxAmplitude - minAmplitude) / 2), ' (min: ',minAmplitude,', max: ', maxAmplitude, '), value: ', this.volume, ' (min: ',minValue,', max: ', maxValue, ')');
		console.log((new Date).valueOf() - timer, 'ms to generate'); 
	}
	
	return new MIWeb.Audio.Clip(this.sampleRate, data);
};

MIWeb.Audio.Synthesizer.Notes = {
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

MIWeb.Audio.Synthesizer.Waves = {
	piano: function(t) {
		var f = 1;
		var base = function(x){
			return Math.sin(2 * Math.PI * t * f + x);
		};
		
		return 1 * Math.sin(2 * Math.PI * t * f + (
			Math.pow(base(0), 2)
			+ (0.75 * base(0.25))
			+ (0.1 * base(0.5))
		));
	}
};

MIWeb.Audio.Synthesizer.Presets = {
	/*constant: {
		wave: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop')
	},*/
	sine: {
		wave: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.25,"y":1},"controlLeft":{"x":-0.125,"y":0},"controlRight":{"x":0.125,"y":0}},
			{"point":{"x":0.5,"y":0},"controlLeft":{"x":-0.017,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		/*amplitudeCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0, y: 0}}
		], '')*/
		amplitudeCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 1}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 1}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop')
	},
	piano: {
		wave: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0.0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.015, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.0}, controlLeft: {x: -0.015, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: -0.25}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], ''),
		duration: 1.5
	},
	organ: {
		wave: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0.225}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.02, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.225}, controlLeft: {x: -0.02, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.001,"y":0.5}},
			{"point":{"x":0.3527762863814007,"y":1},"controlLeft":{"x":-0.20118618037433356,"y":0.0010600706713781438},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.3593639575971731,"y":0.1176678445229682},"controlRight":{"x":0,"y":0}}
		],''),
		duration: 2
	},
	violin: {
		wave: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.04442438188144986,"y":0.014510486451557225}},
			{"point":{"x":0.1,"y":-0.2},"controlLeft":{"x":-0.025,"y":0},"controlRight":{"x":0.0657243816254417,"y":0.000706713780918744}},
			{"point":{"x":0.2,"y":0.9},"controlLeft":{"x":-0.06537102473498235,"y":0.00035335689045934426},"controlRight":{"x":0.06749116607773853,"y":0.0031802120141342094}},
			{"point":{"x":0.3,"y":-0.5},"controlLeft":{"x":-0.0607773851590106,"y":0.003886925795053009},"controlRight":{"x":0.038162544169611345,"y":0.0010600706713780883}},
			{"point":{"x":0.4,"y":-0.1},"controlLeft":{"x":-0.03639575971731451,"y":-0.00035335689045935814},"controlRight":{"x":0.03992932862190812,"y":-0.00035335689045935814}},
			{"point":{"x":0.5,"y":-0.75},"controlLeft":{"x":-0.04310954063604239,"y":-0.0005300353356890719},"controlRight":{"x":0.0558303886925795,"y":-0.006183745583038913}},
			{"point":{"x":0.6,"y":1},"controlLeft":{"x":-0.04982332155477032,"y":-0.0007067137809186885},"controlRight":{"x":0.06486994084805042,"y":0.0035343172769766174}},
			{"point":{"x":0.7,"y":-1},"controlLeft":{"x":-0.05239143496661236,"y":0.0035398132814080663},"controlRight":{"x":0.043891486287687576,"y":0.0035398132814080663}},
			{"point":{"x":0.8,"y":-0.8},"controlLeft":{"x":-0.04194926058668014,"y":-0.0010624935848655426},"controlRight":{"x":0.05150181004249332,"y":-0.0010624935848655426}},
			{"point":{"x":0.9,"y":-0.9},"controlLeft":{"x":-0.04000263808212723,"y":-0.003009116089418451},"controlRight":{"x":0.05628028317217271,"y":0.0026545851608344995}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.04938341807808022,"y":0.00035123332592488355},"controlRight":{"x":0,"y":0}}
		], 'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.001,"y":0.5}},
			{"point":{"x":0.2364293890101159,"y":1},"controlLeft":{"x":-0.2364293890101159,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":0},"controlLeft":{"x":-0.3593639575971731,"y":0.1176678445229682},"controlRight":{"x":0,"y":0}}
		], '')
	},
	jump: {
		wave: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0.225},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.02,"y":0.2}},
			{"point":{"x":0.1,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":-3.1982265396987613}},
			{"point":{"x":0.3,"y":-0.35},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.075,"y":0}},
			{"point":{"x":0.48,"y":0.23},"controlLeft":{"x":-0.075,"y":0},"controlRight":{"x":0.010768237480081322,"y":-1.494611577006979}},
			{"point":{"x":0.725,"y":-1},"controlLeft":{"x":-0.1,"y":0},"controlRight":{"x":0.15,"y":0}},
			{"point":{"x":1,"y":0.225},"controlLeft":{"x":-0.02,"y":-0.2},"controlRight":{"x":0,"y":0}}
		],'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":1},"controlLeft":{"x":-0.007979626485568936,"y":-0.6597623089983025},"controlRight":{"x":0,"y":0}}
		], ''),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.001, y: 0.5}},
			{point: {x: 0.002, y: 1}, controlLeft: {x: -0.001, y: -0.5}, controlRight: {x: 0, y: -0.25}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], ''),
		duration: 0.5
	},
	warp: {
		wave: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.25,"y":1},"controlLeft":{"x":-0.125,"y":0},"controlRight":{"x":0.125,"y":0}},
			{"point":{"x":0.5,"y":0},"controlLeft":{"x":-0.017,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.25,"y":0}},
			{"point":{"x":1,"y":1},"controlLeft":{"x":-0.007979626485568936,"y":-0.6597623089983025},"controlRight":{"x":0,"y":0}}
		], ''),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.05,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":0}},
			{"point":{"x":0.1,"y":0},"controlLeft":{"x":0,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		duration: 0.75
	},
	engine: {
		wave: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0.225}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.02, y: 0.2}},
			{point: {x: 0.1, y: 1}, controlLeft: {x: -0.05, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.3, y: -0.35}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.48, y: 0.23}, controlLeft: {x: -0.075, y: 0}, controlRight: {x: 0.075, y: 0}},
			{point: {x: 0.725, y: -1}, controlLeft: {x: -0.1, y: 0}, controlRight: {x: 0.15, y: 0}},
			{point: {x: 1, y: 0.225}, controlLeft: {x: -0.02, y: -0.2}, controlRight: {x: 0, y: 0}},
		],'loop'),
		frequencyCurve: new MIWeb.Curves.Curve([
			{point: {x: 0, y: 0}, controlLeft: {x: 0, y: 0}, controlRight: {x: 0.25, y: 0}},
			{point: {x: 1, y: 0}, controlLeft: {x: -0.25, y: 0}, controlRight: {x: 0, y: 0}}
		], 'loop'),
		amplitudeCurve: new MIWeb.Curves.Curve([
			{"point":{"x":0,"y":0},"controlLeft":{"x":0,"y":0},"controlRight":{"x":0.017,"y":0.1}},
			{"point":{"x":0.05,"y":1},"controlLeft":{"x":-0.05,"y":0},"controlRight":{"x":0,"y":0}},
			{"point":{"x":0.1,"y":0},"controlLeft":{"x":0,"y":0.1},"controlRight":{"x":0,"y":0}}
		], 'ping-pong-y'),
		duration: 0.5,
		//note: 277.18,
		octave: 2
	}
};var MIWeb = MIWeb || {};
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
};//todo:
//use session to store state
//curves: freestyle / controlled (amplitude: attack, decay, sustain, release; frequency: speed, accel, jerk; http://sfbgames.com/chiptone/)
//update keyboard octave on preset load
//multiple curves (combine curves)
//presets: 
//  instruments: guitar, trumpet, drum
//  sfx: coin, power up, punch, explosion, zap, hurt, blip, win, lose

var container = document.querySelector('.synth');

/*var frames = [];
var srcWave = new MIWeb.PianoCurve();
for(var i = 0; i <= 100; i++) {
	var t = (i / 100);
	frames.push({
		point: {x: t, y: srcWave.getValue(t)},
		controlLeft: {x: 0, y: 0},
		controlRight: {x: 0, y: 0}
	});
}
var wave = new MIWeb.Curve(frames, 'loop');*/

//initialize the synthesizer
var synth = new MIWeb.Audio.Synthesizer();
synth.debug = false;

//initialize the wav writer
var wavWriter = new MIWeb.Audio.WAVWriter();

//initialize the curve editors
var waveEditor = new MIWeb.Curves.CurveEditor(container.querySelector('.curve.wave'), synth.wave, {}, false);
var amplitudeEditor = new MIWeb.Curves.CurveEditor(container.querySelector('.curve.amplitude'), synth.amplitudeCurve, {}, false);
var frequencyEditor = new MIWeb.Curves.CurveEditor(container.querySelector('.curve.frequency'), synth.frequencyCurve, {}, false);

//initialize the keyboard
var keyboard = new MIWeb.Audio.UI.Keyboard(container.querySelector(".keyboard"), 3, 3, function(e) {
	setNote(e.detail.note, e.detail.octave);
	play();
});

//play function: updates synthesizer & plays the sound
function play() {
	var timer = (new Date).valueOf();
		
	synth.setVolume(container.querySelector(".volume").value / 100);
	synth.setDuration(parseFloat(container.querySelector(".duration").value));

	var src = '';
	var local = true;
	if(local) {
		console.log("prepared (" + ((new Date).valueOf() - timer) + "ms)");
		var data = synth.generate();
		console.log("generated (" + ((new Date).valueOf() - timer) + "ms)");
		src = wavWriter.write(data);
		console.log("written (" + ((new Date).valueOf() - timer) + "ms)");
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
}

//setNote function: updates synthesizer & keyboards active key
function setNote(note, octave) {
	synth.setNote(note);
	synth.setOctave(octave);
	
	var activeClass = "active";
	
	var activeKey = keyboard.container.querySelector('.key.' + activeClass);
	if(activeKey) {
		//activeKey.className = activeKey.className.replace(new RegExp('(\b)' + activeClass + '(\b)'),"$1$2");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp('^' + activeClass + ' '),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + '$'),"");
		activeKey.className = activeKey.className.replace(new RegExp(' ' + activeClass + ' '),"");
	}
	
	var key = keyboard.container.querySelector('.key[data-note="' + note + '"][data-octave="' + octave + '"]');
	if(key) {
		var classArr = key.className.split(" ");
		if(classArr.indexOf(activeClass) == -1) {
			key.className += " " + activeClass;
		}
	}
}

//applyPreset function: updates synthesizer, wave editors and option inputs
function applyPreset(preset, property) {
	synth.applyPreset(preset, property);
	
	waveEditor.setCurve(synth.wave);
	amplitudeEditor.setCurve(synth.amplitudeCurve);
	frequencyEditor.setCurve(synth.frequencyCurve);
	
	container.querySelector(".volume").value = Math.max(0, Math.min(100, Math.round(synth.volume * 100)));
	container.querySelector(".duration").value = Math.max(0, synth.duration);
}

//setup preset buttons
var presetButtons = container.querySelectorAll(".preset");
for(var p = 0; p < presetButtons.length; p++) {
	presetButtons[p].onclick = function() {
		var preset = this.getAttribute('data-preset');
		if(!preset) {
			console.error("preset button has no preset defined.");
			return;
		}
		if(!MIWeb.Audio.Synthesizer.Presets[preset]) {
			console.error("preset button has unknown preset: '" + preset + "'.");
			return;
		}
		
		var property = null;
		if(this.hasAttribute('data-property')) {
			property = this.getAttribute('data-property');
		}
		
		if(!confirm("Replace " + (property || 'values') + " with preset '" + this.innerHTML + "'?")) {
			return;
		}
		
		applyPreset(preset, property);
		play();
	};
}

//setup play button
container.querySelector(".play").onclick = function() {
	play();
};

//setup download button
container.querySelector(".download").onclick = function() {
	var data = wavWriter.write(synth.generate());
	
	var link = document.createElement("a");
	link.download = "sample.wav";
	link.href = data;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
};

//setup save button
container.querySelector(".save").onclick = function() {
	var data = "data:text/json," + JSON.stringify(synth);
	
	var link = document.createElement("a");
	link.download = "sample.json";
	link.href = data;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
};

//setup load button
container.querySelector(".load").onclick = function() {
	var input = document.createElement("input");
	input.type = 'file';
	input.onchange = function(e) {
		var file = e.target.files[0];
		if(file) {
			var reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = function (evt) {
				var options = JSON.parse(evt.target.result);
				if(!options) {
					alert("error parsing file");
				}
				applyPreset(options);
				play();
			}
			reader.onerror = function (evt) {
				alert("error reading file");
			}
		}
	};
	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
	delete input;
};

//initialize the synthesizer
synth.volume = 0.5;
setNote('C', 4);
applyPreset('piano');