#!/usr/bin/env bash
# ============================================================
#  同步上游源码 -> 仓库根目录（平铺，不嵌套）
# ------------------------------------------------------------
#  设计原则：只做「目录原样复制」，绝不修改上游任何一个字符。
#  => 永远不会产生冲突，也不需要 rebase / merge。
#
#  用法：
#     bash .github/scripts/sync-upstreams.sh     # 本地
#     GitHub Actions 里由 workflow 自动调用
# ============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF="$ROOT/.github/scripts/upstreams.conf"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "仓库根目录: $ROOT"
echo

# 同一个上游仓库可能被多个包复用（例如 easytier 的三个包），
# 这里按仓库地址缓存，一个仓库只克隆一次。
# 用法： repo="$(repo_cache <地址> <分支>)"
repo_cache() {
    local url="$1" branch="$2" key dir
    key="$(printf '%s' "$url" | tr -c 'A-Za-z0-9' '_')"
    dir="$TMP/repos/$key"
    if [ ! -d "$dir" ]; then
        mkdir -p "$TMP/repos"
        git clone -q --depth 1 --branch "$branch" "$url" "$dir" 1>&2 || return 1
        # 上游的 .git 不带进来，只留纯源码
        rm -rf "$dir/.git"
    fi
    printf '%s' "$dir"
}

# 注意：|| [ -n "$dst" ] 是为了处理「配置文件最后一行没有换行符」的情况，
# 否则最后一行会被 read 直接吃掉（这个坑已经踩过一次）。
while read -r dst branch subdir url || [ -n "${dst:-}" ]; do
    if [ -z "$dst" ]; then continue; fi
    case "$dst" in \#*) continue ;; esac

    # 安全阀：目标目录必须是「仓库根目录下的单个名字」，
    # 避免配置写错时 rm -rf 误删整个仓库。
    case "$dst" in
        .|..|/*|*/*)
            echo "    !! 非法目标目录，已跳过：$dst" >&2
            continue
            ;;
    esac

    printf '==> %-24s <- %s (%s:%s)\n' "$dst" "$url" "$branch" "$subdir"

    if ! repo="$(repo_cache "$url" "$branch")"; then
        echo "    !! 克隆失败，保留 $dst 的现有内容" >&2
        continue
    fi

    src="$repo"
    if [ "$subdir" != "." ]; then
        src="$repo/$subdir"
    fi

    if [ ! -f "$src/Makefile" ]; then
        echo "    !! 找不到 $src/Makefile，保留 $dst 的现有内容" >&2
        continue
    fi

    # 整个目录覆盖：上游删掉的文件，这里也跟着删掉
    rm -rf "$ROOT/$dst"
    mkdir -p "$ROOT/$dst"
    cp -a "$src/." "$ROOT/$dst/"

    echo "    已同步 -> $dst/"
done < "$CONF"

echo
echo "=================== 同步完成 ==================="
echo "各目录内容概览："
for d in "$ROOT"/*/; do
    [ -d "$d" ] || continue
    n="$(basename "$d")"
    case "$n" in .git|.github) continue ;; esac
    cnt="$(find "$d" -type f | wc -l)"
    mk="$(find "$d" -name Makefile | wc -l)"
    printf '  %-26s %3s 个文件, %s 个 Makefile\n' "$n" "$cnt" "$mk"
done