# QG da PRF — Rastreador Caveira (Extensão Chrome MV3 • v3.1.0)

Extensão MV3 que integra o **Projeto Caveira** ao web app **QG da PRF**:
1. Resolve assuntos e disciplinas localmente contra [`caveira_arvore.json`](caveira_arvore.json) (`caveiraResolver.js` + `treeMatcher.js` + `dynamicTreeManager.js`) e aplica filtros profundos por URL.
2. Captura telemetria real de questões (`apiId`, `subjectId`, `subtopicId`, `banca`, `ano`, `acertou`, `data`) no IndexedDB (Dexie v2 + MiniSearch).
3. Captura e entrega simulados ao QG da PRF via fila durável com confirmação (`SIMULADOS_IMPORT` ↔ `SIMULADOS_IMPORT_ACK` — ver [`CONTRATO.md`](CONTRATO.md)).
4. Oferece HUD flutuante (Shadow DOM), alertas FSRS/streak, player de vídeo com memória de velocidade/posição e sincronização direta com Supabase (token em `chrome.storage.session`).

---

## Principais novidades da v3.1.0

- **P0 — Fila confiável de Simulados + ACK:** `qg_pending_simulados_queue` com TTL de 7 dias, dedupe por `caveiraId`, até 10 tentativas com backoff (`5s`, `15s`, `45s`), fallback de `qg_active_user_id` do storage, botão **"Reenviar agora"** e contrato formal em [`CONTRATO.md`](CONTRATO.md).
- **P0 — Parser tolerante de Simulados & Modo Diagnóstico:** suporte a payloads aninhados (`result`, `summary`, `practice_exam`), marcação explícita de `estimated: true` quando houver inferência (nunca inventa `total = 120` em silêncio) e **Modo Diagnóstico** no popup (desligado por padrão; registra apenas formas/chaves sanitizadas sem tokens).
- **P0 — Telemetria real de Questões:** extração dos campos reais da API (`examining_board`, `year`, `difficulty`, `subtopic_path`, `user_answer`, `last_answer_status`, `supporting_content`), mantendo `apiId` separado do código `"Qxxxx"`, mapeando para os IDs oficiais da árvore e gravando `{ apiId, subjectId, subtopicId, banca, ano, acertou, data }`.
- **P0 — Segurança do Canal e Credenciais:** validação de `event.source === window && event.origin === window.location.origin` no `qg_bridge.js`, handshake com nonce aleatório entre `api_sniffer.js` (`MAIN`) e `content.js` (`ISOLATED`), remoção de `localhost`/`127.0.0.1` do `manifest.json` de produção, host Supabase restrito ao projeto e armazenamento de tokens Supabase exclusivamente em `chrome.storage.session`.
- **P1 — Resolver v1.5.1+ & Suíte de Testes:** árvore e algoritmos atualizados + testes automatizados (`cases.js` 12/12 e `bulk.js` >= 91,0% acerto / <= 0,31% errado).
- **P1 — Código-fonte Modular & Migração v2:** fontes organizados em `extensao-src/`, script de build esbuild, versão unificada via `manifest.json`, refresh automático do cache da árvore dinâmica, exibição da data da árvore no popup e memória inteligente de correções (só salva quando há mudança real).
- **P2 — Diagnóstico, Backup, Alerta de URL & Atalhos:** painel de diagnóstico e exportação/importação JSON no popup, detecção quando o Caveira descarta filtros da URL e atalhos `Alt+Shift+D` (Dúvida) / `Alt+Shift+C` (Chute).

---

## Estrutura de Código-Fonte e Build

Os bundles distribuídos em `extensao PC/` são compilados a partir de `extensao-src/`:

```text
extensao-src/
├── content/
│   ├── utils.js            # Chaves, normalização, nonce, sanitização de diagnóstico
│   ├── simuladosHelper.js  # Fila ACK, dedupe, parser de ranking/blocos
│   ├── questionMapper.js   # Mapeamento API → tree IDs e registro estruturado
│   ├── filterGuard.js      # Guarda de memória de seleção (#10) e verificação de URL (#12)
│   └── videoHelper.js      # Velocidade de vídeo por disciplina
├── db/extensionDb.js       # Dexie v2 + busca MiniSearch + export/import backup
├── sync/realtimeSync.js    # Sync Supabase direto com auth em chrome.storage.session
├── tree/dynamicTreeManager.js
├── ui/shadowHudHost.js
├── entries/
│   ├── content.entry.js    -> extensao PC/content.js
│   ├── background.entry.js -> extensao PC/background.js
│   ├── popup.entry.js      -> extensao PC/popup.js
│   ├── qg_bridge.entry.js  -> extensao PC/qg_bridge.js
│   ├── player_bridge.entry.js -> extensao PC/player_bridge.js
│   └── api_sniffer.entry.js -> extensao PC/api_sniffer.js
├── tests/                  # cases.js, bulk.js, demo.js, loadResolver.js
└── manifest.dev.override.json # Somente referência para testes locais em localhost
```

