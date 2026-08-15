# 验收方法(verify.mjs + verify-plugin.ps1)

## 为什么这样才可靠

上次事故(ERR_PACKAGE_PATH_NOT_EXPORTED)的教训:当时的测试全部用相对路径 import,
从未走过「裸名导入包根」这条 dsh loader 真实使用的解析路径,所以 exports 缺陷全部漏检。
本验收法把验证拆成四层,覆盖真实失败路径:

| 层 | 验证什么 | 对应事故/回归 |
|---|---|---|
| 契约层 | exports 含 . 根入口、./client 子路径与文件存在、dsh.client manifest | exports 漏根入口事故 |
| 裸名导入 | import(dsh-plugin-manager) 按 exports 表解析成功且导出 apply | 与 loader 完全相同的解析路径 |
| 引擎层 | !!js 往返、pm-manager/pm. 所有权、insert 不重复、覆盖行不残留、用户行保留 | 自卸载/重复块/残留行 |
| 操作层 | 9 工具、include: 前缀剥离、启停/预设切换/回滚、自守护 | include: 前缀事故 |
| HTTP 层 | /api/state、OPTIONS 预检、CORS、PATCHBAY 页面 | 跨源预检事故 |
| 真实启动 | dsh --profile pmv2 实际拉起插件树,日志含 loaded,exit 0 | 启动失败事故 |
| 一致性 | 已验证副本与安装副本逐文件 SHA-256 比对 | 防「验过的不等于装上的」 |

## 怎么跑

(推荐,全套;含一次真实 headless 启动验证)

    pwsh -File C:\Users\Administrator\dsh-plugin-manager\verify-plugin.ps1

跳过真实启动(纯静态+逻辑)

    pwsh -File C:\Users\Administrator\dsh-plugin-manager\verify-plugin.ps1 -SkipBoot

只跑 Node 套件(注意:必须在 profiles\node_modules\dsh-plugin-manager 里跑,
源目录没有 @deepseek-ai 依赖会解析失败)

    cd C:\Users\Administrator\.dsh\profiles\node_modules\dsh-plugin-manager
    node verify.mjs

退出码:0 = 全部通过;1 = 有失败;2 = 包目录缺 verify.mjs。
任何失败都会打印具体断言名,可定位到上面表格对应层。

## 判定标准(什么才算「做对了」)

1. 契约层 7 项全 PASS(尤其 exports 根入口);
2. 裸名导入 PASS —— 这是「dsh 能加载这个插件」的等价证明;
3. 引擎/操作/HTTP 层全 PASS —— 功能正确性的等价证明;
4. 真实启动:日志出现 [dsh-plugin-manager] loaded 且 exit 0 —— 端到端证明;
5. 一致性:PASS 表示「线上装的」与「刚验证的」逐字节一致。

## 以后每次改动后的流程

1. 改代码 → 同步到 profiles\node_modules\dsh-plugin-manager;
2. 跑 pwsh -File verify-plugin.ps1;
3. 全绿再考虑回装/重启 web;有红先修,不要动线上。
