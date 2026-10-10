/* Sakura Theme configuration — based on Alpha theme config by Hilman Maulana */
'use strict';
'require view';
'require form';
'require fs';
'require uci';
'require ui';

var BG_PATH = '/www/luci-static/sakura/background/';
var BG_RE = /\.(png|jpe?g|webp|gif|bmp|avif|svg|mp4|webm|ogv|ogg|mov)$/i;
var VIDEO_RE = /\.(mp4|webm|ogv|ogg|mov)$/i;

return view.extend({
	load: function () {
		return Promise.all([
			uci.load('sakura'),
			L.resolveDefault(fs.list(BG_PATH), [])
		]);
	},

	render: function (data) {
		var bgFiles = (data[1] || []).filter(function (f) {
			return f.type == 'file' && BG_RE.test(f.name);
		});

		var m, s, o;
		m = new form.Map('sakura', _('Sakura theme configuration'),
			_('Configure the Sakura theme: primary color, transparency, mode and backgrounds.'));

		/* ---------- 主题配置 ---------- */
		s = m.section(form.TypedSection, 'global', _('Theme configuration'));
		s.anonymous = true;

		o = s.option(form.Value, 'primary', _('Primary color'),
			_('A HEX color (default: #D6336C).'));
		o.rmempty = false;
		o.placeholder = '#D6336C';
		o.validate = function(section_id, value) {
			if (section_id)
				return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3}|[0-9a-fA-F]{4})$/i.test(value) || _('Expecting: valid HEX color value');
			return true;
		};

		o = s.option(form.Value, 'transparency', _('Transparency'),
			_('Transparency of the content area, 0 - 1 (default: 0.3).'));
		o.datatype = 'ufloat';
		o.placeholder = '0.3';
		o.rmempty = false;

		/* ---------- 成功提示 ---------- */
		function notify_success(msg) {
			var node = ui.addNotification(null, E('p', {}, [
				E('span', {}, msg + ' ' + _('Please refresh the page to take effect.')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-apply',
					'click': function () { location.reload(); }
				}, _('Refresh Now'))
			]), 'success');
			try { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
			return node;
		}

		/* ---------- 背景上传 / 删除 ---------- */
		var CSF = BG_PATH + '_upload.tmp';
		function doUpload() {
			return ui.uploadFile(CSF, this).then(function (res) {
				var name = String(res.name || '').replace(/^.*[\\\/]/, '');
				if (!name || !BG_RE.test(name))
					return Promise.reject(new Error(_('Unsupported file type.')));
				return fs.exec('/bin/mv', ['-f', CSF, BG_PATH + name])
					.then(function () { return fs.exec('chmod', ['644', BG_PATH + name]); })
					.then(function () { notify_success(_('Background uploaded.')); });
			}).catch(function (e) { ui.addNotification(null, E('p', e.message)); });
		}

		function doRemove(selOpt) {
			var name = uci.get('sakura', '@global[0]', selOpt.option);
			if (!name)
				return ui.addNotification(null, E('p', _('Please select a background first.')));
			return fs.exec('/bin/rm', ['-f', BG_PATH + name])
				.then(function () { notify_success(_('Background removed.')); })
				.catch(function (e) { ui.addNotification(null, E('p', e.message)); });
		}

		function fill_bg(opt) {
			if (!bgFiles.length) {
				opt.value('', _('No background uploaded yet'));
				return;
			}
			for (var i = 0; i < bgFiles.length; i++) {
				var n = bgFiles[i].name;
				opt.value(n, (VIDEO_RE.test(n) ? '🎬 ' : '🖼️ ') + n);
			}
		}

		function bg_row(s, name, title) {
			var opt = s.option(form.ListValue, name, title);
			fill_bg(opt);
			opt.rmempty = true;
			var orig = opt.renderWidget;
			opt.renderWidget = function (section_id, option_index, cfgvalue) {
				var base = orig.call(this, section_id, option_index, cfgvalue);
				var btns = E('div', { 'style': 'display:flex;gap:.4rem;align-items:center;flex-wrap:wrap' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, doUpload)
					}, [ _('Upload Background') ]),
					E('button', {
						'class': 'btn cbi-button cbi-button-reset',
						'click': ui.createHandlerFn(this, function () { return doRemove(this); })
					}, [ _('Delete Background') ])
				]);
				return E('div', { 'style': 'display:flex;gap:.6rem;align-items:center;flex-wrap:wrap' }, [ base, btns ]);
			};
			return opt;
		}

		/* ---------- 背景配置 ---------- */
		s = m.section(form.TypedSection, 'global', _('Background configuration'),
			_('Upload images or videos, then pick one. Files are stored in <code>%s</code>.').format(BG_PATH));
		s.anonymous = true;
		bg_row(s, 'login_bg', _('Login page background'));
		bg_row(s, 'dashboard_bg', _('Dashboard background'));

		/* ---------- 樱花飘落特效 ---------- */
		s = m.section(form.TypedSection, 'global', _('Sakura falling effect'));
		s.anonymous = true;

		o = s.option(form.Flag, 'sakura', _('Enable falling petals'),
			_('Show falling cherry blossom petals in the background.'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'sakura_count', _('Petal count'),
			_('Number of petals, 1 - 200.'));
		o.datatype = 'range(1,200)';
		o.placeholder = '30';
		o.rmempty = false;
		o.default = '30';
		o.depends('sakura', '1');

		return m.render();
	},
});
