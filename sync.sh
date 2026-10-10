#!/bin/sh
# ================================================================
# sakura-package 同步脚本
#   把 change/ 下各插件的最新源码镜像进 sakura-package/ 总仓
#   有变化就自动 commit + push ✓
# 手动跑：/home/openwrt/sync-sakura-package.sh
# 自动跑：各插件仓库的 .git/hooks/post-commit 会调用它 ✓
# ================================================================
set -u

SRC=/home/openwrt/change
DST=/home/openwrt/sakura-package
PKGS="luci-app-live2d luci-app-sakura-home luci-app-sakura-config luci-app-dlna-player luci-app-wolplus luci-theme-sakura"
LOG=/tmp/sakura-package-sync.log
LOCK=/tmp/sakura-package-sync.lock

# 并发保护：多个仓库同时 commit 时只跑一个
if [ -f "$LOCK" ]; then
	now=$(date +%s); old=$(cat "$LOCK" 2>/dev/null || echo 0)
	[ $((now - old)) -lt 60 ] && exit 0
fi
date +%s > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

{
	echo "================ $(date '+%F %T') 同步开始 ================"
	cd "$DST" || { echo "✗ 总仓目录不存在：$DST"; exit 0; }

	for p in $PKGS; do
		s="$SRC/$p"
		if [ ! -d "$s" ]; then echo "  · $p 不存在，跳过"; continue; fi
		tmp="$DST/.tmp-$p"
		rm -rf "$tmp"; mkdir -p "$tmp"
		cp -a "$s/." "$tmp/" 2>/dev/null
		rm -rf "$tmp/.git" "$tmp/.gitignore" "$tmp/build_dir"
		rm -rf "$DST/$p"
		mv "$tmp" "$DST/$p"
		echo "  · $p 已镜像"
	done

	git add -A
	if git diff --cached --quiet; then
		echo "  无变化 ✓ 无需提交"
	else
		n=$(git diff --cached --name-only | wc -l)
		git commit -q -m "sync: 自动同步插件源码（$n 个文件变更 · $(date '+%Y-%m-%d %H:%M')）"
		echo "  已提交（$n 个文件）"
		if git push -q origin main 2>/dev/null; then
			echo "  ✓ 已推送到 GitHub"
		else
			echo "  ⚠ 推送失败（远程仓库可能还没建 / 网络不通）→ 改动已留在本地提交 ✓"
		fi
	fi
	echo "================ $(date '+%F %T') 同步结束 ================"
} >> "$LOG" 2>&1

exit 0