### Comandos (na raiz do repositório)
```bash
npm install
npm run build:extensao   # Compila extensao-src/entries/*.entry.js -> extensao PC/*.js
npm test                 # Executa cases.js (12/12) e bulk.js (8.164 tópicos)
npm run zip:extensao     # Gera releases/qg-prf-rastreador-caveira-v3.1.0.zip (com extensao-src/)
```

Verificação de sintaxe (`node --check`):
```bash
node --check "extensao PC/background.js" "extensao PC/content.js" "extensao PC/popup.js" "extensao PC/qg_bridge.js" "extensao PC/player_bridge.js" "extensao PC/api_sniffer.js"
```

> **Ambiente de Desenvolvimento Local (`localhost`):** O `manifest.json` de produção não inclui `localhost` nem `127.0.0.1`. Para testes contra servidor local, aplique manualmente as permissões de `extensao-src/manifest.dev.override.json` durante desenvolvimento local (sem publicar em produção).

---

## Atalhos de Teclado (`chrome.commands`)
- `Alt+Shift+D`: Marca a questão visível no card com confiança **Dúvida**.
- `Alt+Shift+C`: Marca a questão visível no card com confiança **Chute**.

---

## Como regenerar `caveira_arvore.json`
Se o Caveira ganhar disciplinas ou assuntos novos (ou quando o popup avisar que a árvore tem mais de 30 dias), rode o script abaixo no **DevTools Console** em `https://app.caveira.com/questions`, logado. Ele lê a API com a própria sessão sem gravar nem exportar o token:

```js
(async () => {
  let auth = null;
  const _set = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
    if (/^authorization$/i.test(k) && v) auth = v;
    return _set.apply(this, arguments);
  };
  const _fetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      const h = (init && init.headers) || (input && input.headers);
      if (h) {
        const v = h instanceof Headers ? h.get('authorization') : (h.Authorization || h.authorization);
        if (v) auth = v;
      }
    } catch (_) {}
    return _fetch.apply(this, arguments);
  };
  console.log('⏳ Aguardando a página fazer uma requisição (até 60s). Se demorar, clique em Filtrar.');
  for (let i = 0; i < 120 && !auth; i++) await new Promise(r => setTimeout(r, 500));
  if (!auth) { console.error('❌ Não capturei o token. Clique em Filtrar e rode de novo.'); return; }
  const get = async (url) => {
    const r = await _fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } });
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return r.json();
  };
  const list = (j) => Array.isArray(j) ? j : (j.data || j.items || j.results || []);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const subjects = list(await get('https://api.caveira.com/api/v1/services/subjects/?career_id=all&with_questions=1&filter=&limit=500'));
  const out = { geradoEm: new Date().toISOString(), subjects: [] };
  for (const s of subjects) {
    const sid = s.value ?? s.id, sname = s.label ?? s.name;
    try {
      const raw = list(await get(`https://api.caveira.com/api/v1/services/subtopics?filter=&limit=5000&subject_ids[]=${sid}&career_id=all`));
      if (raw.length >= 5000) console.warn('⚠️ Possível corte (5000) em', sname);
      const nodes = raw.filter(n => !n.group).map(n => {
        const m = String(n.label).match(/^\.((?:\d+\.)+)\s*(.*)$/);
        const ids = m ? m[1].split('.').filter(Boolean).map(Number) : [n.value];
        return { id: n.value, parentId: ids.length >= 2 ? ids[ids.length - 2] : null, depth: ids.length - 1, name: m ? m[2] : n.label, path: ids };
      });
      out.subjects.push({ id: sid, name: sname, count: nodes.length, nodes });
      console.log(`✔ ${sname}: ${nodes.length} nós`);
    } catch (e) {
      console.warn('✖ Falhou:', sname, e.message);
      out.subjects.push({ id: sid, name: sname, error: String(e.message), nodes: [] });
    }
    await sleep(250);
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
  a.download = 'caveira_arvore.json';
  a.click();
})();
```
