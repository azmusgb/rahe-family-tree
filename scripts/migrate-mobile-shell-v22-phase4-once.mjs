import fs from 'node:fs';

function replaceRequired(source, from, to, label){
  if(!source.includes(from)) throw new Error(`Missing expected ${label}`);
  return source.replace(from,to);
}

const runtimePath='src/runtime/mobile-ui-shell.js';
let runtime=fs.readFileSync(runtimePath,'utf8');
runtime=replaceRequired(runtime,
"const PENDING_SEARCH_KEY='family.mobile.v21.pendingSearch';\nconst PENDING_FOCUS_KEY='family.mobile.v21.pendingFocus';\nlet scheduled=false;",
"let pendingPeopleSearchValue='';\nlet pendingPeopleSearchFocus=false;\nlet scheduled=false;",
'pending search constants');

runtime=replaceRequired(runtime,
`function pendingSearch(){try{return sessionStorage.getItem(PENDING_SEARCH_KEY)||'';}catch{return'';}}\nfunction consumePendingSearch(){\n  const value=pendingSearch();\n  try{sessionStorage.removeItem(PENDING_SEARCH_KEY);}catch{}\n  return value;\n}\nfunction queuePeopleSearch(value,{focus=false}={}){\n  try{\n    if(value)sessionStorage.setItem(PENDING_SEARCH_KEY,value);\n    if(focus)sessionStorage.setItem(PENDING_FOCUS_KEY,'1');\n  }catch{}\n  if(routeKey()!=='people')location.hash='people';else schedule();\n}\nfunction hasPendingFocus(){\n  try{return sessionStorage.getItem(PENDING_FOCUS_KEY)==='1';}catch{return false;}\n}\nfunction clearPendingFocus(){try{sessionStorage.removeItem(PENDING_FOCUS_KEY);}catch{}}\nfunction focusPendingPeopleSearch(){\n  if(!hasPendingFocus())return;\n  const selector='[data-v17-native="people"] .mobile-search[data-v21-mobile-search="people"] input';\n  const tryFocus=(attempt=0)=>{\n    if(!hasPendingFocus())return;\n    const input=document.querySelector(selector);\n    if(routeKey()!=='people'||!isMobile()||!input?.isConnected){\n      if(attempt<20)setTimeout(()=>tryFocus(attempt+1),60);\n      return;\n    }\n    input.focus({preventScroll:false});\n    setTimeout(()=>{\n      if(!hasPendingFocus())return;\n      const live=document.querySelector(selector);\n      if(live===input&&document.activeElement===input){\n        clearPendingFocus();\n        return;\n      }\n      if(attempt<20)tryFocus(attempt+1);\n    },80);\n  };\n  requestAnimationFrame(()=>requestAnimationFrame(()=>tryFocus()));\n}\n`,
`function queuePeopleSearch(value,{focus=false}={}){\n  pendingPeopleSearchValue=value;\n  pendingPeopleSearchFocus=focus;\n  if(routeKey()!=='people')location.hash='people';else schedule();\n}\nfunction consumePeopleSearchRequest(){\n  const request={value:pendingPeopleSearchValue,focus:pendingPeopleSearchFocus};\n  pendingPeopleSearchValue='';\n  pendingPeopleSearchFocus=false;\n  return request;\n}\nfunction focusPeopleSearch(input){\n  if(!input||routeKey()!=='people'||!isMobile())return;\n  requestAnimationFrame(()=>{if(input.isConnected)input.focus({preventScroll:false});});\n}\n`,
'session search handoff');

runtime=replaceRequired(runtime,
`  const pending=consumePendingSearch();\n  if(pending){\n    search.querySelector('input').value=pending;\n    setOriginalSearch(pending);\n  }\n  focusPendingPeopleSearch();\n  return search;`,
`  const request=consumePeopleSearchRequest();\n  const input=search.querySelector('input');\n  if(request.value){\n    input.value=request.value;\n    setOriginalSearch(request.value);\n  }\n  if(request.focus)focusPeopleSearch(input);\n  return search;`,
'people search composition');

fs.writeFileSync(runtimePath,runtime);

const testPath='scripts/test-mobile-shell-v22.mjs';
let test=fs.readFileSync(testPath,'utf8');
if(!test.includes("mobile people search handoff uses transient runtime state")){
  test += `\n\ntest('mobile people search handoff uses transient runtime state',()=>{\n  assert.doesNotMatch(mobile,/sessionStorage|PENDING_SEARCH_KEY|PENDING_FOCUS_KEY|attempt<20|tryFocus/);\n  assert.match(mobile,/let pendingPeopleSearchValue=''/);\n  assert.match(mobile,/let pendingPeopleSearchFocus=false/);\n  assert.match(mobile,/function consumePeopleSearchRequest\\(\\)/);\n  assert.match(mobile,/function focusPeopleSearch\\(input\\)/);\n});\n`;
}
fs.writeFileSync(testPath,test);
