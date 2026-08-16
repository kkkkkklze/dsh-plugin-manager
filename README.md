<div align="center">

![dsh-plugin-manager](docs/ad.png)

# 🎛️ dsh-plugin-manager

**在 DeepSeek Harness 网页里直接管理插件:分类列表 · 标签 · 预设一键切换 · 插件市场 · 导入导出 · 余额**

Manage your DeepSeek Harness plugins right inside the web UI.

[![GitHub Repo stars](https://img.shields.io/github/stars/kkkkkklze/dsh-plugin-manager?style=flat-square)](https://github.com/kkkkkklze/dsh-plugin-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![topic: dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-8A2BE2?style=flat-square)](https://github.com/topics/dsh-plugin)

</div>

---

## ✨ 功能 / Features

- 📂 **分类列表** — 内置 128 个插件预分类(24 个标签族)+ 中文简介,搜索 / 筛选 / 启停 / 标签编辑;
- 📦 **插件包(预设)** — 点选插件组成整合包,一键切换 + 回滚,支持**导入 / 导出**(名字与介绍随包继承,方便分享);
- 🛒 **插件市场** — 浏览 GitHub `dsh-plugin` 主题仓库,自动识别真插件,一键安装;非插件给出可复制的安装提示词;
- 🛡️ **权限与安全** — 变更操作走审批(agent 工具)与确认弹窗(Web);一键停止后可优雅退化为 dsh 原版插件列表;
- 💰 **余额与快捷入口** — 侧边栏显示 DeepSeek 余额(点击跳用量页)+ Chat 按钮;
- 🤖 **agent 工具** — `plugin_list / plugin_enable / plugin_disable / plugin_add / plugin_remove / plugin_tag / plugin_preset_list / plugin_preset_switch / plugin_rollback / plugin_stop_self / plugin_market_inspect / plugin_market_install`。

## 🔧 安装 / Install

```bash
# 从 GitHub 安装(推荐)
dsh plugin --profile <name> add github:kkkkkklze/dsh-plugin-manager
```

重启 dsh web 后:设置 → 插件 → 出现「分类 / 插件包 / 市场」三个子标签。

## 🚀 使用 / Usage

- 「分类」:查看 / 筛选 / 启停全部插件,带标签与简介;
- 「插件包」:点选插件组成整合包,一键切换、导入导出;
- 「市场」:默认「只看插件」扫描模式,点安装即可;
- 对话里:对 agent 说「切到日常预设」「用 plugin_list 看看」等。

## 🌱 愿景:统一插件依赖标准(Vision)

> 现在的 dsh 生态里有大量不同格式的**风格包 / 美化包**,互相冲突、装了 A 就坏 B。
> 我们想借鉴 **Minecraft 模组的「前置依赖(required dependency)」** 思路来统一它们。

设想:

1. 统一一个**前置 / 基础插件**作为公共底座,风格包 / 美化包声明对它依赖;
2. **依赖同一前置的插件互相兼容** —— 前置统一注册与渲染入口,风格包只负责提供内容;
3. 像 MCMod 的前置列表一样,装风格包时自动识别并提示它需要的前置;
4. 本插件后续支持**依赖追踪**:展示依赖关系、安装前校验前置是否齐备;
5. 可能需要插件按一定方式声明依赖(例如 `package.json` 的 `dsh` 清单增加 `requires` / `provides` 字段)。

如果你也受风格包冲突之苦、认同这个方向,欢迎来 Issue 讨论,一起定标准。

## ✅ 验证 / Verification

仓库自带一键验收(pwsh -File verify-plugin.ps1):60+ 项断言覆盖契约、引擎、操作、远程、真实启动与一致性。

## 🙌 反馈 / Feedback

欢迎提 Issue / PR;也欢迎到 [dsh-plugin topic](https://github.com/topics/dsh-plugin) 和 awesome 清单互相推荐。

## 📄 License

[MIT](./LICENSE) © 2026 kkkkkklze
