const VERSION='v1.3.0';
const CACHE='meta-entregador-'+VERSION;
const ASSETS=[
  './','./index.html','./manifest.json','./icon.svg','./cloud.js','./firebase-config.js',
  './fonts/narrow-400.woff2','./fonts/narrow-700.woff2',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/maskable-192.png','./icons/maskable-512.png',
  './icons/apple-touch-icon.png','./icons/favicon-48.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  // Só arquivos do próprio app. Login/Firestore/Google passam direto pela rede.
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  // Páginas: rede primeiro (pega atualização), cache como reserva offline
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  // Demais arquivos: usa o cache e atualiza em segundo plano
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
