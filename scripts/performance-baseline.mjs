import fs from'node:fs';

const path=process.argv[2];
if(!path){
  console.error('usage: node scripts/performance-baseline.mjs <family-performance.json>');
  process.exit(2);
}
const events=JSON.parse(fs.readFileSync(path,'utf8'));
const durations=name=>events.filter(event=>event?.name===name&&Number.isFinite(event.duration)).map(event=>event.duration).sort((a,b)=>a-b);
const percentile=(values,p)=>values.length?values[Math.min(values.length-1,Math.ceil(values.length*p)-1)]:null;
const summarize=name=>{
  const values=durations(name);
  return{samples:values.length,p50:percentile(values,.5),p95:percentile(values,.95),max:values.at(-1)??null};
};
console.log(JSON.stringify({
  routeReady:summarize('route:navigation-to-ready'),
  treeInteractive:summarize('tree:navigation-to-interactive')
},null,2));
