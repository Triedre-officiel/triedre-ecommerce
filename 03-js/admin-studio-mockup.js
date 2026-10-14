(()=>{'use strict';
const $=id=>document.getElementById(id),c=$('studio-render'),ctx=c.getContext('2d');
const V={tshirt:['Devant','Dos','Manche gauche','Manche droite'],hoodie:['Devant','Dos','Manche gauche','Manche droite'],casquette:['Devant','Dos','Côté gauche','Côté droit'],brassiere:['Devant','Dos'],legging:['Devant','Dos','Côté gauche','Côté droit'],veste:['Devant','Dos','Manche gauche','Manche droite']};
const Z={tshirt:{Devant:['Poitrine gauche','Poitrine centrale','Grand centre'],Dos:['Haut du dos','Grand dos'],'Manche gauche':['Manche gauche'],'Manche droite':['Manche droite']},hoodie:{Devant:['Poitrine gauche','Poitrine centrale','Grand centre'],Dos:['Haut du dos','Grand dos'],'Manche gauche':['Manche gauche'],'Manche droite':['Manche droite']},casquette:{Devant:['Panneau avant'],Dos:['Arrière'],'Côté gauche':['Côté gauche'],'Côté droit':['Côté droit']},brassiere:{Devant:['Poitrine centrale','Poitrine gauche'],Dos:['Dos central']},legging:{Devant:['Cuisse gauche','Cuisse droite','Ceinture'],Dos:['Arrière ceinture'],'Côté gauche':['Cuisse gauche'],'Côté droit':['Cuisse droite']},veste:{Devant:['Poitrine gauche','Poitrine centrale'],Dos:['Haut du dos'],'Manche gauche':['Manche gauche'],'Manche droite':['Manche droite']}};
// V5.4: Shopify's measurements are garment landmarks, not photo pixel coordinates.
// These percentages are visual starting points for an uncalibrated, centered front-view photograph.
const defaults=name=>{let x=50,y=40,w=24,h=w;
 if(/poitrine gauche/i.test(name)){x=62;y=25;w=19;h=19}
 else if(/poitrine centrale/i.test(name)){x=50;y=33;w=29;h=29}
 else if(/grand centre/i.test(name)){x=50;y=43;w=43;h=43}
 else if(/haut du dos/i.test(name)){x=50;y=27;w=31;h=20}
 else if(/grand dos/i.test(name)){x=50;y=44;w=43;h=48}
 else if(/gauche/i.test(name)){x=64;y=35;w=17;h=17}
 else if(/droite/i.test(name)){x=36;y=35;w=17;h=17}
 else if(/manche/i.test(name)){y=44;w=25;h=25}
 else if(/cuisse/i.test(name)){y=59;w=18;h=18}
 else if(/ceinture/i.test(name)){y=30;w=22;h=22}
 return{x,y,w,h,margin:5}};
const SHOPIFY_GUIDE={
 'tshirt|Devant|Poitrine gauche':{anchor:'Col',offset:'7 à 8 cm sous le col',size:'6 × 6 à 12 × 12 cm (format courant)'},
 'tshirt|Devant|Poitrine centrale':{anchor:'Col',offset:'7,5 à 12,5 cm sous le col',size:'15 × 15 à 25 × 25 cm (format courant)'},
 'tshirt|Devant|Grand centre':{anchor:'Col',offset:'7,6 à 10,2 cm sous le col',size:'30 × 30 à 40 × 40 cm (format courant)'},
 'tshirt|Dos|Haut du dos':{anchor:'Col arrière',offset:'Environ 10 cm sous le col (grand haut du dos)',size:'25 × 12 à 35 × 15 cm (format courant)'},
 'tshirt|Dos|Grand dos':{anchor:'Col arrière',offset:'7 à 8 cm sous le col',size:'25 × 30 à 35 × 40 cm (format courant)'},
 'tshirt|Manche gauche|Manche gauche':{anchor:'Ourlet de manche',offset:'Environ 5 cm au-dessus de l’ourlet',size:'2,5 × 2,5 à 10 × 10 cm (format courant)'},
 'tshirt|Manche droite|Manche droite':{anchor:'Ourlet de manche',offset:'Environ 5 cm au-dessus de l’ourlet',size:'2,5 × 2,5 à 10 × 10 cm (format courant)'}
};
const key=()=>[$('studio-product').value,$('studio-view').value,$('studio-zone').value].join('|');
const photoKey=()=>[$('studio-product').value,$('studio-view').value].join('|');
let templates={},photos={},logo=null,logoUrl=null,settings={widthCm:4,heightCm:4,rotation:0,dx:0,dy:0,flipX:false,flipY:false};let originalLogo=null,originalLogoFile=null,processedLogo=null,processedLogoFile=null,bgRemoved=false;let dirty=false;let calibration={};let projectAssets={};let designViews={};const activeView=()=>photoKey();const markDirty=()=>{dirty=true;$("studio-status").textContent="Modifications non enregistrées"};
try{templates=JSON.parse(localStorage.getItem('triedre-studio-zones-v2')||'{}')}catch{}
const warn=s=>$('studio-alert').textContent=s;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function loadImg(src){return new Promise((ok,err)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=err;im.src=src})}
function opts(el,values){el.replaceChildren();values.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o)})}
function refreshViews(){opts($('studio-view'),V[$('studio-product').value]);refreshZones()}
function refreshZones(){const el=$('studio-zone'),old=el.value,allowed=Z[$('studio-product').value][$('studio-view').value]||['Centre'];opts(el,allowed);if(allowed.includes(old))el.value=old;refreshCal();viewbar();draw();zoneMessage()}
function zone(){return {...defaults($('studio-zone').value),...(templates[key()]||{})}}
function pixelsPerCm(){const real=Number($('studio-garment-cm').value),fraction=Number($('studio-garment-pct').value)/100;return real>0&&fraction>0?c.width*fraction/real:null}
function updateCalibration(){const v=pixelsPerCm();$('studio-calibration-status').textContent=v?'Échelle calibrée : '+v.toFixed(2)+' px/cm sur cette photo. Vérifie la largeur mesurée.':'Échelle non calibrée : les dimensions physiques ne sont pas garanties.';draw()}
function zoneMessage(message=''){
 $('studio-zone-info').textContent='Vue : '+$('studio-view').value+' · Zone : '+$('studio-zone').value+' · limites de placement indicatives (fournisseur à confirmer).'+(message?' '+message:'');
}
function refreshCal(){const z=zone();for(const k of ['x','y','w','h','margin']){$('studio-'+k).value=z[k];$('studio-'+k+'-value').textContent=z[k]+'%'}}
function viewbar(){const bar=$('studio-viewbar');bar.replaceChildren();V[$('studio-product').value].forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent=v;b.className=v===$('studio-view').value?'active':'';b.setAttribute('aria-pressed',String(v===$('studio-view').value));b.onclick=()=>{$('studio-view').value=v;refreshZones();syncCanvas();const v=calibration[photoKey()];$('studio-garment-cm').value=v?.cm||'';$('studio-garment-pct').value=v?.pct||65;updateCalibration();markDirty()};bar.append(b)})}
function currentPhoto(){return photos[photoKey()]}
function syncCanvas(){const p=currentPhoto();if(p){c.width=p.width;c.height=p.height}else{c.width=900;c.height=1000}draw()}
function dimensions(){const z=zone(),margin=clamp(z.margin,0,20)/100;return {x:c.width*z.x/100,y:c.height*z.y/100,w:c.width*z.w/100,h:c.height*z.h/100,margin}}
function sourceAspect(){return logo ? logo.width/logo.height : 1}
function makeTransparent(source,tolerance){
 const cv=document.createElement('canvas');cv.width=source.width;cv.height=source.height;
 const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(source,0,0);
 const pixels=cx.getImageData(0,0,cv.width,cv.height),d=pixels.data;
 let left=cv.width,top=cv.height,right=-1,bottom=-1;
 for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++){
  const i=(y*cv.width+x)*4,r=d[i],g=d[i+1],b=d[i+2];
  const brightness=Math.max(r,g,b),alpha=d[i+3];
  const fade=Math.max(0,Math.min(1,(brightness-tolerance)/(Math.max(8,tolerance*.55))));
  d[i+3]=Math.round(alpha*fade);
  if(d[i+3]>3){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 }
 cx.putImageData(pixels,0,0);
 if(right<left)return null;
 const pad=2,x=Math.max(0,left-pad),y=Math.max(0,top-pad),w=Math.min(cv.width-x,right-left+1+pad*2),h=Math.min(cv.height-y,bottom-top+1+pad*2);
 const cropped=document.createElement('canvas');cropped.width=w;cropped.height=h;cropped.getContext('2d').drawImage(cv,x,y,w,h,0,0,w,h);
 return cropped;
}
async function canvasFile(cv){return new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(new File([b],'TRIEDRE-logo-sans-fond.png',{type:'image/png'})):reject(Error('Conversion PNG impossible')),'image/png'))}
function showComparison(){const box=$('studio-background-tools');box.hidden=!originalLogo;if(!originalLogo)return;
 const before=$('studio-before'),after=$('studio-after');for(const cv of [before,after]){const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);const sq=12;for(let y=0;y<cv.height;y+=sq)for(let x=0;x<cv.width;x+=sq){g.fillStyle=((x+y)/sq)%2===0?'#f0f0f0':'#c7c7c7';g.fillRect(x,y,sq,sq)}}
 function thumb(cv,img){if(!img)return;const g=cv.getContext('2d'),sc=Math.min((cv.width-12)/img.width,(cv.height-12)/img.height),w=img.width*sc,h=img.height*sc;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(img,(cv.width-w)/2,(cv.height-h)/2,w,h)}
 thumb(before,originalLogo);thumb(after,processedLogo);$('studio-background-state').textContent=bgRemoved?'Fond retiré':'Original';
}
async function previewBackground(){if(!originalLogo)return;const cv=makeTransparent(originalLogo,+$('studio-bg-tolerance').value);if(!cv){warn('Aucun dessin détecté après suppression. Réduis la tolérance.');return}processedLogo=cv;processedLogoFile=await canvasFile(cv);showComparison()}
function applyLogo(img,file,removed){logo=img;projectAssets.logo=file;bgRemoved=removed;if(removed){settings.heightCm=+(settings.widthCm*img.height/img.width).toFixed(2);$('studio-height-cm').value=settings.heightCm}markDirty();showComparison();draw()}
function designBounds(){
 if(!logo||!currentPhoto()||!designViews[activeView()])return null;
 const z=dimensions(),rad=settings.rotation*Math.PI/180,availW=z.w*(1-2*z.margin),availH=z.h*(1-2*z.margin);
 // Without a measured photo reference, use a visual preview scale, never claim physical accuracy.
 const pp=pixelsPerCm()||z.w/12;
 const requestedW=Math.max(1,settings.widthCm*pp),requestedH=Math.max(1,settings.heightCm*pp);
 const rw=Math.abs(requestedW*Math.cos(rad))+Math.abs(requestedH*Math.sin(rad));
 const rh=Math.abs(requestedW*Math.sin(rad))+Math.abs(requestedH*Math.cos(rad));
 const scale=Math.min(1,availW/Math.max(1,rw),availH/Math.max(1,rh));
 const w=requestedW*scale,h=requestedH*scale,halfW=rw*scale/2,halfH=rh*scale/2;
 const x=clamp(z.x+settings.dx*pp,z.x-availW/2+halfW,z.x+availW/2-halfW);
 const y=clamp(z.y+settings.dy*pp,z.y-availH/2+halfH,z.y+availH/2-halfH);
 return{x,y,w,h,rad,adjusted:scale<.999,calibrated:!!pixelsPerCm()};
}
function draw(exporting=false){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#f5f5f4';ctx.fillRect(0,0,c.width,c.height);const p=currentPhoto();if(p){ctx.drawImage(p,0,0,c.width,c.height)}else{ctx.fillStyle='#666';ctx.textAlign='center';ctx.font=`bold ${Math.max(16,c.width*.029)}px sans-serif`;ctx.fillText('Importer une photo vierge',c.width/2,c.height/2-20);ctx.font=`${Math.max(12,c.width*.02)}px sans-serif`;ctx.fillText($('studio-product').selectedOptions[0].text+' · '+$('studio-view').value,c.width/2,c.height/2+22)}
const z=dimensions();const b=designBounds();if(logo&&p&&b){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rad);ctx.scale(settings.flipX?-1:1,settings.flipY?-1:1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(logo,-b.w/2,-b.h/2,b.w,b.h);ctx.restore();if(!exporting){$('studio-quality').textContent=`Source : ${logo.width} × ${logo.height} px · réglage : ${settings.widthCm} × ${settings.heightCm} cm. `+(b.adjusted?'Aperçu ajusté aux limites de placement : les dimensions demandées ne sont pas modifiées. ':'')+(b.calibrated?'Échelle photo renseignée.':'Aperçu visuel non calibré : taille physique non garantie.');}}else{$('studio-quality').textContent=logo?(p?'Aucun design placé sur cette vue. Importe le logo pour cette vue.':'Importe une photo vierge pour afficher ton logo.') : '';}
if(!exporting&&$('studio-calibrate').checked){ctx.save();ctx.setLineDash([Math.max(4,c.width*.008),Math.max(3,c.width*.006)]);ctx.strokeStyle='#b18d43';ctx.lineWidth=Math.max(2,c.width*.002);ctx.strokeRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);ctx.setLineDash([]);ctx.strokeStyle='#64b8cf';ctx.lineWidth=Math.max(1,c.width*.0015);ctx.strokeRect(z.x-z.w*(.5-z.margin),z.y-z.h*(.5-z.margin),z.w*(1-2*z.margin),z.h*(1-2*z.margin));ctx.restore()}}
function updateSettings(){settings.rotation=+$('studio-rotation').value;$('studio-rotation-value').textContent=settings.rotation+'°';markDirty();draw()}
function updateMeasures(changed){const w=$('studio-width-cm'),h=$('studio-height-cm');let v=Math.max(.1,Math.min(100,Number((changed==='width'?w:h).value)||.1));if(changed==='width'){settings.widthCm=v;if($('studio-lock-ratio').checked&&logo){settings.heightCm=+(v*logo.height/logo.width).toFixed(2);h.value=settings.heightCm}}else{settings.heightCm=v;if($('studio-lock-ratio').checked&&logo){settings.widthCm=+(v*logo.width/logo.height).toFixed(2);w.value=settings.widthCm}}markDirty();draw()}
$('studio-width-cm').oninput=()=>updateMeasures('width');$('studio-height-cm').oninput=()=>updateMeasures('height');$('studio-lock-ratio').onchange=()=>{if(logo&&$('studio-lock-ratio').checked){$('studio-width-cm').dispatchEvent(new Event('input'))}};
$('studio-product').onchange=()=>{markDirty();refreshViews();syncCanvas();$('studio-garment-cm').value=calibration[photoKey()]?.cm||'';$('studio-garment-pct').value=calibration[photoKey()]?.pct||65;updateCalibration()};$('studio-view').onchange=()=>{refreshZones();syncCanvas()};$('studio-zone').onchange=()=>{settings.dx=0;settings.dy=0;refreshCal();markDirty();zoneMessage();draw()};
$('studio-base-upload').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>15e6){warn('Image non prise en charge (15 Mo maximum).');return}const url=URL.createObjectURL(f);try{const im=await loadImg(url);photos[photoKey()]=im;projectAssets[photoKey()]=f;markDirty();syncCanvas();warn('Photo vierge chargée pour cette vue.')}catch{warn('Impossible de lire cette image.')}finally{URL.revokeObjectURL(url)}};
$('studio-clear-base').onclick=()=>{if(!currentPhoto()){warn('Aucun support vierge à retirer pour cette vue.');return}delete photos[photoKey()];delete projectAssets[photoKey()];markDirty();$('studio-base-upload').value='';syncCanvas();warn('Support vierge supprimé pour cette vue.')};
$('studio-logo-upload').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!['image/png','image/webp','image/svg+xml'].includes(f.type)||f.size>5e6){warn('Logo non pris en charge (5 Mo maximum).');return}if(f.type==='image/svg+xml'){const txt=await f.text();if(/<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i.test(txt)){warn('SVG actif ou externe refusé. Utilise un SVG simple ou un PNG transparent.');return}}const nextUrl=URL.createObjectURL(f);try{const im=await loadImg(nextUrl);if(logoUrl)URL.revokeObjectURL(logoUrl);logoUrl=nextUrl;logo=im;originalLogo=im;originalLogoFile=f;processedLogo=null;processedLogoFile=null;bgRemoved=false;projectAssets.logo=f;designViews[activeView()]=true;settings.dx=0;settings.dy=0;settings.heightCm=+(settings.widthCm*im.height/im.width).toFixed(2);$('studio-height-cm').value=settings.heightCm;markDirty();draw();showComparison();previewBackground().catch(()=>{});warn('Design importé. Tu peux supprimer le fond noir ou conserver l’original.')}catch{URL.revokeObjectURL(nextUrl);warn('Impossible de lire ce logo.')}};
$('studio-bg-tolerance').oninput=()=>{$('studio-bg-tolerance-value').textContent=$('studio-bg-tolerance').value;previewBackground().catch(e=>warn(e.message))};
$('studio-remove-bg').onclick=async()=>{if(!originalLogo)return;try{await previewBackground();if(processedLogo&&processedLogoFile){applyLogo(processedLogo,processedLogoFile,true);warn('Fond noir supprimé. L’original reste disponible.')}}catch(e){warn('Suppression impossible : '+e.message)}};
$('studio-restore-bg').onclick=()=>{if(!originalLogo)return;applyLogo(originalLogo,originalLogoFile,false);warn('Logo original restauré.')};
$('studio-clear-logo').onclick=()=>{designViews[activeView()]=false;markDirty();if(logoUrl){URL.revokeObjectURL(logoUrl);logoUrl=null}$('studio-logo-upload').value='';draw();warn('Design retiré de cette vue. Le fichier reste disponible dans le projet.')};
$('studio-rotation').oninput=updateSettings;
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const m=b.dataset.move;if(m==='left')settings.dx-=.67;if(m==='right')settings.dx+=.67;if(m==='up')settings.dy-=.67;if(m==='down')settings.dy+=.67;markDirty();draw()});
$('studio-center').onclick=()=>{settings.dx=0;settings.dy=0;markDirty();draw()};$('studio-flip-x').onclick=()=>{settings.flipX=!settings.flipX;markDirty();draw()};$('studio-flip-y').onclick=()=>{settings.flipY=!settings.flipY;markDirty();draw()};
$('studio-calibrate').onchange=e=>{$('studio-calibration').hidden=!e.target.checked;refreshCal();draw()};
for(const k of ['x','y','w','h','margin'])$('studio-'+k).oninput=()=>{if(!$('studio-calibrate').checked)return;templates[key()]={x:+$('studio-x').value,y:+$('studio-y').value,w:+$('studio-w').value,h:+$('studio-h').value,margin:+$('studio-margin').value};refreshCal();draw()};
/* Shopify references remain internal: no banner in design UI. */
const referenceButton=$('studio-apply-reference');if(referenceButton)referenceButton.onclick=()=>{if(!SHOPIFY_GUIDE[key()])return;delete templates[key()];localStorage.setItem('triedre-studio-zones-v2',JSON.stringify(templates));settings.dx=0;settings.dy=0;refreshCal();zoneMessage();markDirty();draw();warn('Position indicative V5.4 rétablie pour cette zone. Vérifie le rendu sur ta photo.');};
$('studio-save-template').onclick=()=>{localStorage.setItem('triedre-studio-zones-v2',JSON.stringify(templates));warn('Limites de placement enregistrées dans ce navigateur.')};$('studio-reset-template').onclick=()=>{delete templates[key()];localStorage.setItem('triedre-studio-zones-v2',JSON.stringify(templates));refreshCal();zoneMessage();draw();warn('Zone restaurée par défaut.')};
$('studio-export').onclick=()=>{if(!currentPhoto()){warn('Importe une photo vierge avant l’export.');return}if(!logo){warn('Importe un design avant l’export.');return}const b=designBounds();if(!b){warn('Aucun design placé sur cette vue. Importe ton logo sur cette vue avant l’export.');return}draw(true);const a=document.createElement('a');a.download='TRIEDRE-'+$('studio-product').value+'-'+$('studio-view').value.replaceAll(' ','-')+'.png';a.href=c.toDataURL('image/png');a.click();draw();warn('Mockup PNG exporté. Vérifie les dimensions physiques auprès du fabricant avant impression.')};
// IndexedDB preserves imported files only after an explicit save.
const DB_NAME='triedre-studio-projects-v51';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('projects');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbPut(value){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(value,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function dbGet(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readonly');const r=tx.objectStore('projects').get('current');r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>{db.close();reject(r.error)}})}
$('studio-save').onclick=async()=>{try{await dbPut({product:$('studio-product').value,view:$('studio-view').value,zone:$('studio-zone').value,settings:{...settings},assets:{...projectAssets},originalLogoFile:originalLogoFile,bgRemoved:bgRemoved,bgTolerance:+$('studio-bg-tolerance').value,calibration:{...calibration},templates:{...templates},designViews:{...designViews}});dirty=false;$('studio-status').textContent='Design enregistré';warn('Design enregistré avec ses photos et son logo dans ce navigateur.')}catch(e){warn('Échec de sauvegarde : '+e.message)}};
async function restore(){try{const d=await dbGet();if(!d)return;templates={...templates,...(d.templates||{})};calibration=d.calibration||{};designViews=d.designViews||{};if(d.product&&V[d.product]){$('studio-product').value=d.product;refreshViews();if(V[d.product].includes(d.view)){$('studio-view').value=d.view;refreshZones();if(Z[d.product][d.view].includes(d.zone)){$('studio-zone').value=d.zone;refreshCal()}}if(!d.designViews&&d.assets?.logo)designViews[photoKey()]=true;settings={...settings,...d.settings};$('studio-width-cm').value=settings.widthCm;$('studio-height-cm').value=settings.heightCm;$('studio-rotation').value=settings.rotation;$('studio-rotation-value').textContent=settings.rotation+'°';projectAssets=d.assets||{};originalLogoFile=d.originalLogoFile||projectAssets.logo||null;bgRemoved=!!d.bgRemoved;if(d.bgTolerance)$('studio-bg-tolerance').value=d.bgTolerance;for(const [k,file] of Object.entries(projectAssets)){const url=URL.createObjectURL(file);try{const im=await loadImg(url);if(k==='logo'){logo=im;logoUrl=url}else{photos[k]=im;URL.revokeObjectURL(url)}}catch{URL.revokeObjectURL(url)}}}const scale=calibration[photoKey()];if(scale){$('studio-garment-cm').value=scale.cm;$('studio-garment-pct').value=scale.pct}if(originalLogoFile){const ou=URL.createObjectURL(originalLogoFile);try{originalLogo=await loadImg(ou)}finally{URL.revokeObjectURL(ou)};if(bgRemoved)processedLogo=logo;previewBackground().catch(()=>{});showComparison()}syncCanvas();updateCalibration();dirty=false;$('studio-status').textContent='Design enregistré';warn('Dernier design enregistré restauré.')}catch(e){warn('Restauration impossible : '+e.message)}}
$('studio-garment-cm').oninput=$('studio-garment-pct').oninput=()=>{calibration[photoKey()]={cm:Number($('studio-garment-cm').value),pct:Number($('studio-garment-pct').value)};markDirty();updateCalibration()};
refreshViews();syncCanvas();restore();
$('studio-back').addEventListener('click',e=>{if(dirty){e.preventDefault();if(confirm('Attention : des modifications non enregistrées seront perdues. Quitter le Studio ?')){dirty=false;location.href=e.currentTarget.href}}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
})();