const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Core Structure
content = content.replace(/className="min-h-screen bg-slate-50 font-sans"/g, 'className={`min-h-screen transition-colors duration-300 ${isDarkMode ? \'dark bg-slate-950 text-slate-100\' : \'bg-slate-50 text-slate-900\'}`}');

// 2. Comprehensive Class Map
const classMap = {
    'bg-white': 'dark:bg-slate-900',
    'bg-slate-50': 'dark:bg-slate-950',
    'bg-slate-100': 'dark:bg-slate-800',
    'bg-slate-200': 'dark:bg-slate-800',
    'text-slate-800': 'dark:text-slate-100',
    'text-slate-700': 'dark:text-slate-200',
    'text-slate-600': 'dark:text-slate-300',
    'text-slate-500': 'dark:text-slate-400',
    'border-slate-200': 'dark:border-slate-800',
    'border-slate-300': 'dark:border-slate-700',
    'border-slate-100': 'dark:border-slate-800',
};

// Replace classes inside className="..."
content = content.replace(/className="(.*?)"/g, (match, classes) => {
    let newClasses = classes;
    Object.entries(classMap).forEach(([light, dark]) => {
        if (newClasses.includes(light) && !newClasses.includes(dark)) {
            newClasses += ` ${dark}`;
        }
    });
    // Add dark:text-slate-400 to any label classes if missing
    if (match.includes('<label') || /<label/.test(content.substring(content.lastIndexOf('<', content.indexOf(match)), content.indexOf(match)))) {
       // This is complex, let's just do a simpler pass
    }
    return `className="${newClasses}"`;
});

// 3. Fix labels specifically (Removed broken generic <label injection)
content = content.replace(/<label([^>]*)className="([^"]*)"/g, (match, p1, p2) => {
    if (p2.includes('dark:text-')) return match;
    return `<label${p1}className="${p2} dark:text-slate-400"`;
});

// 4. Input backgrounds
content = content.replace(/<input(.*?)className="(.*?)"/g, (match, p1, p2) => {
    if (p2.includes('dark:bg-')) return match;
    return `<input${p1}className="${p2} dark:bg-slate-800 dark:text-white dark:border-slate-700"`;
});

// 5. Inject Notes Modal if missing
if (!content.includes('editingNotes &&')) {
    const modalCode = `
      {/* MODAL: CADERNO DE ERROS / NOTAS */}
      {editingNotes && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={\`\${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white text-slate-900'} w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden\`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote className="text-blue-500 w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-wider italic">Caderno de Erros</h3>
              </div>
              <button onClick={() => setEditingNotes(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">{subjects[editingNotes.subjectId]?.name} • {editingNotes.topicName}</p>
              <textarea 
                autoFocus
                value={editingNotes.content}
                onChange={(e) => setEditingNotes({...editingNotes, content: e.target.value})}
                placeholder="Anote aqui as pegadinhas e pontos críticos deste assunto..." 
                className={\`w-full h-48 p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all shadow-inner \${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}\`}
              />
              <div className="flex justify-end gap-3 mt-5">
                <button 
                  onClick={() => setEditingNotes(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setSubjects(prev => {
                      const newSubjects = { ...prev };
                      const topics = [...newSubjects[editingNotes.subjectId].topics];
                      const idx = topics.findIndex(t => t.id === editingNotes.topicId);
                      if (idx !== -1) {
                        topics[idx] = { ...topics[idx], notes: editingNotes.content };
                      }
                      newSubjects[editingNotes.subjectId].topics = topics;
                      return newSubjects;
                    });
                    setEditingNotes(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" /> Salvar Notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;
    content = content.replace('      {/* MODAL GLOBAL */}', modalCode + '      {/* MODAL GLOBAL */}');
}


fs.writeFileSync(filePath, content, 'utf8');
console.log("Ultimate Dark Mode Fix applied.");
