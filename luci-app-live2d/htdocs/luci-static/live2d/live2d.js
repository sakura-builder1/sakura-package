(function () {
	'use strict';
	if (window.__live2d_loaded) return;
	window.__live2d_loaded = true;

	var BASE = '/luci-static/live2d/';
	var DEF = {
		enabled: true, size: 240,
		model: 'haru/haru_greeter_t03.model3.json',
		draggable: true, clickable: true, auto_idle: true,
		only_home: true          /* ★ 默认只在首页显示 ✓ */
	};
	var POS_KEY = 'live2d-widget-pos-v3';
	var SIZE_KEY = 'live2d-widget-size-v3';
	var HIDE_KEY = 'live2d-widget-hidden-v3';
	var STAMP_KEY = 'live2d-cfg-stamp-v3';
	var TIPS = ['在的呀~', '需要帮忙吗 ✿', '路由器状态挺好的哦',
		'(*ෆ´ ˘ `ෆ*)', '我在这儿呢', '又是摸鱼的一天呢'];

	function stampOf(o) {
		return 'v' + [ o.enabled !== false ? 1 : 0, o.size, o.model,
			o.draggable !== false ? 1 : 0, o.clickable !== false ? 1 : 0,
			o.auto_idle !== false ? 1 : 0,
			o.only_home !== false ? 1 : 0 ].join('|');
	}

	/* 首选：直接读 uci ✓ 立刻反映配置页的改动 ✓ */
	function readUci() {
		return new Promise(function (resolve, reject) {
			if (!window.L || typeof window.L.require !== 'function')
				return reject(new Error('LuCI 环境不可用'));
			var tid = window.setTimeout(function () { reject(new Error('读 uci 超时')); }, 4000);
			window.L.require('uci').then(function (uci) {
				try { if (uci.unload) uci.unload('live2d'); } catch (e) { }
				return uci.load('live2d').then(function () {
					function g(k, d) {
						var val = uci.get('live2d', 'main', k);
						return (val === undefined || val === null || val === '') ? d : val;
					}
					function b(k, d) { return String(g(k, d)) === '1'; }
					function gl(k, d) {
						var val = uci.get('live2d', 'ai', k);
						return (val === undefined || val === null || val === '') ? d : val;
					}
					var c = {
						enabled: b('enabled', '1'),
						size: parseInt(g('size', '240'), 10) || 240,
						model: g('model', 'haru/haru_greeter_t03.model3.json'),
						draggable: b('draggable', '1'),
						clickable: b('clickable', '1'),
						auto_idle: b('auto_idle', '1'),
						only_home: b('only_home', '1'),
						ai: String(gl('enabled', '0')) === '1',
						aiModel: gl('model', ''),
						sys: gl('system_prompt', '')
					};
					window.clearTimeout(tid);
					c.stamp = stampOf(c);
					c._src = 'uci';
					resolve(c);
				});
			}).catch(function (e) { window.clearTimeout(tid); reject(e); });
		});
	}

	function readJson() {
		return fetch(BASE + 'config.json?_=' + Date.now(), { cache: 'no-store' })
			.then(function (r) { return r.ok ? r.json() : null; })
			.catch(function () { return null; });
	}

	function readCfg() {
		return readUci().catch(function () { return readJson(); }).then(function (c) {
			if (!c) return null;
			if (!c.stamp) c.stamp = stampOf(c);
			return c;
		});
	}

	/* ---- 是否在「首页」：LuCI 里标题就叫「首页」的 sakura-home 仪表盘 ✓ ---- */
	function isHomePage() {
		try {
			var p = (window.location.pathname || '') + (window.location.search || '');
			if (p.indexOf('/admin/sakura-home') >= 0) return true;
			var rp = (window.L && window.L.env && window.L.env.requestpath) ?
				window.L.env.requestpath.join('/') : null;
			if (rp === 'admin/sakura-home') return true;
			if (rp === '') return true;              /* 根路径会重定向到首页 ✓ */
			if (/\/(cgi-bin\/)?luci\/?$/.test(window.location.pathname || '')) return true;
		} catch (e) { }
		return false;
	}

	/* 无论哪步出错都要有反应 ✓ 绝不静默失败 ✓ */
	function safeBoot(cfg, why) {
		cfg = Object.assign({}, DEF, cfg || {});
		if (cfg.enabled === false) { console.log('[live2d] 插件已关闭'); return; }
		if (cfg.only_home !== false && !isHomePage()) {
			console.log('[live2d] 「只在首页显示」已开启 ✓ 本页不加载 ✓');
			return;
		}
		try {
			boot(cfg);
			console.log('[live2d] 启动 ✓ 模型=' + cfg.model + ' 大小=' + cfg.size +
				(why ? ' (' + why + ')' : ''));
		} catch (e) {
			console.error('[live2d] 启动失败: ' + (e && e.message ? e.message : e));
		}
	}

	readCfg().then(function (c) { safeBoot(c, ''); })
		.catch(function (e) {
			console.error('[live2d] 读配置失败: ' + (e && e.message ? e.message : e));
			safeBoot(null, '兜底');
		});

	/* ============ 主体 ============ */
	function boot(cfg) {
		var box = document.createElement('div');
		box.id = 'live2d-box';
		box.innerHTML =
			'<canvas id="live2d-canvas"></canvas>' +
			'<div id="live2d-bar">' +
				'<button class="l2d-btn" data-act="shrink" title="缩小">−</button>' +
				'<button class="l2d-btn" data-act="grow" title="放大">+</button>' +
				'<button class="l2d-btn" data-act="reset" title="重置位置和大小">⟲</button>' +
				'<button class="l2d-btn" data-act="hide" title="收起">×</button>' +
			'</div>' +
			'<div id="live2d-tip">点我一下试试</div>' +
			'<div id="live2d-chat">' +
				'<div id="live2d-bubble"></div>' +
				'<div id="live2d-inrow">' +
					'<input id="live2d-input" type="text" maxlength="300" placeholder="和我说点什么…" autocomplete="off">' +
					'<button id="live2d-send" title="发送">➤</button>' +
				'<button id="live2d-histbtn" title="历史对话">📜</button>' +
				'</div>' +
			'<div id="live2d-hist">' +
				'<div class="hh"><span>📜 历史对话</span><button id="live2d-histclear">清空</button></div>' +
				'<div id="live2d-histlist">加载中…</div>' +
			'</div>' +
			'</div>';
		document.body.appendChild(box);

		var bar = box.querySelector('#live2d-bar');
		if (bar) { bar.style.position = 'absolute'; bar.style.zIndex = '20'; bar.style.pointerEvents = 'auto'; }

		function canvasEl() { return document.getElementById('live2d-canvas') || box; }

		/* ---- 命中判定（都在 boot 作用域 ✓ 谁都能用 ✓）---- */
		var useHitTest = null, hitNow = false;

		function probeHitTest() {
			var m = window.__live2d_model;
			if (!m || useHitTest !== null) return;
			try {
				var c = canvasEl();
				var r = m.hitTest((c.clientWidth || 240) / 2, (c.clientHeight || 348) * 0.55);
				useHitTest = !!(r && r.length);
			} catch (e) { useHitTest = false; }
		}

		function overModel(cx, cy) {
			var c = canvasEl();
			var w = c.clientWidth || box.offsetWidth || 240;
			var h = c.clientHeight || box.offsetHeight || 348;
			var m = window.__live2d_model;
			if (m && useHitTest === null) probeHitTest();
			if (m && useHitTest === true) {
				try {
					var r = m.hitTest(cx, cy);
					if (r && r.length) return true;
				} catch (e) { useHitTest = false; }
			}
			/* 兜底：中间竖条 = 人物本体 ✓ 两侧透明区穿透 ✓ */
			return cx > w * 0.18 && cx < w * 0.82 && cy > h * 0.02;
		}

		function setHit(on) {
			if (hitNow === on) return;
			hitNow = on;
			if (on) box.classList.add('l2d-hit');
			else box.classList.remove('l2d-hit');
			if (bar) bar.style.opacity = on ? '1' : '.5';
		}

		function applySize(w) {
			box.style.setProperty('width', w + 'px', 'important');
			box.style.setProperty('height', Math.round(w * 1.45) + 'px', 'important');
		}

		var theApp = null, theModel = null;

		function fit() {
			if (!theApp || !theModel) return;
			var app = theApp, model = theModel;
			var rw = box.clientWidth || 240, rh = box.clientHeight || 348;
			try {
				var cw = Math.round(app.renderer.width / app.renderer.resolution);
				var ch = Math.round(app.renderer.height / app.renderer.resolution);
				if (cw !== rw || ch !== rh) app.renderer.resize(rw, rh);
			} catch (e) { }
			var sw = app.renderer.width / app.renderer.resolution;
			var sh = app.renderer.height / app.renderer.resolution;

			/* ★ 用不随缩放变化的原始尺寸 ✓ model.width 会随 scale 变 ✗ */
			var mw = 0, mh = 0;
			if (model.internalModel && model.internalModel.width && model.internalModel.height) {
				mw = model.internalModel.width; mh = model.internalModel.height;
			}
			if (!mw || !mh) {
				var keep = model.scale.x;
				model.scale.set(1);
				mw = model.width; mh = model.height;
				model.scale.set(keep);
			}
			if (!mw || !mh) return;

			var s = (sh / mh) * 1.06;
			var sMax = (sw * 6.0) / mw;
			if (s > sMax) s = sMax;
			model.scale.set(s);
			model.x = sw / 2 - (mw * s) / 2;
			model.y = sh - mh * s;
		}

		function refitSoon() {
			[0, 60, 200, 500, 900].forEach(function (d) { window.setTimeout(fit, d); });
			window.requestAnimationFrame(function () { window.requestAnimationFrame(fit); });
		}

		/* ---- 恢复本地记忆 / 指纹变了就重置 ✓ ---- */
		try {
			if (cfg.stamp && localStorage.getItem(STAMP_KEY) !== cfg.stamp) {
				localStorage.removeItem(POS_KEY);
				localStorage.removeItem(SIZE_KEY);
				localStorage.removeItem(HIDE_KEY);
				localStorage.setItem(STAMP_KEY, cfg.stamp);
			}
			var pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
			if (pos && typeof pos.x === 'number') {
				box.style.left = pos.x + 'px';
				box.style.top = pos.y + 'px';
				box.style.right = 'auto';
				box.style.bottom = 'auto';
			}
			var sz = parseInt(localStorage.getItem(SIZE_KEY) || '0', 10);
			applySize(sz >= 120 && sz <= 520 ? sz : (parseInt(cfg.size, 10) || 240));
			if (localStorage.getItem(HIDE_KEY) === '1') box.classList.add('l2d-hidden');
		} catch (e) { applySize(parseInt(cfg.size, 10) || 240); }

		function showRestore() {
			if (document.getElementById('live2d-restore')) return;
			var b = document.createElement('button');
			b.id = 'live2d-restore';
			b.textContent = '🐰';
			b.title = '显示看板娘';
			b.onclick = function () {
				box.classList.remove('l2d-hidden');
				try { localStorage.setItem(HIDE_KEY, '0'); } catch (e) { }
				b.remove();
			};
			document.body.appendChild(b);
		}
		if (box.classList.contains('l2d-hidden')) showRestore();

		/* ---- 按钮：直接绑定 ✓ ---- */
		function bindBtn(act, fn) {
			var el = box.querySelector('[data-act="' + act + '"]');
			if (!el) return;
			el.addEventListener('click', function (ev) {
				ev.stopPropagation();
				ev.preventDefault();
				try { fn(); } catch (e) { console.warn('[live2d] 按钮出错', e); }
			});
		}
		bindBtn('grow', function () {
			var w = Math.min(520, (box.offsetWidth || 240) + 40);
			applySize(w); try { localStorage.setItem(SIZE_KEY, w); } catch (e) { } refitSoon();
		});
		bindBtn('shrink', function () {
			var w = Math.max(120, (box.offsetWidth || 240) - 40);
			applySize(w); try { localStorage.setItem(SIZE_KEY, w); } catch (e) { } refitSoon();
		});
		bindBtn('reset', function () {
			try {
				localStorage.removeItem(POS_KEY);
				localStorage.removeItem(SIZE_KEY);
			} catch (e) { }
			applySize(parseInt(cfg.size, 10) || 240);
			/* ★ 重置回默认位置：右下角 ✓（与 CSS 一致 ✓） */
			box.style.right = '18px'; box.style.top = 'auto';
			box.style.left = 'auto'; box.style.bottom = '12px';
			refitSoon();
		});
		bindBtn('hide', function () {
			box.classList.add('l2d-hidden');
			try { localStorage.setItem(HIDE_KEY, '1'); } catch (e) { }
			showRestore();
		});

		/* ===== AI 对话 + 工具调用 ✓ 密钥走 rpcd 代理 ✗ 前端拿不到 ✓ ===== */
		var BUBBLE = document.getElementById('live2d-bubble');
		var INPUT = document.getElementById('live2d-input');
		var history = [];       /* 本次会话的上下文 ✓ 刷新即清空 ✓ */

		var TOOLS = [
			{ type: 'function', function: { name: 'read_system',
				description: '读取路由器系统状态：内存总量/可用、CPU 负载、CPU 温度、运行时间',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'read_disk',
				description: '查看磁盘和各分区使用情况',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'read_network',
				description: '查看网络状况：各接口 IPv4 地址、默认网关、在线设备（ARP）列表',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'read_services',
				description: '查看常见系统服务（dnsmasq / network / uhttpd / dropbear / rpcd / cron / odhcpd / firewall / nlbwmon）是否在运行',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'read_logs',
				description: '读取系统日志（logread），可按关键字过滤',
				parameters: { type: 'object', properties: {
					keyword: { type: 'string', description: '过滤关键字，留空则取最新日志' },
					lines: { type: 'integer', description: '行数，默认 30，最大 100' } } } } },
			{ type: 'function', function: { name: 'read_wifi',
				description: '查看无线配置（SSID/信道/加密）和当前连接的无线客户端',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'read_packages',
				description: '列出路由器已安装的插件（LuCI 应用/主题）和服务类软件包',
				parameters: { type: 'object', properties: {
					keyword: { type: 'string', description: '可选，按关键字过滤' } } } } },
			{ type: 'function', function: { name: 'read_uci',
				description: '读取路由器的 uci 配置（密码等敏感字段会自动打码）。用于修改前先查看现状。',
				parameters: { type: 'object', properties: {
					config: { type: 'string', description: '配置文件，如 network / dhcp / wireless / firewall / system' },
					section: { type: 'string', description: '可选，只看某个 section，如 lan / wan' } },
					required: ['config'] } } },
			{ type: 'function', function: { name: 'set_uci',
				description: '修改路由器 uci 配置（例如配置 IPv6）。会自动备份原文件，改完需要再调 service_action 做 reload 才生效。属于写操作，需要管理员开启「允许执行操作」。',
				parameters: { type: 'object', properties: {
					config: { type: 'string', description: '配置文件，如 network / dhcp / wireless / firewall' },
					section: { type: 'string', description: 'section 名，如 lan / wan / wan6' },
					option: { type: 'string', description: '选项名，如 proto / ip6assign' },
					value: { type: 'string', description: '新值' } },
					required: ['config', 'section', 'option', 'value'] } } },
			{ type: 'function', function: { name: 'service_action',
				description: '对系统服务执行 start/stop/restart/enable/disable/reload（有服务白名单限制）。改完 uci 配置后用它 reload 生效。',
				parameters: { type: 'object', properties: {
					service: { type: 'string', description: '服务名，如 network / dnsmasq / firewall / uhttpd' },
					action: { type: 'string', description: 'start / stop / restart / enable / disable / reload' } },
					required: ['service'] } } },
			{ type: 'function', function: { name: 'rollback_uci',
				description: '把某个配置文件还原到最近一次备份（改坏了可以一键回退）',
				parameters: { type: 'object', properties: {
					config: { type: 'string', description: '配置文件，如 network' } },
					required: ['config'] } } },
			{ type: 'function', function: { name: 'remember',
				description: '把重要的事记进长期记忆（刷新/重启/刷机都不会丢）。用户告诉你他的偏好、习惯、设备信息、重要约定时用它。',
				parameters: { type: 'object', properties: {
					text: { type: 'string', description: '要记住的内容，一句话说清楚' } },
					required: ['text'] } } },
			{ type: 'function', function: { name: 'forget',
				description: '忘掉某条记忆',
				parameters: { type: 'object', properties: {
					text: { type: 'string', description: '要忘掉的那条内容（原样）' },
					index: { type: 'integer', description: '或者按序号忘掉第几条' } } } } },
			{ type: 'function', function: { name: 'list_memory',
				description: '列出当前所有长期记忆，确认记住了什么',
				parameters: { type: 'object', properties: {}, required: [] } } },
			{ type: 'function', function: { name: 'add_section',
				description: '在配置里新建一个段（section）。配置复杂插件（如 passwall 节点、mosdns 规则）必须先用它建段，再用 set_uci_batch 填字段。',
				parameters: { type: 'object', properties: {
					config: { type: 'string', description: '配置文件，如 passwall / mosdns' },
					type: { type: 'string', description: '段类型，如 nodes / servers / config' },
					name: { type: 'string', description: '可选，段名。不填则自动生成（@nodes[0] 这种）' } },
					required: ['config', 'type'] } } },
			{ type: 'function', function: { name: 'set_uci_batch',
				description: '★ 一次批量修改多个配置字段（比逐个 set_uci 快得多，也不易出错）。填新段字段、批量改配置时优先用它。',
				parameters: { type: 'object', properties: {
					config: { type: 'string', description: '配置文件，如 passwall / network' },
					changes: { type: 'array', items: { type: 'string' },
						description: '要改的项，格式 "段.字段=值"，例如 ["nodes[0].type=SS","nodes[0].server=1.2.3.4","nodes[0].port=443"]' } },
					required: ['config', 'changes'] } } },
			{ type: 'function', function: { name: 'delete_section',
				description: '删除一个配置段（会先备份，可还原）',
				parameters: { type: 'object', properties: {
					config: { type: 'string' }, section: { type: 'string' } },
					required: ['config', 'section'] } } },
			{ type: 'function', function: { name: 'run_shell',
				description: '★ 直接执行 shell 命令（能力最强，也最危险）。结构化工具搞不定的疑难杂症时用它。危险命令会被拦截。需要管理员单独开启「允许执行 shell 命令」。',
				parameters: { type: 'object', properties: {
					command: { type: 'string', description: '要执行的命令，可用管道和重定向' } },
					required: ['command'] } } },
			{ type: 'function', function: { name: 'open_page',
				description: '在浏览器新标签页打开某个 LuCI 管理页面（用于"打开某个插件的设置页"）',
				parameters: { type: 'object', properties: {
					path: { type: 'string', description: 'LuCI 路径，如 admin/network/network 或 admin/services/ddns-go' } },
					required: ['path'] } } },
			{ type: 'function', function: { name: 'restart_service',
				description: '重启一个系统服务。属于写操作，需要管理员在配置里开启「允许执行操作」才会生效。',
				parameters: { type: 'object', properties: {
					service: { type: 'string', description: '服务名，例如 dnsmasq、network、uhttpd' } },
					required: ['service'] } } }
		];

		var TOOL_LABEL = {
			read_system: '查看系统状态', read_disk: '查看磁盘', read_network: '查看网络',
			read_services: '查看服务状态', read_logs: '翻系统日志', restart_service: '重启服务',
			read_wifi: '查看无线', read_packages: '翻插件列表', read_uci: '读配置',
			set_uci: '修改配置', service_action: '操作服务', rollback_uci: '还原配置',
			open_page: '打开页面', remember: '记住这件事', forget: '忘掉记忆',
			list_memory: '翻看记忆', add_section: '新建配置段', set_uci_batch: '批量改配置',
			delete_section: '删除配置段', run_shell: '执行命令'
		};


		/* ===== 轻量 Markdown 渲染 ✓（模型输出是不可信内容 ✗ 必须先转义 ✓✓）===== */
		function esc(s) {
			return String(s)
				.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
		}

		function inline(s) {
			return s
				.replace(/`([^`]+)`/g, '<code>$1</code>')
				.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
				.replace(/__([^_]+)__/g, '<b>$1</b>')
				.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
				.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
		}

		function mdToHtml(src) {
			var lines = esc(src || '').split('\n');
			var out = [], i = 0;

			function cells(l) {
				return l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|')
					.map(function (c) { return c.trim(); });
			}

			while (i < lines.length) {
				var l = lines[i];

				/* 代码块 ``` ✓（内容已被 esc 转义 ✗ 安全 ✓）*/
				if (/^\s*```/.test(l)) {
					var code = [];
					i++;
					while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i++; }
					i++;
					out.push('<pre><code>' + code.join('\n') + '</code></pre>');
					continue;
				}

				/* 表格 ✓ */
				if (/\|/.test(l) && i + 1 < lines.length && /^[\s|:\-]+$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
					var head = cells(l);
					i += 2;
					var body = [];
					while (i < lines.length && /\|/.test(lines[i])) { body.push(cells(lines[i])); i++; }
					var h = '<table><thead><tr>';
					head.forEach(function (c) { h += '<th>' + inline(c) + '</th>'; });
					h += '</tr></thead><tbody>';
					body.forEach(function (row) {
						h += '<tr>';
						for (var k = 0; k < head.length; k++) h += '<td>' + inline(row[k] || '') + '</td>';
						h += '</tr>';
					});
					out.push(h + '</tbody></table>');
					continue;
				}

				/* 标题 ✓ */
				var mh = l.match(/^(#{1,6})\s+(.*)$/);
				if (mh) { out.push('<div class="mdh md' + mh[1].length + '">' + inline(mh[2]) + '</div>'); i++; continue; }

				/* 分隔线 ✓ */
				if (/^\s*([-*_])\1{2,}\s*$/.test(l)) { out.push('<hr>'); i++; continue; }

				/* 无序列表 ✓ */
				if (/^\s*[-*+]\s+/.test(l)) {
					var ul = [];
					while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
						ul.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>'); i++;
					}
					out.push('<ul>' + ul.join('') + '</ul>'); continue;
				}

				/* 有序列表 ✓ */
				if (/^\s*\d+[.)]\s+/.test(l)) {
					var ol = [];
					while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
						ol.push('<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'); i++;
					}
					out.push('<ol>' + ol.join('') + '</ol>'); continue;
				}

				/* 引用 ✓ */
				if (/^\s*&gt;\s?/.test(l)) {
					var q = [];
					while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) {
						q.push(inline(lines[i].replace(/^\s*&gt;\s?/, ''))); i++;
					}
					out.push('<blockquote>' + q.join('<br>') + '</blockquote>'); continue;
				}

				/* 空行 ✓ */
				if (/^\s*$/.test(l)) { i++; continue; }

				/* 普通段落 ✓ */
				out.push('<div>' + inline(l) + '</div>');
				i++;
			}
			return out.join('');
		}

		function showBubble(text, cls) {
			if (!BUBBLE) return;
			if (cls === 'thinking' || cls === 'err') {
				BUBBLE.textContent = text;   /* 状态/错误用纯文本 ✓ */
			} else {
				BUBBLE.innerHTML = mdToHtml(text);   /* 她的回答渲染 Markdown ✓✓ */
			}
			BUBBLE.className = (cls || '') + ' show';
			clearTimeout(window.__l2d_bt);
		}
		function hideBubble() { if (BUBBLE) BUBBLE.classList.remove('show'); }

		function rpcCall(method, params) {
			return new Promise(function (resolve, reject) {
				if (!window.L || typeof L.require !== 'function')
					return reject(new Error('只能在 LuCI 页面里聊天'));
				L.require('rpc').then(function (rpc) {
					/* ★ expect 别写太严 ✗ 否则调用直接失败 ✓（踩过的坑） */
					var call = rpc.declare({
						object: 'luci.sakura_live2d', method: method,
						params: params, expect: {}
					});
					return call.apply(null, Array.prototype.slice.call(arguments, 2));
				}).then(resolve).catch(function (e) {
					reject(new Error(e && e.message ? e.message : String(e)));
				});
			});
		}

		function parseRes(res) {
			if (typeof res === 'string') { try { res = JSON.parse(res); } catch (e) { } }
			return res || {};
		}

		/* 调后端转发到大模型 ✓ 支持工具 ✓ */
		function callLLM(msgs) {
			return new Promise(function (resolve, reject) {
				L.require('rpc').then(function (rpc) {
					var call = rpc.declare({
						object: 'luci.sakura_live2d', method: 'chat',
						params: ['messages', 'tools'], expect: {}
					});
					return call(msgs, TOOLS);
				}).then(function (res) {
					var r = parseRes(res);
					if (r.ok) resolve(r.message || {});
					else reject(new Error(r.error || '未知错误'));
				}).catch(function (e) {
					reject(new Error(e && e.message ? e.message : String(e)));
				});
			});
		}


		/* ===== 记忆 & 历史 ✓ 存 /etc 下的文件 ✗ 刷机可备份 ✓✓ ===== */
		function rpc(method, params, args) {
			return new Promise(function (resolve, reject) {
				if (!window.L || typeof L.require !== 'function')
					return reject(new Error('只能在 LuCI 页面里使用'));
				L.require('rpc').then(function (r) {
					var call = r.declare({ object: 'luci.sakura_live2d', method: method, params: params || [], expect: {} });
					return call.apply(null, args || []);
				}).then(function (res) {
					if (typeof res === 'string') { try { res = JSON.parse(res); } catch (e) { } }
					resolve(res || {});
				}).catch(function (e) { reject(new Error(e && e.message ? e.message : String(e))); });
			});
		}

		function getMemText() {
			return rpc('tool', ['name', 'arguments'], ['mem_text', '{}'])
				.then(function (r) { return (r && r.result) || ''; })
				.catch(function () { return ''; });
		}

		function persist(u, a) {
			return rpc('append', ['user', 'assistant'], [u, a]).catch(function () { });
		}

		function fmtTime(ts) {
			try {
				var d = new Date((ts || 0) * 1000);
				function p(n) { return (n < 10 ? '0' : '') + n; }
				return p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
			} catch (e) { return ''; }
		}

		function loadHistory(limit) {
			return rpc('history', ['limit'], [limit || 50]).then(function (r) {
				return (r && r.history) || [];
			}).catch(function () { return []; });
		}

		function renderHistoryBtn() {
			var btn = document.getElementById('live2d-histbtn');
			var panel = document.getElementById('live2d-hist');
			var list = document.getElementById('live2d-histlist');
			if (!btn || !panel || !list) return;

			function refresh() {
				list.innerHTML = '<div class="empty">加载中…</div>';
				loadHistory(100).then(function (h) {
					if (!h.length) { list.innerHTML = '<div class="empty">还没有历史对话～</div>'; return; }
					var html = '';
					h.slice().reverse().forEach(function (x) {
						html += '<div class="hi">'
							+ '<div class="t">' + esc(fmtTime(x.ts)) + '</div>'
							+ '<div class="u">' + mdToHtml('**我：**' + (x.user || '')) + '</div>'
							+ '<div class="a">' + mdToHtml(x.assistant || '') + '</div>'
							+ '</div>';
					});
					list.innerHTML = html;
				});
			}

			btn.addEventListener('click', function (ev) {
				ev.stopPropagation();
				btn.blur();
				if (panel.classList.toggle('on')) refresh();
			});
			var cl = document.getElementById('live2d-histclear');
			if (cl) cl.addEventListener('click', function (ev) {
				ev.stopPropagation();
				if (!window.confirm('确定要清空全部历史对话吗？（记忆不受影响）')) return;
				rpc('clearhist', [], []).then(function () {
					list.innerHTML = '<div class="empty">已清空 ✓</div>';
				});
			});
		}

		/* 执行工具 ✓ 由后端白名单把关 ✓ */
		function runTool(name, args) {
			/* open_page 纯前端处理 ✓ 后端不用管 ✓ */
			if (name === 'open_page') {
				return new Promise(function (resolve) {
					var p = '';
					try { p = (JSON.parse(args || '{}').path) || ''; } catch (e) { }
					p = String(p).replace(/^\/+/, '');
					if (!p) return resolve('缺少 path 参数');
					if (!/^admin\//.test(p)) p = 'admin/' + p;
					var url = '/cgi-bin/luci/' + p;
					var w = window.open(url, '_blank');
					if (!w) resolve('想帮你打开 ' + url + ' ✗ 但浏览器拦截了弹窗 ✓ 请允许本页弹窗后重试，或直接访问该地址');
					else resolve('已在【新标签页】打开：' + url + ' ✓');
				});
			}
			return new Promise(function (resolve) {
				L.require('rpc').then(function (rpc) {
					var call = rpc.declare({
						object: 'luci.sakura_live2d', method: 'tool',
						params: ['name', 'arguments'], expect: {}
					});
					return call(name, args || '{}');
				}).then(function (res) {
					var r = parseRes(res);
					resolve(r.result || '（工具没有返回内容）');
				}).catch(function (e) {
					resolve('工具执行失败：' + (e && e.message ? e.message : e));
				});
			});
		}

		/* ★ Agent 循环 ✓：问模型 → 要工具 → 执行 → 再问 → 直到给出答案 ✓ */
		function agentChat(userText) {
			history.push({ role: 'user', content: userText });
			if (history.length > 12) history = history.slice(-12);

			var round = 0;
			var SYSBASE = cfg.sys || '你是樱花主题路由器看板娘「小樱」，说话简短温柔爱用颜文字。';
			var SYS = SYSBASE;
			var memReady = getMemText().then(function (mem) {
				if (mem) SYS = SYSBASE + '\n\n【你已经记住的事（来自长期记忆文件）】\n' + mem;
				return mem;
			}).catch(function () { });
			function step() {
				round++;
				var msgs = [{ role: 'system', content: SYS }].concat(history);
				return callLLM(msgs).then(function (msg) {
					var tcs = msg.tool_calls || [];
					if (tcs.length && round <= 3) {
						/* 把带工具调用的助手消息入栈 ✓ */
						history.push({ role: 'assistant', content: msg.content || '', tool_calls: tcs });

						var chain = Promise.resolve();
						tcs.forEach(function (tc) {
							var fn = tc.function || {};
							chain = chain.then(function () {
								showBubble('正在' + (TOOL_LABEL[fn.name] || fn.name) + '…', 'thinking');
								return runTool(fn.name, fn.arguments).then(function (out) {
									history.push({ role: 'tool', tool_call_id: tc.id, content: out });
								});
							});
						});
						return chain.then(step);
					}
					if (tcs.length) {
						/* 超过 3 轮还想要工具 ✗ 就放弃 ✓ */
						return msg.content || '（查得有点久，先到这里吧～）';
					}
					return msg.content || '（她没说话 ✿）';
				});
			}
			return memReady.then(function () { return step(); });
		}

		var chatting = false;
		function sendMsg() {
			if (!INPUT || chatting) return;
			var txt = (INPUT.value || '').trim();
			if (!txt) return;
			chatting = true;
			INPUT.value = '';
			showBubble('…', 'thinking');
			try { if (box.__react) box.__react(); } catch (e) { }

			agentChat(txt).then(function (reply) {
				showBubble(reply, 'ok');
				persist(txt, reply);      /* ★ 持久化到文件 ✓ 刷新重启都不丢 ✓✓ */
				window.__l2d_bt = setTimeout(hideBubble, 30000);
				try { if (box.__react) box.__react(); } catch (e) { }
			}).catch(function (e) {
				showBubble('（' + e.message + '）', 'err');
				window.__l2d_bt = setTimeout(hideBubble, 10000);
			}).then(function () { chatting = false; });
		}

		if (cfg.ai) {
			var chatBox = document.getElementById('live2d-chat');
			if (chatBox) chatBox.classList.add('on');
			var sendBtn = document.getElementById('live2d-send');
			if (sendBtn) sendBtn.addEventListener('click', function (ev) {
				ev.stopPropagation(); sendBtn.blur(); sendMsg();
			});
			if (INPUT) {
				INPUT.addEventListener('click', function (ev) { ev.stopPropagation(); });
				INPUT.addEventListener('keydown', function (ev) {
					ev.stopPropagation();
					if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); sendMsg(); }
				});
			}
			renderHistoryBtn();
			/* 把最近几轮历史读回来 ✗ 刷新后她还能接着聊 ✓✓ */
			loadHistory(6).then(function (h) {
				h.forEach(function (x) {
					if (x.user) history.push({ role: 'user', content: x.user });
					if (x.assistant) history.push({ role: 'assistant', content: x.assistant });
				});
				if (history.length) console.log('[live2d] 已载入 ' + history.length + ' 条历史 ✓');
			});
			console.log('[live2d] AI 已启用 ✓ 模型=' + cfg.aiModel + '（含记忆与历史 ✓）');
		} else {
			console.log('[live2d] AI 对话未启用（配置页可开启）');
		}

		/* ---- 拖拽：document 层 ✓ 不依赖 hover ✓ 触屏也能拖 ✓ ---- */
		var dragPt = null;

		function startDrag(x, y) {
			if (cfg.draggable === false) return;
			var r = box.getBoundingClientRect();
			box.style.left = r.left + 'px';
			box.style.top = r.top + 'px';
			box.style.right = 'auto';
			box.style.bottom = 'auto';
			dragPt = { x: x, y: y, left: r.left, top: r.top };
			window.__live2d_dragging = true;
			box.classList.add('l2d-dragging');
			setHit(true);
		}

		function moveDrag(x, y) {
			if (!dragPt || !window.__live2d_dragging) return;
			var nx = dragPt.left + (x - dragPt.x), ny = dragPt.top + (y - dragPt.y);
			box.style.left = Math.max(0, Math.min(window.innerWidth - box.offsetWidth, nx)) + 'px';
			box.style.top = Math.max(0, Math.min(window.innerHeight - box.offsetHeight, ny)) + 'px';
		}

		function endDrag() {
			if (!window.__live2d_dragging) return false;
			window.__live2d_dragging = false;
			dragPt = null;
			box.classList.remove('l2d-dragging');
			var r = box.getBoundingClientRect();
			try { localStorage.setItem(POS_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) })); } catch (e) { }
			return true;
		}

		function inBox(x, y) {
			var r = canvasEl().getBoundingClientRect();
			return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
		}

		/* 鼠标/触控笔 ✓ */
		document.addEventListener('pointermove', function (ev) {
			if (window.__live2d_dragging) return;
			if (box.classList.contains('l2d-hidden')) { setHit(false); return; }
			if (!inBox(ev.clientX, ev.clientY)) { setHit(false); return; }
			var r = canvasEl().getBoundingClientRect();
			setHit(overModel(ev.clientX - r.left, ev.clientY - r.top));
		}, true);

		document.addEventListener('pointerdown', function (ev) {
			if (ev.pointerType === 'touch') return;      /* 触屏走下面的分支 ✓ */
			if (box.classList.contains('l2d-hidden')) return;
			if (ev.target && ev.target.closest && ev.target.closest('#live2d-bar')) return;
			if (!inBox(ev.clientX, ev.clientY)) return;
			var r = canvasEl().getBoundingClientRect();
			if (!overModel(ev.clientX - r.left, ev.clientY - r.top)) return;
			startDrag(ev.clientX, ev.clientY);
		}, true);

		document.addEventListener('pointermove', function (ev) {
			if (ev.pointerType === 'touch') return;
			moveDrag(ev.clientX, ev.clientY);
		}, true);

		document.addEventListener('pointerup', function (ev) {
			if (ev.pointerType === 'touch') return;
			endDrag();
		}, true);

		/* 触屏 ✓ 手指按在模型上才拦截 ✗ 别处照常滚动 ✓ */
		var tMoved = false, tTime = 0;

		document.addEventListener('touchstart', function (ev) {
			if (!ev.touches || !ev.touches.length) return;
			var t = ev.touches[0];
			tMoved = false; tTime = Date.now();
			if (box.classList.contains('l2d-hidden')) return;
			if (ev.target && ev.target.closest && ev.target.closest('#live2d-bar')) return;
			if (!inBox(t.clientX, t.clientY)) return;
			var r = canvasEl().getBoundingClientRect();
			if (!overModel(t.clientX - r.left, t.clientY - r.top)) return;
			if (ev.cancelable) ev.preventDefault();
			setHit(true);
			startDrag(t.clientX, t.clientY);
		}, { passive: false, capture: true });

		document.addEventListener('touchmove', function (ev) {
			if (!ev.touches || !ev.touches.length) return;
			var t = ev.touches[0];
			if (dragPt && (Math.abs(t.clientX - dragPt.x) > 8 || Math.abs(t.clientY - dragPt.y) > 8)) tMoved = true;
			if (!window.__live2d_dragging) return;
			if (ev.cancelable) ev.preventDefault();
			moveDrag(t.clientX, t.clientY);
		}, { passive: false, capture: true });

		document.addEventListener('touchend', function () {
			var wasDrag = window.__live2d_dragging;
			var quick = (Date.now() - tTime) < 500;
			if (wasDrag && !tMoved && quick && typeof box.__interact === 'function') box.__interact();
			endDrag();
		}, { passive: true, capture: true });

		/* ---- 加载渲染库 ---- */
		function loadScript(src, cb) {
			var s = document.createElement('script');
			s.src = src;
			s.onload = cb;
			s.onerror = function () { console.warn('[live2d] 加载失败: ' + src); };
			document.head.appendChild(s);
		}
		loadScript(BASE + 'lib/pixi.min.js', function () {
			loadScript(BASE + 'lib/core.js', function () {
				loadScript(BASE + 'lib/cubism4.min.js', start);
			});
		});

		/* ---- 启动模型 ---- */
		function start() {
			if (!window.PIXI || !PIXI.live2d) { console.warn('[live2d] 运行时未就绪'); return; }
			var app = new PIXI.Application({
				view: document.getElementById('live2d-canvas'),
				backgroundAlpha: 0, antialias: true, autoStart: true,
				resizeTo: box, resolution: window.devicePixelRatio || 1, autoDensity: true
			});
			theApp = app;

			PIXI.live2d.Live2DModel.from(BASE + 'models/' + cfg.model, { autoInteract: true })
				.then(function (model) {
					app.stage.addChild(model);
					theModel = model;
					window.__live2d_model = model;
					box.__app = app;
					box.__model = model;
					fit();
					try { model.motion('Idle'); } catch (e) { }

					/* pose3 处理 ✓ 三种模式（实测结果）✗
					   off    → 部件组全显示 ✗ 有时会多重肢体 ✗
					   auto   → 交给库 ✓（目前 web 端表现不稳 ✗）
					   默认不改动 ✗ 让库自己走 ✓ 出问题时可在配置里换模型 ✓
					   ⚠️ 经验：带头部/手部部件组的官方示例模型
					      （Haru / Hiyori）在网页端容易有多肢体表现 ✗
					      不带 pose 的模型（如 Rice）完全正常 ✓✓ */
					box.__react = function () {
						try {
							var im = model.internalModel;
							var em = im && im.settings && im.settings.expressions;
							if (em && em.length) model.expression(Math.floor(Math.random() * em.length));
						} catch (e) { }
					};

					box.__interact = function () {
						if (cfg.clickable === false) return;
						try {
							var im = model.internalModel;
							var em = im && im.settings && im.settings.expressions;
							if (em && em.length) model.expression(Math.floor(Math.random() * em.length));
							var defs = im && im.motionManager && im.motionManager.definitions;
							model.motion(defs && defs.Tap ? 'Tap' : 'Idle');
							var tip = document.getElementById('live2d-tip');
							if (tip) {
								tip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
								try { tip.classList.toggle('l2d-below', box.getBoundingClientRect().top < 70); } catch (e) { }
								tip.classList.add('l2d-show');
								clearTimeout(window.__live2d_tipT);
								window.__live2d_tipT = setTimeout(function () { tip.classList.remove('l2d-show'); }, 2200);
							}
						} catch (e) { console.warn('[live2d] 互动出错', e); }
					};

					box.addEventListener('click', function (ev) {
						if (ev.target.closest && ev.target.closest('#live2d-bar')) return;
						box.__interact();
					});

					if (cfg.auto_idle !== false) {
						window.__live2d_idleT = setInterval(function () {
							try { model.motion('Idle'); } catch (e) { }
						}, 45000);
					}

					[120, 600, 1500, 3000].forEach(function (d) { window.setTimeout(fit, d); });
					if (window.ResizeObserver) {
						try {
							new ResizeObserver(function () {
								window.requestAnimationFrame(fit);
							}).observe(box);
						} catch (e) { }
					}
					window.addEventListener('resize', function () { window.requestAnimationFrame(fit); });
				})
				.catch(function (e) { console.error('[live2d] 模型加载失败: ' + (e && e.message ? e.message : e)); });
		}

		/* ---- 轮询配置变化 ✓ 10 秒 ✓ 配置页上不自动刷新 ✓ ---- */
		window.__live2d_poll = window.__live2d_poll || setInterval(function () {
			var p = window.location.pathname + window.location.search;
			if (p.indexOf('live2d') >= 0) return;
			readCfg().then(function (nc) {
				if (!nc) return;
				if (nc.enabled === false) {
					var b = document.getElementById('live2d-box');
					if (b) b.remove();
					var rb = document.getElementById('live2d-restore');
					if (rb) rb.remove();
					clearInterval(window.__live2d_poll);
					return;
				}
				if (nc.stamp && nc.stamp !== cfg.stamp) {
					try {
						localStorage.removeItem(POS_KEY);
						localStorage.removeItem(SIZE_KEY);
						localStorage.removeItem(HIDE_KEY);
						localStorage.setItem(STAMP_KEY, nc.stamp);
					} catch (e) { }
					window.location.reload();
				}
			}).catch(function () { });
		}, 10000);
	}
})();
