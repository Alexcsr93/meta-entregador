const VERSION='v1.2.0';
const CACHE='meta-entregador-'+VERSION;
const ASSETS=[
  './','./index.html','./manifest.json','./icon.svg',
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
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  // Páginas: rede primeiro (pega atualização), cache como reserva offline
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  // Arquivos estáticos: cache primeiro
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})));
});
