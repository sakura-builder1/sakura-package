(function () {
	'use strict';

	function init() {
		if (document.getElementById('sakura-canvas'))
			return;

		var count = parseInt(window.SAKURA_COUNT, 10);
		if (isNaN(count) || count < 1) count = 20;
		if (count > 200) count = 200;

		var canvas = document.createElement('canvas');
		canvas.id = 'sakura-canvas';
		canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
		document.body.appendChild(canvas);

		var ctx = canvas.getContext('2d');
		var W = 0, H = 0, petals = [];

		function resize() {
			W = canvas.width = window.innerWidth;
			H = canvas.height = window.innerHeight;
		}
		resize();
		window.addEventListener('resize', resize);

		function Petal() { this.reset(true); }

		Petal.prototype.reset = function (initial) {
			this.x = Math.random() * W;
			this.y = initial ? Math.random() * H : -30;
			this.size = 6 + Math.random() * 9;
			this.speedY = 0.6 + Math.random() * 1.4;
			this.speedX = -0.6 + Math.random() * 1.2;
			this.rot = Math.random() * Math.PI * 2;
			this.rotSpeed = -0.03 + Math.random() * 0.06;
			this.sway = Math.random() * Math.PI * 2;
			this.swaySpeed = 0.01 + Math.random() * 0.025;
			this.alpha = 0.45 + Math.random() * 0.45;
			this.hue = 335 + Math.random() * 25;
		};

		Petal.prototype.update = function () {
			this.sway += this.swaySpeed;
			this.y += this.speedY;
			this.x += this.speedX + Math.sin(this.sway) * 0.9;
			this.rot += this.rotSpeed;
			if (this.y > H + 40) this.reset(false);
			if (this.x < -40) this.x = W + 40;
			else if (this.x > W + 40) this.x = -40;
		};

		Petal.prototype.draw = function () {
			var s = this.size;
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.rot);
			ctx.globalAlpha = this.alpha;
			ctx.fillStyle = 'hsl(' + this.hue.toFixed(0) + ', 85%, 82%)';
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 1.1, s * 0.45, 0, s);
			ctx.bezierCurveTo(-s * 1.1, s * 0.45, -s * 0.7, -s * 0.5, 0, 0);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		};

		for (var i = 0; i < count; i++) petals.push(new Petal());

		(function loop() {
			ctx.clearRect(0, 0, W, H);
			for (var j = 0; j < petals.length; j++) {
				petals[j].update();
				petals[j].draw();
			}
			requestAnimationFrame(loop);
		})();
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', init);
	else
		init();
})();
