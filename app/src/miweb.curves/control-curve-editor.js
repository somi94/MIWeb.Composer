var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.ControlCurveEditor = function(container, curve, options, maximize) {
	MIWeb.Curves.CurveEditor.call(this, container, curve, options, maximize);
};
MIWeb.Curves.ControlCurveEditor.prototype = Object.create(MIWeb.Curves.CurveEditor.prototype);
MIWeb.Curves.ControlCurveEditor.prototype.constructor = MIWeb.Curves.ControlCurveEditor;
MIWeb.Curves.ControlCurveEditor.prototype.getCurveBounds = function() {
	var controlCount = this.curve.controls.length;
	
	var bounds = {
		min: {x: -1, y: -1},
		max: {x: 1, y: 1}
	};
	for(var c = 0; c < controlCount; c++) {
		var control = this.curve.controls[c];
		if(c < controlCount - 1) control.x = Math.min(control.x, this.curve.controls[c + 1].x);
		if(c > 0) control.x = Math.max(control.x, this.curve.controls[c - 1].x);
		
		if(c == 0) {
			bounds.min.x = bounds.max.x = control.x;
			bounds.min.y = bounds.max.y = control.y;
		} else {
			bounds.min.x = Math.min(bounds.min.x, control.x);
			bounds.max.x = Math.max(bounds.max.x, control.x);
			bounds.min.y = Math.min(bounds.min.y, control.y);
			bounds.max.y = Math.max(bounds.max.y, control.y);
		}
	}
	
	/*if(this.curve.end == 'ping-pong-y' || this.curve.end == 'ping-pong-xy') {
		var fullExtentsY = Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y));
		bounds.min.y = -fullExtentsY;
		bounds.max.y = fullExtentsY;
	}*/
	console.log(bounds);
	return bounds;
};
MIWeb.Curves.ControlCurveEditor.prototype.renderCurve = function() {
	this.curveCanvas = this.container.querySelector('[data-id="curve"]');
	if(!this.curveCanvas) {
		this.curveCanvas = document.createElementNS("http://www.w3.org/2000/svg", "g");
		this.curveCanvas.setAttribute('data-id','curve');
		this.canvas.appendChild(this.curveCanvas);
	}
	
	var ppu = this.curveContext.pxPerUnit;
	var scale = this.curveContext.scale;
	var strokeWidth = this.config.gridWeight / ppu;
	var dotSize = this.config.dotSize / ppu;
	
	var curve = '';
	
	for(var c = 0; c < this.curve.controls.length; c++) {
		var start = this.curve.controls[c].x;
		var last = c >= this.curve.controls.length - 1;
		var end = last ? start : this.curve.controls[c + 1].x;
		var length = end - start;
		
		var startY = this.curve.getValue(start);
		
		if(length && !last) {
			var pathCount = 10;
			var pathLength = length / pathCount;
			var x,y,x1,y1;
			for(var p = 0; p < pathCount; p++) {
				if(p == 0) {
					x = start
					y = startY;
				}
				x1 = start + (p + 1) * pathLength;
				y1 = this.curve.getValue(x1);
				
				curve += '<path d="M' + (x * scale.x) + ' ' + (y * scale.y) + ' L ' + (x1 * scale.x) + ' ' + (y1 * scale.y) + '" fill="transparent" stroke-width="' + strokeWidth + '" stroke="' + this.config.curveColor + '" />';
			
				x = x1;
				y = y1;
			}
		}
		
		if(this.config.drawDots) {
			curve += '<circle cx="' + (start * scale.x) + '" cy="' + (startY * scale.y) + '" r="' + dotSize + '" fill="' + this.config.curveColor + '" />';
		}
	}
	
	this.curveCanvas.innerHTML = curve;
};
MIWeb.Curves.ControlCurveEditor.prototype.renderControls = function() {
	MIWeb.Curves.CurveEditor.prototype.renderControls.call(this);
	
	var controls = '';
	controls += '<div class="option vector2"><label>attack</label>';
	controls += '<input type="text" name="curve-controls-1-x" value="' + (this.curve.controls[1] ? this.curve.controls[1].x : '') + '" />';
	controls += '<input type="text" name="curve-controls-1-d" value="' + (this.curve.controls[1] ? this.curve.controls[1].d : '') + '" /></div>';
	controls += '<div class="option vector2"><label>decay</label>';
	controls += '<input type="text" name="curve-controls-2-x" value="' + (this.curve.controls[2] ? this.curve.controls[2].x : '') + '" />';
	controls += '<input type="text" name="curve-controls-2-d" value="' + (this.curve.controls[2] ? this.curve.controls[2].d : '') + '" /></div>';
	
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
				/*if(propertySplit[0] == 'frame') {
					target = editor.selected >= 0 && editor.selected < editor.curve.frames.length ? editor.curve.frames[editor.selected] : null;
					propertySplit = propertySplit.slice(1);
				}*/
				
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