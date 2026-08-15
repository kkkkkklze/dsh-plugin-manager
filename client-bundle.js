// dsh-plugin-manager 客户端半(M3c):原生 dsh 设置观感(设计令牌)+ 数量统计 + 分类
(function () {
  if (typeof window === 'undefined' || !window.__ModuleLoader__) return
  try {
    window.__ModuleLoader__.load({
      id: 'dsh-plugin-manager',
      factory: function (require) {
        var module = { exports: {} }
        var exports = module.exports
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
        var React = require('react')

        ;(function () {
          var css = [
            '.pm-section{width:100%;max-width:760px;display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary)}',
            '.pm-heading{display:flex;align-items:baseline;gap:8px;padding:0 2px}',
            '.pm-heading h3{font-size:13px;font-weight:600;line-height:20px;margin:0}',
            '.pm-heading .count{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:12px;line-height:18px}',
            '.pm-search{width:100%;color:var(--dsw-alias-label-tertiary);align-items:center;display:flex;position:relative}',
            '.pm-search input{width:100%;height:36px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:0 12px;font:inherit;font-size:13px}',
            '.pm-search input::placeholder{color:var(--dsw-alias-label-tertiary)}',
            '.pm-search input:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent)}',
            '.pm-tags{display:flex;gap:6px;flex-wrap:wrap}',
            '.pm-chip{font-size:12px;padding:3px 11px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);background:transparent;border-radius:999px;cursor:pointer}',
            '.pm-chip.on{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}',
            '.pm-list{display:flex;flex-direction:column;gap:8px}',
            '.pm-row{display:flex;align-items:center;gap:12px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;padding:10px 14px}',
            '.pm-row.off{opacity:.6}',
            '.pm-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-label-tertiary);flex-shrink:0}',
            '.pm-row.on .pm-dot{background:var(--dsw-alias-state-business-primary)}',
            '.pm-row.failed .pm-dot{background:var(--dsw-alias-state-error-primary)}',
            '.pm-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}',
            '.pm-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            '.pm-row a.pm-name{color:var(--dsw-alias-label-primary);text-decoration:none}',
            '.pm-row a.pm-name:hover{text-decoration:underline}',
            '.pm-id{font-size:11px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
            '.pm-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
            '.pm-pager{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dsw-alias-label-tertiary)}',
            '.pm-ta{width:100%;min-height:88px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:10px;font:inherit;font-size:12px;line-height:1.6;resize:vertical}',
            '.pm-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:1000}',
            '.pm-modal{width:min(560px,92vw);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 40px rgba(0,0,0,.35)}',
            '.pm-pills{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}',
            '.pm-pill{font-size:11px;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:1px 7px}',
            '.pm-phase{font-size:11px;color:var(--dsw-alias-label-tertiary);flex-shrink:0}',
            '.pm-btn{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0;border-radius:6px;padding:4px 11px;font:inherit;font-size:12px;cursor:pointer;flex-shrink:0}',
            '.pm-btn:hover{border-color:var(--dsw-alias-state-business-primary)}',
            '.pm-btn.primary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:var(--dsw-alias-bg-layer-3)}',
            '.pm-btn.danger:hover{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}',
            '.pm-btn:disabled{opacity:.4;cursor:default}',
            '.pm-form{display:flex;gap:8px;flex-wrap:wrap}',
            '.pm-input{flex:1;min-width:120px;height:34px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:0 11px;font:inherit;font-size:13px}',
            '.pm-input:focus-visible{border-color:var(--dsw-alias-state-business-primary)}',
            '.pm-desc-full{font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:pre-wrap;word-break:break-word;line-height:1.5}',
            '.pm-picker{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px}',
            '.pm-selchips{display:flex;gap:6px;flex-wrap:wrap}',
            '.pm-selchip{display:inline-flex;align-items:center;gap:6px;font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:2px 9px;color:var(--dsw-alias-label-primary)}',
            '.pm-selchip button{border:0;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:0;font-size:13px;line-height:1}',
            '.pm-toast{font-size:12px;color:var(--dsw-alias-label-tertiary);min-height:16px}',
            '.pm-toast.err{color:var(--dsw-alias-state-error-primary)}',
          ].join('\n')
          var tagId = 'dsh-plugin-manager/client.css'
          if (document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
            var tag = document.createElement('style')
            tag.setAttribute('data-plugin-css', tagId)
            tag.textContent = css
            document.head.appendChild(tag)
          }
        })()

        function esc(s) {
          return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }
        var identity = { parse: function (v) { return v } }
        var TYPE_SYMBOL = 'dsh-plugin-manager/types#Json'
        function param(name) {
          return { name: name, wire: name, source: 'json', codec: { mode: 'strict', typeSymbol: TYPE_SYMBOL, schema: identity } }
        }
        function descriptor(method, params) {
          return {
            id: 'dsh-plugin-manager#pluginManager/' + method,
            service: 'pluginManager',
            namespace: 'pluginManager',
            method: method,
            invocation: { kind: 'direct' },
            parameters: params.map(param),
            result: { mode: 'strict', typeSymbol: TYPE_SYMBOL, schema: identity },
            sourceLocation: { file: 'dsh-plugin-manager/remote.js', line: 1, column: 1 },
          }
        }
        var CONTRIBUTION = {
          package: 'dsh-plugin-manager',
          descriptors: [
            descriptor('list', []),
            descriptor('presets', []),
            descriptor('switchPreset', ['presetName']),
            descriptor('rollback', []),
            descriptor('toggle', ['name', 'disabled']),
            descriptor('toggleByTag', ['tag', 'disabled']),
            descriptor('tag', ['name', 'tags']),
            descriptor('add', ['pkg']),
            descriptor('removeRow', ['name']),
            descriptor('addPreset', ['name', 'description', 'plugins']),
            descriptor('removePreset', ['name']),
            descriptor('stopSelf', ['confirm']),
            descriptor('marketInstall', ['repo']),
            descriptor('profile', []),
            descriptor('deepseekBalance', []),
            descriptor('exportPreset', ['name']),
            descriptor('importPreset', ['text']),
          ],
        }

        function unwrap(r) {
          if (!r) return { ok: false, text: '远程调用无响应' }
          if (r.ok && (!r.value || r.value.ok !== false)) return { ok: true, text: (r.value && r.value.text) || '', value: r.value }
          return { ok: false, text: (r.value && r.value.text) || (r.error && r.error.message) || '远程调用失败' }
        }

        var ErrorBoundary = React.Component ? (function () {
          var Base = React.Component
          function Bound(props) { Base.call(this, props); this.state = { error: null } }
          Bound.prototype = Object.create(Base.prototype)
          Bound.prototype.constructor = Bound
          Bound.prototype.componentDidCatch = function (err) { this.setState({ error: err }) }
          Bound.prototype.render = function () {
            if (this.state.error) return React.createElement('div', { className: 'pm-section' }, '渲染失败: ' + esc(this.state.error && this.state.error.message ? this.state.error.message : this.state.error))
            return this.props.children
          }
          return Bound
        })() : null

        function registerFallback(ctx, message) {
          try {
            ctx.slots.inject('settings.plugins.tab', function () {
              return ctx.slots.register({
                name: 'settings.plugins.tab', id: 'categories-error', order: 5, label: function () { return '分类(诊断)' }, locale: NS, inject: function () { return {} }, children: {},
              }, function FallbackSection() {
                return React.createElement('div', { className: 'pm-section' }, 'dsh-plugin-manager UI 初始化失败:', React.createElement('pre', null, esc(message)))
              })
            })
          } catch (e2) { if (typeof console !== 'undefined') console.error('[dsh-plugin-manager] fallback register failed:', e2) }
        }

        function makePluginsSection(pm) {
          return function PluginsSection() {
            var useState = React.useState, useEffect = React.useEffect, useCallback = React.useCallback
            var entriesH = useState([]); var entries = entriesH[0]; var setEntries = entriesH[1]
            var queryH = useState(''); var query = queryH[0]; var setQuery = queryH[1]
            var tagH = useState(null); var tag = tagH[0]; var setTag = tagH[1]
            var toastH = useState(''); var toast = toastH[0]; var setToast = toastH[1]
            var errH = useState(false); var err = errH[0]; var setErr = errH[1]

            var load = useCallback(function () {
              Promise.resolve(pm.list()).then(function (r) {
                var u = unwrap(r)
                if (u.ok && r.value && Array.isArray(r.value.entries)) { setEntries(r.value.entries); setErr(false) }
                else { setToast(u.text); setErr(true) }
              }).catch(function (e) { setToast('加载失败: ' + e.message); setErr(true) })
            }, [])
            useEffect(function () { load(); var t = setInterval(load, 10000); return function () { clearInterval(t) } }, [load])
            var act = function (p) { Promise.resolve(p).then(function (r) { var u = unwrap(r); setToast(u.text); setErr(!u.ok); load() }).catch(function (e) { setToast('失败: ' + e.message); setErr(true) }) }
            var toggleRow = function (e) { act(pm.toggle(e.id, !e.enabled)) }
            var editTag = function (e) { var val = window.prompt('标签(逗号分隔;-前缀移除):', (e.tags || []).join(', ')); if (val === null) return; act(pm.tag(e.name, val)) }
            var addPlugin = function () { var pkg = window.prompt('npm 包名(必须已存在于 profile 依赖):'); if (!pkg) return; act(pm.add(pkg)) }
            var removeRow = function (e) { if (!window.confirm('移除受管行 ' + e.id + ' ?')) return; act(pm.removeRow(e.id)) }
            var stopSelf = function () { if (!window.confirm('停止插件管理器?\n界面将退化为 dsh 原版插件列表。\n重新启用:删除 profile cordis.patch.yml 中 pm-manager 的停用行。')) return; act(pm.stopSelf('STOP')) }

            var tagCounts = {}
            entries.forEach(function (e) { (e.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1 }) })
            var tagKeys = Object.keys(tagCounts).sort()
            var rows = entries.filter(function (e) {
              if (tag && (e.tags || []).indexOf(tag) < 0) return false
              if (query) { var q = query.toLowerCase(); if (e.id.toLowerCase().indexOf(q) < 0 && e.name.toLowerCase().indexOf(q) < 0) return false }
              return true
            })
            var onCount = entries.filter(function (e) { return e.enabled }).length

            var body = React.createElement('div', { className: 'pm-section' },
              React.createElement('div', { className: 'pm-heading' },
                React.createElement('h3', null, '插件'),
                React.createElement('span', { className: 'count' }, '共 ' + entries.length + ' 个 · 启用 ' + onCount + ' · 停用 ' + (entries.length - onCount))
              ),
              React.createElement('label', { className: 'pm-search' },
                React.createElement('input', { placeholder: '搜索插件 id 或模块名 …', value: query, onChange: function (ev) { setQuery(ev.target.value) } })
              ),
              React.createElement('div', { className: 'pm-tags' },
                React.createElement('button', { className: 'pm-chip' + (tag === null ? ' on' : ''), onClick: function () { setTag(null) } }, '全部 ' + entries.length),
                tagKeys.map(function (t) {
                  return React.createElement('button', { key: t, className: 'pm-chip' + (t === tag ? ' on' : ''), onClick: function () { setTag(t === tag ? null : t) } }, t + ' ' + tagCounts[t])
                })
              ),
              React.createElement('div', { className: 'pm-list' },
                rows.length === 0
                  ? React.createElement('div', { className: 'pm-toast' }, '没有匹配的插件')
                  : rows.map(function (e) {
                      var del = (e.id.indexOf('pm.') === 0 && e.id !== 'pm-manager') ? React.createElement('button', { className: 'pm-btn danger', onClick: function () { removeRow(e) } }, '移除') : null
                      return React.createElement('div', { key: e.id, className: 'pm-row' + (e.enabled ? ' on' : ' off') + (e.phase === 'failed' ? ' failed' : '') },
                        React.createElement('span', { className: 'pm-dot' }),
                        React.createElement('div', { className: 'pm-main' },
                          React.createElement('span', { className: 'pm-name' }, esc(e.name)),
                          e.description ? React.createElement('span', { className: 'pm-desc' }, esc(e.description)) : null,
                          React.createElement('span', { className: 'pm-id' }, esc(e.id)),
                          React.createElement('div', { className: 'pm-pills' }, (e.tags || []).map(function (t) { return React.createElement('span', { key: t, className: 'pm-pill' }, esc(t)) }))
                        ),
                        React.createElement('span', { className: 'pm-phase' }, esc(e.phase || '')),
                        React.createElement('button', { className: 'pm-btn', onClick: function () { editTag(e) } }, '标签'),
                        React.createElement('button', { className: 'pm-btn' + (e.enabled ? '' : ' primary'), onClick: function () { toggleRow(e) } }, e.enabled ? '停用' : '启用'),
                        del
                      )
                    })
              ),
              React.createElement('div', { className: 'pm-toast' + (err ? ' err' : '') }, esc(toast || (err ? '' : ' '))),
              React.createElement('button', { className: 'pm-btn danger', onClick: stopSelf }, '⏻ 停止管理器')
            )
            return ErrorBoundary ? React.createElement(ErrorBoundary, null, body) : body
          }
        }

        function makeBalanceChip(pm, t) {
          return function BalanceChip() {
            var useState = React.useState, useEffect = React.useEffect
            var balH = useState(''); var bal = balH[0]; var setBal = balH[1]
            useEffect(function () {
              Promise.resolve(pm.deepseekBalance()).then(function (r) {
                if (r && r.ok && r.value && r.value.text) setBal(r.value.text)
              }).catch(function () {})
            }, [])
            if (!bal) return null
            try {
              return React.createElement('button', { className: 'pm-btn', title: 'DeepSeek 用量 → ' + bal, onClick: function () { window.open('https://platform.deepseek.com/usage', '_blank') } }, 'DeepSeek ' + esc(bal))
            } catch (e) { return null }
          }
        }

        function makeChatButton() {
          return function ChatButton() {
            try {
              return React.createElement('button', { className: 'pm-btn', title: '打开 DeepSeek Chat', onClick: function () { window.open('https://chat.deepseek.com/', '_blank') } }, 'Chat')
            } catch (e) { return null }
          }
        }

        function makeMarketSection(pm, t) {
          return function MarketSection() {
            var useState = React.useState, useEffect = React.useEffect, useCallback = React.useCallback
            var reposH = useState([]); var repos = reposH[0]; var setRepos = reposH[1]
            var statusH = useState('loading'); var status = statusH[0]; var setStatus = statusH[1]
            var toastH = useState(''); var toast = toastH[0]; var setToast = toastH[1]
            var errH = useState(false); var err = errH[0]; var setErr = errH[1]
            var busyH = useState(''); var busy = busyH[0]; var setBusy = busyH[1]
            var pageH = useState(0); var page = pageH[0]; var setPage = pageH[1]
            var totalH = useState(0); var total = totalH[0]; var setTotal = totalH[1]
            var promptH = useState(null); var promptFor = promptH[0]; var setPromptFor = promptH[1]
            var confirmH = useState(null); var confirmFor = confirmH[0]; var setConfirmFor = confirmH[1]
            var onlyH = useState(true); var only = onlyH[0]; var setOnly = onlyH[1]
            var scanH = useState(false); var scanning = scanH[0]; var setScanning = scanH[1]
            var plugH = useState([]); var plugList = plugH[0]; var setPlugList = plugH[1]
            var scanDoneH = useState(false); var scanDone = scanDoneH[0]; var setScanDone = scanDoneH[1]
            var scanSess = { list: [], page: 1, done: false }

            var enrich = function (repo) {
              return fetch('https://raw.githubusercontent.com/' + repo.full_name + '/' + (repo.default_branch || 'main') + '/package.json')
                .then(function (r) { return r.ok ? r.json() : null })
                .then(function (pkg) { repo.isPlugin = !!(pkg && pkg.dsh && (pkg.dsh.bundle || pkg.dsh.client)); return repo })
                .catch(function () { repo.isPlugin = false; return repo })
            }
            var scanMore = function () {
              if (scanning || scanSess.done) return
              setScanning(true)
              fetch('https://api.github.com/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=30&page=' + scanSess.page, { headers: { Accept: 'application/vnd.github+json' } })
                .then(function (r) { return r.json() })
                .then(function (j) {
                  var items = j.items || []
                  if (!items.length) { scanSess.done = true; setScanDone(true); setScanning(false); return }
                  return Promise.all(items.map(enrich)).then(function (done) {
                    var plugs = done.filter(function (r) { return r.isPlugin })
                    scanSess.list = scanSess.list.concat(plugs)
                    scanSess.page += 1
                    setPlugList(scanSess.list.slice())
                    setScanning(false)
                    if (scanSess.list.length < 30 && scanSess.page <= 10) scanMore()
                  })
                })
                .catch(function (e) { setScanning(false); setToast(t('marketError') + ': ' + e.message); setErr(true) })
            }
            var beginScan = function () {
              scanSess = { list: [], page: 1, done: false }
              setPlugList([]); setScanDone(false)
              scanMore()
            }

            var load = useCallback(function (p) {
              setStatus('loading'); setScanning(true)
              fetch('https://api.github.com/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=30&page=' + (p + 1), { headers: { Accept: 'application/vnd.github+json' } })
                .then(function (r) { return r.json() })
                .then(function (j) {
                  var items = j.items || []
                  setRepos(items)
                  setTotal(j.total_count || 0)
                  setStatus('ready')
                  return Promise.all(items.map(enrich))
                })
                .then(function (done) { setRepos(done); setScanning(false) })
                .catch(function (e) { setStatus('error'); setScanning(false); setToast(t('marketError') + ': ' + e.message); setErr(true) })
            }, [t])
            useEffect(function () { if (only) { beginScan() } else { load(0) } }, [])
            var goPage = function (p) { setPage(p); load(p) }
            var copyText = function (t) {
              var done = function () { setToast(t('copied')) }
              if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, function () { legacyCopy(t); done() }) }
              else { legacyCopy(t); done() }
            }
            var legacyCopy = function (t) {
              var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') } catch (e) {} document.body.removeChild(ta)
            }

            var b64 = function (b) {
              try { return decodeURIComponent(escape(atob(b.replace(/\s/g, '')))) } catch (e) { try { return atob(b) } catch (e2) { return '' } }
            }
            var inspectRepo = function (repo) {
              return fetch('https://api.github.com/repos/' + repo + '/contents', { headers: { Accept: 'application/vnd.github+json' } })
                .then(function (r) { return r.ok ? r.json() : null })
                .then(function (files) {
                  if (!files || !Array.isArray(files)) return null
                  var pkgFile = files.find(function (f) { return f.name === 'package.json' })
                  var readmeFile = files.find(function (f) { return /^readme/i.test(f.name) })
                  var out = { pkg: null, readme: '' }
                  var p1 = pkgFile ? fetch(pkgFile.url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { return r.json() }).then(function (j) { try { out.pkg = JSON.parse(b64(j.content)) } catch (e) {} }).catch(function () {}) : Promise.resolve()
                  var p2 = readmeFile ? fetch(readmeFile.url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { return r.json() }).then(function (j) { try { out.readme = b64(j.content).slice(0, 360) } catch (e) {} }).catch(function () {}) : Promise.resolve()
                  return Promise.all([p1, p2]).then(function () { return out })
                })
                .catch(function () { return null })
            }

            var doInstall = function (repo) {
              Promise.resolve(pm.marketInstall(repo)).then(function (r) { var u = unwrap(r); setToast(u.text); setErr(!u.ok); setBusy('') }).catch(function (e) { setToast(t('install') + ' ' + e.message); setErr(true); setBusy('') })
            }
            var install = function (repo) {
              setBusy(repo.full_name)
              inspectRepo(repo.full_name).then(function (info) {
                var pkg = info && info.pkg
                var isPlugin = !!(pkg && pkg.dsh && (pkg.dsh.bundle || pkg.dsh.client))
                var verdict = pkg ? (isPlugin ? t('verdictPlugin') + ' (' + Object.keys(pkg.dsh).join('/') + ')' : t('verdictNoDsh')) : (info ? t('verdictNoPkg') : t('verdictUnknown'))
                var effect = (info && info.readme) ? info.readme : (repo.description || t('effect'))
                Promise.resolve(pm.profile()).then(function (pr) {
                  var profile = (pr && pr.value && pr.value.profile) || 'web'
                  var method = 'dsh plugin add github:' + repo.full_name
                  if (isPlugin) {
                    setBusy('')
                    setConfirmFor({ repo: repo.full_name, profile: profile, method: method, verdict: verdict, effect: effect })
                  } else {
                    setBusy('')
                    var prompt = t('promptTemplate').replace(/\{repo\}/g, repo.full_name).replace(/\{profile\}/g, profile)
                    setPromptFor({ repo: repo.full_name, verdict: verdict, prompt: prompt })
                  }
                })
              }).catch(function () { setBusy(''); setToast(t('marketError')); setErr(true) })
            }

            var plugins = repos.filter(function (r) { return r.isPlugin })
            var shown = only ? plugList : repos
            var totalPages = Math.max(1, Math.ceil(total / 30))
            var body = React.createElement('div', { className: 'pm-section' },
              React.createElement('div', { className: 'pm-heading' },
                React.createElement('h3', null, t('marketTitle')),
                React.createElement('span', { className: 'count' }, t('marketCount').replace('{n}', total)),
                React.createElement('button', { className: 'pm-btn' + (only ? ' primary' : ''), onClick: function () { var nxt = !only; setOnly(nxt); if (nxt) { beginScan() } else { load(page) } } }, t('onlyPlugins') + ' (' + (only ? plugList.length : plugins.length) + ')'),
                React.createElement('button', { className: 'pm-btn', onClick: function () { load(page) } }, t('refresh'))
              ),
              status === 'loading' ? React.createElement('div', { className: 'pm-toast' }, t('loading')) : null,
              status === 'error' ? React.createElement('div', { className: 'pm-toast err' }, t('marketError')) : null,
              scanning ? React.createElement('div', { className: 'pm-toast' }, t('scanning')) : null,
              React.createElement('div', { className: 'pm-list' },
                shown.map(function (repo) {
                  return React.createElement('div', { key: repo.full_name, className: 'pm-row' },
                    React.createElement('div', { className: 'pm-main' },
                      React.createElement('a', { className: 'pm-name', href: repo.html_url, target: '_blank', rel: 'noreferrer' }, esc(repo.full_name)),
                      repo.description ? React.createElement('span', { className: 'pm-desc' }, esc(repo.description)) : null
                    ),
                    React.createElement('span', { className: 'pm-phase' }, '★ ' + repo.stargazers_count),
                    React.createElement('button', { className: 'pm-btn primary', disabled: busy !== '', onClick: function () { install(repo) } }, busy === repo.full_name ? t('checking') : t('install'))
                  )
                })
              ),
              confirmFor ? React.createElement('div', { className: 'pm-modal-overlay', onClick: function () { setConfirmFor(null) } },
                React.createElement('div', { className: 'pm-modal', onClick: function (ev) { ev.stopPropagation() } },
                  React.createElement('div', { className: 'pm-heading' },
                    React.createElement('h3', null, t('confirmTitle')),
                    React.createElement('span', { className: 'count' }, esc(confirmFor.repo))
                  ),
                  React.createElement('div', { className: 'pm-toast' }, esc(confirmFor.verdict)),
                  React.createElement('div', { className: 'pm-desc' }, esc(confirmFor.effect || t('effect'))),
                  React.createElement('div', { className: 'pm-toast' }, t('methodLabel') + ': ' + esc(confirmFor.method)),
                  React.createElement('div', { className: 'pm-toast' }, t('profileLabel') + ': ' + esc(confirmFor.profile) + ' profile'),
                  React.createElement('div', { className: 'pm-pager' },
                    React.createElement('button', { className: 'pm-btn primary', onClick: function () { setConfirmFor(null); setBusy(confirmFor.repo); doInstall(confirmFor.repo) } }, t('confirmInstall')),
                    React.createElement('button', { className: 'pm-btn', onClick: function () { setConfirmFor(null) } }, t('cancel'))
                  )
                )
              ) : null,
              promptFor ? React.createElement('div', { className: 'pm-modal-overlay', onClick: function () { setPromptFor(null) } },
                React.createElement('div', { className: 'pm-modal', onClick: function (ev) { ev.stopPropagation() } },
                  React.createElement('div', { className: 'pm-heading' },
                    React.createElement('h3', null, t('promptTitle')),
                    React.createElement('span', { className: 'count' }, esc(promptFor.repo))
                  ),
                  React.createElement('div', { className: 'pm-toast' }, esc(promptFor.verdict)),
                  React.createElement('textarea', { className: 'pm-ta', readOnly: true, value: promptFor.prompt }),
                  React.createElement('div', { className: 'pm-pager' },
                    React.createElement('button', { className: 'pm-btn primary', onClick: function () { copyText(promptFor.prompt) } }, t('copy')),
                    React.createElement('button', { className: 'pm-btn', onClick: function () { setPromptFor(null) } }, t('close'))
                  )
                )
              ) : null,
              only
                ? React.createElement('div', { className: 'pm-pager' },
                    React.createElement('span', null, t('loadedPlugins').replace('{n}', plugList.length) + (scanning ? ' · ' + t('scanning') : '')),
                    !scanDone && !scanning ? React.createElement('button', { className: 'pm-btn', onClick: scanMore }, t('loadMore')) : null
                  )
                : React.createElement('div', { className: 'pm-pager' },
                    React.createElement('button', { className: 'pm-btn', disabled: page === 0, onClick: function () { goPage(page - 1) } }, t('prev')),
                    React.createElement('span', null, t('pager').replace('{p}', page + 1).replace('{n}', totalPages)),
                    React.createElement('button', { className: 'pm-btn', disabled: page >= totalPages - 1, onClick: function () { goPage(page + 1) } }, t('next'))
                  ),
              React.createElement('div', { className: 'pm-toast' + (err ? ' err' : '') }, esc(toast))
            )
            return ErrorBoundary ? React.createElement(ErrorBoundary, null, body) : body
          }
        }

        function makeBundlesSection(pm) {
          return function BundlesSection() {
            var useState = React.useState, useEffect = React.useEffect, useCallback = React.useCallback
            var presetsH = useState([]); var presets = presetsH[0]; var setPresets = presetsH[1]
            var toastH = useState(''); var toast = toastH[0]; var setToast = toastH[1]
            var errH = useState(false); var err = errH[0]; var setErr = errH[1]
            var nameH = useState(''); var name = nameH[0]; var setName = nameH[1]
            var descH = useState(''); var desc = descH[0]; var setDesc = descH[1]
            var selH = useState([]); var sel = selH[0]; var setSel = selH[1]
            var pickerH = useState(false); var picker = pickerH[0]; var setPicker = pickerH[1]
            var allH = useState([]); var all = allH[0]; var setAll = allH[1]
            var pqH = useState(''); var pq = pqH[0]; var setPq = pqH[1]
            var ptH = useState(null); var pt = ptH[0]; var setPt = ptH[1]
            var modalH = useState(null); var modal = modalH[0]; var setModal = modalH[1]
            var importTextH = useState(''); var importText = importTextH[0]; var setImportText = importTextH[1]

            var load = useCallback(function () {
              Promise.resolve(pm.presets()).then(function (r) {
                var u = unwrap(r)
                if (u.ok && r.value && Array.isArray(r.value.presets)) { setPresets(r.value.presets); setErr(false) }
                else { setToast(u.text); setErr(true) }
              }).catch(function (e) { setToast('加载失败: ' + e.message); setErr(true) })
            }, [])
            var loadAll = useCallback(function () {
              Promise.resolve(pm.list()).then(function (r) {
                var u = unwrap(r)
                if (u.ok && r.value && Array.isArray(r.value.entries)) setAll(r.value.entries)
              }).catch(function () {})
            }, [])
            useEffect(function () { load(); loadAll() }, [load, loadAll])
            var act = function (p) { Promise.resolve(p).then(function (r) { var u = unwrap(r); setToast(u.text); setErr(!u.ok); load() }).catch(function (e) { setToast('失败: ' + e.message); setErr(true) }) }
            var switchScene = function (p) { if (!window.confirm('接入插件包「' + p.name + '」?\n将停用包外插件(管理器除外),可回滚。')) return; act(pm.switchPreset(p.name)) }
            var removePreset = function (p) { if (!window.confirm('删除插件包「' + p.name + '」?')) return; act(pm.removePreset(p.name)) }
            var editPreset = function (p) { setName(p.name); setDesc(p.description || ''); setSel((p.refs || []).slice()); setPicker(true) }
            var resetForm = function () { setName(''); setDesc(''); setSel([]); setPicker(false); setPq(''); setPt(null) }
            var save = function () {
              if (!name.trim()) { setToast('请填写插件包名称'); setErr(true); return }
              act(pm.addPreset(name.trim(), desc.trim(), sel.slice()))
              resetForm()
            }
            var toggleSel = function (id) {
              setSel(function (cur) { return cur.indexOf(id) >= 0 ? cur.filter(function (x) { return x !== id }) : cur.concat([id]) })
            }
            var removeSel = function (s) { setSel(function (cur) { return cur.filter(function (x) { return x !== s }) }) }
            var doExport = function (p) {
              Promise.resolve(pm.exportPreset(p.name)).then(function (r) {
                var u = unwrap(r)
                setModal({ kind: 'export', text: u.ok ? u.text : ('导出失败: ' + u.text) })
              }).catch(function (e) { setToast('导出失败: ' + e.message); setErr(true) })
            }
            var doImport = function () {
              act(pm.importPreset(importText))
              setImportText(''); setModal(null)
            }
            var openImport = function () { setImportText(''); setModal({ kind: 'import' }) }
            var copyToClipboard = function (txt) {
              if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { setToast('已复制') }, function () {}) }
            }

            var pickerTagCounts = {}
            all.forEach(function (e) { (e.tags || []).forEach(function (t) { pickerTagCounts[t] = (pickerTagCounts[t] || 0) + 1 }) })
            var pickerTags = Object.keys(pickerTagCounts).sort()
            var pickerRows = all.filter(function (e) {
              if (pt && (e.tags || []).indexOf(pt) < 0) return false
              if (pq) { var q = pq.toLowerCase(); if (e.id.toLowerCase().indexOf(q) < 0 && e.name.toLowerCase().indexOf(q) < 0) return false }
              return true
            })

            var body = React.createElement('div', { className: 'pm-section' },
              React.createElement('div', { className: 'pm-heading' },
                React.createElement('h3', null, '插件包'),
                React.createElement('span', { className: 'count' }, presets.length + ' 个'),
                React.createElement('button', { className: 'pm-btn', onClick: openImport }, '导入')
              ),
              React.createElement('div', { className: 'pm-form' },
                React.createElement('input', { className: 'pm-input', placeholder: '名称', value: name, onChange: function (ev) { setName(ev.target.value) } }),
                React.createElement('input', { className: 'pm-input', placeholder: '描述', value: desc, onChange: function (ev) { setDesc(ev.target.value) } }),
                React.createElement('button', { className: 'pm-btn', onClick: function () { setPicker(!picker) } }, '选择插件(' + sel.length + ')'),
                React.createElement('button', { className: 'pm-btn primary', onClick: save }, name.trim() && presets.some(function (p) { return p.name === name.trim() }) ? '保存' : '添加')
              ),
              sel.length > 0 ? React.createElement('div', { className: 'pm-selchips' }, sel.map(function (s) {
                return React.createElement('span', { key: s, className: 'pm-selchip' }, esc(s), React.createElement('button', { onClick: function () { removeSel(s) } }, '×'))
              })) : null,
              picker ? React.createElement('div', { className: 'pm-picker' },
                React.createElement('div', { className: 'pm-heading' },
                  React.createElement('h3', null, '选择插件'),
                  React.createElement('span', { className: 'count' }, '已选 ' + sel.length + ' 个'),
                  React.createElement('button', { className: 'pm-btn', onClick: function () { setPicker(false) } }, '完成')
                ),
                React.createElement('label', { className: 'pm-search' },
                  React.createElement('input', { placeholder: '搜索插件 …', value: pq, onChange: function (ev) { setPq(ev.target.value) } })
                ),
                React.createElement('div', { className: 'pm-tags' },
                  React.createElement('button', { className: 'pm-chip' + (pt === null ? ' on' : ''), onClick: function () { setPt(null) } }, '全部 ' + all.length),
                  pickerTags.map(function (t) {
                    return React.createElement('button', { key: t, className: 'pm-chip' + (t === pt ? ' on' : ''), onClick: function () { setPt(t === pt ? null : t) } }, t + ' ' + pickerTagCounts[t])
                  })
                ),
                React.createElement('div', { className: 'pm-list' }, pickerRows.map(function (e) {
                  var on = sel.indexOf(e.id) >= 0
                  return React.createElement('div', { key: e.id, className: 'pm-row' },
                    React.createElement('div', { className: 'pm-main' },
                      React.createElement('span', { className: 'pm-name' }, esc(e.name)),
                      e.description ? React.createElement('span', { className: 'pm-desc' }, esc(e.description)) : null,
                      React.createElement('span', { className: 'pm-id' }, esc(e.id))
                    ),
                    React.createElement('button', { className: 'pm-btn' + (on ? ' primary' : ''), onClick: function () { toggleSel(e.id) } }, on ? '已选' : '选择')
                  )
                }))
              ) : null,
              React.createElement('div', { className: 'pm-list' },
                presets.map(function (p) {
                  return React.createElement('div', { key: p.name, className: 'pm-row' },
                    React.createElement('div', { className: 'pm-main' },
                      React.createElement('span', { className: 'pm-name' }, esc(p.name)),
                      React.createElement('span', { className: 'pm-desc-full' }, esc(p.description || '—'))
                    ),
                    React.createElement('span', { className: 'pm-phase' }, p.refs.length + ' 项'),
                    React.createElement('button', { className: 'pm-btn', onClick: function () { doExport(p) } }, '导出'),
                    React.createElement('button', { className: 'pm-btn', onClick: function () { editPreset(p) } }, '编辑'),
                    React.createElement('button', { className: 'pm-btn primary', onClick: function () { switchScene(p) } }, '一键切换'),
                    React.createElement('button', { className: 'pm-btn danger', onClick: function () { removePreset(p) } }, '删除')
                  )
                })
              ),
              React.createElement('button', { className: 'pm-btn', onClick: function () { act(pm.rollback()) } }, '⟲ 回滚上一步'),
              modal ? React.createElement('div', { className: 'pm-modal-overlay', onClick: function () { setModal(null) } },
                React.createElement('div', { className: 'pm-modal', onClick: function (ev) { ev.stopPropagation() } },
                  React.createElement('div', { className: 'pm-heading' },
                    React.createElement('h3', null, modal.kind === 'import' ? '导入整合包(名字与介绍随包继承)' : '导出整合包(分享给他人)')
                  ),
                  modal.kind === 'import'
                    ? React.createElement('textarea', { className: 'pm-ta', placeholder: '粘贴 YAML/JSON 整合包内容…', value: importText, onChange: function (ev) { setImportText(ev.target.value) } })
                    : React.createElement('textarea', { className: 'pm-ta', readOnly: true, value: modal.text }),
                  React.createElement('div', { className: 'pm-pager' },
                    modal.kind === 'import'
                      ? React.createElement('button', { className: 'pm-btn primary', onClick: doImport }, '导入')
                      : React.createElement('button', { className: 'pm-btn primary', onClick: function () { copyToClipboard(modal.text) } }, '复制'),
                    React.createElement('button', { className: 'pm-btn', onClick: function () { setModal(null) } }, '关闭')
                  )
                )
              ) : null,
              React.createElement('div', { className: 'pm-toast' + (err ? ' err' : '') }, esc(toast))
            )
            return ErrorBoundary ? React.createElement(ErrorBoundary, null, body) : body
          }
        }

        var NS = 'settings.pluginManager'
        var LOCALE = {
          zh: {
            categoriesTab: '分类', bundlesTab: '插件包', marketTab: '市场',
            marketTitle: '插件市场', marketCount: 'GitHub topic: dsh-plugin · 共 {n} 个',
            refresh: '刷新', loading: '加载中…', marketError: '市场加载失败(检查网络/代理)',
            install: '安装', checking: '识别中…',
            confirmTitle: '确认安装插件',
            effect: '效果:将下载仓库源码并在 profile 内构建(首次 git 安装可能需在 pnpm-workspace.yaml 授权 allowBuilds),以 dsh.bundle 加入插件组合;完成后可在「插件 → 分类」中管理它。',
            verdictPlugin: '识别:是 dsh 插件', verdictNoDsh: '识别:有 package.json 但无 dsh.bundle/dsh.client,不是标准 dsh 插件', verdictNoPkg: '识别:仓库没有 package.json,是 Skill/应用/MCP,不是 npm 插件', verdictUnknown: '识别:无法访问仓库内容,未能自动识别',
            methodLabel: '安装方式', profileLabel: '安装到',
            confirmInstall: '确认安装', cancel: '取消',
            promptTitle: '安装提示词(可复制)', copy: '复制', copied: '已复制,可粘贴到会话给 agent', close: '关闭',
            promptTemplate: '请帮我安装 GitHub 仓库 {repo} 作为 dsh 插件:\n1. 先用 plugin_market_inspect 识别它是否为标准 dsh 插件;\n2. 若确认可装,执行 dsh plugin --profile {profile} add github:{repo};\n3. 若装不上,说明原因并给出替代方案。',
            pager: '第 {p} / {n} 页', prev: '‹ 上一页', next: '下一页 ›', onlyPlugins: '只看插件', scanning: '正在识别插件…', loadedPlugins: '已加载 {n} 个插件', loadMore: '加载更多',
          },
          en: {
            categoriesTab: 'Categories', bundlesTab: 'Bundles', marketTab: 'Market',
            marketTitle: 'Plugin Market', marketCount: 'GitHub topic: dsh-plugin · {n} repos',
            refresh: 'Refresh', loading: 'Loading…', marketError: 'Market load failed (check network/proxy)',
            install: 'Install', checking: 'Checking…',
            confirmTitle: 'Confirm plugin install',
            effect: 'Effect: downloads and builds the repo into the profile (first git install may require allowBuilds in pnpm-workspace.yaml), registers it via dsh.bundle, and it becomes manageable under Plugins → Categories.',
            verdictPlugin: 'Detected: dsh plugin', verdictNoDsh: 'Detected: has package.json but no dsh.bundle/dsh.client — not a standard dsh plugin', verdictNoPkg: 'Detected: no package.json — a Skill/app/MCP, not an npm plugin', verdictUnknown: 'Detected: could not read the repo',
            methodLabel: 'Method', profileLabel: 'Install to',
            confirmInstall: 'Confirm', cancel: 'Cancel',
            promptTitle: 'Install prompt (copyable)', copy: 'Copy', copied: 'Copied — paste it to the agent in a session', close: 'Close',
            promptTemplate: 'Please help me install the GitHub repo {repo} as a dsh plugin:\n1. First identify it with plugin_market_inspect;\n2. If installable, run: dsh plugin --profile {profile} add github:{repo};\n3. If it fails, explain why and offer alternatives.',
            pager: 'Page {p} / {n}', prev: '‹ Prev', next: 'Next ›', onlyPlugins: 'Plugins only', scanning: 'Identifying plugins…', loadedPlugins: 'Loaded {n} plugins', loadMore: 'Load more',
          },
        }
        function apply(ctx) {
          if (ctx.locale) { try { ctx.effect(function () { ctx.locale.register(NS, LOCALE); return function () {} }, 'dsh-plugin-manager: locale dictionaries') } catch (e3) {} }
          var t = (ctx.locale && ctx.locale.bind) ? ctx.locale.bind(NS) : function (k) { return (LOCALE.zh && LOCALE.zh[k]) || k }
          return Promise.resolve().then(function () {
            return ctx.remote.$mount(CONTRIBUTION)
          }).then(function (unmount) {
            var pm = ctx.get('remote.pluginManager')
            if (!pm) throw new Error('remote.pluginManager 服务未就绪')
            var d1 = ctx.slots.inject('settings.plugins.tab', function () {
              return ctx.slots.register({ name: 'settings.plugins.tab', id: 'categories', order: 5, label: function () { return t('categoriesTab') }, locale: NS, inject: function () { return {} }, children: {} }, makePluginsSection(pm))
            })
            var d2 = ctx.slots.inject('settings.plugins.tab', function () {
              return ctx.slots.register({ name: 'settings.plugins.tab', id: 'bundles', order: 10, label: function () { return t('bundlesTab') }, locale: NS, inject: function () { return {} }, children: {} }, makeBundlesSection(pm))
            })
            var d3 = ctx.slots.inject('settings.plugins.tab', function () {
              return ctx.slots.register({ name: 'settings.plugins.tab', id: 'market', order: 15, label: function () { return t('marketTab') }, locale: NS, inject: function () { return {} }, children: {} }, makeMarketSection(pm, t))
            })
            var d4 = ctx.slots.inject('sidebar.footer.action', function () {
              return ctx.slots.register({ name: 'sidebar.footer.action', id: 'plugin-manager-balance', locale: NS, inject: function () { return {} } }, makeBalanceChip(pm, t))
            })
            var d5 = ctx.slots.inject('sidebar.footer.action', function () {
              return ctx.slots.register({ name: 'sidebar.footer.action', id: 'plugin-manager-chat', locale: NS, inject: function () { return {} } }, makeChatButton())
            })
            return function () { if (d1) d1(); if (d2) d2(); if (d3) d3(); if (d4) d4(); if (d5) d5(); return unmount() }
          }).catch(function (err) {
            if (typeof console !== 'undefined') console.error('[dsh-plugin-manager] client apply failed:', err)
            registerFallback(ctx, err && err.message ? err.message : String(err))
            return function () {}
          })
        }
        exports.apply = apply
        exports.inject = ['remote', 'slots', 'locale']
        exports.__contribution = CONTRIBUTION
        return module.exports
      },
    })
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[dsh-plugin-manager/client] load failed:', e)
  }
})()
