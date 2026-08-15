// dsh-plugin-manager — M3: Web UI(自带 localhost 管理页)+ 全部 agent 工具
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { createManager } from './manager.js'
import { createGateway } from './remote.js'

export const name = 'dsh-plugin-manager'
export const inject = ['tools', 'loader']

export const Config = Schema.object({
  patchFile: Schema.string().default('cordis.patch.yml'),
  // M4:运行期间用本插件替换内置「插件」区;自停时自动恢复原版 UI
  replaceInventoryId: Schema.string().default('ui-settings-plugin-inventory'),
  replaceInventoryOnStart: Schema.boolean().default(true),
})

export function apply(ctx, config) {
  const m = createManager(ctx, config)
  // Typert 远程服务:Web 客户端经 /api 调用(零额外端口)
  ctx.plugin(createGateway(m, [config.replaceInventoryId || 'ui-settings-plugin-inventory']))

  // 启动即替换内置「插件」区(禁用清单 + 插件配置区两个内置行;幂等;失败不致命)
  const REPLACE_ROWS = [
    { id: config.replaceInventoryId || 'ui-settings-plugin-inventory', name: '@deepseek-ai/dsh-client-ui-settings-plugin-inventory' },
  ]
  // 历史替换行全集(自愈:不在当前替换集内的,一律清掉,避免旧版本残留禁用内置分区)
  const MANAGED_REPLACE_IDS = ['ui-settings-plugin-inventory', 'ui-settings-plugins']
  ;(async () => {
    if (config.replaceInventoryOnStart !== false) {
      try {
        const { readState, writeState, sync: syncState } = m.internals
        const state = await readState()
        let changed = false
        const wanted = new Set(REPLACE_ROWS.map((row) => row.id))
        for (const id of MANAGED_REPLACE_IDS) {
          if (wanted.has(id)) {
            const row = REPLACE_ROWS.find((r) => r.id === id)
            if (!(state.overrides[id] && state.overrides[id].disabled === true)) {
              state.overrides[id] = { name: row.name, disabled: true }
              changed = true
            }
          } else if (state.overrides[id]) {
            delete state.overrides[id]
            changed = true
          }
        }
        if (changed) { await writeState(state); await syncState(state); m.log('已同步内置分区替换状态(分类列表)') }
      } catch (e) { m.log('替换内置分区失败(继续运行): ' + e.message) }
      // 启动自检:上次整合包切换后启动失败(崩溃)→ 自动回退默认整合包,防止 boot 起不来
      try { await m.internals.startupSelfCheck() } catch (e2) { m.log('启动自检异常(继续运行): ' + e2.message) }
    }
  })()
  const textOutput = { schema: { type: 'string' }, render: (_a, v) => [{ type: 'text', text: v }] }
  const reg = (toolName, description, parameters, execute) =>
    ctx.tools.register(defineTool({ name: toolName, description, parameters, output: textOutput, execute }))

  // M4 权限层:变更类工具经 approval 服务审批(policy=never 时返回 rejected,天然拦截)
  async function requireApproval(exec, reason) {
    let approval = null
    try { approval = ctx.get('approval') } catch { approval = null }
    if (!approval || !exec || !exec.agent) return
    const outcome = await approval.request({ agent: exec.agent, toolName: name, callId: exec.callId, signal: exec.signal, reason })
    if (outcome !== 'approved') throw new Error('操作未获批准(' + outcome + '): ' + reason)
  }

  reg('plugin_list', '列出当前 dsh 运行时的全部插件条目(id/模块名/状态/阶段/标签),可按标签筛选。',
    { tag: { type: 'string', description: '按标签筛选(可选)' } },
    async (args) => {
      const { rows } = await m.opList({ tag: args.tag })
      const lines = rows.map((r) => '- ' + r.id + '  |  ' + r.name + '  |  [' + (r.enabled ? 'enabled' : 'disabled') + ']  |  ' + (r.phase ?? '-') + '  |  ' + (r.tags.join(' ') || '-'))
      return '插件列表' + (args.tag ? '(标签: ' + args.tag + ')' : '') + ':\n' + (lines.join('\n') || '(空)')
    })

  reg('plugin_enable', '启用插件(按 id/模块名,或按标签批量),免重启热更新。',
    { name: { type: 'string', description: '插件 id 或模块名(与 tag 二选一)' }, tag: { type: 'string', description: '按标签批量启用' } },
    async (args, exec) => { await requireApproval(exec, '启用插件'); return (await m.opToggle({ name: args.name, tag: args.tag }, false)).text })

  reg('plugin_disable', '停用插件(按 id/模块名,或按标签批量),免重启热更新。',
    { name: { type: 'string', description: '插件 id 或模块名(与 tag 二选一)' }, tag: { type: 'string', description: '按标签批量停用' } },
    async (args, exec) => { await requireApproval(exec, '停用插件'); return (await m.opToggle({ name: args.name, tag: args.tag }, true)).text })

  reg('plugin_add', '把 npm 包名加入插件树并启用(免重启的 dsh plugin add;包必须已存在于 profile 依赖)。',
    { package: { type: 'string', required: true, description: 'npm 包名' } },
    async (args, exec) => { await requireApproval(exec, '添加插件'); return (await m.opAdd(args.package)).text })

  reg('plugin_remove', '移除管理器自己添加的插件行(pm- 前缀)。上层/内置行请用 plugin_disable。',
    { name: { type: 'string', required: true, description: '插件 id 或模块名' } },
    async (args, exec) => { await requireApproval(exec, '移除插件行'); return (await m.opRemove(args.name)).text })

  reg('plugin_tag', '编辑用户标签(逗号分隔;-前缀移除,如: 工具,AI,-UI)。',
    { name: { type: 'string', required: true, description: '插件 id 或模块名' }, tags: { type: 'string', required: true, description: '标签改动' } },
    async (args, exec) => { await requireApproval(exec, '编辑插件标签'); return (await m.opTag(args.name, args.tags)).text })

  reg('plugin_preset_list', '列出所有插件预设及引用。',
    {},
    async () => {
      const { presets, presetsPath } = await m.opPresetList()
      if (!presets.length) return '没有预设。请在 ' + presetsPath + ' 定义。'
      return '预设列表( ' + presetsPath + ' ):\n' + presets.map((p) => '- ' + p.name + ' | ' + (p.description || '') + ' | ' + p.refs.join(', ')).join('\n')
    })

  reg('plugin_preset_switch', '一键切换预设:启用预设内插件、停用其余(管理器自身不受影响);可用 plugin_rollback 回滚。',
    { preset: { type: 'string', required: true, description: '预设名(见 plugin_preset_list)' } },
    async (args, exec) => { await requireApproval(exec, '一键切换插件包「' + args.preset + '」'); return (await m.opPresetSwitch(args.preset)).text })

  reg('plugin_rollback', '回滚最近一次插件状态变更,恢复到上一步完整状态。',
    {},
    async (_args, exec) => { await requireApproval(exec, '回滚插件状态'); return (await m.opRollback()).text })

  reg('plugin_market_inspect', '识别 GitHub 仓库是否为 dsh 插件:抓其 package.json 检查 dsh 清单。',
    { repo: { type: 'string', required: true, description: '仓库,如 owner/name' } },
    async (args) => (await m.opMarketInspect(args.repo)).text)

  reg('plugin_market_install', '从 GitHub 安装插件到当前 profile(内部 dsh plugin add github:<repo>)。',
    { repo: { type: 'string', required: true, description: '仓库,如 owner/name' } },
    async (args, exec) => { await requireApproval(exec, '从市场安装插件 ' + args.repo); return (await m.opMarketInstall(args.repo)).text })

  reg('plugin_stop_self', '停止插件管理器自身:界面退化为 dsh 原版插件列表。confirm 必须传 STOP;重新启用需手删 patch 中的停用行。',
    { confirm: { type: 'string', required: true, description: '输入 STOP 确认停止' } },
    async (args, exec) => {
      if (args.confirm !== 'STOP') return '未确认:confirm 必须为 STOP。'
      await requireApproval(exec, '停止插件管理器(界面将恢复为 dsh 原版插件列表)')
      return (await m.opSelfStop([config.replaceInventoryId])).text
    })

  m.log('loaded; patchFile=' + m.patchPath + '; presets=' + m.presetsPath)
}
