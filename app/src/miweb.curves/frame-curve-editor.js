//TODO:
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

MIWeb.Curves.FrameCurveEditor = function(container, curve, options, maximize) {
	var config = {
		drawHandles: true,
		drawLoop: true,
		handleColor: "#f00",
		handleSelectedColor: "#0f0",
		minimizeOptions: {
			drawHandles: false
		}
	};
	options = MIWeb.Utilities.Object.merge(config, options);
	
	MIWeb.Curves.CurveEditor.call(this, container, curve, options, maximize);
};
MIWeb.Curves.FrameCurveEditor.prototype = Object.create(MIWeb.Curves.CurveEditor.prototype);
MIWeb.Curves.FrameCurveEditor.prototype.constructor = MIWeb.Curves.FrameCurveEditor;
MIWeb.Curves.FrameCurveEditor.prototype.setCurve = function(curve) {
	MIWeb.Curves.CurveEditor.prototype.setCurve.call(this, curve, true);
	
	this.selected = -1;
	this.lastSelected = -1;
	this.grabbed = false;
	
	this.draw();
};
MIWeb.Curves.FrameCurveEditor.prototype.draw = function() {
	MIWeb.Curves.CurveEditor.prototype.draw.call(this);

	var editor = this;
	
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
MIWeb.Curves.CurveEditor.prototype.getCurveBounds = function() {
	var frameCount = this.curve.frames.length;
	
	var bounds = {
		min: {x: -1, y: -1},
		max: {x: 1, y: 1}
	};
	for(var f = 0; f < frameCount; f++) {
		var frame = this.curve.frames[f];
		frame.controlLeft.x = Math.min(0,Math.max(frame.controlLeft.x, f > 0 ? this.curve.frames[f - 1].point.x - frame.point.x : 0));
		frame.controlRight.x = Math.max(0,Math.min(frame.controlRight.x, f < frameCount - 1 ? this.curve.frames[f + 1].point.x - frame.point.x : 0));
		this.curve.frames[f] = frame;
		
		if(f == 0) {
			bounds.min = {
				x: Math.min(frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x),
				y: Math.min(frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y)
			};
			bounds.max = {
				x: Math.max(frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x),
				y: Math.max(frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y)
			};
		} else {
			bounds.min.x = Math.min(bounds.min.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			bounds.max.x = Math.max(bounds.max.x, frame.point.x, frame.point.x + frame.controlLeft.x, frame.point.x + frame.controlRight.x);
			bounds.min.y = Math.min(bounds.min.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
			bounds.max.y = Math.max(bounds.max.y, frame.point.y, frame.point.y + frame.controlLeft.y, frame.point.y + frame.controlRight.y);
		}
	}
	
	if(this.curve.end == 'ping-pong-y' || this.curve.end == 'ping-pong-xy') {
		var fullExtentsY = Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y));
		bounds.min.y = -fullExtentsY;
		bounds.max.y = fullExtentsY;
	}
	
	return bounds;
};
MIWeb.Curves.FrameCurveEditor.prototype.renderCurve = function() {
	//MIWeb.Curves.CurveEditor.prototype.renderCurve.call(this);
	
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
MIWeb.Curves.FrameCurveEditor.prototype.renderControls = function() {
	MIWeb.Curves.CurveEditor.prototype.renderControls.call(this);
	
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
MIWeb.Curves.FrameCurveEditor.prototype.renderWindowOptions = function() {
	MIWeb.Curves.CurveEditor.prototype.renderWindowOptions.call(this);
};
MIWeb.Curves.FrameCurveEditor.prototype.getCurveFrames = function() {
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