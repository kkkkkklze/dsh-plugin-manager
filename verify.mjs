// verify.mjs — dsh-plugin-manager 验收测试(必须在包目录内运行: node verify.mjs)
// 三层验证:契约(元数据)→ 逻辑(引擎/操作)→ 与线上同路径的裸名导入回归
import { readFileSync, existsSync } from 'node:fs'
import yaml from 'js-yaml'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parsePatch, composePatch, isOwnRow, isOwnInsertRow, isOwnOverrideRow } from './engine.js'
import { apply } from './index.js'
import { createGateway } from './remote.js'

let pass = 0
const failures = []
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS  ' + name) }
  else { failures.push(name + (detail ? ' | ' + detail : '')); console.log('FAIL  ' + name + (detail ? ' | ' + detail : '')) }
}

// ============ 第一层:包契约 ============
console.log('--- 契约层 ---')
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
check('包名 = dsh-plugin-manager', pkg.name === 'dsh-plugin-manager')
check('exports 有 . 根入口(事故根因回归)', !!pkg.exports && typeof pkg.exports['.'] === 'string')
check('根入口指向的文件存在', !!pkg.exports && existsSync(new URL('./' + pkg.exports['.'], import.meta.url)))
check('exports 有 ./client 子路径', !!pkg.exports && typeof pkg.exports['./client'] === 'string')
check('exports 有 ./package.json(客户端扫描回归)', !!pkg.exports && typeof pkg.exports['./package.json'] === 'string')
check('client 文件存在', existsSync(new URL('./client-bundle.js', import.meta.url)))
check('dsh.client.platform = web', !!(pkg.dsh && pkg.dsh.client && pkg.dsh.client.platform === 'web'))
check('bundle manifest 声明 patch', !!(pkg.dsh && pkg.dsh.bundle && typeof pkg.dsh.bundle.patch === 'string'))
const bundlePatch = readFileSync(new URL('./cordis.patch.yml', import.meta.url), 'utf8')
check('bundle patch 不自插 pm-manager(防 duplicate id)', !bundlePatch.includes('id: pm-manager'))
check('remote.js 存在', existsSync(new URL('./remote.js', import.meta.url)))
const clientSrc = readFileSync(new URL('./client-bundle.js', import.meta.url), 'utf8')
check('client 含模块加载器注册', clientSrc.includes('__ModuleLoader__'))
check('client 作为内置「插件」区子标签(分类/插件包)', clientSrc.includes('settings.plugins.tab') && clientSrc.includes('插件包'))
check('client 含插件市场(市场/marketInstall)', clientSrc.includes('市场') && clientSrc.includes('marketInstall'))
check('client 含批量安装(勾选/整合包)', clientSrc.includes('batchInstall') && clientSrc.includes('pm-check') && clientSrc.includes('批量安装并生成整合包'))
check('client 含精选列表源(Awesome curated,修复子目录/无topic漏识别)', clientSrc.includes('marketCurated') && clientSrc.includes('parseCurated') && clientSrc.includes('awesome-dsh-plugin'))
check('client 识别回退链(HEAD 万能回退)', clientSrc.includes('HEAD/package.json') && clientSrc.includes("tries.indexOf('HEAD/package.json')"))
check('client 识别限流与缓存(防 raw 假404)', clientSrc.includes('mapLimit') && clientSrc.includes('sessionStorage') && clientSrc.includes('pm-id-'))
check('client 含 remote 自挂载', clientSrc.includes('$mount'))
check('远程方法名避开命名空间服务原型(removeRow)', clientSrc.includes('removeRow') && !clientSrc.includes("descriptor('remove',"))
check('descriptor 带 typeSymbol 与 sourceLocation', clientSrc.includes('typeSymbol') && clientSrc.includes('sourceLocation'))

// ============ 第一层补:裸名导入(与 dsh loader 完全相同的解析路径)============
console.log('--- 裸名导入回归 ---')
let bare = null
let bareErr = ''
try { bare = await import('dsh-plugin-manager') } catch (e) { bareErr = e && e.message ? e.message : String(e) }
check('裸名 import(dsh-plugin-manager) 成功(事故回归)', !!bare, bareErr)
if (bare) {
  check('裸名导出 apply 函数', typeof bare.apply === 'function')
  check('裸名导出 name 匹配', bare.name === 'dsh-plugin-manager')
}

