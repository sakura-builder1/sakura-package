# mirror/ — 上游源码镜像

本目录**全部是第三方上游源码的只读镜像**，由 GitHub Actions 自动同步。
**请勿在此目录直接改代码** —— 改动会在下一次同步时被覆盖。
要改，请去上游仓库提 PR，或在自己的仓库里改。

## 同步方式

- 清单：`.github/scripts/upstreams.conf`
- 脚本：`.github/scripts/sync-upstreams.sh`
- 定时：`.github/workflows/sync-upstreams.yml`（每 6 小时，也可手动触发）

原理很简单：**整仓复制，不改一个字符** —— 所以永远不会有冲突。

## 收录的包

| 目录 | 上游仓库 | 分支 | 产出包 | 许可证 |
|---|---|---|---|---|
| `luci-app-advancedplus/` | sirpdboy/luci-app-advancedplus | main | luci-app-advancedplus | ⚠️ 未声明 |
| `luci-app-poweroffdevice/` | sirpdboy/luci-app-poweroffdevice | master | luci-app-poweroffdevice | ⚠️ 未声明 |
| `luci-app-easytier/` | EasyTier/luci-app-easytier | main | easytier、easytier-noweb、luci-app-easytier | Apache-2.0 |
| `luci-app-tailscale/` | asvow/luci-app-tailscale | main | luci-app-tailscale | GPL-3.0 |
| `luci-app-harbor-file/` | destan19/luci-app-harbor-file | main | luci-app-harbor-file | MIT |
| `luci-app-bandix/` | timsaya/luci-app-bandix | main | luci-app-bandix | Apache-2.0 |
| `openwrt-bandix/` | timsaya/openwrt-bandix | main | bandix | Apache-2.0 |

> 7 个上游仓库，实际产出 **9 个包**。

## ⚠️ 两个坑（改目录名/删包之前务必先看）

**1. 目录名 = 包名，不能乱改**

`luci.mk` 里是这样的：

```make
LUCI_NAME?=$(notdir ${CURDIR})   # 包名 = 所在目录名
PKG_NAME?=$(LUCI_NAME)
```

所以 `luci-app-tailscale`、`luci-app-advancedplus`、`luci-app-harbor-file`
这三个的目录名**必须和包名一致**，改名就会编出名字错误的包。

**2. bandix 是一对，缺一不可**

- `luci-app-bandix`（前端）依赖 `+bandix`
- `bandix` 这个包由 `openwrt-bandix` 提供

两个都要在，只留一个会编译失败。

## 引用方式

母仓本身可以直接当 feed 用（feeds 会**递归**扫描 Makefile，子目录照样识别）：

```sh
src-git sakura https://github.com/sakura-builder1/sakura-package
```

## 版权

各上游版权归原作者所有，许可证见上表。
**注意：`sirpdboy` 的两个仓库未声明许可证**，再分发前请自行确认授权情况。