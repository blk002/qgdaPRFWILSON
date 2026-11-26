// Gerenciador de Árvore Dinâmica do Caveira (#7 — Mescla baseline + nós capturados via API)

export function mergeBaselineAndDynamicTree(baselineJson, dynamicRows = []) {
  if (!baselineJson || !Array.isArray(baselineJson.subjects)) {
    return { mergedJson: baselineJson, dynamicAddedCount: 0 };
  }

  const subjectsCopy = baselineJson.subjects.map((s) => ({
    ...s,
    nodes: Array.isArray(s.nodes) ? s.nodes.map((n) => ({ ...n })) : [],
  }));

  if (!Array.isArray(dynamicRows) || dynamicRows.length === 0) {
    return { mergedJson: { ...baselineJson, subjects: subjectsCopy }, dynamicAddedCount: 0 };
  }

  const bySubjectId = new Map();
  subjectsCopy.forEach((s) => {
    const nodeMap = new Map();
    s.nodes.forEach((n) => nodeMap.set(Number(n.id), n));
    bySubjectId.set(Number(s.id), { subj: s, nodeMap });
  });

  let dynamicAddedCount = 0;

  dynamicRows.forEach((row) => {
    if (!row || !row.subjectId || !row.nodeId || !row.name) return;
    const sId = Number(row.subjectId);
    const nId = Number(row.nodeId);
    let bucket = bySubjectId.get(sId);

    if (!bucket) {
      const newSubj = {
        id: sId,
        name: row.subjectName || `Disciplina ${sId}`,
        count: 0,
        nodes: [],
      };
      subjectsCopy.push(newSubj);
      bucket = { subj: newSubj, nodeMap: new Map() };
      bySubjectId.set(sId, bucket);
    } else if (row.subjectName && row.subjectName.length > 2 && !bucket.subj.name) {
      bucket.subj.name = row.subjectName;
    }

    const existing = bucket.nodeMap.get(nId);
    if (existing) {
      if (row.name && existing.name !== row.name) {
        existing.name = row.name;
      }
      return;
    }

    const parentId = Number(row.parentId || sId);
    const parentNode = bucket.nodeMap.get(parentId);
    const computedDepth = parentNode ? (Number(parentNode.depth) || 1) + 1 : (Number(row.depth) || 1);
    const computedPath = (Array.isArray(row.path) && row.path.length > 0)
      ? row.path.map(Number)
      : parentNode && Array.isArray(parentNode.path)
      ? [...parentNode.path, nId]
      : [sId, nId];

    const newNode = {
      id: nId,
      parentId,
      depth: computedDepth,
      name: String(row.name).trim(),
      path: computedPath,
    };
    bucket.subj.nodes.push(newNode);
    bucket.subj.count = bucket.subj.nodes.length;
    bucket.nodeMap.set(nId, newNode);
    dynamicAddedCount += 1;
  });

  return {
    mergedJson: {
      ...baselineJson,
      subjects: subjectsCopy,
    },
    dynamicAddedCount,
  };
}

export function extractTreeNodesFromApiJson(url = '', data = null) {
  if (!data || typeof data !== 'object') return [];
  const lowerUrl = String(url || '').toLowerCase();
  // Só processa endpoints prováveis de filtro/disciplina/assunto/tópico
  if (lowerUrl && !/(subject|discipline|topic|subtopic|filter|tree|category)/i.test(lowerUrl)) {
    return [];
  }

  const root = (data.data && typeof data.data === 'object') ? data.data : data;
  const rows = [];
  const seenKeys = new Set();

  const pushNode = (subjectId, subjectName, node, parentId, depth, pathPrefix) => {
    if (!node || typeof node !== 'object') return;
    const nodeId = Number(node.id ?? node.subtopic_id ?? node.topic_id);
    const name = String(node.name ?? node.title ?? node.label ?? '').trim();
    if (!Number.isFinite(nodeId) || nodeId <= 0 || !name) return;

    const sId = Number(subjectId || node.subject_id || node.discipline_id || nodeId);
    const pId = Number(node.parent_id ?? node.parentId ?? parentId ?? sId);
    const path = [...pathPrefix, nodeId];
    const key = `${sId}:${nodeId}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      rows.push({
        subjectId: sId,
        subjectName: String(subjectName || '').trim(),
        nodeId,
        parentId: pId,
        depth,
        name,
        path,
      });
    }

    const nested = node.children || node.subtopics || node.topics || node.items || [];
    if (Array.isArray(nested)) {
      nested.forEach((ch) => pushNode(sId, subjectName, ch, nodeId, depth + 1, path));
    }
  };

  const subjMatch = lowerUrl.match(/subject[_-]?id[s]?=(\d+)/i) || lowerUrl.match(/\/subjects\/(\d+)/i);
  const urlSubjectId = subjMatch ? Number(subjMatch[1]) : null;

  const list = Array.isArray(root)
    ? root
    : Array.isArray(root.subjects)
    ? root.subjects
    : Array.isArray(root.disciplines)
    ? root.disciplines
    : Array.isArray(root.subtopics)
    ? root.subtopics
    : Array.isArray(root.topics)
    ? root.topics
    : (root.id && (root.subtopics || root.topics || root.children))
    ? [root]
    : [];

  list.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const hasChildrenTree = Array.isArray(item.subtopics || item.topics || item.children);
    const hasExplicitSubjectOwner = Boolean(urlSubjectId || item.subject_id || item.discipline_id);
    const looksLikeSubject = !hasExplicitSubjectOwner && (hasChildrenTree || /subject|discipline/i.test(lowerUrl));

    if (looksLikeSubject) {
      const sId = Number(item.id || item.subject_id);
      const sName = String(item.name || item.title || '').trim();
      const children = item.subtopics || item.topics || item.children || [];
      if (Number.isFinite(sId) && sId > 0 && Array.isArray(children)) {
        children.forEach((ch) => pushNode(sId, sName, ch, sId, 1, [sId]));
      }
    } else if (urlSubjectId || item.subject_id || item.discipline_id) {
      const sId = Number(item.subject_id || item.discipline_id || urlSubjectId);
      const sName = String(item.subject_name || item.subjectName || '').trim();
      if (Number.isFinite(sId) && sId > 0) {
        pushNode(sId, sName, item, item.parent_id || sId, 1, [sId]);
      }
    }
  });

  return rows;
}
