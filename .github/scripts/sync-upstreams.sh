#!/usr/bin/env bash
# ============================================================
#  同步上游源码 -> mirror/<目录>/
# ------------------------------------------------------------
#  设计原则：只做「整仓复制」，绝不修改上游任何一个字符。
#  => 永远不会产生冲突，也不需要 rebase / merge。
#  用法：
#     bash .github/scripts/sync-upstreams.sh     # 本地
#     GitHub Actions 里由 workflow 自动调用
# ============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF="$ROOT/.github/scripts/upstreams.conf"
MIRROR="$ROOT/mirror"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$MIRROR"
echo "仓库根目录: $ROOT"
echo "镜像目标  : $MIRROR"
echo

# 注意：|| [ -n "$dir" ] 是为了处理「配置文件最后一行没有换行符」的情况，
# 否则最后一行会被 read 直接吃掉（这个坑已经踩过一次）。
while read -r dir branch url || [ -n "${dir:-}" ]; do
    # 跳过空行和注释行
    [ -z "$dir" ] && continue
    case "$dir" in \#*) continue ;; esac

    printf '==> %-28s <- %s (%s)\n' "$dir" "$url" "$branch"

    rm -rf "$TMP/$dir"
    if ! git clone -q --depth 1 --branch "$branch" "$url" "$TMP/$dir"; then
        echo "    !! 克隆失败，保留 mirror/$dir 的现有内容" >&2
        continue
    fi

    # 上游的 .git 不带进来，只留纯源码
    rm -rf "$TMP/$dir/.git"

    # 整仓覆盖：上游删掉的文件，这里也跟着删掉
    rm -rf "$MIRROR/$dir"
    mkdir -p "$MIRROR/$dir"
    cp -a "$TMP/$dir/." "$MIRROR/$dir/"

    echo "    已镜像 -> mirror/$dir/"
done < "$CONF"

echo
echo "=================== 同步完成 ==================="
echo "各目录内容概览："
for d in "$MIRROR"/*/; do
    [ -d "$d" ] || continue
    n=$(basename "$d")
    cnt=$(find "$d" -type f | wc -l)
    mk=$(find "$d" -name Makefile | wc -l)
    printf '  %-28s %3s 个文件, %s 个 Makefile\n' "$n" "$cnt" "$mk"
done