// ============ 第二层:补丁引擎 ============
console.log('--- 引擎层 ---')
const sample = [
  '- id: user-row',
  "  name: '@scope/foo'",
  '  config:',
  '    port: !!js ctx.x ?? 8080',
].join('\n')
const parsed = parsePatch(sample)
check('解析用户行', parsed.length === 1)
check('isOwnRow 认 pm-manager(连字符回归)', isOwnRow({ id: 'pm-manager' }))
check('isOwnRow 认 pm. 前缀', isOwnRow({ id: 'pm.x' }))
check('isOwnRow 拒绝用户行', !isOwnRow({ id: 'user-row' }))
check('isOwnInsertRow 认我方 insert 块', isOwnInsertRow({ insert: [{ id: 'pm-manager', name: 'x' }] }))
check('isOwnInsertRow 拒绝外来块', !isOwnInsertRow({ insert: [{ id: 'other', name: 'x' }] }))
const state = { inserted: { 'pm-manager': { name: 'dsh-plugin-manager' } }, overrides: { bash: { name: 'x', disabled: false } } }
let d = parsePatch(sample + '\n- insert:\n  - id: pm-manager\n    name: dsh-plugin-manager\n')
for (let i = 0; i < 3; i++) {
  const kept = d.filter((e) => !isOwnRow(e) && !isOwnInsertRow(e) && !isOwnOverrideRow(e, { overrides: state.overrides }))
  d = parsePatch(composePatch(kept, state))
}
check('3 轮同步后 insert 块不重复', d.filter((e) => e.insert).length === 1)
check('3 轮同步后覆盖行不残留', d.filter((e) => e.id === 'bash').length === 1)
check('用户行与 !!js 原样保留', (function () { const u = d.find((e) => e.id === 'user-row'); return !!u && u.config && u.config.port && u.config.port.__jsExpr === 'ctx.x ?? 8080' })())

// ============ 第二层:管理操作(include: 前缀 mock)============
console.log('--- 操作层 ---')
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-verify-ops-'))
process.env.DSH_HOME = tmp
const patchPath = path.join(tmp, 'cordis.patch.yml')
await fs.writeFile(patchPath, sample + '\n', 'utf8')
await fs.writeFile(path.join(tmp, 'plugin-presets.yml'), '日常:\n  description: 默认\n  plugins: [tools, bash]\n', 'utf8')
const tools = []
const disposers = []

const fakeCtx = {
  baseUrl: 'file:///C:/tmp/',
  tools: { register: (t) => tools.push(t) },
  effect: (fn) => { const d = fn(); if (d) disposers.push(d) },
  plugin: (p) => { try { if (typeof p === 'function') new p(fakeCtx) } catch (e) { console.log('  (gateway in mock: ' + e.message + ')') } return { dispose: async () => {} } },
  reflect: { provide: () => {} },
  on: () => {},
  get: () => { throw new Error('mock ctx.get not wired') },
  loader: { entries: () => [
    { id: 'include:tools', options: { name: '@deepseek-ai/dsh-tools' }, disabled: false, fiber: undefined },
    { id: 'include:bash', options: { name: '@deepseek-ai/dsh-bash-local' }, disabled: false, fiber: undefined },
    { id: 'include:pm-manager', options: { name: 'dsh-plugin-manager' }, disabled: false, fiber: undefined },
    { id: 'include:user-row', options: { name: '@scope/foo' }, disabled: false, fiber: undefined },
  ] },
}
apply(fakeCtx, { patchFile: patchPath, waitMs: 10 })
await new Promise((r) => setTimeout(r, 150)) // 等启动时的替换同步完成
const byName = Object.fromEntries(tools.map((t) => [t.name, t]))
check('注册 12 个工具', tools.length === 12, '实际 ' + tools.length)

