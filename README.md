# OpenWrt 源码合集

`sakura-package` —— 开箱即用的 OpenWrt LuCI 插件源码合集。
所有插件**平铺在仓库根目录**，一个目录就是一个插件，用 `feeds` 引入即可直接参与编译。

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

| 软件名 | 中文名称 | 说明 |
| --- | --- | --- |
| luci-app-live2d | Live2D 看板娘 | 网页上可拖动、可点击交互的 Live2D 角色 |
| luci-app-sakura-home | 樱花首页仪表盘 | 卡片式首页：CPU / 内存 / 温度 / 网络 / 磁盘 / 在线设备 / 流量 / Docker |
| luci-app-sakura-config | 樱花主题配置 | 设置主题主色、模糊半径等外观参数 |
| luci-app-dlna-player | DLNA 音乐播放器 | 把路由器变成网络音箱，自动识别声卡 |
| luci-app-wolplus | 网络唤醒增强 | 增强版 Wake-on-LAN 远程唤醒 |
| luci-app-game | 怀旧游戏站 | 浏览器直接玩模拟器游戏，支持封面 / 金手指 / 手柄 / 存档 |
| luci-app-advancedplus | 系统高级设置 | 系统设置增强合集（时间同步 / 磁盘 / 文件管理等） |
| luci-app-poweroffdevice | 关机重启 | 网页端关机 / 重启 / 定时电源管理 |
| luci-app-easytier | EasyTier 组网 | EasyTier 异地组网的 LuCI 管理界面 |
| luci-app-tailscale | Tailscale 组网 | Tailscale 异地组网的 LuCI 界面 |
| luci-app-harbor-file | 文件管理 | 网页上传 / 下载 / 管理路由器文件 |
| luci-app-bandix | Bandix 流量监控 | Bandix 按设备流量统计的 LuCI 界面 |

> `luci-app-bandix` 依赖 `openwrt-bandix` 提供的 `bandix` 包，编译时请一起选上。

## 自动同步上游源码

本仓库的插件源码由 GitHub Actions 每 6 小时自动同步上游仓库的最新版本。

## 说明

- 各插件版权归其上游作者所有，本仓库仅做源码汇集，方便一键引入编译。
- 上游更新以各自仓库为准，本仓库不做二次修改。