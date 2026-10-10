#
# Copyright (C) 2026 sakura-builder1
#
# This is free software, licensed under the Apache License, Version 2.0
#
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Live2D Companion
LUCI_DESCRIPTION:=A floating Live2D character on the LuCI web interface. Drag, resize, click to interact. Phase 1: display only (no AI yet).
LUCI_DEPENDS:=+luci-base +luci-theme-sakura +jsonfilter +curl +jshn +rpcd-mod-file
# jsonfilter: 后端解析 JSON
# curl:       后端请求 OpenAI 兼容接口
# jshn:       后端生成 JSON（libubox 的 shell 库）
# rpcd-mod-file: 配置页保存/执行同步脚本
PKG_VERSION:=1.0.0
PKG_RELEASE:=20261010

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