const listOut = await byName.plugin_list.execute({})
check('plugin_list 剥离 include: 前缀', listOut.includes('- tools ') || listOut.includes('tools  |'), String(listOut).split('\n')[1] || '')
check('plugin_list 显示管理器标签', listOut.includes('管理'), '')
check('出厂标签库生效(dsh-tools → 内核)', listOut.includes('内核'), '')
const tagsYml = yaml.load(readFileSync(new URL('./default-tags.yml', import.meta.url), 'utf8'))
const descYml = yaml.load(readFileSync(new URL('./default-descriptions.yml', import.meta.url), 'utf8'))
const missingDesc = Object.keys(tagsYml).filter((n) => !descYml[n])
check('每个插件都有介绍(覆盖率)', missingDesc.length === 0, missingDesc.join(', '))
const gwListTags = await byName.plugin_list.execute({ tag: '内核' })
check('按出厂标签筛选(内核)', gwListTags.includes('@deepseek-ai/dsh-tools'), '')

const rEn = await byName.plugin_enable.execute({ name: 'bash' })
check('按 patch id 启用成功', rEn.includes('已启用'), rEn)
let patchText = await fs.readFile(patchPath, 'utf8')
check('patch 写入裸 id 覆盖行', patchText.includes('- id: bash'), '')
check('启动即替换内置插件清单行', patchText.includes('ui-settings-plugin-inventory') && patchText.includes('disabled: true'), '')
check('自愈:patch 不含 ui-settings-plugins 禁用', !patchText.includes('ui-settings-plugins'), '')

const rSw = await byName.plugin_preset_switch.execute({ preset: '日常' })
check('预设切换成功', rSw.includes('已切换到'), rSw)
const rRb = await byName.plugin_rollback.execute({})
check('回滚成功', rRb.includes('已回滚'), rRb)

const rSelf = await byName.plugin_disable.execute({ name: 'dsh-plugin-manager' })
check('拒绝停用自身', rSelf.includes('拒绝'), rSelf)
const rRm = await byName.plugin_remove.execute({ name: 'pm-manager' })
check('拒绝移除自身', rRm.includes('拒绝'), rRm)

