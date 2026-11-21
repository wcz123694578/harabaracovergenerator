(()=>{
const el=id=>document.getElementById(id);
const cvs=el('cover'),ctx=cvs.getContext('2d',{alpha:false});
const inputIds=['title','subtitle','bg','maincolor','subcolor','mainwidth','subwidth','gap','top'];
const state={font:'fallback', uploadedName:''};
const DEFAULT={w:1200,h:900};
let ratio=DEFAULT.w/DEFAULT.h;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const numberValue=(node,fallback)=>{const n=Math.round(Number(node.value));return Number.isFinite(n)?clamp(n,64,8192):fallback};
function setCanvasSize(w,h){
  w=clamp(Math.round(w),64,8192);h=clamp(Math.round(h),64,8192);
  if(cvs.width!==w)cvs.width=w;if(cvs.height!==h)cvs.height=h;
  el('dimensions').textContent=`${w} × ${h}`;
}
function fontFamily(){
  if(state.font==='file')return '"ImportedHarabara", sans-serif';
  if(state.font==='remote')return '"Harabara", sans-serif';
  if(state.font==='local')return '"LocalHarabara", sans-serif';
  return '"Arial Rounded MT Bold", "Trebuchet MS", Verdana, sans-serif';
}
function setFont(size){ctx.font=`${state.font==='fallback'?900:700} ${size}px ${fontFamily()}`;ctx.textAlign='center';ctx.textBaseline='alphabetic'}
function metrics(text,size){setFont(size);return ctx.measureText(text)}
function fit(text,maxWidth){
  let lo=1,hi=Math.max(128,cvs.width*1.5);
  for(let i=0;i<26;i++){const m=(lo+hi)/2;if(metrics(text,m).width>maxWidth)hi=m;else lo=m}
  return (lo+hi)/2;
}
function inkHeight(m,size){return (m.actualBoundingBoxAscent||size*.75)+(m.actualBoundingBoxDescent||size*.2)}
function inkAscent(m,size){return m.actualBoundingBoxAscent||size*.75}
function draw(){
  const w=numberValue(el('width'),DEFAULT.w),h=numberValue(el('height'),DEFAULT.h);
  setCanvasSize(w,h);
  ctx.fillStyle=el('bg').value;ctx.fillRect(0,0,w,h);
  const texts=el('title').value.replace(/\r/g,'').split('\n').map(v=>v.trim()).filter(Boolean);
  const lines=texts.length?texts:['Admit'];
  const sub=el('subtitle').value;
  const maxTitleW=w*Number(el('mainwidth').value)/100;
  let size=Math.min(...lines.map(line=>fit(line,maxTitleW)));
  size=Math.min(size,h*.38);
  // Main title's ink top, then subtitle's ink top: no extra line-height padding.
  let y=h*Number(el('top').value)/100;
  ctx.fillStyle=el('maincolor').value;
  lines.forEach((line,i)=>{
    const m=metrics(line,size);
    const ascent=inkAscent(m,size),height=inkHeight(m,size);
    setFont(size);ctx.fillText(line,w/2,y+ascent);
    y+=height+(i===lines.length-1?0:size*.035);
  });
  const subSize=Math.min(fit(sub||' ',w*Number(el('subwidth').value)/100),size*1.0,h*.25);
  const subM=metrics(sub||' ',subSize);
  const referenceScale=Math.min(w/300,h/225);
  y+=Number(el('gap').value)*referenceScale;
  ctx.fillStyle=el('subcolor').value;setFont(subSize);
  ctx.fillText(sub,w/2,y+inkAscent(subM,subSize));
  ['bg','maincolor','subcolor'].forEach(id=>el(id+'val').textContent=el(id).value.toUpperCase());
  ['mainwidth','subwidth'].forEach(id=>el(id+'val').textContent=el(id).value+'%');
  el('gapval').textContent=el('gap').value+' px';el('topval').textContent=el('top').value+'%';
}
function presetValue(w,h){return `${w}x${h}`}
function syncPreset(){
  const current=presetValue(el('width').value,el('height').value);
  el('preset').value=[...el('preset').options].some(o=>o.value===current)?current:'custom';
}
function setSize(w,h){
  el('width').value=w;el('height').value=h;ratio=w/h;syncPreset();draw();
}
el('preset').addEventListener('change',()=>{
  const val=el('preset').value;if(val==='custom')return;
  const [w,h]=val.split('x').map(Number);setSize(w,h);
});
el('width').addEventListener('input',()=>{
  if(el('width').value==='')return;
  const w=numberValue(el('width'),DEFAULT.w);
  if(el('lockRatio').checked)el('height').value=clamp(Math.round(w/ratio),64,8192);
  else ratio=w/numberValue(el('height'),DEFAULT.h);
  syncPreset();draw();
});
el('height').addEventListener('input',()=>{
  if(el('height').value==='')return;
  const h=numberValue(el('height'),DEFAULT.h);
  if(el('lockRatio').checked)el('width').value=clamp(Math.round(h*ratio),64,8192);
  else ratio=numberValue(el('width'),DEFAULT.w)/h;
  syncPreset();draw();
});
el('lockRatio').addEventListener('change',()=>ratio=numberValue(el('width'),DEFAULT.w)/numberValue(el('height'),DEFAULT.h));
for(const id of inputIds)el(id).addEventListener('input',draw);
el('reset').addEventListener('click',()=>{
  el('title').value='Admit';el('subtitle').value='kyo alt';
  el('bg').value='#00152f';el('maincolor').value='#f1ee95';el('subcolor').value='#076a94';
  el('mainwidth').value=55;el('subwidth').value=44;el('gap').value=2;el('top').value=29;
  el('lockRatio').checked=true;setSize(1200,900);
});
el('save').addEventListener('click',()=>{
  draw();const a=document.createElement('a');
  a.download=(el('title').value.trim().replace(/[^\p{L}\p{N}_-]+/gu,'_').slice(0,40)||'cover')+'.png';
  a.href=cvs.toDataURL('image/png');a.click();
});
el('fontfile').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    const face=new FontFace('ImportedHarabara',await f.arrayBuffer(),{weight:'700'});
    await face.load();document.fonts.add(face);
    state.font='file';state.uploadedName=f.name;
    el('fontstatus').className='font-note ok';el('fontstatus').textContent=`已使用导入字体：${f.name}`;draw();
  }catch(error){el('fontstatus').className='font-note';el('fontstatus').textContent='字体导入失败，请检查文件格式。'}
});
async function initFont(){
  const loaded=async name=>{
    try{
      const faces=await document.fonts.load(`700 48px "${name}"`);
      return faces.some(face=>face.status==='loaded'&&face.family.replace(/["']/g,'').toLowerCase()===name.toLowerCase());
    }catch(e){return false}
  };
  if(await loaded('Harabara')){
    if(state.font!=='file'){state.font='remote';el('fontstatus').className='font-note ok';el('fontstatus').textContent='在线 Harabara 已加载';draw()}
  }else if(await loaded('LocalHarabara')){
    if(state.font!=='file'){state.font='local';el('fontstatus').className='font-note ok';el('fontstatus').textContent='已使用本机 Harabara 字体';draw()}
  }else{
    if(state.font!=='file'){el('fontstatus').className='font-note';el('fontstatus').textContent='未加载到 Harabara，暂用回退字体；可导入字体文件。';draw()}
  }
}
draw();
initFont();
// Load the remote stylesheet without holding up the preview when the CDN is blocked.
const remoteFontStylesheet=document.createElement('link');
remoteFontStylesheet.rel='stylesheet';
remoteFontStylesheet.href='https://fonts.cdnfonts.com/css/harabara';
remoteFontStylesheet.addEventListener('load',()=>initFont());
remoteFontStylesheet.addEventListener('error',()=>initFont());
document.head.appendChild(remoteFontStylesheet);
})();
