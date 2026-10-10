# 樱花主题配置 (luci-app-sakura-config)

[luci-theme-sakura](https://github.com/<你的用户名>/luci-theme-sakura) 樱花主题的配套配置插件。

## 功能

| 分组 | 配置项 |
|---|---|
| 主题配置 | **主色调**（HEX，带校验）、**透明度**（0-1）|
| 背景配置 | **登录页背景**、**主页背景**（下拉选择 / 上传 / 删除，支持图片和视频）|
| 樱花飘落 | **开关** + **花瓣数量**（1-200）|

## 安装

```sh
opkg install luci-app-sakura-config_*.ipk luci-i18n-sakura-config-zh-cn_*.ipk
```

安装后菜单位置：**系统 → 樱花主题配置**

## 依赖

- luci-theme-sakura（自动安装）
- 配置写入 `/etc/config/sakura`

## 目录结构

```
.
├── Makefile
├── htdocs/luci-static/resources/view/sakura-config.js   配置页面
├── po/zh_Hans + po/zh-cn/                               中文翻译
└── root/
    ├── etc/uci-defaults/                                确保配置文件存在
    └── usr/share/
        ├── luci/menu.d/                                 菜单
        └── rpcd/acl.d/                                  权限
```

## 许可

Apache License 2.0

## 说明

本项目的**代码、图标与文档均由 AI 辅助生成**，并经人工测试与调整后发布。
图标使用 AI 图像模型（gpt-image-2.5）生成。
