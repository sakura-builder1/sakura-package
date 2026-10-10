# sakura-package · 自研 OpenWrt 插件总源码

本仓收录自己开发的全部 LuCI 插件与主题的**源码快照** ✓ 由脚本**自动同步** ✓

> ⚠️ 这里是**镜像仓** ✓ 改代码请到对应的独立仓库改 ✓ 不要直接在这里改 ✗
> （在独立仓库 commit 后，本仓会自动跟着更新 ✓）

## 📦 收录的包

| 目录 | 说明 | 独立仓库 |
|---|---|---|
| `luci-app-live2d` | Live2D 看板娘：可拖拽缩放、点击互动、OpenAI 兼容 AI 对话、20 个路由器管理工具、持久化记忆与历史 | [luci-app-live2d](https://github.com/sakura-builder1/luci-app-live2d) |
| `luci-app-sakura-home` | 自研首页仪表盘（樱花风·卡片式） | [luci-app-sakura-home](https://github.com/sakura-builder1/luci-app-sakura-home) |
| `luci-app-sakura-config` | 樱花主题配置页（主色/模糊半径等） | [luci-app-sakura-config](https://github.com/sakura-builder1/luci-app-sakura-config) |
| `luci-app-dlna-player` | OpenWrt 上的 DLNA 音乐播放器 | [luci-app-dlna-player](https://github.com/sakura-builder1/luci-app-dlna-player) |
| `luci-app-wolplus` | 网络唤醒（WOL）增强 | [luci-app-wolplus](https://github.com/sakura-builder1/luci-app-wolplus) |
| `luci-theme-sakura` | 樱花二次元主题（粉白毛玻璃） | [luci-theme-sakura](https://github.com/sakura-builder1/luci-theme-sakura) |

## 🔄 自动同步机制

```
① 你在 change/luci-app-xxx/ 里改代码并 git commit
                ↓  该仓库的 .git/hooks/post-commit 自动触发
② /home/openwrt/sync-sakura-package.sh
                ↓  把 6 个包的源码镜像进 /home/openwrt/sakura-package/
                ↓  git add -A → 有变化才 commit → git push origin main
③ 本仓在 GitHub 上自动更新 ✓
```

**手动同步**（任何时候都可以跑一遍）：

```sh
/home/openwrt/sync-sakura-package.sh
tail -30 /tmp/sakura-package-sync.log      # 看同步日志 ✓
```

**同步规则**
- 只镜像**源码**：`Makefile` / `README.md` / `htdocs/` / `root/` 等
- 自动排除：`.git/`、`.gitignore`、`build_dir/`
- 用「整目录替换」而不是增量覆盖 ✓ 所以**删掉的文件也会同步删掉** ✓
- 无变化时**不会**产生空提交 ✓

## 🏗️ 编译打包

各包仍按标准 OpenWrt 流程编译：

```sh
cp -a /home/openwrt/change/<包名> /home/openwrt/bianyi/immortalwrt/package/custom/
cd /home/openwrt/bianyi/immortalwrt && make package/custom/<包名>/compile
```

## 📝 目录结构

```
sakura-package/
├── README.md          ← 本文件
├── sync.sh            ← 同步脚本副本（实际执行的是 /home/openwrt/sync-sakura-package.sh）
├── luci-app-live2d/
├── luci-app-sakura-home/
├── luci-app-sakura-config/
├── luci-app-dlna-player/
├── luci-app-wolplus/
└── luci-theme-sakura/
```
