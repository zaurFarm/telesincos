const fs = require('fs');
let c = fs.readFileSync('src/Landing.tsx', 'utf8');
c = c.replace(/<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500\/10 border border-blue-500\/20 text-xs text-blue-400 font-mono mb-4 uppercase tracking-widest animate-pulse">\s*<Globe className="w-3\.5 h-3\.5" \/>\s*\{lt\.liveRouting\}\s*<\/div>/, '');
fs.writeFileSync('src/Landing.tsx', c);
