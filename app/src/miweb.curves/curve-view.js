var MIWeb = MIWeb || {};
MIWeb.Curves = MIWeb.Curves || {};

MIWeb.Curves.CurveView = function(container, curve, options, maximize) {
    var config = {
        drawAxes: true,
        drawGrid: true,

        axesWeight: 2,
        gridWeight: 1,
        dotSize: 5,
        backgroundColor: "#333",

        curveColor: "#0f0",
        curveWeight: 0.02,

        gridColor: "#888",
        gridWeight: 0.02,

        loopColor: "#ccc",
        size: {x: null, y: null},
        keepAspectRatio: false
    };

    if(options) {
        MIWeb.Utilities.Object.merge(config, options);
    }

    this.config = config;

    this.container = container;
    this.setCurve(curve);
};
MIWeb.Curves.CurveView.prototype.setCurve = function(curve, silent) {
    this.curve = curve;
    if(!silent) this.render();
};
MIWeb.Curves.CurveView.prototype.render = function() {
    this.setupContext();

    this.renderCanvas();

    this.renderBackground();

    this.renderCurve();
};
MIWeb.Curves.CurveView.prototype.setupContext = function() {
    this.aspectRatio = 4;
};
MIWeb.Curves.CurveView.prototype.renderCanvas = function() {
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

    this.canvas.parentElement.style.backgroundColor = this.config.backgroundColor;
    //this.canvas.parentElement.style.width = this.config.size && this.config.size.x ? this.config.size.x + "px" : "";
    //this.canvas.parentElement.style.height = this.config.size && this.config.size.y ? this.config.size.y + "px" : "";

    var scale = {
        x: 40,
        y: -40
    };
    /*var scale = {
        x: this.container.clientWidth / 2,
        y: this.container.clientHeight / -2
    };*/
    this.canvas.setAttribute('transform','translate(50 50) scale(' + scale.x + ' ' + scale.y + ')');
    /*
    var canvasSize = this.curveContext.canvasSize;

    var bounds = this.curveContext.fullBounds;
    var scale = this.curveContext.scale;
    var ppu = this.curveContext.pxPerUnit;
    var padding = 0;
    this.canvas.setAttribute('transform','translate(' +
        ((-bounds.min.x) * (ppu - padding)) + ' ' +
        (canvasSize.y / 2 + (bounds.max.y - (bounds.max.y - bounds.min.y) * 0.5) * (ppu - padding)) +
        ') scale(' +
        (ppu - padding) + ' ' +
        -(ppu - padding) +
        ')');
    */
};
MIWeb.Curves.CurveView.prototype.renderBackground = function() {
    this.background = this.container.querySelector('[data-id="background"]');
    if(!this.background) {
        this.background = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.background.setAttribute('data-id', 'background');
        if(this.canvas.children.length) {
            this.canvas.insertBefore(this.background, this.canvas.children[0]);
        } else {
            this.canvas.appendChild(this.background);
        }
    }

    var size = {
        x: 2 * this.aspectRatio,
        y: 2
    };

    var contents = '';
    if(this.config.drawAxes) {
        contents += '<path d="M 0 -' + size.y + ' L 0 ' + size.y + '" stroke-width="' + this.config.gridWeight + '" stroke="' + this.config.gridColor + '" />';
        contents += '<path d="M -' + size.x + ' 0 L ' + size.x + ' 0" stroke-width="' + this.config.gridWeight + '" stroke="' + this.config.gridColor + '" />';
    }

    this.background.innerHTML = contents;
};
MIWeb.Curves.CurveView.prototype.renderCurve = function() {
    this.curveCanvas = this.container.querySelector('[data-id="curve"]');
    if(!this.curveCanvas) {
        this.curveCanvas = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.curveCanvas.setAttribute('data-id', 'curve');
        this.canvas.appendChild(this.curveCanvas);
    }

    var contents = '';

    var loops = this.curve.loop ? 2 : 1;
    var sections = 100;
    var point = {x: 0, y: 0};
    for(var s = 0; s <= sections * loops; s++) {
        var x = (s % sections) / sections;
        var y = this.curve.getValue(x);
        var l = Math.floor(s / sections);

        x *= this.aspectRatio;
        x += l * this.aspectRatio;

        if(s > 0) {
            var color = s <= sections ? this.config.curveColor : this.config.loopColor;
            contents += '<path d="M ' + point.x + ' ' + point.y + ' L ' + x + ' ' + y + '" stroke-width="' + this.config.curveWeight + '" stroke="' + color + '" />';
        }

        point.x = x;
        point.y = y;
    }

    this.curveCanvas.innerHTML = contents;
};