# sakura-package

自研 OpenWrt 插件与主题源码合集。

## 使用

**一键命令**

```sh
sed -i '1i src-git sakura https://github.com/sakura-builder1/sakura-package' feeds.conf.default
git pull
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
```

- openwrt 固件编译自定义主题与软件

## 软件列表

| 软件名 | 说明 | 中文说明 |
| --- | --- | --- |
| luci-app-live2d | Live2D desktop pet with AI assistant | Live2D 看板娘（AI 对话 · 路由器管理 · 记忆） |
| luci-app-sakura-home | Custom dashboard for LuCI | 自研首页仪表盘（樱花风 · 卡片式） |
| luci-app-sakura-config | Sakura theme settings | 樱花主题配置（主色 · 模糊半径） |
| luci-app-dlna-player | DLNA music player | DLNA 音乐播放器 |
| luci-app-wolplus | Enhanced Wake-on-LAN | 网络唤醒增强 |
| luci-app-game | Retro game station, play in browser (AI-assisted) | 怀旧游戏站（浏览器模拟器 · 免客户端 · 手柄 / 金手指 / 存档 · AI 辅助开发） |
| luci-theme-sakura | Sakura anime theme | 樱花二次元主题（粉白毛玻璃） |

## 源码同步说明

本仓库是各插件源码的**自动镜像合集**，由同步脚本在各插件仓库提交后自动镜像过来。

主源码在**独立仓库**中维护，本仓库内对应目录为副本，**请勿直接改这里**：

| 插件 | 独立仓库（主源码） |
| --- | --- |
| luci-app-game | [sakura-builder1/luci-app-game](https://github.com/sakura-builder1/luci-app-game) |

> 其余插件目前仅在本仓库内维护。
