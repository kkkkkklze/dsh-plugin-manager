// manager.js — dsh-plugin-manager 核心操作(agent 工具与 Web UI 共用同一份逻辑)
import yaml from 'js-yaml'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { exec } from 'node:child_process'
import { parsePatch, composePatch, isOwnRow, isOwnInsertRow, isOwnOverrideRow, slugify, FIBER_PHASE } from './engine.js'

export const PLUGIN_NAME = 'dsh-plugin-manager'

export const AUTO_TAG_RULES = [
  [/^@deepseek-ai\/dsh-tool/, '工具'],
  [/^@deepseek-ai\/dsh-llm/, 'LLM'],
  [/^@deepseek-ai\/dsh-client-ui/, 'UI'],
  [/^@deepseek-ai\/dsh-client/, '客户端'],
  [/^@deepseek-ai\/dsh-host/, '服务端'],
  [/^@deepseek-ai\/cordis/, '框架'],
  [/^dsh-tool/, '工具'],
]

export function createManager(ctx, config) {
  const name = PLUGIN_NAME
  const log = (...args) => console.log('[' + name + ']', ...args)

  let patchPath = null
  if (config.patchFile && path.isAbsolute(config.patchFile)) {
    patchPath = config.patchFile
  } else if (ctx.baseUrl) {
    try { patchPath = fileURLToPath(new URL(config.patchFile, ctx.baseUrl)) } catch {}
  }
  if (!patchPath) throw new Error(name + ': 无法定位 cordis.patch.yml')

  const dshHome = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  const stateDir = path.join(dshHome, 'plugin-manager')
  const statePath = path.join(stateDir, 'state.json')
  const tagsPath = path.join(stateDir, 'tags.yml')
  const rollbackPath = path.join(stateDir, 'rollback.json')
  const presetsPath = path.join(dshHome, 'plugin-presets.yml')
  const backupDir = path.join(stateDir, 'backups')

  async function readState() {
    let s
    try { s = JSON.parse(await fs.readFile(statePath, 'utf8')) } catch { s = { inserted: {}, overrides: {} } }
    s.inserted = s.inserted || {}
    s.overrides = s.overrides || {}
    // 管理器自己的行必须始终存在,否则 sync 会把它从 patch 里清掉(自卸载)
    s.inserted['pm-manager'] = { name: PLUGIN_NAME }
    return s
  }
  async function writeState(state) {
    await fs.mkdir(stateDir, { recursive: true })
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8')
  }
  async function readPresets() {
    try {
      const data = yaml.load(await fs.readFile(presetsPath, 'utf8'))
      return data && typeof data === 'object' ? data : {}
    } catch { return {} }
  }
  // 出厂标签库(随包分发,覆盖当前插件全集;合并优先级:用户 > bundle 声明 > 出厂库 > 自动规则)
  const defaultTagsFile = fileURLToPath(new URL('./default-tags.yml', import.meta.url))
  let defaultTagsCache = null
  async function readDefaultTags() {
    if (defaultTagsCache) return defaultTagsCache
    try {
      const data = yaml.load(await fs.readFile(defaultTagsFile, 'utf8'))
      defaultTagsCache = data && typeof data === 'object' ? data : {}
    } catch (e) { defaultTagsCache = {} }
    return defaultTagsCache
  }

  // 出厂介绍库(简短中文介绍)
  const defaultDescriptionsFile = fileURLToPath(new URL('./default-descriptions.yml', import.meta.url))
  let defaultDescriptionsCache = null
  async function readDefaultDescriptions() {
    if (defaultDescriptionsCache) return defaultDescriptionsCache
    try {
      const data = yaml.load(await fs.readFile(defaultDescriptionsFile, 'utf8'))
      defaultDescriptionsCache = data && typeof data === 'object' ? data : {}
    } catch (e) { defaultDescriptionsCache = {} }
    return defaultDescriptionsCache
  }

  async function readUserTags() {
    try {
      const data = yaml.load(await fs.readFile(tagsPath, 'utf8'))
      return data && typeof data === 'object' ? data : {}
    } catch { return {} }
  }
  async function writeUserTags(tags) {
    await fs.mkdir(stateDir, { recursive: true })
    await fs.writeFile(tagsPath, yaml.dump(tags, { noRefs: true }), 'utf8')
  }

  async function commit(previousState, nextState) {
    await fs.mkdir(stateDir, { recursive: true })
    await fs.writeFile(rollbackPath, JSON.stringify(previousState, null, 2), 'utf8')
    await writeState(nextState)
    await sync(nextState, previousState)
  }

  // legacy = 上一个状态;过滤时把新旧两态的覆盖行都视为我方行,避免 remove/rollback 残留
  async function sync(state, legacy) {
    let raw = ''
    try { raw = await fs.readFile(patchPath, 'utf8') } catch { raw = '' }
    const existing = parsePatch(raw)
    const legacyOv = (legacy && legacy.overrides) || {}
    const filter = { overrides: Object.assign({}, legacyOv, state.overrides) }
    const kept = existing.filter((e) => !isOwnRow(e) && !isOwnInsertRow(e) && !isOwnOverrideRow(e, filter))
    const text = composePatch(kept, state)
    await fs.mkdir(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    await fs.writeFile(path.join(backupDir, stamp + '.yml'), raw || '# (empty)\n', 'utf8')
    const tmp = patchPath + '.tmp-' + process.pid
    await fs.writeFile(tmp, text, 'utf8')
    await fs.rename(tmp, patchPath)
    return text
  }

  // loader 条目 id 带子树前缀(如 include:tools),patch 层用裸 id;从自身行推导前缀并剥离
  function rawEntries() {
    const rows = []
    for (const entry of ctx.loader.entries()) {
      if (entry.options && entry.options.group) continue
      rows.push({
        rawId: entry.id,
        name: (entry.options && entry.options.name) || '',
        disabled: !!entry.disabled,
        phase: entry.fiber === undefined ? null : (FIBER_PHASE[entry.fiber.state] ?? 'unknown'),
      })
    }
    return rows
  }
  const ownRaw = rawEntries().find((r) => r.name === PLUGIN_NAME)
  const idPrefix = ownRaw && ownRaw.rawId.endsWith('pm-manager') ? ownRaw.rawId.slice(0, -('pm-manager'.length)) : ''
  if (idPrefix) log('loader id prefix detected:', JSON.stringify(idPrefix))
  function patchId(rawId) {
    return idPrefix && rawId.startsWith(idPrefix) ? rawId.slice(idPrefix.length) : rawId
  }
  function entriesInfo() {
    return rawEntries().map((r) => ({ id: patchId(r.rawId), name: r.name, disabled: r.disabled, phase: r.phase }))
  }
  function findRow(term) {
    const rows = entriesInfo()
    return rows.find((r) => r.id === term) || rows.find((r) => r.name === term) || null
  }
  function looksLikePackage(term) {
    return term.startsWith('@') || term.includes('/') || term.includes('-')
  }
  function isSelf(row) {
    return row.id === 'pm-manager' || row.name === name
  }

  async function bundleTagsFor(moduleName) {
    if (!moduleName) return []
    try {
      let url = null
      try { url = import.meta.resolve(moduleName) } catch { return [] }
      let fp = url.startsWith('file:') ? fileURLToPath(url) : null
      if (!fp) return []
      let dir = path.extname(fp) ? path.dirname(fp) : fp
      for (let i = 0; i < 12; i++) {
        const pj = path.join(dir, 'package.json')
        try {
          const pkg = JSON.parse(await fs.readFile(pj, 'utf8'))
          const tags = pkg && pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.tags
          return Array.isArray(tags) ? tags : []
        } catch {}
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
      }
    } catch { return [] }
    return []
  }
  async function tagsFor(row, userTags) {
    const auto = AUTO_TAG_RULES.filter(([re]) => re.test(row.name)).map(([, t]) => t)
    const defaults = await readDefaultTags()
    const preset = defaults[row.name] || []
    const bundle = await bundleTagsFor(row.name)
    const user = userTags[row.name] || []
    return [...new Set([...auto, ...preset, ...bundle, ...user])]
  }

  // ---- 操作(返回结构化结果;工具层转文本,UI 层转 JSON)----
  async function opList({ tag } = {}) {
    const userTags = await readUserTags()
    const descriptions = await readDefaultDescriptions()
    const rows = []
    for (const r of entriesInfo()) {
      const tags = await tagsFor(r, userTags)
      if (tag && !tags.includes(tag)) continue
      rows.push({ id: r.id, name: r.name, enabled: !r.disabled, phase: r.phase, tags, description: descriptions[r.name] || '' })
    }
    return { rows }
  }

  async function opToggle({ name: term, tag }, disabled) {
    const state = await readState()
    const prev = structuredClone(state)
    if (!term && !tag) return { ok: false, text: '需要 name 或 tag 参数。' }
    if (tag) {
      const userTags = await readUserTags()
      const targets = []
      for (const r of entriesInfo()) {
        if (isSelf(r)) continue
        const tags = await tagsFor(r, userTags)
        if (tags.includes(tag)) targets.push(r)
      }
      if (!targets.length) return { ok: false, text: '没有标签为「' + tag + '」的插件。' }
      for (const r of targets) state.overrides[r.id] = { name: r.name, disabled }
      await commit(prev, state)
      return { ok: true, text: (disabled ? '已停用 ' : '已启用 ') + targets.length + ' 个「' + tag + '」插件: ' + targets.map((r) => r.id).join(', ') }
    }
    let row = findRow(term)
    if (!row && looksLikePackage(term)) {
      const id = 'pm.' + slugify(term)
      if (!state.inserted[id]) state.inserted[id] = { name: term }
      state.overrides[id] = { name: term, disabled }
      await commit(prev, state)
      return { ok: true, text: '已新增并' + (disabled ? '停用' : '启用') + ' ' + id + '(' + term + ')。' }
    }
    if (!row) return { ok: false, text: '未找到插件:' + term + '。' }
    if (isSelf(row)) return { ok: false, text: '拒绝:不能启停管理器自身。' }
    state.overrides[row.id] = { name: row.name, disabled }
    await commit(prev, state)
    const warn = row.id.startsWith('pm.') ? '' : '(内置/上层行,影响面较大)'
    return { ok: true, text: (disabled ? '已停用 ' : '已启用 ') + row.id + '(' + row.name + ')。' + warn }
  }

  async function opAdd(pkg) {
    const id = 'pm.' + slugify(pkg)
    const state = await readState()
    const prev = structuredClone(state)
    if (state.inserted[id]) return { ok: false, text: '已存在:' + id }
    state.inserted[id] = { name: pkg }
    state.overrides[id] = { name: pkg, disabled: false }
    await commit(prev, state)
    return { ok: true, text: '已添加 ' + id + '(' + pkg + ')并启用。' }
  }

  async function opRemove(term) {
    const state = await readState()
    let targetId = null
    if (state.inserted[term]) targetId = term
    else {
      const byName = Object.entries(state.inserted).find(([, v]) => v.name === term)
      if (byName) targetId = byName[0]
      else {
        const row = findRow(term)
        if (!row) return { ok: false, text: '未找到插件:' + term }
        if (!row.id.startsWith('pm.')) return { ok: false, text: '只能移除 pm- 前缀的行;上层/内置行请停用。' }
        targetId = row.id
      }
    }
    if (targetId === 'pm-manager') return { ok: false, text: '拒绝:不能移除管理器自身。' }
    const prev = structuredClone(state)
    delete state.inserted[targetId]
    delete state.overrides[targetId]
    await commit(prev, state)
    return { ok: true, text: '已移除 ' + targetId + '。' }
  }

  async function opTag(term, tagsText) {
    const row = findRow(term)
    if (!row) return { ok: false, text: '未找到插件:' + term }
    const userTags = await readUserTags()
    const current = new Set(userTags[row.name] || [])
    for (const raw of String(tagsText).split(',')) {
      const t = raw.trim()
      if (!t) continue
      if (t.startsWith('-')) current.delete(t.slice(1).trim())
      else current.add(t)
    }
    userTags[row.name] = [...current]
    await writeUserTags(userTags)
    return { ok: true, text: '已更新 ' + row.name + ' 标签: ' + ([...current].join(' ') || '(空)') }
  }

  async function opPresetList() {
    const presets = await readPresets()
    const list = Object.entries(presets).map(([name_, p]) => ({
      name: name_,
      description: p.description || '',
      refs: Array.isArray(p.plugins) ? p.plugins : [],
    }))
    return { presets: list, presetsPath }
  }

  // 识别不可用引用:仓库形态(owner/repo)抓 package.json 分类;纯 id/标签引用标 unknown(网络失败也降级 unknown)
  async function inspectRef(ref, profile) {
    const norm = String(ref).trim()
    if (!/^[\w.-]+\/[\w.-]+$/.test(norm)) return { ref, kind: 'unknown', reason: '非仓库引用(插件 id 或标签),需人工确认' }
    let pkg = null
    let netFail = false
    for (const c of [norm + '/HEAD/package.json', norm + '/main/package.json', norm + '/master/package.json']) {
      try {
        const res = await fetch('https://raw.githubusercontent.com/' + c, { signal: AbortSignal.timeout(10000) })
        if (res.ok) { pkg = await res.json(); break }
      } catch (e) { netFail = true }
    }
    if (!pkg) return { ref, kind: netFail ? 'unknown' : 'no-pkg', reason: netFail ? '网络不可达,未能识别' : '仓库无 package.json(可能是 Skill/应用/资源仓库)' }
    const dsh = pkg.dsh && typeof pkg.dsh === 'object' ? pkg.dsh : null
    if (dsh && (dsh.bundle || dsh.client)) return { ref, kind: 'plugin-missing', reason: '是 dsh 插件但未安装', install: 'dsh plugin --profile ' + profile + ' add github:' + norm }
    return { ref, kind: 'not-plugin', reason: '有 package.json 但非 dsh 插件(' + (dsh ? Object.keys(dsh).join('/') : '无 dsh 清单') + ')' }
  }
  // 组装不可用引用提示词(供复制给 agent)
  function buildPrompt(info, presetName) {
    const lines = ['整合包「' + presetName + '」中有 ' + info.length + ' 项引用当前不可用,请按需处理:']
    for (const it of info) {
      if (it.kind === 'plugin-missing') lines.push('- ' + it.ref + ' — ' + it.reason + ',可执行: ' + it.install)
      else if (it.kind === 'no-pkg') lines.push('- ' + it.ref + ' — ' + it.reason + ',请识别其类型(Skill/应用/MCP 等)并给出安装建议')
      else if (it.kind === 'not-plugin') lines.push('- ' + it.ref + ' — ' + it.reason + ',请判断是否仍需要并给出替代方案')
      else lines.push('- ' + it.ref + ' — ' + it.reason)
    }
    return lines.join('\n')
  }

  // 切换核心:把 refs(已去重并集)解析为启停集合并执行切换 + 验证 + 双保险回退;label 用于文案(单包名或「A + B」)
  async function switchToRefs(refs, label) {
    const userTags = await readUserTags()
    const rows = entriesInfo()
    const targetIds = new Set()
    const skipped = []
    for (const item of refs) {
      const s = String(item)
      const tagRef = s.startsWith('tag:') ? s.slice(4) : (s.startsWith('#') ? s.slice(1) : null)
      if (tagRef) {
        for (const r of rows) {
          if (isSelf(r)) continue
          const tags = await tagsFor(r, userTags)
          if (tags.includes(tagRef)) targetIds.add(r.id)
        }
        continue
      }
      const r = rows.find((x) => x.id === s) || rows.find((x) => x.name === s)
      if (r) { if (!isSelf(r)) targetIds.add(r.id) } else skipped.push(s)
    }
      const state = await readState()
    const prev = structuredClone(state)
    const enabledList = []
    const disabledList = []
    for (const r of rows) {
      if (isSelf(r)) continue
      if (targetIds.has(r.id)) {
        state.overrides[r.id] = { name: r.name, disabled: false }
        enabledList.push(r.id)
      } else {
        state.overrides[r.id] = { name: r.name, disabled: true }
        disabledList.push(r.id)
      }
    }
    await commit(prev, state)
    // 切换后验证:等 loader 重载,目标插件缺失或 failed 即判定失败 → 自动退回切换前状态
    await new Promise((res) => setTimeout(res, config.waitMs || 3000))
    const after = entriesInfo()
    const failed = []
    const missing = []
    for (const id of targetIds) {
      const row = after.find((x) => x.id === id)
      if (!row) missing.push(id)
      else if (row.phase === 'failed') failed.push(id)
    }
    if (failed.length || missing.length || skipped.length) {
      await writeState(prev)
      await sync(prev, state)
      const why = []
      if (missing.length) why.push('未加载(可能未安装或需重启): ' + missing.join(', '))
      if (failed.length) why.push('加载失败: ' + failed.join(', '))
      if (skipped.length) why.push('不可用: ' + skipped.join(', '))
      // 识别不可用引用并生成提示词(仅识别仓库形态;网络失败降级 unknown)
      const profile = opProfile()
      const skippedInfo = await Promise.all(skipped.map((s) => inspectRef(s, profile).catch(() => ({ ref: s, kind: 'unknown', reason: '识别失败' }))))
      const promptText = skipped.length ? buildPrompt(skippedInfo, label) : ''
      return { ok: false, text: '切换失败:' + why.join('; ') + '。已自动退回切换前状态。', skippedInfo, promptText }
    }
    // 记录待确认切换:本次启动若崩溃(如插件冲突导致 boot 失败),下次启动将自动回退到切换前状态
    state.lastSwitch = { preset: label, prev, ts: Date.now() }
    await writeState(state)
    let text = '已切换到「' + label + '」。\n启用: ' + (enabledList.join(', ') || '(无)') + '\n停用: ' + (disabledList.join(', ') || '(无)')
    if (skipped.length) text += '\n未找到(已跳过): ' + skipped.join(', ')
    return { ok: true, text }
  }

  async function opPresetSwitch(presetName) {
    const presets = await readPresets()
    const preset = presets[presetName]
    if (!preset) return { ok: false, text: '预设不存在:' + presetName + '。' }
    const refs = Array.isArray(preset.plugins) ? preset.plugins : []
    return switchToRefs(refs, presetName)
  }

  // 多选整合包同时启用:并集去重(重复插件只启用一次),包外插件停用;任一引用不可用则整体回退
  async function opPresetSwitchMulti(names) {
    const list = Array.isArray(names) ? names.map(String).filter(Boolean) : []
    if (!list.length) return { ok: false, text: '未选择整合包。' }
    const presets = await readPresets()
    const missing = list.filter((n) => !(n in presets))
    if (missing.length) return { ok: false, text: '整合包不存在:' + missing.join(', ') }
    const refs = []
    for (const n of list) {
      for (const item of (Array.isArray(presets[n].plugins) ? presets[n].plugins : [])) {
        const s = String(item)
        if (!refs.includes(s)) refs.push(s)
      }
    }
    return switchToRefs(refs, list.join(' + '))
  }

  // 预设名校验:非空字符串、长度受限、拒绝保留键(防原型链/序列化异常)
  function validPresetName(name) {
    const s = String(name || '').trim()
    if (!s || s.length > 100) return null
    if (['__proto__', 'constructor', 'prototype'].includes(s)) return null
    return s
  }

  async function opAddPreset(name, description, plugins) {
    const safeName = validPresetName(name)
    if (!safeName) return { ok: false, text: '非法预设名:' + name }
    const presets = await readPresets()
    presets[safeName] = { description: String(description || '').slice(0, 2000), plugins: Array.isArray(plugins) ? plugins.map(String).slice(0, 500) : [] }
    await fs.mkdir(path.dirname(presetsPath), { recursive: true })
    await fs.writeFile(presetsPath, yaml.dump(presets, { noRefs: true }), 'utf8')
    return { ok: true, text: '已添加插件包「' + safeName + '」。' }
  }

  async function opRemovePreset(name) {
    const presets = await readPresets()
    if (!(name in presets)) return { ok: false, text: '插件包不存在:' + name }
    delete presets[name]
    await fs.writeFile(presetsPath, yaml.dump(presets, { noRefs: true }), 'utf8')
    return { ok: true, text: '已删除插件包「' + name + '」。' }
  }

  // 一键停止:先恢复内置插件清单(删替换覆盖行),再停用自身 —— UI 退化为 dsh 原版
  // DeepSeek 余额(读 .credentials.yaml 的 DEEPSEEK_API_KEY,调官方 user/balance 接口)
  async function opDeepseekBalance() {
    let key = null
    try {
      const raw = await fs.readFile(path.join(dshHome, '.credentials.yaml'), 'utf8')
      const m = raw.match(/^DEEPSEEK_API_KEY\s*:\s*(\S+)/m)
      if (m) key = m[1].trim()
    } catch (e) {}
    if (!key) return { ok: false, text: '未找到 DEEPSEEK_API_KEY(.credentials.yaml)' }
    try {
      const res = await fetch('https://api.deepseek.com/user/balance', { headers: { Authorization: 'Bearer ' + key } })
      const data = await res.json()
      if (!res.ok) return { ok: false, text: '余额查询失败: ' + ((data && data.error && data.error.message) || res.status) }
      const info = data && data.balance_infos && data.balance_infos[0]
      const short = info ? (info.total_balance + ' ' + (info.currency || '')) : '查到了,但格式未知'
      const detail = info ? ('DeepSeek 余额: ' + info.currency + ' 总额 ' + info.total_balance + '(赠送 ' + info.granted_balance + ' + 充值 ' + info.topped_up_balance + ')') : JSON.stringify(data)
      return { ok: true, text: short, detail }
    } catch (e) {
      return { ok: false, text: '余额查询失败: ' + e.message }
    }
  }

  // 整合包导出(含名字与介绍,分享给别人)
  async function opExportPreset(name) {
    const presets = await readPresets()
    const p = presets[name]
    if (!p) return { ok: false, text: '插件包不存在:' + name }
    const doc = { name: name, description: p.description || '', plugins: Array.isArray(p.plugins) ? p.plugins : [] }
    return { ok: true, text: yaml.dump(doc, { noRefs: true }) }
  }

  // 整合包导入(名字、介绍随包继承;同名覆盖;输入大小限制防滥用)
  async function opImportPreset(text) {
    const raw = String(text || '')
    if (raw.length > 262144) return { ok: false, text: '导入失败:内容超过 256KB 限制' }
    let doc = null
    try { doc = yaml.load(raw) } catch (e) { try { doc = JSON.parse(raw) } catch (e2) {} }
    if (!doc || typeof doc !== 'object' || !doc.name) return { ok: false, text: '导入失败:内容必须是含 name 的 YAML/JSON 整合包' }
    const safeName = validPresetName(doc.name)
    if (!safeName) return { ok: false, text: '导入失败:非法预设名:' + doc.name }
    const plugins = Array.isArray(doc.plugins) ? doc.plugins.map(String).slice(0, 500) : []
    const presets = await readPresets()
    const existed = presets[safeName] !== undefined
    presets[safeName] = { description: String(doc.description || '').slice(0, 2000), plugins: plugins }
    await fs.mkdir(path.dirname(presetsPath), { recursive: true })
    await fs.writeFile(presetsPath, yaml.dump(presets, { noRefs: true }), 'utf8')
    return { ok: true, text: (existed ? '已覆盖插件包「' : '已导入插件包「') + safeName + '」(' + plugins.length + ' 项,名字与介绍已继承)' }
  }

  function opProfile() {
    return path.basename(path.dirname(patchPath))
  }

  // 仓库名白名单校验:仅允许 GitHub owner/repo 合法字符(字母数字 _ . - 和单个 /),防命令注入(exec 拼接)
  const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
  function validRepo(repo) {
    const s = String(repo || '').trim()
    return REPO_RE.test(s) && s.length <= 200 && !s.includes('..')
  }

  // 识别仓库是否为 dsh 插件:抓 package.json 查 dsh 清单
  async function opMarketInspect(repo) {
    if (!validRepo(repo)) return { ok: false, text: '非法仓库名:' + repo + '(应为 owner/repo 格式,仅含字母数字 . _ -)' }
    const candidates = [repo + '/HEAD/package.json', repo + '/main/package.json', repo + '/master/package.json']
    let pkg = null
    for (const c of candidates) {
      try {
        const res = await fetch('https://raw.githubusercontent.com/' + c)
        if (res.ok) { pkg = await res.json(); break }
      } catch (e) {}
    }
    if (!pkg) return { ok: true, text: '无法读取 ' + repo + ' 的 package.json(仓库不存在或网络受限),未能自动识别。' }
    const dshKeys = pkg.dsh ? Object.keys(pkg.dsh) : []
    const isPlugin = dshKeys.length > 0 && (pkg.dsh.bundle || pkg.dsh.client)
    const summary = '包名: ' + (pkg.name || '(无)') + '\n识别: ' + (isPlugin ? '是 dsh 插件(含 ' + dshKeys.join('/') + ')' : '非标准 dsh 插件(未发现 dsh.bundle/dsh.client)') + '\n建议: ' + (isPlugin ? '可安装到插件列表' : '交给会话让 agent 处理,或手动安装')
    return { ok: true, text: summary, isPlugin }
  }

  // 插件市场:从 GitHub 安装(内部走 dsh plugin add github:<repo>;repo 白名单校验防命令注入)
  async function opMarketInstall(repo) {
    if (!validRepo(repo)) return { ok: false, text: '非法仓库名:' + repo + '(应为 owner/repo 格式,仅含字母数字 . _ -)' }
    const profile = path.basename(path.dirname(patchPath))
    const arg = 'dsh plugin --profile ' + profile + ' add github:' + String(repo).trim()
    return new Promise((resolve) => {
      exec(arg, { timeout: 180000, maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
        const out = String(stdout || '') + String(stderr || '')
        const tail = out.trim().slice(-1200)
        if (error) resolve({ ok: false, text: '安装失败: ' + (error.message || '') + (tail ? '\n' + tail : '') })
        else resolve({ ok: true, text: '安装完成: github:' + repo + (tail ? '\n' + tail : '') })
      })
    })
  }

  // 批量安装:依次 dsh plugin add github:<repo>,结束后 diff 新条目并生成整合包(refs 优先用新条目 id,失败则退回包名)
  async function opBatchMarketInstall(repos, pkgNames, presetName, presetDescription) {
    const list = Array.isArray(repos) ? repos.map(String).filter(Boolean).filter((r) => validRepo(r)) : []
    const rejected = Array.isArray(repos) ? repos.map(String).filter((r) => r && !validRepo(r)) : []
    if (!list.length) return { ok: false, text: '未选择任何合法插件。' + (rejected.length ? ' 已拒绝非法仓库名: ' + rejected.join(', ') : '') }
    const profile = path.basename(path.dirname(patchPath))
    const before = entriesInfo()
    const results = []
    for (const repo of list) {
      const arg = 'dsh plugin --profile ' + profile + ' add github:' + repo
      const r = await new Promise((resolve) => {
        exec(arg, { timeout: 180000, maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
          const out = String(stdout || '') + String(stderr || '')
          const tail = out.trim().slice(-1200)
          if (error) resolve({ ok: false, text: (error.message || '') + (tail ? '\n' + tail : '') })
          else resolve({ ok: true, text: tail || '安装完成' })
        })
      })
      results.push({ repo, ok: r.ok, text: r.text })
    }
    // 等 loader 重读 patch 后再 diff
    await new Promise((res) => setTimeout(res, 800))
    const after = entriesInfo()
    const newRows = after.filter((a) => !before.some((b) => b.id === a.id && b.name === a.name))
    const refs = newRows.map((x) => x.id)
    const nameRefs = (Array.isArray(pkgNames) ? pkgNames : []).map(String).filter(Boolean)
    const presetRefs = refs.length ? refs : nameRefs
    let presetText = ''
    const pname = validPresetName(presetName)
    if (pname) {
      if (!presetRefs.length) {
        presetText = '未检测到新插件条目,整合包未更新(重启 dsh 后插件生效,再到「插件包」里补建/并入)。'
      } else {
        const presets = await readPresets()
        const existing = presets[pname]
        if (existing && Array.isArray(existing.plugins)) {
          // 加入现有整合包:追加去重,保留原描述
          const merged = [...new Set([...existing.plugins.map(String), ...presetRefs])]
          presets[pname] = { description: String(existing.description || ''), plugins: merged }
          presetText = '已并入现有整合包「' + pname + '」(' + merged.length + ' 项,新增 ' + presetRefs.length + ' 项)。'
        } else {
          // 新建整合包
          presets[pname] = { description: String(presetDescription || '').slice(0, 2000), plugins: presetRefs }
          presetText = '已新建整合包「' + pname + '」(' + presetRefs.length + ' 项)。'
        }
        await fs.mkdir(path.dirname(presetsPath), { recursive: true })
        await fs.writeFile(presetsPath, yaml.dump(presets, { noRefs: true }), 'utf8')
      }
    }
    const okCount = results.filter((x) => x.ok).length
    const failCount = results.length - okCount
    const lines = results.map((x) => (x.ok ? '✅ ' : '❌ ') + x.repo + (x.ok ? '' : ' | ' + x.text.split(/\r?\n/)[0]))
    let text = '批量安装完成:' + okCount + ' 成功,' + failCount + ' 失败。\n' + lines.join('\n')
    if (pname && presetText) text += '\n' + presetText
    return { ok: failCount === 0, text, results, presetRefs, presetName: pname || '' }
  }

  async function opSelfStop(replaceIds) {
    const state = await readState()
    const prev = structuredClone(state)
    for (const id of (Array.isArray(replaceIds) ? replaceIds : [replaceIds])) {
      if (id) delete state.overrides[id]
    }
    state.overrides['pm-manager'] = { name: PLUGIN_NAME, disabled: true }
    await commit(prev, state)
    return { ok: true, text: '管理器已停止,界面恢复为 dsh 原版插件列表。重新启用:删除 profile 的 cordis.patch.yml 中 - id: pm-manager / disabled: true 一行。' }
  }

  async function opRollback() {
    let snapshot = null
    try { snapshot = JSON.parse(await fs.readFile(rollbackPath, 'utf8')) } catch { return { ok: false, text: '没有可回滚的快照。' } }
    const current = await readState()
    await writeState(snapshot)
    await sync(snapshot, current)
    try { await fs.unlink(rollbackPath) } catch {}
    return { ok: true, text: '已回滚到上一步状态。' }
  }

  async function hasRollback() {
    try { await fs.access(rollbackPath); return true } catch { return false }
  }

  // 启动自检:整合包切换后若启动崩溃(如插件冲突),lastSwitch 残留且 attempts>=2 → 自动回退到切换前状态(默认整合包)
  async function startupSelfCheck() {
    try {
      const st = await readState()
      if (!st.lastSwitch) return { status: 'clean' }
      const ls = st.lastSwitch
      ls.attempts = (ls.attempts || 0) + 1
      if (ls.attempts >= 2) {
        const prevOv = (ls.prev && ls.prev.overrides) || {}
        log('检测到上次启动失败(整合包「' + ls.preset + '」连续 ' + ls.attempts + ' 次启动未确认),自动恢复切换前状态…')
        const next = { inserted: st.inserted || {}, overrides: prevOv }
        await writeState(next)
        await sync(next, st)
        log('已自动回退到切换前状态(默认整合包)。')
        return { status: 'rolled-back', preset: ls.preset }
      }
      await writeState(st)
      // 启动稳定确认:进程存活到 10s 说明本次启动成功,清除待确认标记
      setTimeout(async () => {
        try {
          const s = await readState()
          if (s.lastSwitch && s.lastSwitch.ts === ls.ts) { delete s.lastSwitch; await writeState(s); log('启动稳定,已确认整合包「' + ls.preset + '」') }
        } catch (e) {}
      }, 10000)
      return { status: 'pending', preset: ls.preset, attempts: ls.attempts }
    } catch (e) { log('启动自检失败(继续运行): ' + e.message); return { status: 'error' } }
  }

  return {
    opList, opToggle, opAdd, opRemove, opTag, opPresetList, opPresetSwitch, opPresetSwitchMulti, opRollback, opAddPreset, opRemovePreset, opSelfStop, opMarketInstall, opMarketInspect, opBatchMarketInstall, opProfile, opDeepseekBalance, opExportPreset, opImportPreset, hasRollback,
    patchPath, statePath, tagsPath, presetsPath, log,
    internals: { readState, writeState, sync, startupSelfCheck },
  }
}
