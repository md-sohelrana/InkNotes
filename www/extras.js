// Inkwell extras: IndexedDB storage, PDF import/annotate, PDF export, Google Drive / OneDrive.
var ready=false,NBC={},gtok=null,msApp=null;
const idb=new Promise((ok,no)=>{const q=indexedDB.open('inkwell',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
const kv=(m,k,v)=>idb.then(d=>new Promise((ok,no)=>{const s=d.transaction('kv',m==='get'?'readonly':'readwrite').objectStore('kv'),r=m==='get'?s.get(k):m==='put'?s.put(v,k):s.delete(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
ld=id=>NBC[id]||null;
flush=function(){if(!cid||!ready)return;NBC[cid]=D;kv('put','nb-'+cid,D).catch(()=>toast('Storage error'));try{localStorage.setItem('inkwell-lib',JSON.stringify(L));localStorage.setItem('inkwell-cur',cid)}catch(e){}};
(async()=>{try{for(const n of L){let d=await kv('get','nb-'+n.id);if(!d){try{d=JSON.parse(localStorage.getItem('inkwell-nb-'+n.id))}catch(e){}if(d){await kv('put','nb-'+n.id,d);localStorage.removeItem('inkwell-nb-'+n.id)}}if(d)NBC[n.id]=d}
if(NBC[cid])D=NBC[cid];ready=true;fit();flush()}catch(e){ready=true;toast('IndexedDB unavailable')}})();
function ensureBg(k){return new Promise(ok=>{const c=bgc.get(k);if(c&&c.complete)return ok();kv('get',k).then(b=>{if(!b)return ok();const im=new Image();im.onload=()=>{bgc.set(k,im);ok()};im.src=URL.createObjectURL(b)})})}
function loadBg(k){if(bgc.has(k))return;bgc.set(k,{});ensureBg(k).then(draw)}
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';
async function impPdf(f){try{toast('Importing PDF…');const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,id=mk(f.name.replace(/\.pdf$/i,''),'');sw(id);const tag='pdf-'+id+'-'+Date.now()+'-';
for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n),v0=p.getViewport({scale:1}),v=p.getViewport({scale:1600/v0.width}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;await kv('put',tag+n,await new Promise(r=>c.toBlob(r,'image/jpeg',.82)));
const pgd={s:[],bg:'blank',pdf:tag+n,h:Math.round(W*v0.height/v0.width)};if(n===1){D.pages=[pgd];D.i=0;fit()}else D.pages.push(pgd);toast(`PDF page ${n}/${pdf.numPages}`);if(n%5===0)flush()}
flush();fit();toast('PDF ready – start annotating')}catch(e){toast('Import failed: '+(e.message||e))}}
async function expPdf(){const {jsPDF}=window.jspdf,keep=D.i;let doc;sel=[];toast('Building PDF…');
try{for(let i=0;i<D.pages.length;i++){D.i=i;H=pg().h||1273;if(pg().pdf)await ensureBg(pg().pdf);cv.width=W*2;cv.height=H*2;draw();
const w=595.28,h=w*H/W,o=h>w?'p':'l';if(!doc)doc=new jsPDF({unit:'pt',format:[w,h],orientation:o});else doc.addPage([w,h],o);doc.addImage(cv.toDataURL('image/jpeg',.88),'JPEG',0,0,w,h)}}
finally{D.i=keep;fit()}return doc.output('blob')}
const nm=()=>L.find(n=>n.id===cid).name;
function dl(b,name){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
const CF=()=>window.INK_CFG||{};
const js=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
setTimeout(()=>js('https://accounts.google.com/gsi/client').catch(()=>{}),1500);
async function gAuth(){if(gtok)return gtok;const id=CF().googleClientId||localStorage.getItem('ink-gid')||prompt('Google OAuth client ID (README → Cloud setup):');if(!id)throw 0;localStorage.setItem('ink-gid',id);
if(!window.google)await js('https://accounts.google.com/gsi/client');
return new Promise((ok,no)=>google.accounts.oauth2.initTokenClient({client_id:id,scope:'https://www.googleapis.com/auth/drive.file',callback:r=>r.access_token?(gtok=r.access_token,setTimeout(()=>gtok=null,3e6),ok(gtok)):no(r.error||'Google sign-in failed'),error_callback:e=>no(e.type||'Google sign-in cancelled')}).requestAccessToken())}
async function toDrive(b,name){const t=await gAuth(),r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',{method:'POST',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':b.type},body:JSON.stringify({name,mimeType:b.type})});
if(!r.ok)throw 'Drive error '+r.status;const p=await fetch(r.headers.get('Location'),{method:'PUT',body:b});if(!p.ok)throw 'Drive error '+p.status;toast('Saved to Google Drive')}
async function mAuth(){const id=CF().msClientId||localStorage.getItem('ink-mid')||prompt('Microsoft app (client) ID (README → Cloud setup):');if(!id)throw 0;localStorage.setItem('ink-mid',id);
if(!msApp){msApp=new msal.PublicClientApplication({auth:{clientId:id,authority:'https://login.microsoftonline.com/common',redirectUri:location.origin+location.pathname}});if(msApp.initialize)await msApp.initialize()}
const sc={scopes:['Files.ReadWrite']},acc=msApp.getAllAccounts()[0];if(acc)try{return(await msApp.acquireTokenSilent({...sc,account:acc})).accessToken}catch(e){}
return(await msApp.loginPopup(sc)).accessToken}
async function toOD(b,name){const t=await mAuth(),A={Authorization:'Bearer '+t},base='https://graph.microsoft.com/v1.0/me/drive/root:/InkNotes/'+encodeURIComponent(name);
if(b.size<4e6){const r=await fetch(base+':/content',{method:'PUT',headers:{...A,'Content-Type':b.type},body:b});if(!r.ok)throw 'OneDrive error '+r.status}
else{const s=await fetch(base+':/createUploadSession',{method:'POST',headers:{...A,'Content-Type':'application/json'},body:'{}'});if(!s.ok)throw 'OneDrive error '+s.status;
const r=await fetch((await s.json()).uploadUrl,{method:'PUT',headers:{'Content-Range':`bytes 0-${b.size-1}/${b.size}`},body:b});if(!r.ok)throw 'OneDrive error '+r.status}toast('Saved to OneDrive')}
const fm=document.createElement('select');fm.id='fm';fm.innerHTML='<option value="">📁 File…</option><option value="exp">Export PDF (download)</option><option value="shp">Share PDF… (Files, Mail, apps)</option><option value="imp">Import PDF to annotate</option><option value="gd">Save PDF → Google Drive</option><option value="od">Save PDF → OneDrive</option><option value="bk">Backup notebook (.json)</option><option value="rs">Restore backup</option>';
$('sh').after(fm);
const fi=document.createElement('input');fi.type='file';fi.hidden=true;document.body.appendChild(fi);
function pick(acc,fn){fi.accept=acc;fi.onchange=()=>{const f=fi.files[0];fi.value='';if(f)fn(f)};fi.click()}
fm.onchange=async()=>{const v=fm.value;fm.value='';if(!v)return;
try{if(v==='imp')return pick('application/pdf',impPdf);
if(v==='rs')return pick('.json,application/json',async f=>{try{const d=JSON.parse(await f.text());if(!d.pages)throw'Not a backup file';const id=mk((d.name||'Restored'),'');sw(id);D=d;flush();fit();toast('Restored')}catch(e){toast(String(e.message||e))}});
if(v==='bk')return dl(new Blob([JSON.stringify(D)],{type:'application/json'}),nm()+'.json');
if(v==='gd')await gAuth();if(v==='od')await mAuth();
const b=await expPdf(),name=nm()+'.pdf';
if(v==='exp')dl(b,name);else if(v==='gd')await toDrive(b,name);else if(v==='od')await toOD(b,name);
else{const f=new File([b],name,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[f]}))try{await navigator.share({files:[f]})}catch(e){if(e.name!=='AbortError')dl(b,name)}else dl(b,name)}}
catch(e){if(e)toast(String(e.message||e).slice(0,90))}};