// ============ 第二层补:Typert 远程服务 ============
console.log('--- 远程层 ---')
const gwCtx = { baseUrl: 'file:///C:/tmp/', reflect: { provide: () => {} }, effect: () => {}, on: () => {}, loader: fakeCtx.loader }
const managerForGw = await (async () => { const { createManager } = await import('./manager.js'); return createManager(gwCtx, { patchFile: patchPath, waitMs: 10 }) })()
const Gateway = createGateway(managerForGw, ['ui-settings-plugin-inventory', 'ui-settings-plugins'])
const gw = new Gateway(gwCtx)
check('网关服务名 pluginManager', gw.name === 'pluginManager')
const gwList = await gw.list()
check('远程 list 返回 entries 数组', Array.isArray(gwList.entries) && gwList.entries.length >= 4, 'entries=' + (gwList.entries && gwList.entries.length))
const toolsDesc = (gwList.entries.find((e) => e.name === '@deepseek-ai/dsh-tools') || {}).description
check('远程 list 行含介绍', toolsDesc === '工具注册表', toolsDesc || '')
const gwPresets = await gw.presets()
check('远程 presets 含 日常', gwPresets.presets.some((p) => p.name === '日常'))
const gwSw = await gw.switchPreset('日常')
check('远程 switchPreset ok', gwSw.ok === true)
const gwRb = await gw.rollback()
check('远程 rollback ok', gwRb.ok === true)
// 切换失败自动退回(引用不存在的插件 → 应判定失败并回退)
const gwSw2 = await gw.switchPreset('日常')
check('远程 switchPreset(二次) ok', gwSw2.ok === true, gwSw2.text)
const gwBad = await gw.addPreset('坏包', '含不存在插件', ['ghost'])
check('addPreset 坏包成功', gwBad.ok === true)
const gwBadSw = await gw.switchPreset('坏包')
check('切换坏包自动退回(ok:false+文案)', gwBadSw.ok === false && String(gwBadSw.text).includes('自动退回'), gwBadSw.text)
const afterBad = await fs.readFile(patchPath, 'utf8')
check('回退后 patch 保留日常切换的启用行', /id: tools\n\s+disabled: false/.test(afterBad.replace(/\r/g, '')), afterBad.split('\n').slice(0, 12).join('|'))
const gwRmBad = await gw.removePreset('坏包')
check('清理坏包成功', gwRmBad.ok === true)
// 混入非插件的整合包:切换失败时返回分类信息 + 可复制安装提示词(mock fetch 模拟识别)
const realFetch = globalThis.fetch
const mockRes = (body) => ({ ok: true, json: async () => body, text: async () => JSON.stringify(body) })
globalThis.fetch = async (url) => {
  const u = String(url)
  if (u.includes('raw.githubusercontent.com/installed-plugin/foo')) return mockRes({ name: 'foo', dsh: { bundle: { patch: 'x' } } })
  if (u.includes('raw.githubusercontent.com/skill-repo/bar')) return mockRes({ name: 'bar', dsh: {} })
  if (u.includes('raw.githubusercontent.com/nopkg-repo/baz')) return { ok: false, status: 404, json: async () => ({}) }
  if (u.includes('raw.githubusercontent.com/notdsh/qux')) return mockRes({ name: 'qux' })
  return { ok: false, status: 404, json: async () => ({}) }
}
const gwMix = await gw.addPreset('混合包', '混入非插件', ['tools', 'installed-plugin/foo', 'skill-repo/bar', 'nopkg-repo/baz', 'notdsh/qux', 'plain-id'])
check('addPreset 混合包成功', gwMix.ok === true)
const gwMixSw = await gw.switchPreset('混合包')
check('混合包切换失败(有不可用引用)', gwMixSw.ok === false)
check('切换返回 skippedInfo 分类(5 项)', Array.isArray(gwMixSw.skippedInfo) && gwMixSw.skippedInfo.length === 5, JSON.stringify(gwMixSw.skippedInfo))
const kinds = {}
gwMixSw.skippedInfo.forEach((x) => { kinds[x.kind] = (kinds[x.kind] || 0) + 1 })
check('分类正确(插件未装1/无包1/非插件2/未知1)', kinds['plugin-missing'] === 1 && kinds['no-pkg'] === 1 && kinds['not-plugin'] === 2 && kinds['unknown'] === 1, JSON.stringify(kinds))
check('提示词含安装命令与 profile', String(gwMixSw.promptText || '').includes('dsh plugin --profile') && String(gwMixSw.promptText).includes('installed-plugin/foo'), gwMixSw.promptText)
check('提示词区分非插件与无包', String(gwMixSw.promptText || '').includes('非 dsh 插件') && String(gwMixSw.promptText).includes('无 package.json'))
globalThis.fetch = realFetch
const gwRmMix = await gw.removePreset('混合包')
check('清理混合包成功', gwRmMix.ok === true)
const gwTag = await gw.tag('tools', 'AI')
check('远程 tag ok', gwTag.ok === true)
const gwAddP = await gw.addPreset('验收包', 'desc', ['tools'])
check('远程 addPreset ok', gwAddP.ok === true)
const gwRmP = await gw.removePreset('验收包')
check('远程 removePreset ok', gwRmP.ok === true)
const gwSelf = await gw.removeRow('pm-manager')
check('远程 removeRow 拒绝自身', gwSelf.ok === false)
const gwStopNo = await gw.stopSelf('no')
check('远程 stopSelf 需确认', gwStopNo.ok === false)
check('远程含 marketInstall 方法', typeof gw.marketInstall === 'function')
check('远程含 batchInstall 方法(批量安装+生成整合包)', typeof gw.batchInstall === 'function')
const gwBatchEmpty = await gw.batchInstall([], [], '', '')
check('远程 batchInstall 空列表安全拒绝', gwBatchEmpty.ok === false && String(gwBatchEmpty.text).includes('未选择'), gwBatchEmpty.text)
check('远程含 profile 方法', typeof gw.profile === 'function')
check('远程含 deepseekBalance/exportPreset/importPreset', typeof gw.deepseekBalance === 'function' && typeof gw.exportPreset === 'function' && typeof gw.importPreset === 'function')
const prof = await gw.profile()
check('远程 profile 返回当前 profile', typeof prof.profile === 'string' && prof.profile.length > 0, JSON.stringify(prof))
const exp = await gw.exportPreset('日常')
check('exportPreset 返回含名字的 YAML', exp.ok === true && exp.text.includes('name:'), String(exp.text).slice(0, 60))
const imp = await gw.importPreset(exp.text.replace('日常', '日常副本'))
check('importPreset 导入成功且继承名字', imp.ok === true && imp.text.includes('日常副本'), imp.text)
const presetsAfter = await gw.presets()
check('导入后目录含副本', presetsAfter.presets.some((p) => p.name === '日常副本'))
const rmCopy = await gw.removePreset('日常副本')
check('清理副本成功', rmCopy.ok === true)
const gwStop = await gw.stopSelf('STOP')
check('远程 stopSelf 执行成功', gwStop.ok === true)
const afterStop = await fs.readFile(patchPath, 'utf8')
check('自停后自身行 disabled:true', afterStop.includes('id: pm-manager') && /id: pm-manager\n\s+disabled: true/.test(afterStop.replace(/\r/g, '')))
check('自停后内置清单覆盖已恢复(移除)', !afterStop.includes('ui-settings-plugin-inventory'))

