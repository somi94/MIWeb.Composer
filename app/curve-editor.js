//TODO:
//solve drag&drop bug on scrolled window
//solve auto resizing window behaviour while dragging (zoom levels (=steps)?)
//auto select frame on drag start
//add/remove frames
//show full synth source(=config) (formatted json)
//make synth source editable
//play button in popup
//handle size?
//make loops easier?
//improve presets
//dont render everything again on draw, dont redraw on drag/input

var MIWeb = MIWeb || {};

MIWeb.CurveEditor = function(container, curve, options, maximize) {
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
MIWeb.CurveEditor.prototype.setCurve = function(curve) {
	this.curve = curve;
	this.selected = -1;
	this.lastSelected = -1;
	this.grabbed = false;
	this.draw();
};
MIWeb.CurveEditor.prototype.draw = function() {
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
MIWeb.CurveEditor.prototype.setupCurveContext = function() {
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
			this.curveContext.bounds.min = {
				x: frame.point.x,
				y: frame.point.y
			};
			this.curveContext.bounds.max = {
				x: frame.point.x,
				y: frame.point.y
			};
		} else {
			this.curveContext.fullBounds.min.x = Math.min(this.curveContext.fullBounds.min.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			this.curveContext.fullBounds.max.x = Math.max(this.curveContext.fullBounds.max.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			this.curveContext.fullBounds.min.y = Math.min(this.curveContext.fullBounds.min.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
			this.curveContext.fullBounds.max.y = Math.max(this.curveContext.fullBounds.max.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
			this.curveContext.bounds.min.x = Math.min(this.curveContext.bounds.min.x, frame.point.x);
			this.curveContext.bounds.max.x = Math.max(this.curveContext.bounds.max.x, frame.point.x);
			this.curveContext.bounds.min.y = Math.min(this.curveContext.bounds.min.y, frame.point.y);
			this.curveContext.bounds.max.y = Math.max(this.curveContext.bounds.max.y, frame.point.y);
		}
	}
	this.curveContext.fullBounds.center.x = this.curveContext.fullBounds.min.x + this.curveContext.fullBounds.size.x / 2;
	this.curveContext.fullBounds.center.y = this.curveContext.fullBounds.min.y + this.curveContext.fullBounds.size.y / 2;
	this.curveContext.bounds.center.x = this.curveContext.bounds.min.x + this.curveContext.bounds.size.x / 2;
	this.curveContext.bounds.center.y = this.curveContext.bounds.min.y + this.curveContext.bounds.size.y / 2;
	
	//var sizeX = this.curve.end == 'ping-pong-xy' ? 4 : (this.curve.end ? 2 : 1);
	//var sizeY = this.curve.end == 'ping-pong-y' || this.curve.end == 'ping-pong-xy' ? 2 : 1
	if(this.curve.end == 'ping-pong-y' || this.curve.end == 'ping-pong-xy') {
		var fullExtentsY = Math.max(Math.abs(this.curveContext.fullBounds.min.y), Math.abs(this.curveContext.fullBounds.max.y));
		this.curveContext.fullBounds.min.y = -fullExtentsY;
		this.curveContext.fullBounds.max.y = fullExtentsY;
		var extentsY = Math.max(Math.abs(this.curveContext.bounds.min.y), Math.abs(this.curveContext.bounds.max.y));
		this.curveContext.bounds.min.y = -extentsY;
		this.curveContext.bounds.max.y = extentsY;
	}
	
	this.curveContext.fullBounds.size.x = (this.curveContext.fullBounds.max.x - this.curveContext.fullBounds.min.x)/* * sizeX*/;
	this.curveContext.fullBounds.size.y = (this.curveContext.fullBounds.max.y - this.curveContext.fullBounds.min.y)/* * sizeY*/;
	this.curveContext.bounds.size.x = (this.curveContext.bounds.max.x - this.curveContext.bounds.min.x)/* * sizeX*/;
	this.curveContext.bounds.size.y = (this.curveContext.bounds.max.y - this.curveContext.bounds.min.y)/* * sizeY*/;
	
	this.curveContext.pxPerUnit = Math.min(
		this.curveContext.canvasSize.x / (this.curveContext.fullBounds.size.x/* * 1.2*/ || 1),
		this.curveContext.canvasSize.y / (this.curveContext.fullBounds.size.y/* * 1.2*/ || 1)
	);
	
	this.curveContext.scale = {
		x: this.curveContext.canvasSize.x > this.curveContext.canvasSize.y ? this.curveContext.canvasSize.x / this.curveContext.canvasSize.y : 1,
		y: this.curveContext.canvasSize.y > this.curveContext.canvasSize.x ? this.curveContext.canvasSize.y / this.curveContext.canvasSize.x : 1
	};
	
	if(this.config.keepAspectRatio) {
		this.curveContext.scale.x = Math.min(this.curveContext.scale.x,this.curveContext.scale.y);
		this.curveContext.scale.y = this.curveContext.scale.x;
	}
};
MIWeb.CurveEditor.prototype.renderCanvas = function() {
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
	var padding = Math.floor(ppu / 4);
	this.canvas.setAttribute('transform','translate(' + 
		((bounds.min.x) * ppu + padding) + ' ' + 
		(canvasSize.y / 2 + (bounds.max.y - (bounds.max.y - bounds.min.y) * 0.5) * (ppu - padding)) +
	') scale(' +
		(ppu - padding) + ' ' +
		-(ppu - padding) +
	')');
};
MIWeb.CurveEditor.prototype.renderBackground = function(axes,grid) {
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
			x: bounds.min.x - size.x,
			y: bounds.min.y - size.y
		},
		max: {
			x: bounds.min.x + size.x * 3,
			y: bounds.min.y + size.y * 3
		}
	};
	
	if(axes) {
		canvas += '<path d="M 0 ' + gridBounds.min.y + ' L 0 ' + gridBounds.max.y + '" stroke-width="' + (this.config.axesWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
		canvas += '<path d="M ' + gridBounds.min.x + ' 0 L ' + gridBounds.max.x + ' 0" stroke-width="' + (this.config.axesWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
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
		
		var gridCountX = canvasSize.x / (gridSize.x * ppu);
		var gridCountY = canvasSize.y / (gridSize.y * ppu);
		
		for(var g = 0; g < gridCountX; g++) {
			var x = g * gridSize.x * scale.x;
			if(g != 0) {
				canvas += '<path d="M ' + x + ' ' + gridBounds.min.y + ' L ' + x + ' ' + gridBounds.max.y + '" stroke-width="' + (this.config.gridWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
			}
			canvas += '<text x="' + (x + 5 / ppu) + '" y="' + (5 / ppu) + '" fill="' + this.config.gridColor + '"  font-size="' + (16 / ppu) + '" transform="scale(1,-1)">' + (Math.round(g * gridSize.x * 100) / 100) + '</text>';
		}

        for(var g = 0; g < gridCountY; g++) {
            if(g == 0) {
                continue;
            }
            var y = g * gridSize.y * scale.y;
            canvas += '<path d="M ' + gridBounds.min.x + ' ' + y + ' L ' + gridBounds.max.x + ' ' + y + '" stroke-width="' + (this.config.gridWeight / ppu) + '" stroke="' + this.config.gridColor + '" />';
            canvas += '<text x="' + (5 / ppu) + '" y="' + (-y + 5 / ppu) + '" fill="' + this.config.gridColor + '"  font-size="' + (16 / ppu) + '" transform="scale(1,-1)">' + (Math.round(g * gridSize.y * 100) / 100) + '</text>';
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
MIWeb.CurveEditor.prototype.renderCurve = function(frames) {
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
MIWeb.CurveEditor.prototype.renderControls = function() {
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
MIWeb.CurveEditor.prototype.renderWindowOptions = function() {
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
MIWeb.CurveEditor.prototype.getCurveFrames = function() {
	if(!this.curve.frames || !this.curve.frames.length) {
		return [];
	}
	
	var loopCount = 0;
	if(this.config.drawLoop) {
		var loopX = this.curve.frames[this.curve.frames.length - 1].point.x;
		loopCount = this.curveContext.canvasSize.x / this.curveContext.pxPerUnit / loopX;
	}
	
	return this.curve.getFrames(loopCount);
};