# luci-app-live2d

樱花主题的 Live2D 看板娘插件，内置 AI 对话能力，可以直接管理路由器。

## 功能

**看板娘显示**
- 悬浮在 LuCI 页面上的 Live2D 模型，支持拖拽、缩放、点击交互
- 内置模型：Haru、Rice（可选）
- 支持鼠标穿透、触屏、自动待机动作

**AI 对话（OpenAI 兼容接口）**
- 点击模型即可对话，支持 Markdown 渲染（表格 / 代码块 / 列表）
- ★ API Key 只保存在路由器上（`/etc/config/live2d`），前端通过 rpcd 代理调用，拿不到密钥
- 支持 function calling，能真正操作路由器

**20 个工具**
| 类别 | 工具 |
|---|---|
| 读取 | 系统信息 / 磁盘 / 网络 / 服务 / 日志 / WiFi / 已装插件 / uci 配置 |
| 改配置 | set_uci / set_uci_batch / add_section / delete_section / rollback_uci |
| 服务 | service_action / restart_service |
| 插件 | install / remove / search_package |
| 记忆 | remember / forget / list_memory |
| 界面 | open_page |
| 高危 | run_shell（需单独开启）|

**记忆与历史**
- 记忆和历史保存在 `/etc/live2d-data/`，刷新、重启、刷机都不会丢
  （sysupgrade 备份的就是 `/etc`，所以刷机备份会自动带上）
- 每轮对话自动注入已记住的内容
- 与 AI 对话时自动带上最近 6 轮上下文

## 安全设计

三层开关：

```
启用 AI 对话          总开关
  └ 允许执行操作       写操作（改配置 / 服务 / 插件）
      └ 允许执行 shell 命令   最高危，默认关闭
```

- 凭据字段（password / key / secret / token）永远不允许修改
- 核心系统包不允许卸载
- 每次修改配置前自动备份，保留最近 20 份
- shell 命令有危险操作拦截（rm -rf / mkfs / dd 写设备等）

## 依赖

```
+luci-base +luci-theme-sakura +jsonfilter +curl +jshn +rpcd-mod-file
```

## 第三方组件与许可

| 组件 | 许可 |
|---|---|
| Live2D Cubism Core (`lib/core.js`) | Live2D Inc. 专有许可 |
| pixi.min.js | MIT |
| pixi-live2d-display (`lib/cubism4.min.js`) | MIT |
| 模型 Haru | Live2D 官方示例模型 |
| 模型 Rice | 原作者保留权利 |

使用前请自行确认各组件许可条款。

## 安装

```
opkg install luci-app-live2d_*.ipk
```

安装后到「服务 → Live2D 看板娘」配置。
