// Camada de nuvem (Firebase Auth + Firestore). Carregada sob demanda:
// se estiver offline ou sem configuração, o app continua funcionando local.
// Configuração do projeto Firebase "meta-entregador" (não é segredo: a segurança fica nas regras do Firestore)
const firebaseConfig = {
  apiKey: "AIzaSyDM293szGquYjDla5rUNtV2bhs4LV-S-C0",
  authDomain: "meta-entregador.firebaseapp.com",
  projectId: "meta-entregador",
  storageBucket: "meta-entregador.firebasestorage.app",
  messagingSenderId: "16692857917",
  appId: "1:16692857917:web:285eb075cf06669088ae54",
  measurementId: "G-5JEPMR3CTW"
};

const V = '10.14.1';
const B = `https://www.gstatic.com/firebasejs/${V}/`;
const COLLECTION = 'metaEntregador';
let fb = null, auth = null, db = null;

export function configured() {
  return !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId &&
    !String(firebaseConfig.apiKey).startsWith('COLE') && !String(firebaseConfig.projectId).startsWith('COLE'));
}

export async function init() {
  if (fb) return true;
  const [app, au, fs] = await Promise.all([
    import(B + 'firebase-app.js'),
    import(B + 'firebase-auth.js'),
    import(B + 'firebase-firestore.js')
  ]);
  const a = app.initializeApp(firebaseConfig);
  auth = au.getAuth(a);
  db = fs.getFirestore(a);
  fb = { app, au, fs };
  // resultado do login por redirecionamento (fallback)
  try { await au.getRedirectResult(auth); } catch (e) { /* tratado no onUser/erro de tela */ }
  return true;
}

export function onUser(cb) {
  return fb.au.onAuthStateChanged(auth, cb);
}

export async function signIn() {
  const { au } = fb;
  const provider = new au.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await au.signInWithPopup(auth, provider);
    return { ok: true };
  } catch (e) {
    const c = e && e.code;
    if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') {
      try { await au.signInWithRedirect(auth, provider); return { ok: true, redirect: true }; }
      catch (e2) { return { ok: false, code: e2 && e2.code }; }
    }
    return { ok: false, code: c };
  }
}

export function signOut() { return fb.au.signOut(auth); }

export function watch(uid, onData, onError) {
  const ref = fb.fs.doc(db, COLLECTION, uid);
  return fb.fs.onSnapshot(ref,
    snap => onData(snap.exists() ? snap.data() : null, !!(snap.metadata && snap.metadata.hasPendingWrites)),
    err => onError && onError(err));
}

export function push(uid, data) {
  const ref = fb.fs.doc(db, COLLECTION, uid);
  return fb.fs.setDoc(ref, JSON.parse(JSON.stringify(data)));
}
