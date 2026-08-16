// remote.js — pluginManager 远程服务(Web 客户端经 /api 调用;零额外端口)
// 装饰器按 dsh-host-plugin-inventory 的编译输出手工展开(plain JS 无装饰器语法)
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'

var __runInitializers = function (thisArg, initializers, value) {
  var useValue = arguments.length > 2
  for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg)
  return useValue ? value : void 0
}
var __esDecorate = function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== 'function') throw new TypeError('Function expected')
    return f
  }
  var kind = contextIn.kind
  var key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value'
  var target = !descriptorIn && ctor ? ctor.prototype : null
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {})
  var _, done = false
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {}
    for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p]
    for (var p in contextIn.access) context.access[p] = contextIn.access[p]
    context.addInitializer = function (f) {
      if (done) throw new TypeError('Cannot add initializers after decoration has completed')
      extraInitializers.push(accept(f || null))
    }
    var result = decorators[i](kind === 'accessor' ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context)
    if (kind === 'accessor') {
      if (result === void 0) continue
      if (result === null || typeof result !== 'object') throw new TypeError('Object expected')
      if (_ = accept(result.get)) descriptor.get = _
      if (_ = accept(result.set)) descriptor.set = _
      if (_ = accept(result.init)) initializers.unshift(_)
    } else if (_ = accept(result)) {
      if (kind === 'field') initializers.unshift(_)
      else descriptor[key] = _
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor)
  done = true
}

// 注意:方法名不能与客户端命名空间服务原型冲突(如 remove 已被占用),故移除行叫 removeRow
const REMOTE_METHODS = ['list', 'presets', 'switchPreset', 'switchPresets', 'rollback', 'toggle', 'toggleByTag', 'tag', 'add', 'removeRow', 'addPreset', 'removePreset', 'stopSelf', 'marketInstall', 'batchInstall', 'profile', 'deepseekBalance', 'exportPreset', 'importPreset']

// 工厂:闭包持有 manager,返回已装饰的网关类
export function createGateway(manager, replaceIds) {
  let PluginManagerGateway = (() => {
    let _classSuper = TypertRemoteService
    let _instanceExtraInitializers = []
    let _dec = {}
    return class PluginManagerGateway extends _classSuper {
      static {
        const _metadata = typeof Symbol === 'function' && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0
        for (const name of REMOTE_METHODS) {
          _dec[name] = [Remote(name)]
          __esDecorate(this, null, _dec[name], { kind: 'method', name, static: false, private: false, access: { has: (o) => name in o, get: (o) => o[name] }, metadata: _metadata }, null, _instanceExtraInitializers)
        }
        if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata })
      }
      constructor(ctx) {
        super(ctx, 'pluginManager')
        __runInitializers(this, _instanceExtraInitializers)
        this.manager = manager
        this.replaceIds = replaceIds
      }
      // 注意:方法签名必须保持简单命名参数(SRC 网关按源码反射参数名)
      async list() {
        const { rows } = await this.manager.opList({})
        return { entries: rows }
      }
      async presets() {
        return this.manager.opPresetList()
      }
      async switchPreset(presetName) {
        return this.manager.opPresetSwitch(presetName)
      }
      async switchPresets(names) {
        return this.manager.opPresetSwitchMulti(names)
      }
      async rollback() {
        return this.manager.opRollback()
      }
      async toggle(name, disabled) {
        return this.manager.opToggle({ name }, !!disabled)
      }
      async toggleByTag(tag, disabled) {
        return this.manager.opToggle({ tag }, !!disabled)
      }
      async tag(name, tags) {
        return this.manager.opTag(name, tags)
      }
      async add(pkg) {
        return this.manager.opAdd(pkg)
      }
      async removeRow(name) {
        return this.manager.opRemove(name)
      }
      async addPreset(name, description, plugins) {
        return this.manager.opAddPreset(name, description, plugins)
      }
      async removePreset(name) {
        return this.manager.opRemovePreset(name)
      }
      async marketInstall(repo) {
        return this.manager.opMarketInstall(repo)
      }
      async batchInstall(repos, pkgNames, presetName, presetDescription) {
        return this.manager.opBatchMarketInstall(repos, pkgNames, presetName, presetDescription)
      }
      async profile() {
        return { profile: this.manager.opProfile() }
      }
      async deepseekBalance() {
        return this.manager.opDeepseekBalance()
      }
      async exportPreset(name) {
        return this.manager.opExportPreset(name)
      }
      async importPreset(text) {
        return this.manager.opImportPreset(text)
      }
      async stopSelf(confirm) {
        if (confirm !== 'STOP') return { ok: false, text: '未确认:confirm 必须为 STOP。' }
        return this.manager.opSelfStop(this.replaceIds || [])
      }
    }
  })()
  return PluginManagerGateway
}
