# Contrato de Comunicação — QG da PRF Web App ↔ Extensão (v3.1.0)

Este documento define o contrato oficial de mensagens entre a aplicação Web **QG da PRF** (`https://blk002.github.io/qgdaPRFWILSON`) e a extensão **QG da PRF — Rastreador Caveira (`v3.1.0`)**.

---

## 1. Camadas de Mensageria & Segurança de Canal

### 1.1 Web App (`QG_WEB_APP`) ↔ `qg_bridge.js` (`ISOLATED` world)
- **Transporte:** `window.postMessage(message, targetOrigin)`
- **Validação obrigatória nos dois lados:**
  ```js
  if (!event || event.source !== window || event.origin !== window.location.origin) return;
  ```
- Na extensão (`qg_bridge.js`), além de `event.source === window && event.origin === window.location.origin`, exige-se hostname em `ALLOWED_WEB_HOSTS` (`blk002.github.io`, `localhost`, `127.0.0.1`).
- Respostas de `qg_bridge.js` ao site usam `window.location.origin` como `targetOrigin` (nunca `'*'`).

### 1.2 `api_sniffer.js` (`MAIN` world) ↔ `content.js` (`ISOLATED` world)
- Ao inicializar, `content.js` gera um nonce criptográfico aleatório (`CHANNEL_NONCE`) e o envia via evento `CustomEvent('qg-caveira-sniffer-init', { detail: { nonce, diagnosticMode } })`.
- Todas as mensagens `postMessage` entre `QG_CAVEIRA_SNIFFER` e `QG_CAVEIRA_CONTENT` carregam `nonce` e são descartadas se `event.source !== window`, `event.origin !== window.location.origin` ou `event.data.nonce !== CHANNEL_NONCE`.

### 1.3 Credenciais e Dados Sensíveis
- Tokens Supabase enviados pelo site em `QG_PRF_SYNC_CLOUD_CREDS` são gravados **exclusivamente** em `chrome.storage.session` (volátil em memória, nunca em `chrome.storage.local` nem em backups/diagnósticos).
- Tokens `Authorization: Bearer` / JWTs do Projeto Caveira nunca são persistidos, exportados ou incluídos no **Modo Diagnóstico**.

---

## 2. Contrato de Entrega Confiável de Simulados (`SIMULADOS_IMPORT` ↔ `SIMULADOS_IMPORT_ACK`)

### 2.1 Fila Durável na Extensão (`qg_pending_simulados_queue`)
Quando o aluno importa simulados no Caveira (`content.js` → `enqueueSimuladosIntoQueue`):
- Cada simulado recebe chave única `caveiraId` (ou fallback determinístico `sim_title_<slug>`), com **dedupe por `caveiraId`**.
- **TTL:** 7 dias (`604800000 ms`).
- **Máximo de tentativas:** `10` por item.
- Estados visíveis no HUD e no Popup:
  1. `saved` → *"salvo na extensão — enviando ao QG..."*
  2. `sending` → *"enviando ao QG..."*
  3. `waiting_qg` → *"aguardando o QG (abra o site e faça login)"*
  4. `confirmed` → *"entregue ao QG (confirmado)"* (itens removidos da fila **somente após** receber `SIMULADOS_IMPORT_ACK`)
  5. `failed` → *"pendente(s) após 10 tentativas — clique 'Reenviar' no popup"*

### 2.2 Mensagem Extensão → Site: `SIMULADOS_IMPORT`
```json
{
  "source": "QG_CAVEIRA_EXTENSION",
  "type": "SIMULADOS_IMPORT",
  "payload": {
    "deliveryId": "dlv_1760000000000_ab12c",
    "userId": "uuid-do-usuario-logado",
    "simulados": [
      {
        "caveiraId": "sim_caveira_42",
        "title": "Simulado PRF #11",
        "data": "2026-05-18",
        "hits": 82,
        "errors": 24,
        "blank": 14,
        "totalQuestions": 120,
        "liquida": 58,
        "source": "api",
        "estimated": false,
        "subjects": [
          {
            "name": "Legislação de Trânsito",
            "bloco": "Bloco II",
            "hits": 28,
            "errors": 6,
            "liquida": 22
          }
        ]
      }
    ]
  }
}
```
> Campos estimados a partir de API parcial ou DOM trazem `"estimated": true` e `"estimateReason"` explícito; números ausentes não são inventados silenciosamente.

### 2.3 Confirmação Site → Extensão: `SIMULADOS_IMPORT_ACK`
Assim que o site processar `SIMULADOS_IMPORT`, ele deve responder na mesma janela:
```json
{
  "source": "QG_WEB_APP",
  "type": "SIMULADOS_IMPORT_ACK",
  "payload": {
    "ids": ["sim_caveira_42"],
    "imported": 1,
    "deliveryId": "dlv_1760000000000_ab12c"
  }
}
```
- Se o ACK não chegar em **5 segundos**, o `qg_bridge.js` incrementa `attempts`, marca `waiting_qg` e agenda reenvios com backoff (`5s`, `15s`, `45s`).
- Em `FLUSH_PENDING_QG_EVENTS`, se `cachedActiveUserId` estiver nulo em memória, o `qg_bridge.js` lê `qg_active_user_id` de `chrome.storage.local` antes de desistir.

