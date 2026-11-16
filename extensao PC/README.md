# QG da PRF — Rastreador Caveira (Extensão Chrome MV3)

## Filtro por IDs (`caveira_arvore.json`)
A partir da **v1.4.0**, a extensão resolve disciplinas e assuntos localmente usando `treeMatcher.js` + `caveiraResolver.js` sobre `caveira_arvore.json` e navega diretamente para a URL de questões do Caveira (`buildUrl`), sem chamar a API do Caveira durante o uso normal.

## Como regenerar `caveira_arvore.json`
Se novas disciplinas ou subtópicos forem adicionados no Projeto Caveira, você pode atualizar `extensao PC/caveira_arvore.json` rodando o script abaixo no **DevTools Console** enquanto estiver logado em `https://app.caveira.com`:

> **Importante:** nunca salve tokens de autenticação no repositório. O snippet abaixo lê o token apenas da sua sessão ativa no navegador.

```js
(async () => {
  // 1. Informe seu Bearer token da sessão atual (copie do header Authorization em DevTools > Network)
  const TOKEN = prompt('Cole o Bearer token (apenas "eyJ...") da sua sessão atual no Caveira:');
  if (!TOKEN) return;

  const headers = { Authorization: `Bearer ${TOKEN.replace(/^Bearer\s+/i, '').trim()}` };
  const api = 'https://api.caveira.com/api/v1/services';

  const subjResp = await fetch(`${api}/subjects?limit=200&career_id=all`, { headers });
  const subjJson = await subjResp.json();
  const rawSubjects = Array.isArray(subjJson?.data) ? subjJson.data : (Array.isArray(subjJson) ? subjJson : []);

  const flattenTree = (nodes, depth = 1, parentId = null, parentPath = []) => {
    const out = [];
    for (const n of nodes || []) {
      const path = [...parentPath, n.name];
      out.push({ id: n.id, parentId: n.parent_id ?? parentId, depth, name: n.name, path });
      if (Array.isArray(n.children) && n.children.length > 0) {
        out.push(...flattenTree(n.children, depth + 1, n.id, path));
      }
    }
    return out;
  };

  const subjects = [];
  for (const s of rawSubjects) {
    const r = await fetch(`${api}/subtopics?filter=&limit=5000&subject_ids[]=${s.id}&career_id=all`, { headers });
    const j = await r.json();
    const rawNodes = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
    subjects.push({ id: s.id, name: s.name, nodes: flattenTree(rawNodes, 1, null, [s.name]) });
  }

  const out = { geradoEm: new Date().toISOString().slice(0, 10), subjects };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'caveira_arvore.json';
  a.click();
})();
```

Substitua o arquivo `extensao PC/caveira_arvore.json` pelo JSON baixado e recarregue a extensão em `chrome://extensions`.
