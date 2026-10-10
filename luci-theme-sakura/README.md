# 樱花主题 (luci-theme-sakura)

二次元樱花风格的 OpenWrt / ImmortalWrt LuCI 主题，基于 [luci-theme-argon](https://github.com/jerrykuku/luci-theme-argon) 二次开发。

## 特性

- 🌸 **樱花风格界面**：粉白毛玻璃卡片、圆润药丸菜单、柔和渐变
- 🎨 **33 个专属可爱图标**：AI 生成的 Q 版图标，覆盖侧边栏主要菜单
- 🖼️ **可配置背景**：登录页 / 主页背景均可从配置页选择或上传（**支持图片和视频**）
- ✨ **樱花飘落特效**：可开关，花瓣数量可调
- 🎛️ **主色调 / 透明度可调**：整个主题（含自定义部分）跟随设置变化
- 📱 **完整 favicon 套件**：含 iOS / Android 图标、manifest
- 🔌 **与 Argon 主题共存**：使用独立路径 `/luci-static/sakura/`，互不影响

## 依赖

- OpenWrt / ImmortalWrt 24.10 及以上
- 配置插件 [luci-app-sakura-config](https://github.com/<你的用户名>/luci-app-sakura-config)（安装本主题会自动带上）

## 安装

```sh
# 方式一：ipk
opkg install luci-theme-sakura_*.ipk luci-i18n-sakura-zh-cn_*.ipk

# 方式二：编译进固件
# 把本包放进 package/ 下（或你自己的 feed），然后在 .config 中启用：
#   CONFIG_PACKAGE_luci-theme-sakura=y
```

安装后在 **系统 → 系统 → 语言和界面** 中选择「Sakura」主题。

## 配置

安装后到 **系统 → Sakura Theme Configuration** 配置：

| 配置项 | 说明 |
|---|---|
| 主色调 | 顶部栏 / 菜单 / 按钮主色（HEX）|
| 透明度 | 毛玻璃面板通透度 0 - 1 |
| 登录页背景 | 下拉选择或上传（图片 / 视频）|
| 主页背景 | 同上 |
| 樱花飘落 | 开关 + 花瓣数量（1-200）|

## 目录结构

```
.
├── Makefile
├── htdocs/luci-static/
│   ├── resources/menu-sakura.js      侧边栏菜单（含 SVG 图标注入）
│   └── sakura/                       主题静态资源
│       ├── css/                      cascade / sakura-custom / sakura-login / sakura-spa / dark
│       ├── icon/anime/               16 个 AI 生成 Q 版图标
│       ├── icon/cute/                17 个 Fluent 风格图标
│       ├── img/                      品牌图标等
│       ├── background/               默认背景图
│       └── sakura.js                 樱花飘落特效
├── po/zh_Hans/                       中文翻译
├── root/
│   ├── etc/uci-defaults/             安装时注册主题
│   ├── etc/config/sakura             默认配置
│   ├── usr/libexec/rpcd/             rpcd 后端
│   └── usr/share/rpcd/acl.d/         权限
└── ucode/template/themes/sakura/     7 个模板
```

<img width="2557" height="1274" alt="image" src="https://github.com/user-attachments/assets/5781169d-4933-44b5-83e2-e54080a95ee3" />


## 说明

本项目的**代码、图标与文档均由 AI 辅助生成**，并经人工测试与调整后发布。
图标使用 AI 图像模型（gpt-image-2.5）生成。

## 致谢

- 基于 [luci-theme-argon](https://github.com/jerrykuku/luci-theme-argon)（Jerrykuku）二次开发
- 图标生成：AI（gpt-image-2.5）

## 许可

Apache License 2.0（继承自上游）
