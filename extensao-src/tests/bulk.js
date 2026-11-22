// Teste em massa: usa cada nó real da árvore como "título de aula" e vê se o resolver devolve esse nó (ou ancestral/duplicata sinalizada)
const { loadExtensionResolver } = require('./loadResolver.js');
const { R, treeJson } = loadExtensionResolver();
const tree = R.loadTree(treeJson);
const strip=n=>n.replace(/^(?:cap[ií]tulo|se[cç][aã]o|t[ií]tulo|livro)\s+[\dIVXLC]+(?:\s*-\s*[A-Z])?\s*[-–:]\s*/i,'').replace(/^Lei\s+(?:n[º°.]?\s*)?[\d.\/]+\s*[–-]\s*/i,'');
let tot=0,ok=0,amb=0,none=0,wrong=0;const wr=[];
for(const s of tree.subjects.values()){
  const byName=new Map();for(const n of s.nodes){const k=n.name.toLowerCase();byName.set(k,(byName.get(k)||0)+1);}
  for(const n of s.nodes){
    if(n.isLeaf||n.depth>3)continue;
    for(const variant of [n.name,strip(n.name)]){
      if(!variant||variant.length<4)continue;
      tot++;
      const r=R.resolveLesson(tree,{subjectName:s.name,lessons:[variant],topic:'',subtopics:[]});
      const dup=byName.get(n.name.toLowerCase())>1;
      if(!r.ids.length){ if(r.alternatives.some(a=>a.id===n.id))amb++; else {none++; if(wr.length<14)wr.push(['NONE',s.name.slice(0,18),variant.slice(0,60)]);} continue;}
      const hit=r.ids.includes(n.id)||r.ids.some(id=>{let c=s.byId.get(n.id);while(c){if(c.id===id)return true;c=s.byId.get(c.parentId);}return false;});
      if(hit)ok++; else if(dup)amb++; else {wrong++; if(wr.length<14)wr.push(['WRONG',s.name.slice(0,18),variant.slice(0,50),'→',r.picks.map(p=>p.name.slice(0,40)).join(' | ')]);}
    }
  }
}
console.log({tot,ok,amb_ou_alternativas:amb,sem_decisao:none,errado:wrong,acerto:(ok/tot*100).toFixed(1)+'%',errado_pct:(wrong/tot*100).toFixed(2)+'%'});
wr.forEach(x=>console.log(x.join(' ')));
