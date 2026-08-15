# dsh-plugin-manager

> 在 DeepSeek Harness 的网页里直接管理插件:分类列表、标签、预设一键切换、插件市场、整合包导入导出、DeepSeek 余额显示。
> Manage your DeepSeek Harness plugins right inside the web UI: categorized list, tags, one-click preset switching, a plugin marketplace, bundle import/export, and DeepSeek balance.

## 功能 / Features

- **分类列表**:128 个内置插件预分类(24 个标签族)+ 中文简介,搜索/筛选/启停/标签编辑;
- **插件包(预设)**:点选插件组成整合包,一键切换 + 回滚,支持**导入/导出**(名字与介绍随包继承,方便分享);
- **插件市场**:GitHub `dsh-plugin` topic 分页浏览,自动识别真插件,一键安装(内部走 `dsh plugin add github:<repo>`),非插件给出可复制的安装提示词;
- **权限与安全**:变更操作走审批(agent 工具)与确认弹窗(Web);一键停止后可退化为 dsh 原版插件列表;
- **余额与快捷入口**:侧边栏显示 DeepSeek 余额(点击跳用量页)+ Chat 按钮;
- **agent 工具**:`plugin_list / plugin_enable / plugin_disable / plugin_add / plugin_remove / plugin_tag / plugin_preset_list / plugin_preset_switch / plugin_rollback / plugin_stop_self / plugin_market_inspect / plugin_market_install`。

## 安装 / Install

```bash
# 从 GitHub 安装(推荐)
dsh plugin --profile <name> add github:kkkkkkklze/dsh-plugin-manager
```

重启 dsh web 后:设置 → 插件 → 出现「分类 / 插件包 / 市场」三个子标签。

## 使用 / Usage

- 「分类」:查看/筛选/启停全部插件,带标签与简介;
- 「插件包」:点选插件组成整合包,一键切换、导入导出;
- 「市场」:默认「只看插件」扫描模式,点安装即可;
- 对话里:对 agent 说「切到日常预设」「用 plugin_list 看看」等。

## 验证 / Verification

仓库自带一键验收(pwsh -File verify-plugin.ps1):66 项断言覆盖契约、引擎、操作、远程、真实启动与一致性。

## 反馈 / Feedback

欢迎提 Issue / PR;也可以到 [dsh-plugin topic](https://github.com/topics/dsh-plugin) 和 awesome 列表推广你的插件。

## License

MIT
