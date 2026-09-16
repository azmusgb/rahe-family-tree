import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'src','styles','composition.css');
let css=fs.readFileSync(file,'utf8');

function replaceOnce(from,to,label){
  const first=css.indexOf(from);
  if(first<0)throw new Error(`Missing composition pattern: ${label}`);
  if(css.indexOf(from,first+from.length)>=0)throw new Error(`Ambiguous composition pattern: ${label}`);
  css=css.slice(0,first)+to+css.slice(first+from.length);
}

replaceOnce(`.page-heading{\n  align-items:end;\n  gap:32px;\n  margin-bottom:24px;\n}`,
`.page-heading{\n  max-width:1120px;\n  align-items:flex-start;\n  gap:24px;\n  margin-bottom:28px;\n}`,'page heading');

replaceOnce(`.page-heading h1{\n  margin:.12em 0 .14em;\n  font-family:var(--family-font-display);\n  font-size:clamp(2.7rem,5.4vw,5.2rem);\n  line-height:.95;\n  letter-spacing:-.045em;\n  color:var(--green);\n  text-wrap:balance;\n}`,
`.page-heading h1{\n  margin:.12em 0 .14em;\n  font-family:var(--family-font-display);\n  font-size:clamp(2.35rem,4.2vw,4.25rem);\n  line-height:.98;\n  letter-spacing:-.038em;\n  color:var(--green);\n  text-wrap:balance;\n}`,'page heading title');

replaceOnce(`.page-heading>div>p:last-child,.page-heading>p:last-child{\n  max-width:68ch;\n  color:var(--muted-strong);\n  font-size:clamp(.92rem,1.15vw,1.02rem);\n  line-height:1.7;\n}`,
`.page-heading>div>p:last-child,.page-heading>p:last-child{\n  max-width:62ch;\n  color:var(--muted-strong);\n  font-size:.96rem;\n  line-height:1.62;\n}`,'page heading copy');

replaceOnce(`/* Keep ordinary pages editorial rather than billboard-sized. */\n.page-heading{max-width:1120px;align-items:flex-start;gap:24px;margin-bottom:28px}\n.page-heading h1{font-size:clamp(2.35rem,4.2vw,4.25rem);line-height:.98;letter-spacing:-.038em}\n.page-heading>div>p:last-child,.page-heading>p:last-child{max-width:62ch;font-size:.96rem;line-height:1.62}\n\n`,``,'page heading stabilization override');

replaceOnce(`.filters,#filters{\n  gap:12px;\n  padding:12px;\n  border:1px solid var(--line);\n  border-color:color-mix(in srgb,var(--line) 92%,transparent);\n  border-radius:18px;\n  background:rgba(255,253,248,.8);\n  box-shadow:var(--family-shadow-card);\n  -webkit-backdrop-filter:blur(12px);\n  backdrop-filter:blur(12px);\n}`,
`.filters,#filters{\n  gap:12px;\n  padding:10px;\n  border:1px solid var(--line);\n  border-color:color-mix(in srgb,var(--line) 92%,transparent);\n  border-radius:16px;\n  background:rgba(255,253,248,.8);\n  background:color-mix(in srgb,var(--paper) 92%,transparent);\n  box-shadow:none;\n  -webkit-backdrop-filter:blur(12px);\n  backdrop-filter:blur(12px);\n}`,'filters shell');

replaceOnce(`.filters input,.filters select,#filters input,#filters select{\n  border-color:transparent;\n  background:#f5f3ed;\n  min-height:46px;\n  transition:\n    border-color var(--family-motion-fast,140ms),\n    background var(--family-motion-fast,140ms),\n    box-shadow var(--family-motion-fast,140ms);\n}`,
`.filters input,.filters select,#filters input,#filters select{\n  min-height:44px;\n  border:1px solid transparent;\n  background:#f5f3ed;\n  background:var(--surface-soft);\n  transition:\n    border-color var(--family-motion-fast,140ms),\n    background var(--family-motion-fast,140ms),\n    box-shadow var(--family-motion-fast,140ms);\n}`,'filter controls');

