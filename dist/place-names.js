/* Source names are retained for audit/search; one formatter serves every UI. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.PlaceNames=factory()})(this,()=>{
function clean(name){return String(name||'').replace(/^[（(]관악사[)）]\s*/, '').replace(/^기초교육원$/, '학부대학').replace(/^관악\s+[\d-]+동\[([^\]]+)\]$/,'$1').replace(/\s*\/\s*\d+동\s*증[·ㆍ]?개축\s*부분$/,'').replace(/\s*[（(]\s*(?:제\s*)?\d+\s*단계\s*[)）]/g,'').replace(/\s+(?:제\s*)?\d+\s*단계(?=\s|$)/g,'').trim()}
function format(b){return b.label49?.displayName||b.place?.displayName||b.displayName||''}
function prepare(data,places){for(const p of places){p.sourceName15??=p.name;p.sourceNumber15??=p.number;p.aliases=[...new Set([...(p.aliases||[]),p.sourceName15])];p.name=clean(p.name)}for(const b of data.buildings){b.sourceName15??=b.name;b.name=clean(b.name)}}
return{clean,format,prepare};});