### 2.4 Trecho de Referência para o Site (`src/App.jsx`)
```js
const handleExtensionMessage = (event) => {
  if (!event || event.source !== window || event.origin !== window.location.origin) return;
  if (event.data?.source !== 'QG_CAVEIRA_EXTENSION') return;

  if (event.data.type === 'SIMULADOS_IMPORT' && event.data.payload) {
    const rawSimulados = Array.isArray(event.data.payload.simulados) ? event.data.payload.simulados : [];
    const imported = useStore.getState().importCaveiraSimulados?.(rawSimulados);
    const ids = rawSimulados.map((s) => s?.caveiraId || s?.id).filter(Boolean);

    window.postMessage({
      source: 'QG_WEB_APP',
      type: 'SIMULADOS_IMPORT_ACK',
      payload: {
        ids,
        imported: Number(imported) || 0,
        deliveryId: event.data.payload.deliveryId || null,
      },
    }, window.location.origin);
  }
};

window.addEventListener('message', handleExtensionMessage);
```

---

## 3. Catálogo Completo de Mensagens (`window.postMessage`)

### 3.1 Extensão → Site (`source: "QG_CAVEIRA_EXTENSION"`)
| `type` | Descrição |
| --- | --- |
| `SYNC_UPDATE` | Sincroniza questão recém-salva / lista filtrada, `session` e `dailyGoal`. |
| `CAVEIRA_DATA_RESPONSE` | Resposta sob demanda (`FETCH_CAVEIRA_DATA`) ou no foco/login com questões, `session` e `dailyGoal`. |
| `SIMULADOS_IMPORT` | Envia simulados pendentes com `deliveryId` aguardando `SIMULADOS_IMPORT_ACK`. |
| `COURSE_INDEX_SYNC` | Envia cache do índice de aulas (`qg_caveira_course_index_cache`). |
| `COURSE_CATALOG_SYNC` | Envia catálogo estruturado de módulos/aulas capturado no Caveira. |
| `COURSE_LESSON_COMPLETE_REQUEST` | Abre fluxo de conclusão de aula no QG após clique no player do Caveira. |
| `FILTER_MEMORY_SYNC` | Sincroniza mapa local de memórias ID→assunto (`qg_caveira_filter_id_memory_v1`). |
| `PDF_STUDY_LOG` | Registra sessão de leitura de PDF capturada no Caveira. |
| `SESSION_CLEARED` | Confirmação após `CLEAR_SESSION`. |

### 3.2 Site → Extensão (`source: "QG_WEB_APP"`)
| `type` | Descrição |
| --- | --- |
| `SIMULADOS_IMPORT_ACK` | Confirma recebimento de `SIMULADOS_IMPORT` por `{ ids, imported, deliveryId }`. |
| `SET_ACTIVE_USER` | Informa `{ userId, userEmail, userLabel }`, troca o bucket local e dispara entrega de pendências. |
| `USER_SIGNED_OUT` | Limpa bucket ativo em memória e remove token volátil em `chrome.storage.session`. |
| `QG_PRF_SYNC_CLOUD_CREDS` | Envia credenciais temporárias para o background manter somente em `chrome.storage.session`. |
| `QG_PRF_SYNC_REMINDER_STATE` | Atualiza resumo de metas/FSRS/streak para alertas em 2º plano. |
| `FETCH_CAVEIRA_DATA` | Solicita `CAVEIRA_DATA_RESPONSE` e eventos pendentes para `userId`. |
| `OPEN_CAVEIRA_PRACTICE` | Abre/foca aba do Caveira e aplica filtro automático (`subject`, `topic`, `lessons`, `examBoards`, `numberAlternatives`). |
| `QG_PRF_SYNC_TODAY_MISSION` | Sincroniza a missão do dia para exibição no HUD do Caveira. |
| `QG_PRF_SYNC_SUBJECT_SPEEDS` | Sincroniza velocidades preferidas do player por disciplina. |
| `QG_PRF_SYNC_FILTER_MEMORY` | Sincroniza memórias de filtro salvas na nuvem. |
| `UPDATE_CAVEIRA_QUESTION` | Atualiza questão (`note`, `fsrs`, `confidence`, etc.) no IndexedDB + storage. |
| `DELETE_CAVEIRA_QUESTION` | Remove questão por `id` do IndexedDB + storage. |
| `REPLACE_CAVEIRA_QUESTIONS` | Substitui lista completa de questões da sessão. |
| `SET_CAVEIRA_DAILY_GOAL` | Atualiza meta diária de questões. |
| `CLEAR_SESSION` | Zera lista/contadores do dia. |

---

## 4. Telemetria Estruturada por Questão (P0 #3)
Cada questão capturada combina resposta real da API do Caveira (`/api/v1/skull/question-database`) com o estado visual do card, mantendo `apiId` numérico separado do código textual (`code`) e mapeando para `caveira_arvore.json`:
```json
{
  "id": "Q104328",
  "apiId": 104328,
  "subjectId": 8199,
  "subtopicId": 8201,
  "banca": "CEBRASPE",
  "ano": "2002",
  "acertou": true,
  "data": "2026-05-18"
}
```
> Quando o código explícito `"Qxxxx"` não vier no payload da API nem no DOM, `apiId` continua preservado sem forjar código da plataforma.
