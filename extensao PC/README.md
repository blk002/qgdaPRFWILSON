# QG da PRF — Rastreador Caveira (Extensão Chrome MV3)

## Filtro por IDs (`caveira_arvore.json`)
A partir da **v1.4.0** a extensão resolve disciplinas e assuntos localmente (`treeMatcher.js` + `caveiraResolver.js`) sobre `caveira_arvore.json` e navega direto para a URL de questões do Caveira (`buildUrl`), sem chamar a API do Caveira durante o uso normal.

## Como regenerar `caveira_arvore.json`
Se o Caveira ganhar disciplinas ou assuntos novos, rode o script abaixo no **DevTools Console** em `https://app.caveira.com/questions`, logado. Ele captura o token da própria sessão (não pede nem salva token), lê a API com chamadas sequenciais e baixa o arquivo novo. Substitua o `caveira_arvore.json` da extensão e recarregue-a em `chrome://extensions`.

Formato real da API: lista PLANA; cada item tem `value` (id) e `label` com o caminho de ids na frente (ex.: `.8199.8200.8201. Art. 1º`); o item `group: true` é a própria disciplina.

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
