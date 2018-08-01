var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.CurveEditor = function(container, curve, options, maximize) {
	var config = {
		drawAxes: true,
		drawGrid: true,
		drawDots: true,
		drawControls: true,
		
		axesWeight: 2,
		gridWeight: 1,
		dotSize: 5,
		curveColor: "black",
		
		gridColor: "#666",
		loopColor: "#ccc",
		size: {x: null, y: null},
		minimizable: true,
		maximizeMode: 'popup',
		dragable: true,
		keepAspectRatio: false,
		minimizeOptions: {
			drawGrid: false,
			drawControls: false,
			drawDots: false,
			axesWeight: 1,
			curveColor: "#ccc"/*,
			size: {x: 200, y: 50}*/
		}
	};
	
	if(options) {
		MIWeb.Utilities.Object.merge(config, options);
	}
	
	this.defaultConfig = config;
	this.config = config;
	
	this.source = container;
	this.container = container;
	this.popup = null;
	this.minimized = !maximize;
	this.setCurve(curve);
};
MIWeb.Curves.CurveEditor.prototype.setCurve = function(curve, silent) {
	this.curve = curve;
	if(!silent) this.draw();
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
};
MIWeb.Curves.CurveEditor.prototype.getCurveBounds = function() {
	return {
		min: {x: 0, y: 0},
		max: {x: this.curve.getLength(), y: 1}
	};
};
MIWeb.Curves.CurveEditor.prototype.setupCurveContext = function() {
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
	
	if(this.curveContext.canvasSize.x < 0 || this.curveContext.canvasSize.y <= 0 || !this.curve || !this.curve.getLength()) {
		return;
	}
	
	this.curveContext.fullBounds = this.getCurveBounds();
	this.curveContext.fullBounds.size = {};
	this.curveContext.fullBounds.center = {};
	
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
MIWeb.Curves.CurveEditor.prototype.renderCurve = function() {
	this.curveCanvas = this.container.querySelector('[data-id="curve"]');
	if(!this.curveCanvas) {
		this.curveCanvas = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.curveCanvas.setAttribute('data-id','curve');
		this.canvas.appendChild(this.curveCanvas);
	}
	
	var ppu = this.curveContext.pxPerUnit;
	var strokeWidth = this.config.gridWeight / ppu;
	
	var curve = '';
	
	var length = this.curve.getLength();
	if(length) {
		var pathCount = 100;
		var pathLength = length / pathCount;
		var x,y,x1,y1;
		for(var p = 0; p < pathCount - 1; p++) {
			if(p == 0) {
				x = p * pathLength;
				y = this.curve.getValue(x);
			}
			x1 = (p + 1) * pathLength;
			y1 = this.curve.getValue(x1);
			
			curve += '<path d="M' + x + ' ' + y + ' L ' + x1 + ' ' + y1 + '" fill="transparent" stroke-width="' + strokeWidth + '" stroke="' + this.config.curveColor + '" />';
		
			x = x1;
			y = y1;
		}
	}
	
	this.curveCanvas.innerHTML = curve;
};
MIWeb.Curves.CurveEditor.prototype.renderControls = function() {
	this.controls = this.container.querySelector('.controls');
	if(!this.controls) {
		this.controls = document.createElement("div");
		this.controls.className = 'controls';
		this.container.appendChild(this.controls);
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
			/*var printFrames = [];
			for(var p = 0; p < editor.curve.frames.length; p++) {
				printFrames.push(JSON.stringify(editor.curve.frames[p]));
			}
			alert("[\n\t" + printFrames.join(",\n\t") + "\n]");*/
			alert(JSON.stringify(editor.curve));
		};
	}
	if(this.config.minimizable) {
		this.windowOptions.querySelector('button.minimize').onclick = function() {
			editor.minimized = !editor.minimized;
			editor.draw();
		};
	}
};