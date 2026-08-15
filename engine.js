// dsh-plugin-manager 补丁引擎:解析/重写 profile 的 cordis.patch.yml
// 约定:管理器拥有 id 以 'pm.' 开头的行;其他行(用户手写)一律原样保留。
import yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

const OWN_PREFIX = 'pm.'

// 我方 id 判定:pm. 前缀,外加管理器自身的历史 id 'pm-manager'(连字符,不匹配 pm. 前缀)
export function isOwnId(id) {
  return typeof id === 'string' && (id.startsWith(OWN_PREFIX) || id === 'pm-manager')
}

export function parsePatch(text) {
  if (!text || !text.trim()) return []
  const data = yaml.load(text, { schema: entryListSchema })
  if (data === undefined || data === null) return []
  if (!Array.isArray(data)) throw new Error('patch 文件顶层必须是 YAML 数组')
  return data
}

export function isOwnRow(entry) {
  return !!entry && typeof entry === 'object' && isOwnId(entry.id)
}

// 管理器写的 insert 块:顶层行只有 insert 键,块内子行 id 全部带 pm- 前缀。
export function isOwnInsertRow(entry) {
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.insert)) return false
  return entry.insert.every((c) => !!c && isOwnId(c.id))
}

// 管理器写的覆盖行形状恒为 { id, disabled }。若某行的 id 在 state.overrides 中且没有其他键,就是我们的行(即使 id 不带 pm- 前缀,如内置行的 tools)。
export function isOwnOverrideRow(entry, state) {
  if (!entry || typeof entry !== 'object') return false
  if (!state || !state.overrides || !entry.id || !(entry.id in state.overrides)) return false
  const keys = Object.keys(entry).filter((k) => k !== 'id' && k !== 'disabled')
  return keys.length === 0
}

// kept = 用户行;state = { inserted: { [id]: { name } }, overrides: { [id]: { name, disabled } } }
export function composePatch(kept, state) {
  const next = kept.slice()
  // 新增行必须包在 insert: 块里——顶层 {id, name} 会被当作按 id 覆盖,找不到目标则被静默跳过
  const inserts = Object.entries(state.inserted).map(([id, v]) => ({ id, name: v.name }))
  if (inserts.length) next.push({ insert: inserts })
  // 覆盖行放在 insert 之后:同一 patch 列表内,后行可以定位前文刚插入的行
  for (const [id, v] of Object.entries(state.overrides)) next.push({ id, disabled: !!v.disabled })
  return yaml.dump(next, { schema: entryListSchema, noRefs: true, lineWidth: 200 })
}

export function slugify(name) {
  return String(name).replace(/[^a-zA-Z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '')
}

export const FIBER_PHASE = { 0: 'pending', 1: 'loading', 2: 'active', 3: 'failed', 4: null, 5: 'unloading' }