// 启动失败自动回退:切换成功后写入 lastSwitch;自检连续 2 次未确认 → 恢复切换前状态
const statePathTmp = path.join(tmp, 'plugin-manager', 'state.json')
const stAfterSwitch = JSON.parse(await fs.readFile(statePathTmp, 'utf8'))
check('切换成功写入 lastSwitch 待确认标记', stAfterSwitch.lastSwitch && stAfterSwitch.lastSwitch.preset === '日常', JSON.stringify(stAfterSwitch.lastSwitch || null))
const prevOv = { bash: { name: 'x', disabled: false } }
await fs.writeFile(statePathTmp, JSON.stringify({ inserted: { 'pm-manager': { name: 'dsh-plugin-manager' } }, overrides: { ghost: { name: 'g', disabled: false } }, lastSwitch: { preset: '坏包', prev: { overrides: prevOv }, ts: Date.now() - 5000, attempts: 1 } }, null, 2), 'utf8')
const sc = await managerForGw.internals.startupSelfCheck()
check('自检判定上次启动失败并回退(rolled-back)', sc.status === 'rolled-back' && sc.preset === '坏包', JSON.stringify(sc))
const stAfterRecover = JSON.parse(await fs.readFile(statePathTmp, 'utf8'))
check('回退后 lastSwitch 已清除', !stAfterRecover.lastSwitch)
check('回退后 overrides 恢复为 prev', JSON.stringify(stAfterRecover.overrides) === JSON.stringify(prevOv), JSON.stringify(stAfterRecover.overrides))
const patchAfterRecover = await fs.readFile(patchPath, 'utf8')
check('回退后 patch 同步 prev 状态', /id: bash\n\s+disabled: false/.test(patchAfterRecover.replace(/\r/g, '')))

// 批量导入压测回归(10 包:导入 + 导出/导入往返一致性)
const benchStart = Date.now()
let benchAllOk = true
for (let i = 0; i < 10; i++) {
  const doc = { name: '回归包-' + i, description: 'desc ' + i, plugins: ['tools', 'bash', 'ghost-' + i] }
  const ri = await gw.importPreset(yaml.dump(doc))
  if (!ri.ok) benchAllOk = false
}
check('批量导入 10 包成功', benchAllOk, '')
let roundTripOk = true
for (let i = 0; i < 10; i++) {
  const e1 = await gw.exportPreset('回归包-' + i)
  const ri2 = await gw.importPreset(e1.text)
  const e2 = await gw.exportPreset('回归包-' + i)
  if (!(e1.ok && ri2.ok && e2.ok && e2.text === e1.text)) roundTripOk = false
}
check('导出导入往返一致性(10 包)', roundTripOk, '')
check('批量导入+一致性耗时 < 5s', Date.now() - benchStart < 5000, (Date.now() - benchStart) + 'ms')
for (let i = 0; i < 10; i++) await gw.removePreset('回归包-' + i)

patchText = await fs.readFile(patchPath, 'utf8')
check('用户行仍在', patchText.includes('@scope/foo'), '')
check('管理器 insert 行仍在', patchText.includes('id: pm-manager'), '')

disposers.forEach((fn) => { try { fn() } catch {} })
await fs.rm(tmp, { recursive: true, force: true })

// ============ 汇总 ============
console.log('---')
console.log('RESULT: ' + pass + ' passed, ' + failures.length + ' failed')
if (failures.length) { console.log('FAILURES:\n  ' + failures.join('\n  ')); process.exit(1) }
console.log('ALL PASS')
