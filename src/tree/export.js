const XMLNS='http://www.w3.org/2000/svg';

export function cloneSvgWithStyles(svg,win=globalThis.window){
  if(!svg)return null;
  const clone=svg.cloneNode(true),source=[svg,...svg.querySelectorAll('*')],target=[clone,...clone.querySelectorAll('*')];
  for(let i=0;i<Math.min(source.length,target.length);i++){
    const style=win?.getComputedStyle?.(source[i]);if(!style)continue;
    const css=[];for(const name of style)css.push(`${name}:${style.getPropertyValue(name)};`);
    target[i].setAttribute('style',css.join(''));
  }
  clone.setAttribute('xmlns',XMLNS);
  clone.setAttribute('data-export-engine','v19');
  return clone;
}

export function serializeSvg(svg,win=globalThis.window){
  const clone=cloneSvgWithStyles(svg,win);return clone?new XMLSerializer().serializeToString(clone):'';
}

export function svgBlob(svg,win=globalThis.window){return new Blob([serializeSvg(svg,win)],{type:'image/svg+xml;charset=utf-8'});}

export function printTree({documentRef=globalThis.document}={}){
  documentRef?.documentElement?.setAttribute('data-tree-print','true');
  globalThis.window?.print?.();
  queueMicrotask(()=>documentRef?.documentElement?.removeAttribute('data-tree-print'));
}
