const VERSION='v2.0.0';
const CACHE='meta-entregador-'+VERSION;
const ASSETS=[
  './','./index.html','./manifest.json','./icon.svg','./cloud.js',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/maskable-192.png','./icons/maskable-512.png',
  './icons/apple-touch-icon.png','./icons/favicon-48.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  // Só arquivos do próprio app. Login/Firestore/Google passam direto pela rede.
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  const url=new URL(req.url);
  const isCode=req.mode==='navigate'||/\.(js|json|html)$/.test(url.pathname)||url.pathname.endsWith('/');
  if(isCode){
    // Código: rede primeiro (sempre a versão nova), cache só offline
    e.respondWith(fetch(req,{cache:'no-cache'}).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req.mode==='navigate'?'./index.html':req,copy))}
      return res;
    }).catch(()=>caches.match(req.mode==='navigate'?'./index.html':req,{ignoreSearch:true})));
    return;
  }
  // Imagens: cache primeiro
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  })));
});
