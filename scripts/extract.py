"""Deterministic OOXML ingestion. The controlling source remains read-only."""
import xml.etree.ElementTree as E
from zipfile import ZipFile
from pathlib import Path
import json,re,hashlib,sys
src=Path(sys.argv[1]); w='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
with ZipFile(src) as z:
 root=E.fromstring(z.read('word/document.xml'))
 extras={n:z.read(n) for n in z.namelist() if re.match(r'word/(footnotes|endnotes|comments|header\d+|footer\d+)\.xml',n)}
def txt(e):return ''.join(n.text or '' for n in e.iter(w+'t'))
sections=[]; current=None; legacy=False; annex=''; blocks=0
for e in root.find(w+'body'):
 if e.tag==w+'p':
  t=txt(e); s=e.find(w+'pPr/'+w+'pStyle'); style=s.get(w+'val','') if s is not None else ''
  if not t.strip():continue
  if t.startswith('24. Part II'):legacy=True
  if style.startswith('Heading'):
   if legacy and t.endswith('.docx'):annex=t
   current={'id':f's{len(sections):03}','title':t,'legacy':legacy,'annex':annex,'blocks':[]};sections.append(current)
  else:
   if current is None:
    current={'id':'s000','title':'Dossier introduction','legacy':False,'annex':'','blocks':[]};sections.append(current)
   current['blocks'].append({'type':'p','text':t});blocks+=1
 elif e.tag==w+'tbl':
  rows=[[ '\n'.join(txt(p) for p in c.findall('.//'+w+'p')) for c in row.findall(w+'tc')] for row in e.findall(w+'tr')]
  current['blocks'].append({'type':'table','rows':rows});blocks+=1
for name,raw in extras.items():
 texts=[txt(e) for e in E.fromstring(raw).iter(w+'p') if txt(e)]
 if texts:sections.append({'id':f's{len(sections):03}','title':'Document apparatus: '+name.split('/')[-1],'legacy':True,'annex':'Document apparatus','blocks':[{'type':'p','text':t} for t in texts]})
roster=next(s for s in sections if s['title'].startswith('Appendix F.'))
rows=next(b['rows'] for b in roster['blocks'] if b['type']=='table')
people=[dict(zip(['branch','name','dates','role','state'],r),id=f'p{i:03}',section=roster['id']) for i,r in enumerate(rows[1:]) if len(r)==5]
# Public edition retains names and relationships but suppresses birth details of living people.
living=['Linda Kay Dennewitz','Jean C./Carol Dennewitz','Kathleen Ann Dennewitz Rahe','William John Rahe Jr.','William John Rahe III','Melissa Rahe','Current Rahe children']
redactions=0
def scrub(t):
 global redactions
 original=t
 for pattern in [r'27 (?:Oct(?:ober)?|OCT) 1942',r'17 (?:Jun(?:e)?|JUN) 1947',r'17 (?:Nov(?:ember)?|NOV) 1952',r'2002[–-]2014']:
  t=re.sub(pattern,'[birth detail withheld]',t)
 if t!=original:redactions+=1
 return t
for s in sections:
 for b in s['blocks']:
  if b['type']=='p':b['text']=scrub(b['text'])
  else:
   b['rows']=[[scrub(c) for c in r] for r in b['rows']]
   for r in b['rows']:
    if any(any(n in c for n in living) for c in r):
     for j,c in enumerate(r):
      if re.search(r'1946|1952|1977|1983|1947|1942|birth detail withheld',c) and not any(n in c for n in living):
       r[j]=re.sub(r'(?<!\d)(?:1946|1952|1977|1983|1947|1942)(?!\d)','[birth year withheld]',c)
for p in people:
 p['living']=p['name'] in living
 p['dates']='Living / birth details withheld' if p['living'] else p['dates']
 p['states']=[x for x in ['SUPPORTED','PROVISIONAL','UNRESOLVED','REJECTED','DERIVATIVE'] if x in p['state'].upper()]
 p['references']=[s['id'] for s in sections if not s['legacy'] and p['name'].split(' / ')[0] in json.dumps(s,ensure_ascii=False)]
result={'meta':{'title':src.name,'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sections':len(sections),'tables':sum(b['type']=='table' for s in sections for b in s['blocks']),'people':len(people),'annexes':len(set(s['annex'] for s in sections if s['annex'] and s['annex']!='Document apparatus')),'privacyRedactions':redactions,'edition':'Public research edition; living birth details withheld'},'people':people,'sections':sections}
Path('public/corpus.json').write_text(json.dumps(result,ensure_ascii=False))
Path('public/coverage.json').write_text(json.dumps(result['meta'],indent=2))
print(json.dumps(result['meta'],indent=2))