replaceOnce(`.filters,#filters{padding:10px;border-radius:16px;box-shadow:none;background:color-mix(in srgb,var(--paper) 92%,transparent)}\n.filters input,.filters select,#filters input,#filters select{min-height:44px;border:1px solid transparent;background:var(--surface-soft)}\n`,``,'filter stabilization override');

replaceOnce(`.site-footer{\n  margin-top:clamp(48px,8vw,110px);\n  border-top:1px solid var(--line);\n  background:#efece3;\n}`,
`.site-footer{\n  margin-top:clamp(40px,6vw,80px);\n  border-top:1px solid var(--line);\n  background:transparent;\n}`,'footer');
replaceOnce(`\n/* Footer should recede rather than become another large panel. */\n.site-footer{margin-top:clamp(40px,6vw,80px);background:transparent}\n`,``,'footer override');

replaceOnce(`.v17-home-hero,.family-home-hero,.dashboard-hero{\n  position:relative;\n  isolation:isolate;\n  overflow:hidden;\n  border:1px solid rgba(18,63,52,.12);\n  border-radius:30px;\n  background:\n    radial-gradient(circle at 78% 18%,rgba(201,160,92,.32),transparent 16rem),\n    linear-gradient(135deg,#123f34 0%,#1f5848 54%,#816329 145%);\n  box-shadow:0 28px 70px rgba(18,45,36,.16);\n}`,
`.v17-home-hero,.family-home-hero,.dashboard-hero{\n  position:relative;\n  isolation:isolate;\n  overflow:hidden;\n  border:1px solid rgba(18,63,52,.12);\n  border-radius:24px;\n  background:\n    radial-gradient(circle at 78% 18%,rgba(201,160,92,.32),transparent 16rem),\n    linear-gradient(135deg,#123f34 0%,#1f5848 54%,#816329 145%);\n  box-shadow:0 18px 48px rgba(18,45,36,.12);\n}`,'home hero shell');
replaceOnce(`.v17-home-hero,.dashboard-hero{min-height:clamp(390px,52vh,600px)}`,
`.v17-home-hero,.dashboard-hero{min-height:clamp(350px,46vh,520px)}`,'home hero height');
replaceOnce(`  font-size:clamp(3.35rem,7vw,6.6rem);`, `  font-size:clamp(3rem,6vw,5.6rem);`,'home hero heading size');
replaceOnce(`.v174-discovery{padding-block:clamp(38px,5vw,68px)}`,
`.v174-discovery{padding-block:clamp(32px,4vw,54px)}`,'home discovery spacing');
replaceOnce(`.v174-discovery-grid>button{\n  min-height:126px;\n  padding:18px;\n  border-color:var(--line);\n  border-radius:18px;\n  background:rgba(255,253,248,.88);\n  box-shadow:var(--family-shadow-card);\n}`,
`.v174-discovery-grid>button{\n  min-height:112px;\n  padding:18px;\n  border-color:var(--line);\n  border-radius:16px;\n  background:rgba(255,253,248,.88);\n  box-shadow:none;\n}`,'home discovery cards');
replaceOnce(`\n/* Home: preserve identity, reduce visual weight after the hero. */\n.v17-home-hero,.family-home-hero,.dashboard-hero{border-radius:24px;box-shadow:0 18px 48px rgba(18,45,36,.12)}\n.v17-home-hero,.dashboard-hero{min-height:clamp(350px,46vh,520px)}\n.v17-home-hero h1,.family-home-copy h2,.dashboard-hero-copy h2{font-size:clamp(3rem,6vw,5.6rem)}\n.v174-discovery{padding-block:clamp(32px,4vw,54px)}\n.v174-discovery-grid>button{min-height:112px;border-radius:16px;box-shadow:none}\n`,``,'home stabilization override');

fs.writeFileSync(file,css);
console.log('Collapsed 11 sequential composition override groups into their owning declarations.');
