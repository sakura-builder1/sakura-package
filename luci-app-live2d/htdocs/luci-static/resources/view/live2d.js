'use strict';
'require view';
'require form';
'require uci';
'require fs';
'require ui';
'require rpc';

return view.extend({
	load: function () {
		var self = this;

		function readCfg() {
			return fs.read('/www/luci-static/live2d/config.json').then(function (r) {
				try { return JSON.parse(r); } catch (e) { return {}; }
			}).catch(function () { return {}; });
		}

		return Promise.all([ uci.load('live2d'), readCfg() ]).then(function (res) {
			self.cfg = res[1] || {};
			/* 模型列表缺失 → 跑一次同步脚本重建 ✓（自愈 ✓） */
			if (!self.cfg.models || !self.cfg.models.length) {
				return fs.exec('/usr/libexec/live2d-sync')
					.catch(function () { })
					.then(readCfg)
					.then(function (c2) { self.cfg = c2 || self.cfg; })
					.catch(function () { });
			}
		});
	},

	render: function () {
		var m, s, o;

		m = new form.Map('live2d', _('Live2D 看板娘'),
			_('在 LuCI 界面右下角显示一个可交互的 Live2D 角色。保存后会自动刷新页面 ✓'));

		s = m.section(form.NamedSection, 'main', 'live2d', _('基本设置'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('启用看板娘'),
			_('关闭后所有页面都不再加载（保存后立即生效）'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.ListValue, 'size', _('初始大小'),
			_('浏览器里用 +/− 调过的尺寸会覆盖此项；点 ⟲ 重置按钮可回到这里设置的大小'));
		o.value('180', _('小（180px）'));
		o.value('240', _('中（240px）'));
		o.value('320', _('大（320px）'));
		o.value('420', _('很大（420px）'));
		o.default = '240';

		o = s.option(form.ListValue, 'model', _('看板娘模型'),
			_('把 Cubism 3/4 模型文件夹（含 .model3.json）放进 /www/luci-static/live2d/models/ 后，' +
			  '这里会自动出现。保存后立即切换 ✓'));
		var list = (this.cfg && this.cfg.models && this.cfg.models.length) ? this.cfg.models.slice() : [];
		['haru/haru_greeter_t03.model3.json', 'rice/Rice.model3.json'].forEach(function (d) {
			if (list.indexOf(d) < 0) list.push(d);
		});
		var cur = uci.get('live2d', 'main', 'model') || 'haru/haru_greeter_t03.model3.json';
		if (list.indexOf(cur) < 0) list.unshift(cur);
		list.forEach(function (mfile) {
			var name = mfile.split('/')[0];
			var nice = { 'haru': _('Haru（女高中生 · 默认）'),
			             'rice': _('Rice（小可爱 · 蓝帽子）') }[name] || name;
			o.value(mfile, nice + '   —   ' + mfile);
		});
		o.default = 'rice/Rice.model3.json';

		s = m.section(form.NamedSection, 'main', 'live2d', _('交互开关'));
		s.anonymous = true;

		o = s.option(form.Flag, 'draggable', _('允许拖拽移动'),
			_('关掉后角色固定在右下角'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'clickable', _('允许点击互动'),
			_('点击角色会播放随机动作和表情'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_idle', _('自动待机动作'),
			_('空闲时自动播放 Idle 动作'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'only_home', _('只在首页显示'),
			_('✓ 默认开启 ✓ 只在首页（仪表盘）显示看板娘，进其他设置页会自动隐藏 ✓ ' +
			  '想让她跟着你逛所有页面就关掉此项。'));
		o.default = '1';
		o.rmempty = false;

		/* ===== AI 对话（OpenAI 兼容）===== */
		s = m.section(form.NamedSection, 'ai', 'llm', _('AI 对话 · OpenAI 兼容'),
			_('给看板娘接上大模型。🔒 API Key 只保存在路由器上，不会下发到浏览器。'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('启用 AI 对话'),
			_('开启后点击看板娘可以和她说话'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'base_url', _('API 地址（Base URL）'),
			_('OpenAI 兼容端点，末尾不要带 /chat/completions。' +
			  '例：https://api.deepseek.com/v1 ｜ 火山方舟 ｜ 阿里 token-plan ｜ 本地 ollama'));
		o.default = '';
		o.rmempty = true;              /* ★ 允许留空：关掉 AI 时不该拦着保存 */

		o = s.option(form.Value, 'api_key', _('API Key'),
			_('🔒 只存在路由器上（/etc/config/live2d）。前端只能通过 rpcd 代理调用，拿不到这个值。'));
		o.password = true;

		o = s.option(form.Value, 'model', _('模型名'),
			_('例：gpt-4o-mini ｜ deepseek-chat ｜ qwen-plus ｜ 本地 ollama'));
		o.default = '';
		o.rmempty = true;              /* ★ 同样允许留空 */

		o = s.option(form.TextValue, 'system_prompt', _('人格提示词'),
			_('决定她怎么说话。改完保存即可生效。'));
		o.rows = 4;
		o.default = '你是樱花主题路由器看板娘「小樱」，说话简短、温柔、爱用颜文字。' +
			'用户是折腾软路由的开发者，回答要实用、别啰嗦。';

		o = s.option(form.Value, 'max_tokens', _('最大回复长度'),
			_('太小会被截断 ✗ 尤其她会写长分析 ✗ 建议 1024~2048'));
		o.datatype = 'range(64,8192)';
		o.default = '1024';

		o = s.option(form.Value, 'temperature', _('创造力 temperature'),
			_('0 = 严谨，1 = 活泼，建议 0.7'));
		o.datatype = 'range(0,2)';
		o.default = '0.7';

		o = s.option(form.Value, 'timeout', _('请求超时（秒）'),
			_('本地小模型可以调大'));
		o.datatype = 'range(10,300)';
		o.default = '60';

		o = s.option(form.Value, 'uci_allow', _('允许修改的配置文件'),
			_('★ 留空 = 允许修改【所有】配置（推荐，自由度最高）。' +
			  '想限制就填空格分隔的名字，例如：network dhcp wireless firewall system' +
			  '。凭据类字段（password/key/secret/token）无论怎样都不允许修改。'));
		o.default = '';

		o = s.option(form.Flag, 'allow_actions', _('⚠️ 允许执行操作'),
			_('开启后她才能【改配置】【重启服务】等写操作。' +
			  '服务白名单：dnsmasq / network / wifi / uhttpd / dropbear / rpcd / cron / odhcpd / firewall / nlbwmon / mdns / miniupnpd。' +
			  '改配置前会自动备份 ✓ 改坏了可以让她一键还原 ✓ ' +
			  '只读查询（内存、磁盘、网络、日志、服务状态）不受此开关限制。'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Flag, 'allow_shell', _('⚠️⚠️ 允许执行 shell 命令（高危）'),
			_('再往上一个危险等级 ✗ 开启后她可以【直接执行任意 shell 命令】✓ ' +
			  '用于结构化工具搞不定的疑难杂症。' +
			  '\n\n⚠️ 风险：等于把 root 命令行交给她 ✗ 一条错误命令可能搞坏系统。' +
			  '\n\n已内置危险命令拦截：rm -rf / mkfs / dd 写设备 / mtd write / fork炸弹 / ' +
			  '改 passwd shadow / 卸载核心包 / sysupgrade -f / reboot -f / halt 等会被直接拒绝。' +
			  '\n\n建议：平时【关着】✗ 需要时临时开 ✗ 用完关回去 ✓✓'));

		this.map = m;   /* ✓ 关键：保存流程要能拿到 form.Map */

		/* 把「上传模型」控件塞进【基本设置】分区末尾 ✓ */
		var dom = m.render();
		var vs = this;
		if (dom && typeof dom.then === 'function')
			return dom.then(function (n) { return vs.injectUploader(n); });
		return this.injectUploader(dom);
	},

	/* ① 用【uci 会话里的当前值】写 config.json ✓
	     保存的那一瞬间就是对的 ✗ 不依赖落盘顺序 ✓
	     同时保留已有模型列表 ✓ */
/* ===== 上传模型（zip 分块上传 → 路由器解压安装）===== */

	/* ArrayBuffer → base64（分片拼接 ✗ 避免 apply 参数过多爆栈 ✓） */
	b64: function (buf) {
		var b = new Uint8Array(buf), s = '', i, CH = 0x8000;
		for (i = 0; i < b.length; i += CH)
			s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
		return window.btoa(s);
	},

	uploadModel: function (file, onProgress) {
		var CHUNK = 32768, sent = 0, seq = 0, id = null, self = this;
		var name = (file.name || 'model').replace(/\.zip$/i, '');

		var callBegin = rpc.declare({ object: 'luci.sakura_live2d', method: 'upload_begin', params: [ 'name', 'size' ] });
		var callChunk = rpc.declare({ object: 'luci.sakura_live2d', method: 'upload_chunk', params: [ 'id', 'seq', 'data' ] });
		var callEnd   = rpc.declare({ object: 'luci.sakura_live2d', method: 'upload_end',   params: [ 'id', 'name' ] });
		var callAbort = rpc.declare({ object: 'luci.sakura_live2d', method: 'upload_abort', params: [ 'id' ] });

		function readSlice(start) {
			return new Promise(function (res, rej) {
				var fr = new FileReader();
				fr.onload = function () { res(fr.result); };
				fr.onerror = function () { rej(new Error('读取文件失败')); };
				fr.readAsArrayBuffer(file.slice(start, start + CHUNK));
			});
		}

		return Promise.resolve(callBegin(name, String(file.size))).then(function (r) {
			if (!r || !r.ok) throw new Error((r && r.error) || '无法开始上传');
			id = r.id;

			var step = function () {
				if (sent >= file.size) return Promise.resolve();
				return readSlice(sent).then(function (buf) {
					if (!buf) throw new Error('读取文件失败');
					return callChunk(id, String(seq), self.b64(buf));
				}).then(function (rr) {
					if (!rr || !rr.ok) throw new Error((rr && rr.error) || '上传中断');
					sent += CHUNK; seq++;
					onProgress(Math.min(1, sent / file.size));
					return step();
				});
			};

			return step();
		}).then(function () {
			return callEnd(id, name);
		}).then(function (r2) {
			if (!r2 || !r2.ok) throw new Error((r2 && r2.error) || '安装失败');
			return r2;
		}).catch(function (e) {
			try { if (id) callAbort(id); } catch (x) { }
			throw e;
		});
	},

	buildUploader: function () {
		var self = this;
		var fileIn = E('input', { 'type': 'file', 'accept': '.zip', 'style': 'max-width:100%' });
		var btn = E('button', { 'class': 'cbi-button cbi-button-action' }, _('上传并安装'));
		var fill = E('div', { 'style': 'height:100%;width:0;background:linear-gradient(90deg,#ff9ec4,#c9a4ff);transition:width .2s' });
		var bar = E('div', { 'style': 'display:none;height:6px;border-radius:3px;overflow:hidden;margin-top:8px;background:rgba(140,160,200,.25);width:100%' }, [ fill ]);
		var msg = E('div', { 'style': 'margin-top:6px;font-size:12px;line-height:1.6;color:#8ea8c8' },
			_('选一个 .zip（里面要有 .model3.json 和 .moc3），≤64MB。上传后会自动解压、加入模型列表并切换过去 ✓'));

		function say(txt, color) {
			msg.style.color = color || '#8ea8c8';
			msg.textContent = txt;
		}

		btn.addEventListener('click', function (ev) {
			ev.preventDefault();
			var f = fileIn.files && fileIn.files[0];
			if (!f) return say(_('先选一个 .zip 文件呀～'), '#ffb3c8');
			if (!/\.zip$/i.test(f.name)) return say(_('只支持 .zip 压缩包 ✗'), '#ffb3c8');
			if (f.size > 67108864) return say(_('文件超过 64MB ✗'), '#ffb3c8');
			btn.disabled = true;
			bar.style.display = 'block';
			fill.style.width = '0%';
			say(_('上传中… 0%'));
			return self.uploadModel(f, function (p) {
				fill.style.width = (p * 100).toFixed(1) + '%';
				say(_('上传中… ') + (p * 100).toFixed(0) + '%');
			}).then(function (r) {
				fill.style.width = '100%';
				say(_('✓ 安装成功：') + r.model + '（' + (r.size || '?') + _('），1.5 秒后刷新页面…'), '#8ce0a8');
				window.setTimeout(function () { window.location.reload(); }, 1500);
			}).catch(function (e) {
				bar.style.display = 'none';
				btn.disabled = false;
				say(_('✗ 失败：') + (e && e.message ? e.message : e), '#ff9a9a');
			});
		});

		return E('div', { 'class': 'cbi-value' }, [
			E('label', { 'class': 'cbi-value-title' }, _('上传模型')),
			E('div', { 'class': 'cbi-value-field' }, [
				fileIn,
				E('div', { 'style': 'margin-top:6px' }, [ btn ]),
				bar,
				msg
			])
		]);
	},

	/* 挂到【基本设置】分区末尾 ✓ 找不到就退回挂到整页 ✓ */
	injectUploader: function (node) {
		try {
			var secs = (node && node.querySelectorAll) ? node.querySelectorAll('.cbi-section') : [];
			var host = secs.length ? (secs[0].querySelector('.cbi-section-node') || secs[0]) : node;
			if (host && host.appendChild) host.appendChild(this.buildUploader());
		} catch (e) { console.warn('[live2d] 上传控件注入失败', e); }
		return node;
	},

	writeFrontLocal: function () {
		var self = this;

		function readOld() {
			return fs.read('/www/luci-static/live2d/config.json').then(function (r) {
				try { return JSON.parse(r); } catch (e) { return {}; }
			}).catch(function () { return {}; });
		}

		return readOld().then(function (old) {
			function g(k, d) {
				var val = uci.get('live2d', 'main', k);
				return (val === undefined || val === null || val === '') ? d : val;
			}
			function b(k, d) { return String(g(k, d)) === '1'; }

			var models = (old && old.models && old.models.length) ? old.models
				: ((self.cfg && self.cfg.models) ? self.cfg.models : []);

			var cfg = {
				enabled: b('enabled', '1'),
				size: parseInt(g('size', '240'), 10) || 240,
				model: g('model', 'haru/haru_greeter_t03.model3.json'),
				models: models,
				draggable: b('draggable', '1'),
				clickable: b('clickable', '1'),
				auto_idle: b('auto_idle', '1'),
				only_home: b('only_home', '1'),
				stamp: 'v' + Math.floor(Date.now() / 1000)
			};

			return fs.write('/www/luci-static/live2d/config.json',
				JSON.stringify(cfg, null, '\t') + '\n');
		});
	},

	/* ② 落盘之后再跑同步脚本 ✓
	     它会扫描模型目录 ✗ 用【磁盘上的新值】重写一份完整配置 ✓ */
	syncModels: function () {
		return fs.exec('/usr/libexec/live2d-sync').catch(function (e) {
			console.warn('[live2d] 同步脚本执行失败（不影响主流程）', e);
		});
	},

	/* 保存 ✓ 关键三点：①没改动不报错 ②apply 不带回滚 ③confirm 确认 */
	handleSave: function (ev) {
		var map = this.map;
		var self = this;

		return Promise.resolve(map && map.save ? map.save() : null)
			/* ① 先看有没有实际改动 ✓ */
			.then(function () {
				if (!uci.changes) return true;
				return uci.changes().then(function (chg) {
					if (!chg || !Object.keys(chg).length) return false;
					return true;
				}).catch(function () { return true; });
			})
			.then(function (hasChange) {
				if (hasChange === false) {
					self.__noChange = true;
					ui.addNotification(null, E('p', {}, _('没有需要保存的修改 ✓')), 'info');
					return null;
				}
				self.__noChange = false;
				return self.writeFrontLocal()
					.then(function () { return uci.save(); })
					/* ★ apply(false) = 不带 rollback ✓✓
					   带 rollback 时 30 秒不 confirm 会自动回滚 ✗ 就是之前的坑 ✓ */
					.then(function () { return uci.apply(false); })
					.then(function () {
						try { if (uci.confirm) return uci.confirm(); } catch (e) { }
					})
					.then(function () { return self.syncModels(); })
					.then(function () {
						ui.addNotification(null, E('p', {}, _('设置已保存 ✓')), 'info');
					});
			})
			.catch(function (e) {
				ui.addNotification(null, E('p', {}, _('保存失败：') + (e && e.message ? e.message : e)), 'error');
				throw e;
			});
	},

	/* 保存并应用 ✓ 有改动才刷新页面 ✗ 没改动只提示 ✓ */
	handleSaveApply: function (ev, mode) {
		var self = this;
		return this.handleSave(ev).then(function () {
			if (self.__noChange) return;
			ui.addNotification(null, E('p', {}, _('设置已生效，正在刷新页面…')), 'info');
			return new Promise(function (res) { window.setTimeout(res, 1000); })
				.then(function () { window.location.reload(); });
		});
	}
});
