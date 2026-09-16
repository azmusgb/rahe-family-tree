import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const styleDir=path.join(root,'src','styles');
const styleFiles=fs.readdirSync(styleDir).filter((name)=>name.endsWith('.css')).sort();
const ignoredDirs=new Set(['.git','node_modules','dist','.netlify','playwright-report','test-results']);
const sourceExtensions=new Set(['.html','.js','.mjs','.cjs','.json','.md']);
const legacyClassPattern=/\.((?:v\d{2,})[a-z0-9_-]*)/gi;

function walk(dir,out=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignoredDirs.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,out);
    else if(sourceExtensions.has(path.extname(entry.name).toLowerCase()))out.push(full);
  }
  return out;
}

function countMatches(text,className){
  const escaped=className.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return (text.match(new RegExp(`\\b${escaped}\\b`,'g'))||[]).length;
}

const classes=new Map();
for(const file of styleFiles){
  const rel=path.join('src','styles',file);
  const css=fs.readFileSync(path.join(styleDir,file),'utf8');
  for(const match of css.matchAll(legacyClassPattern)){
    const className=match[1];
    const entry=classes.get(className)||{className,cssOccurrences:0,cssFiles:new Set(),sourceOccurrences:0,sourceFiles:new Set()};
    entry.cssOccurrences+=1;
    entry.cssFiles.add(rel);
    classes.set(className,entry);
  }
}

const sourceFiles=walk(root).filter((file)=>!file.startsWith(styleDir+path.sep));
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const entry of classes.values()){
    const count=countMatches(text,entry.className);
    if(!count)continue;
    entry.sourceOccurrences+=count;
    entry.sourceFiles.add(path.relative(root,file));
  }
}

const inventory=[...classes.values()].map((entry)=>({
  className:entry.className,
  cssOccurrences:entry.cssOccurrences,
  cssFiles:[...entry.cssFiles].sort(),
  sourceOccurrences:entry.sourceOccurrences,
  sourceFiles:[...entry.sourceFiles].sort(),
  cssOnly:entry.sourceOccurrences===0,
})).sort((a,b)=>b.sourceOccurrences-a.sourceOccurrences||b.cssOccurrences-a.cssOccurrences||a.className.localeCompare(b.className));

const report={
  generatedAt:new Date().toISOString(),
  totals:{
    versionedClasses:inventory.length,
    cssOccurrences:inventory.reduce((sum,item)=>sum+item.cssOccurrences,0),
    sourceOccurrences:inventory.reduce((sum,item)=>sum+item.sourceOccurrences,0),
    cssOnlyClasses:inventory.filter((item)=>item.cssOnly).length,
  },
  byCssFile:Object.fromEntries(styleFiles.map((file)=>{
    const rel=path.join('src','styles',file);
    const items=inventory.filter((item)=>item.cssFiles.includes(rel));
    return [rel,{classes:items.length,occurrences:items.reduce((sum,item)=>sum+item.cssOccurrences,0)}];
  })),
  inventory,
};

const output=path.join(root,'docs','css-versioned-selector-report.json');
fs.writeFileSync(output,`${JSON.stringify(report,null,2)}\n`);

if(process.argv.includes('--assert-none')&&inventory.length){
  console.error(`Versioned selector audit failed: ${inventory.length} versioned class(es) remain.`);
  process.exitCode=1;
}

console.log(JSON.stringify(report.totals));
