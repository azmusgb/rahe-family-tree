const COMMAND_TARGETS=Object.freeze({
  share:'#share',
  export:'#export',
  print:'#print',
  'toggle-experience':'.experience-toggle'
});

function resolveTarget(command){
  const selector=COMMAND_TARGETS[command];
  return selector?document.querySelector(selector):null;
}

export function canRunUiCommand(command){
  const target=resolveTarget(command);
  return Boolean(target&&!target.disabled&&target.getAttribute('aria-disabled')!=='true');
}

export function runUiCommand(command,{source=null}={}){
  const target=resolveTarget(command);
  if(!target||target.disabled||target.getAttribute('aria-disabled')==='true')return false;
  target.click();
  window.dispatchEvent(new CustomEvent('family-ui-command',{detail:{command,source}}));
  return true;
}

export function commandLabel(command){
  if(command!=='toggle-experience')return'';
  return resolveTarget(command)?.textContent?.trim()||'Research mode';
}
