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
| luci-theme-sakura | Sakura anime theme | 樱花二次元主题（粉白毛玻璃） |
