'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const INDEX_HTML = "<!doctype html>\n<html lang=\"fr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Discuter</title>\n<style>\n:root{--bg:#0f1720;--panel:#17212c;--panel2:#1e2a37;--line:#2a3846;--txt:#e8eef4;--mut:#8fa1b3;--acc:#2f9e6f;--acc2:#25805a;--me:#245c47;--red:#e5484d}\n*{box-sizing:border-box;margin:0}\n[hidden]{display:none!important}\nhtml,body{height:100%}\nbody{font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt);overflow:hidden}\nbutton{font:inherit;color:inherit;border:0;background:none;cursor:pointer}\ninput{font:inherit;color:var(--txt);background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;width:100%;outline:none}\ninput:focus{border-color:var(--acc)}\n.screen{height:100%}\n.grow{flex:1;min-width:0}\nsmall{color:var(--mut);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.primary{background:var(--acc);color:#fff;border-radius:12px;padding:12px 16px;font-weight:600}\n.primary:active{background:var(--acc2)}\n.primary:disabled{opacity:.6}\n#auth{display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}\n.card{width:100%;max-width:400px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px 24px;display:flex;flex-direction:column;gap:14px}\n.logo{font-size:44px;text-align:center}\n.card h1{text-align:center;font-size:26px}\n.tabs{display:flex;background:var(--panel2);border-radius:12px;padding:4px}\n.tabs button{flex:1;padding:10px;border-radius:9px;color:var(--mut);font-weight:600}\n.tabs button.on{background:var(--acc);color:#fff}\nform{display:flex;flex-direction:column;gap:12px}\n.pw{position:relative}\n.pw button{position:absolute;right:6px;top:50%;transform:translateY(-50%);padding:8px}\n.err{color:#ff8e91;font-size:14px}\n.err:empty{display:none}\n.or{display:flex;align-items:center;gap:10px;color:var(--mut);font-size:14px}\n.or:before,.or:after{content:\"\";flex:1;height:1px;background:var(--line)}\n.google{background:#fff;color:#222;border-radius:12px;padding:12px;font-weight:600;display:flex;gap:10px;align-items:center;justify-content:center}\n.google b{font-weight:800;background:conic-gradient(#ea4335 0 25%,#fbbc05 0 50%,#34a853 0 75%,#4285f4 0);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:20px}\n#gSlot{display:flex;justify-content:center}\n#app{display:grid;grid-template-columns:340px 1fr}\naside{background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0}\nheader.bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--panel);border-bottom:1px solid var(--line)}\nheader.bar button{font-size:20px;padding:8px;border-radius:10px}\nheader.bar button:hover{background:var(--panel2)}\n.av{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;color:#fff;position:relative}\n.av.big{width:110px;height:110px;font-size:46px}\n.av.on:after{content:\"\";position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:#3ddc84;border:2px solid var(--panel)}\n.av.big.on:after{display:none}\n#list{overflow:auto;flex:1}\n.item{display:flex;gap:12px;align-items:center;padding:12px 14px;width:100%;text-align:left;border-bottom:1px solid var(--line)}\n.item:hover,.item.on{background:var(--panel2)}\n.item .top{display:flex;justify-content:space-between;gap:8px}\n.item .t{font-size:12px;color:var(--mut)}\n.badge{background:var(--acc);color:#fff;border-radius:99px;font-size:12px;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;margin-left:6px}\n.noc{padding:24px;color:var(--mut);text-align:center}\nmain#chat{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--bg)}\n#empty{margin:auto;color:var(--mut);padding:30px;text-align:center}\n#conv{display:flex;flex-direction:column;height:100%;min-height:0}\n#back{display:none}\n#msgs{flex:1;overflow:auto;padding:16px 14px;display:flex;flex-direction:column;gap:6px}\n.b{max-width:min(78%,520px);padding:8px 11px;border-radius:14px;background:var(--panel2);align-self:flex-start;word-break:break-word;white-space:pre-wrap}\n.b.me{background:var(--me);align-self:flex-end}\n.b img,.b video{max-width:100%;max-height:320px;border-radius:10px;display:block;cursor:zoom-in}\n.b .ts{font-size:11px;color:var(--mut);text-align:right;margin-top:3px}\n.b a{color:#7cd7ff}\n.sys{align-self:center;font-size:13px;color:var(--mut);background:var(--panel);padding:4px 12px;border-radius:99px}\n#sendForm{display:flex;flex-direction:row;align-items:center;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--panel);border-top:1px solid var(--line)}\n.clip{font-size:22px;cursor:pointer;padding:6px 8px}\n.overlay{position:fixed;inset:0;z-index:50;background:rgba(5,10,15,.78);display:flex;align-items:center;justify-content:center;padding:16px}\n.modal{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:20px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:12px}\n.modal h2{font-size:19px}\n.row{display:flex;gap:10px;align-items:center}\n.chk{width:22px;height:22px;accent-color:var(--acc);flex:none}\n.sender{font-size:12px;font-weight:700;margin-bottom:2px}\n.urow{display:flex;gap:10px;align-items:center;padding:8px 2px;border-bottom:1px solid var(--line)}\n.urow .add{background:var(--acc);color:#fff;border-radius:10px;padding:6px 12px;font-weight:600}\n.urow .add:disabled{opacity:.6}\n#ulist{overflow:auto;flex:1;min-height:120px;max-height:45vh}\n#call{background:#05090d;padding:0;flex-direction:column;align-items:stretch;justify-content:flex-start}\n.stage{position:relative;flex:1;min-height:0;overflow:hidden}\n#remoteVideo,#localVideo{object-fit:cover;background:#111}\n.vid-full{position:absolute;inset:0;width:100%;height:100%;z-index:1;background:#000}\n.vid-pip{position:absolute;right:12px;bottom:12px;width:28%;max-width:160px;aspect-ratio:3/4;border-radius:14px;border:2px solid #fff4;z-index:3;touch-action:none;cursor:grab;box-shadow:0 4px 18px #0008}\n#localVideo{transform:scaleX(-1)}\n.stage.swap .callinfo{inset:0 0 auto 0;justify-content:flex-start;padding:18px;background:linear-gradient(#000a,transparent)}\n.stage.swap .callinfo .av{display:none}\n#gtitle{padding:12px 16px;font-weight:600;text-align:center;background:#0b1219}\n#ggrid{flex:1;min-height:0;display:grid;gap:6px;padding:6px;grid-template-columns:repeat(var(--cols,1),1fr);grid-auto-rows:1fr}\n.gtile{position:relative;background:#111;border-radius:12px;overflow:hidden;cursor:pointer;min-height:0}\n.gtile video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.gtile.me video{transform:scaleX(-1)}\n.gtile .gav{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:42px;font-weight:700;color:#fff}\n.gtile.novid .gav{display:flex}\n.gtile.novid video{opacity:0}\n.gtile .gname{position:absolute;left:8px;bottom:6px;font-size:13px;background:#0008;padding:2px 8px;border-radius:99px;z-index:2}\n#ggrid.focus{grid-template-columns:repeat(auto-fit,minmax(90px,1fr));grid-template-rows:1fr 90px;grid-auto-rows:90px}\n#ggrid.focus .gtile.big{grid-column:1/-1;grid-row:1}\n.stage.audio #remoteVideo{position:absolute;width:1px;height:1px;opacity:0}\n.callinfo{z-index:2;position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;pointer-events:none}\n.stage:not(.audio).live .callinfo{inset:0 0 auto 0;justify-content:flex-start;padding:18px;background:linear-gradient(#000a,transparent)}\n.stage:not(.audio).live .callinfo .av{display:none}\n\n.ctrls{display:flex;justify-content:center;gap:18px;padding:16px 0 calc(20px + env(safe-area-inset-bottom));background:#0b1219}\n.ctrls button{width:60px;height:60px;border-radius:50%;background:#26343f;font-size:24px}\n.ctrls button.off{background:#fff;color:#000}\n.ctrls .red{background:var(--red)}\n.ctrls .green{background:var(--acc)}\n#lightbox img{max-width:100%;max-height:100%;border-radius:8px}\n#toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#000c;border:1px solid var(--line);padding:10px 16px;border-radius:99px;z-index:99;font-size:14px;max-width:90%;text-align:center}\n#net{position:fixed;top:0;left:0;right:0;background:#b7791f;color:#fff;text-align:center;font-size:13px;padding:4px;z-index:60}\n@media(max-width:760px){\n #app{grid-template-columns:1fr}\n #chat{display:none}\n #app.open aside{display:none}\n #app.open #chat{display:flex}\n #back{display:block}\n}\n</style>\n</head>\n<body>\n\n<div id=\"auth\" class=\"screen\" hidden>\n <div class=\"card\">\n  <div class=\"logo\">\ud83d\udcac</div>\n  <h1>Discuter</h1>\n  <div class=\"tabs\">\n   <button type=\"button\" data-tab=\"login\" class=\"on\">Connexion</button>\n   <button type=\"button\" data-tab=\"signup\">Cr\u00e9er un compte</button>\n  </div>\n  <form id=\"authForm\">\n   <input id=\"fName\" placeholder=\"Ton nom\" autocomplete=\"name\" hidden>\n   <input id=\"fEmail\" type=\"email\" placeholder=\"Adresse e-mail\" autocomplete=\"email\" required>\n   <div class=\"pw\"><input id=\"fPw\" type=\"password\" placeholder=\"Mot de passe\" autocomplete=\"current-password\" required><button type=\"button\" id=\"eye\" aria-label=\"Afficher\">\ud83d\udc41</button></div>\n   <input id=\"fPw2\" type=\"password\" placeholder=\"Confirmer le mot de passe\" autocomplete=\"new-password\" hidden>\n   <div id=\"err\" class=\"err\"></div>\n   <button class=\"primary\" id=\"submitBtn\">Se connecter</button>\n  </form>\n  <div class=\"or\">ou</div>\n  <div id=\"gSlot\"></div>\n  <button class=\"google\" id=\"gBtn\" type=\"button\"><b>G</b> Continuer avec Google</button>\n  <button type=\"button\" id=\"setupBtn\" style=\"color:var(--mut);font-size:14px;padding:6px\">\u2699 R\u00e9glages du serveur</button>\n </div>\n</div>\n\n<div id=\"app\" class=\"screen\" hidden>\n <aside>\n  <header class=\"bar\">\n   <div class=\"av\" id=\"meAv\"></div>\n   <div class=\"grow\"><b id=\"meName\"></b><small id=\"meMail\"></small></div>\n   <button id=\"grpBtn\" title=\"Cr\u00e9er un groupe\">\ud83d\udc65</button>\n   <button id=\"addBtn\" title=\"Ajouter quelqu'un\">\u2795</button>\n   <button id=\"outBtn\" title=\"Se d\u00e9connecter\">\ud83d\udeaa</button>\n  </header>\n  <div id=\"list\"></div>\n </aside>\n <main id=\"chat\">\n  <div id=\"empty\">Choisis une conversation, ou ajoute quelqu'un avec \u2795</div>\n  <div id=\"conv\" hidden>\n   <header class=\"bar\">\n    <button id=\"back\">\u2190</button>\n    <div class=\"av\" id=\"peerAv\"></div>\n    <div class=\"grow\"><b id=\"peerName\"></b><small id=\"peerStatus\"></small></div>\n    <button id=\"callA\" title=\"Appel audio\">\ud83d\udcde</button>\n    <button id=\"callV\" title=\"Appel vid\u00e9o\">\ud83c\udfa5</button>\n   </header>\n   <div id=\"msgs\"></div>\n   <form id=\"sendForm\">\n    <label class=\"clip\" title=\"Photo, vid\u00e9o, fichier\">\ud83d\udcce<input type=\"file\" id=\"file\" multiple hidden></label>\n    <input id=\"txt\" placeholder=\"\u00c9crire un message\" autocomplete=\"off\">\n    <button class=\"primary\">\u27a4</button>\n   </form>\n  </div>\n </main>\n</div>\n\n<div id=\"modal\" class=\"overlay\" hidden>\n <div class=\"modal\" style=\"max-height:90vh\">\n  <h2>Ajouter des amis</h2>\n  <input id=\"addSearch\" type=\"search\" placeholder=\"\ud83d\udd0d Chercher un nom\" autocomplete=\"off\">\n  <div id=\"ulist\"></div>\n  <form id=\"addForm\"><div class=\"row\"><input id=\"addMail\" type=\"email\" placeholder=\"Ou ajoute par e-mail\" required><button class=\"primary\">Ajouter</button></div></form>\n  <div id=\"addErr\" class=\"err\"></div>\n  <button id=\"closeModal\" type=\"button\" style=\"padding:10px;color:var(--mut)\">Fermer</button>\n </div>\n</div>\n\n<div id=\"gmodal\" class=\"overlay\" hidden>\n <div class=\"modal\" style=\"max-height:90vh\">\n  <h2 id=\"gTitle\">Cr\u00e9er un groupe</h2>\n  <div id=\"gStep1\" style=\"display:flex;flex-direction:column;gap:12px;min-height:0\">\n   <small style=\"white-space:normal\">Choisis les amis \u00e0 mettre dans le groupe :</small>\n   <div id=\"glist\" style=\"overflow:auto;max-height:50vh\"></div>\n   <button class=\"primary\" id=\"gNext\" type=\"button\" disabled>Valider</button>\n  </div>\n  <div id=\"gStep2\" hidden style=\"display:flex;flex-direction:column;gap:12px\">\n   <small id=\"gCount\" style=\"white-space:normal\"></small>\n   <input id=\"gName\" placeholder=\"Nom du groupe\" maxlength=\"40\" autocomplete=\"off\">\n   <button class=\"primary\" id=\"gCreate\" type=\"button\">Cr\u00e9er le groupe</button>\n   <button id=\"gBack\" type=\"button\" style=\"color:var(--mut);padding:6px\">\u2190 Changer les personnes</button>\n  </div>\n  <div id=\"gErr\" class=\"err\"></div>\n  <button id=\"gClose\" type=\"button\" style=\"padding:10px;color:var(--mut)\">Annuler</button>\n </div>\n</div>\n\n<div id=\"incoming\" class=\"overlay\" hidden style=\"z-index:80\">\n <div class=\"modal\" style=\"align-items:center;text-align:center\">\n  <div class=\"av big\" id=\"inAv\"></div>\n  <h2 id=\"inName\"></h2>\n  <p id=\"inType\" style=\"color:var(--mut)\"></p>\n  <div class=\"ctrls\" style=\"background:none;padding:10px 0 0\">\n   <button id=\"inNo\" class=\"red\">\ud83d\udcde</button>\n   <button id=\"inYes\" class=\"green\">\ud83d\udcde</button>\n  </div>\n </div>\n</div>\n\n<div id=\"call\" class=\"overlay\" hidden>\n <div class=\"stage audio\" id=\"stage\">\n  <video id=\"remoteVideo\" class=\"vid-full\" autoplay playsinline muted></video>\n  <audio id=\"remoteAudio\" autoplay></audio>\n  <div class=\"callinfo\"><div class=\"av big\" id=\"callAv\"></div><h2 id=\"callName\"></h2><p id=\"callStatus\"></p><p id=\"callNote\" style=\"font-size:13px;color:#f0b35a;max-width:300px\"></p></div>\n  <video id=\"localVideo\" class=\"vid-pip\" autoplay playsinline muted></video>\n </div>\n <div class=\"ctrls\">\n  <button id=\"bMic\" title=\"Micro\">\ud83c\udfa4</button>\n  <button id=\"bCam\" title=\"Cam\u00e9ra\">\ud83d\udcf7</button>\n  <button id=\"bEnd\" class=\"red\" title=\"Raccrocher\">\ud83d\udcde</button>\n </div>\n</div>\n\n<div id=\"setup\" class=\"overlay\" hidden style=\"z-index:70;overflow:auto\">\n <div class=\"modal\">\n  <h2>\u2699 Serveur</h2>\n  <p style=\"color:var(--mut);font-size:14px\">Les messages et les appels passent par un serveur (gratuit sur Render). Colle ici son adresse.</p>\n  <input id=\"srvUrl\" type=\"url\" placeholder=\"https://mon-app.onrender.com\" autocapitalize=\"off\" autocorrect=\"off\">\n  <div id=\"srvErr\" class=\"err\"></div>\n  <button class=\"primary\" id=\"srvSave\" type=\"button\">Enregistrer et se connecter</button>\n  <div id=\"zipBox\" hidden style=\"border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:8px\">\n   <b>Pas encore de serveur ?</b>\n   <button class=\"primary\" id=\"zipBtn\" type=\"button\" style=\"background:#3b6ea8\">\u2b07 T\u00e9l\u00e9charger le serveur (zip)</button>\n   <ol style=\"font-size:13.5px;color:var(--mut);padding-left:18px;line-height:1.6\">\n    <li>D\u00e9zippe le fichier et mets son contenu sur un d\u00e9p\u00f4t GitHub.</li>\n    <li>Sur render.com : New + > Web Service > choisis ton d\u00e9p\u00f4t.</li>\n    <li>Build : <code>npm install</code> \u00b7 Start : <code>node server.js</code></li>\n    <li>Copie l'adresse https que Render te donne et colle-la ci-dessus.</li>\n   </ol>\n  </div>\n  <button id=\"srvClose\" type=\"button\" style=\"padding:10px;color:var(--mut)\">Fermer</button>\n </div>\n</div>\n\n<div id=\"gcall\" class=\"overlay\" hidden style=\"z-index:55;background:#05090d;padding:0;flex-direction:column;align-items:stretch;justify-content:flex-start\">\n <div id=\"gtitle\"></div>\n <div id=\"ggrid\"></div>\n <div class=\"ctrls\">\n  <button id=\"gMic\" title=\"Micro\">\ud83c\udfa4</button>\n  <button id=\"gCam\" title=\"Cam\u00e9ra\">\ud83d\udcf7</button>\n  <button id=\"gEnd\" class=\"red\" title=\"Quitter l'appel\">\ud83d\udcde</button>\n </div>\n</div>\n\n<div id=\"lightbox\" class=\"overlay\" hidden></div>\n<div id=\"net\" hidden>Reconnexion au serveur\u2026</div>\n<div id=\"toast\" hidden></div>\n\n<script>\n'use strict';\nconst $ = s => document.querySelector(s);\nlet token = localStorage.getItem('token');\nlet BASE = (localStorage.getItem('server') || '').replace(/\\/+$/, '');   // vide = m\u00eame adresse que la page\nconst furl = u => BASE + u;\nconst ZIP_B64 = '';   // rempli dans la version \u00ab tout-en-un \u00bb\nlet me = null, contacts = [], groups = [], msgs = new Map(), online = new Set(), current = null, unread = {};\nlet ws = null, wsTry = 0, cfg = {googleClientId: '', iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};\n\n/* ---------- utilitaires ---------- */\nlet toastT;\nfunction toast(t, ms = 3500){ const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, ms); }\nconst initials = n => (n || '?').trim().slice(0, 1).toUpperCase();\nfunction colorOf(s){ let h = 0; for(const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 55% 42%)`; }\nfunction setAv(el, u){ el.textContent = initials(u.name); el.style.background = colorOf(u.email); }\nconst fmtTime = ts => new Date(ts).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});\nconst fmtDur = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;\nfunction h(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }\nconst sizeStr = b => b > 1e6 ? (b / 1e6).toFixed(1) + ' Mo' : Math.max(1, Math.round(b / 1e3)) + ' Ko';\nconst isGroup = k => typeof k === 'string' && k.startsWith('g:');\nconst groupOf = id => groups.find(g => g.id === id);\nconst userOf = email => contacts.find(c => c.email === email) || {email, name: email};\nfunction nameIn(email, gid){\n  if(email === me.email) return 'Toi';\n  const g = groupOf(gid), m = g && g.members.find(x => x.email === email);\n  return m ? m.name : userOf(email).name;\n}\nfunction setGroupAv(el, g){ el.textContent = '\ud83d\udc65'; el.style.background = colorOf(g.id); }\n\nasync function api(path, opts = {}){\n  const headers = Object.assign({}, opts.headers || {});\n  if(token) headers.Authorization = 'Bearer ' + token;\n  if(typeof opts.body === 'string') headers['Content-Type'] = 'application/json';\n  let r;\n  try{ r = await fetch(BASE + path, Object.assign({}, opts, {headers})); }\n  catch{ throw new Error('Serveur injoignable. V\u00e9rifie ta connexion.'); }\n  let j = {}; try{ j = await r.json(); }catch{}\n  if(!r.ok){ const e = new Error(j.error || 'Erreur serveur'); e.status = r.status; throw e; }\n  return j;\n}\n\n/* ---------- connexion / inscription ---------- */\nlet mode = 'login';\ndocument.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setMode(b.dataset.tab));\nfunction setMode(m){\n  mode = m;\n  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === m));\n  $('#fName').hidden = $('#fPw2').hidden = m !== 'signup';\n  $('#fName').required = $('#fPw2').required = m === 'signup';\n  $('#fPw').autocomplete = m === 'signup' ? 'new-password' : 'current-password';\n  $('#submitBtn').textContent = m === 'signup' ? 'Cr\u00e9er mon compte' : 'Se connecter';\n  $('#err').textContent = '';\n}\n$('#eye').onclick = () => { const p = $('#fPw'); p.type = p.type === 'password' ? 'text' : 'password'; $('#fPw2').type = p.type; };\n\n$('#authForm').onsubmit = async e => {\n  e.preventDefault();\n  const err = t => $('#err').textContent = t;\n  const pw = $('#fPw').value;\n  if(mode === 'signup' && pw !== $('#fPw2').value) return err('Les deux mots de passe sont diff\u00e9rents.');\n  const btn = $('#submitBtn'); btn.disabled = true; err('');\n  try{\n    const j = await api(mode === 'signup' ? '/api/signup' : '/api/login', {method: 'POST', body: JSON.stringify({\n      name: $('#fName').value.trim(), email: $('#fEmail').value.trim(), password: pw})});\n    token = j.token; localStorage.setItem('token', token); await boot();\n  }catch(ex){ err(ex.message); }\n  btn.disabled = false;\n};\n\nasync function googleCallback(r){\n  try{\n    const j = await api('/api/google', {method: 'POST', body: JSON.stringify({credential: r.credential})});\n    token = j.token; localStorage.setItem('token', token); await boot();\n  }catch(ex){ $('#err').textContent = ex.message; }\n}\nfunction setupGoogle(){\n  if(!cfg.googleClientId){\n    $('#gBtn').onclick = () => $('#err').textContent = \"La connexion Google n'est pas encore activ\u00e9e sur ce serveur (voir le README).\";\n    return;\n  }\n  $('#gBtn').hidden = true;\n  const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;\n  s.onload = () => {\n    google.accounts.id.initialize({client_id: cfg.googleClientId, callback: googleCallback});\n    google.accounts.id.renderButton($('#gSlot'), {theme: 'outline', size: 'large', width: 300, text: 'continue_with', locale: 'fr'});\n  };\n  s.onerror = () => { $('#gBtn').hidden = false; $('#gBtn').onclick = () => $('#err').textContent = 'Impossible de charger Google.'; };\n  document.head.appendChild(s);\n}\n\nasync function boot(){\n  try{\n    const j = await api('/api/me');\n    me = j.user; contacts = j.contacts; groups = j.groups || [];\n  }catch(ex){\n    token = null; localStorage.removeItem('token'); me = null;\n    $('#app').hidden = true; $('#auth').hidden = false; return;\n  }\n  $('#auth').hidden = true; $('#app').hidden = false;\n  setAv($('#meAv'), me); $('#meName').textContent = me.name; $('#meMail').textContent = me.email;\n  current = null; unread = {}; msgs = new Map(); online = new Set();\n  $('#app').classList.remove('open'); $('#conv').hidden = true; $('#empty').hidden = false;\n  await loadHistory(); renderList(); connect();\n}\nasync function loadHistory(){\n  try{ const j = await api('/api/history'); j.messages.forEach(m => msgs.set(m.id, m)); }catch{}\n}\n$('#outBtn').onclick = async () => {\n  hangup(true);\n  try{ await api('/api/logout', {method: 'POST'}); }catch{}\n  token = null; localStorage.removeItem('token'); me = null; current = null;\n  if(ws){ ws.onclose = null; ws.close(); ws = null; }\n  $('#app').hidden = true; $('#auth').hidden = false;\n  $('#fPw').value = $('#fPw2').value = ''; setMode('login');\n};\n\n/* ---------- connexion temps r\u00e9el ---------- */\nlet lastSeen = 0, beatInt = null;\nfunction startBeat(){\n  clearInterval(beatInt);\n  beatInt = setInterval(() => {\n    if(!ws || ws.readyState !== 1) return;\n    if(Date.now() - lastSeen > 45000){ try{ ws.close(); }catch{} return; }   // connexion fant\u00f4me : on reconnecte\n    ws.send('{\"t\":\"ping\"}');\n  }, 15000);\n}\ndocument.addEventListener('visibilitychange', () => {\n  if(document.hidden || !me) return;\n  if(!ws || ws.readyState > 1) connect(); else if(ws.readyState === 1) ws.send('{\"t\":\"ping\"}');\n});\nfunction connect(){\n  if(!token || !me) return;\n  if(ws && ws.readyState <= 1) return;\n  const root = (BASE || location.origin).replace(/^http/, 'ws');\n  ws = new WebSocket(`${root}/ws?token=${token}`);\n  ws.onopen = () => { wsTry = 0; lastSeen = Date.now(); startBeat(); $('#net').hidden = true; };\n  ws.onmessage = e => { lastSeen = Date.now(); try{ onWs(JSON.parse(e.data)); }catch(ex){ console.error(ex); } };\n  ws.onclose = () => {\n    if(!me) return;\n    $('#net').hidden = false;\n    if(pc && !connectedAt) hangup(false);\n    if(gcall) leaveGroupCall(false);\n    wsTry++; setTimeout(async () => { if(me){ await loadHistory(); renderList(); if(current) renderChat(); connect(); } }, Math.min(1000 * wsTry, 8000));\n  };\n}\nfunction wsSend(o){\n  if(ws && ws.readyState === 1){ ws.send(JSON.stringify(o)); return true; }\n  toast('Pas de connexion au serveur, r\u00e9essaie dans un instant.'); return false;\n}\nfunction onWs(m){\n  switch(m.t){\n    case 'hello': online = new Set(m.online); renderList(); updateHeader(); break;\n    case 'presence': m.online ? online.add(m.email) : online.delete(m.email); renderList(); updateHeader(); break;\n    case 'contact':\n      if(!contacts.find(c => c.email === m.contact.email)) contacts.push(m.contact);\n      if(m.online) online.add(m.contact.email);\n      renderList(); toast(m.contact.name + ' t\\'a ajout\u00e9'); break;\n    case 'group':\n      if(!groupOf(m.group.id)) groups.push(m.group);\n      renderList(); toast((m.by || 'Quelqu\\'un') + ' t\\'a ajout\u00e9 au groupe \u00ab ' + m.group.name + ' \u00bb'); break;\n    case 'msg': {\n      msgs.set(m.m.id, m.m);\n      const other = isGroup(m.m.to) ? m.m.to : (m.m.from === me.email ? m.m.to : m.m.from);\n      if(isGroup(other) ? !groupOf(other) : !contacts.find(c => c.email === other)) break;\n      if(m.m.from !== me.email && m.m.kind !== 'call' && current !== other) unread[other] = (unread[other] || 0) + 1;\n      if(current === other) renderChat();\n      renderList(); break;\n    }\n    case 'gring':\n      if(pc || pending || gcall) break;\n      pending = {group: m.gid, from: m.from, video: m.video};\n      setGroupAv($('#inAv'), groupOf(m.gid) || {id: m.gid});\n      $('#inName').textContent = groupOf(m.gid)?.name || 'Groupe';\n      $('#inType').textContent = `${m.name} lance un appel ${m.video ? 'vid\u00e9o ' : ''}de groupe\u2026`;\n      $('#incoming').hidden = false; startRing(); break;\n    case 'gend': if(pending && pending.group === m.gid){ pending = null; hideIncoming(); } break;\n    case 'gbusy': toast('Tu es d\u00e9j\u00e0 en appel.'); if(gcall) leaveGroupCall(false); break;\n    case 'gpeers': if(gcall && gcall.gid === m.gid) m.peers.forEach(p => gConnect(p.email, p.name, true)); break;\n    case 'gleft': gDrop(m.email, m.gid); break;\n    case 'gsig': onGSig(m); break;\n    case 'offer': onOffer(m); break;\n    case 'answer': onAnswer(m); break;\n    case 'ice': addIce(m.from, m.candidate); break;\n    case 'end':\n      if(pending && pending.from === m.from){ pending = null; hideIncoming(); toast('Appel manqu\u00e9'); }\n      else if(callPeer === m.from) hangup(false);\n      break;\n    case 'reject': if(callPeer === m.from){ toast('Appel refus\u00e9'); hangup(false); } break;\n    case 'busy': if(callPeer === m.from){ toast(userOf(m.from).name + ' est d\u00e9j\u00e0 en appel'); hangup(false); } break;\n    case 'unavailable': if(callPeer === m.from){ toast(userOf(m.from).name + \" n'est pas en ligne\"); hangup(false); } break;\n    case 'taken': if(pending){ pending = null; hideIncoming(); } break;\n  }\n}\n\n/* ---------- contacts ---------- */\nlet allUsers = [];\n$('#addBtn').onclick = () => { $('#addErr').textContent = ''; $('#addMail').value = ''; $('#addSearch').value = ''; $('#modal').hidden = false; loadUsers(); };\nasync function loadUsers(){\n  $('#ulist').innerHTML = ''; $('#ulist').appendChild(h('div', 'noc', 'Chargement\u2026'));\n  try{ allUsers = (await api('/api/users')).users; }catch(ex){ allUsers = []; $('#addErr').textContent = ex.message; }\n  renderUsers();\n}\nfunction renderUsers(){\n  const q = $('#addSearch').value.trim().toLowerCase(), box = $('#ulist'); box.innerHTML = '';\n  const list = allUsers.filter(u => !q || u.name.toLowerCase().includes(q));\n  if(!list.length){ box.appendChild(h('div', 'noc', allUsers.length ? 'Personne ne correspond.' : \"Personne d'autre n'est inscrit pour l'instant. Invite tes amis \u00e0 cr\u00e9er un compte !\")); return; }\n  list.forEach(u => {\n    const r = h('div', 'urow'), av = h('div', 'av' + (u.online ? ' on' : '')); setAv(av, {name: u.name, email: u.id});\n    const t = h('div', 'grow'); t.append(h('b', null, u.name), h('small', null, u.online ? 'en ligne' : u.email));\n    const btn = h('button', 'add', 'Ajouter');\n    btn.onclick = async () => {\n      btn.disabled = true;\n      try{\n        const j = await api('/api/contacts', {method: 'POST', body: JSON.stringify({id: u.id})});\n        if(!contacts.find(c => c.email === j.contact.email)) contacts.push(j.contact);\n        if(j.online) online.add(j.contact.email);\n        allUsers = allUsers.filter(x => x.id !== u.id); renderUsers(); renderList(); toast(u.name + ' ajout\u00e9 \u2714');\n      }catch(ex){ btn.disabled = false; $('#addErr').textContent = ex.message; }\n    };\n    r.append(av, t, btn); box.appendChild(r);\n  });\n}\n$('#addSearch').oninput = renderUsers;\n$('#closeModal').onclick = () => $('#modal').hidden = true;\n$('#addForm').onsubmit = async e => {\n  e.preventDefault();\n  try{\n    const j = await api('/api/contacts', {method: 'POST', body: JSON.stringify({email: $('#addMail').value.trim()})});\n    if(!contacts.find(c => c.email === j.contact.email)) contacts.push(j.contact);\n    if(j.online) online.add(j.contact.email);\n    $('#modal').hidden = true; renderList(); openChat(j.contact.email);\n  }catch(ex){ $('#addErr').textContent = ex.message; }\n};\n\n/* ---------- groupes ---------- */\nlet gSel = new Set();\nfunction gShow(step){ $('#gStep1').hidden = step !== 1; $('#gStep2').hidden = step !== 2; $('#gErr').textContent = ''; $('#gTitle').textContent = step === 1 ? 'Cr\u00e9er un groupe' : 'Nom du groupe'; }\n$('#grpBtn').onclick = () => {\n  gSel = new Set(); $('#gName').value = ''; gShow(1); renderGlist(); $('#gmodal').hidden = false;\n};\nfunction renderGlist(){\n  const box = $('#glist'); box.innerHTML = '';\n  if(!contacts.length){ box.appendChild(h('div', 'noc', \"Tu n'as pas encore d'amis. Ajoute-en avec \u2795 d'abord.\")); }\n  contacts.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr')).forEach(u => {\n    const r = h('label', 'urow'); r.style.cursor = 'pointer';\n    const av = h('div', 'av' + (online.has(u.email) ? ' on' : '')); setAv(av, u);\n    const t = h('div', 'grow'); t.append(h('b', null, u.name), h('small', null, online.has(u.email) ? 'en ligne' : 'hors ligne'));\n    const c = document.createElement('input'); c.type = 'checkbox'; c.className = 'chk'; c.checked = gSel.has(u.email);\n    c.onchange = () => { c.checked ? gSel.add(u.email) : gSel.delete(u.email); $('#gNext').disabled = !gSel.size; $('#gNext').textContent = gSel.size ? `Valider (${gSel.size})` : 'Valider'; };\n    r.append(av, t, c); box.appendChild(r);\n  });\n  $('#gNext').disabled = !gSel.size; $('#gNext').textContent = gSel.size ? `Valider (${gSel.size})` : 'Valider';\n}\n$('#gNext').onclick = () => { $('#gCount').textContent = gSel.size + (gSel.size > 1 ? ' personnes s\u00e9lectionn\u00e9es' : ' personne s\u00e9lectionn\u00e9e') + ' (+ toi)'; gShow(2); $('#gName').focus(); };\n$('#gBack').onclick = () => gShow(1);\n$('#gClose').onclick = () => $('#gmodal').hidden = true;\n$('#gCreate').onclick = async () => {\n  const name = $('#gName').value.trim();\n  if(!name) return $('#gErr').textContent = '\u00c9cris un nom pour le groupe.';\n  const btn = $('#gCreate'); btn.disabled = true;\n  try{\n    const j = await api('/api/groups', {method: 'POST', body: JSON.stringify({name, members: [...gSel]})});\n    if(!groupOf(j.group.id)) groups.push(j.group);\n    $('#gmodal').hidden = true; renderList(); openChat(j.group.id);\n  }catch(ex){ $('#gErr').textContent = ex.message; }\n  btn.disabled = false;\n};\n\n/* ---------- liste & conversation ---------- */\nfunction lastOf(key){\n  let l = null;\n  for(const m of msgs.values()){\n    const ok = isGroup(key) ? m.to === key : ((m.from === key && m.to === me.email) || (m.to === key && m.from === me.email));\n    if(ok && (!l || m.id > l.id)) l = m;\n  }\n  return l;\n}\nfunction preview(m){\n  if(!m) return 'Dis bonjour \ud83d\udc4b';\n  const p = isGroup(m.to) ? (m.from === me.email ? 'Toi : ' : nameIn(m.from, m.to) + ' : ') : (m.from === me.email ? 'Toi : ' : '');\n  if(m.kind === 'text') return p + m.text;\n  if(m.kind === 'image') return p + '\ud83d\udcf7 Photo';\n  if(m.kind === 'video') return p + '\ud83c\udfac Vid\u00e9o';\n  if(m.kind === 'call') return '\ud83d\udcde ' + m.text;\n  return p + '\ud83d\udcce ' + (m.file?.name || 'Fichier');\n}\nfunction renderList(){\n  if(!me) return;\n  const box = $('#list'); box.innerHTML = '';\n  const items = [\n    ...contacts.map(u => ({key: u.email, name: u.name, u, l: lastOf(u.email)})),\n    ...groups.map(g => ({key: g.id, name: g.name, g, l: lastOf(g.id)}))\n  ].sort((a, b) => (b.l?.ts || 0) - (a.l?.ts || 0));\n  if(!items.length){ box.appendChild(h('div', 'noc', 'Aucun contact. Appuie sur \u2795 pour ajouter quelqu\\'un.')); return; }\n  items.forEach(({key, name, u, g, l}) => {\n    const it = h('button', 'item' + (current === key ? ' on' : ''));\n    const av = h('div', 'av' + (u && online.has(key) ? ' on' : ''));\n    if(g) setGroupAv(av, g); else setAv(av, u);\n    const body = h('div', 'grow');\n    const top = h('div', 'top'); top.append(h('b', null, name), h('span', 't', l ? fmtTime(l.ts) : ''));\n    const sub = h('div', 'top'); sub.appendChild(h('small', null, preview(l) || (g ? '\u00c9cris le premier message' : '')));\n    if(unread[key]) sub.appendChild(h('span', 'badge', unread[key]));\n    body.append(top, sub); it.append(av, body);\n    it.onclick = () => openChat(key);\n    box.appendChild(it);\n  });\n}\nfunction updateHeader(){\n  if(!current) return;\n  const grp = isGroup(current);\n  if(grp){\n    const g = groupOf(current); if(!g) return;\n    setGroupAv($('#peerAv'), g); $('#peerAv').classList.remove('on');\n    $('#peerStatus').textContent = g.members.map(m => m.email === me.email ? 'Toi' : m.name).join(', ');\n    return;\n  }\n  const u = userOf(current);\n  $('#peerAv').classList.toggle('on', online.has(current));\n  $('#peerStatus').textContent = online.has(current) ? 'en ligne' : 'hors ligne';\n  setAv($('#peerAv'), u);\n}\nfunction openChat(key){\n  current = key; unread[key] = 0;\n  $('#peerName').textContent = isGroup(key) ? (groupOf(key)?.name || 'Groupe') : userOf(key).name;\n  updateHeader();\n  $('#empty').hidden = true; $('#conv').hidden = false; $('#app').classList.add('open');\n  renderChat(); renderList();\n}\n$('#back').onclick = () => { current = null; $('#app').classList.remove('open'); $('#conv').hidden = true; $('#empty').hidden = false; renderList(); };\n\nfunction renderChat(){\n  const box = $('#msgs'); box.innerHTML = '';\n  [...msgs.values()].filter(m => isGroup(current) ? m.to === current : ((m.from === me.email && m.to === current) || (m.from === current && m.to === me.email)))\n    .sort((a, b) => a.id - b.id).forEach(m => {\n      if(m.kind === 'call'){ box.appendChild(h('div', 'sys', `\ud83d\udcde ${m.text} \u00b7 ${fmtTime(m.ts)}`)); return; }\n      const b = h('div', 'b' + (m.from === me.email ? ' me' : ''));\n      if(isGroup(current) && m.from !== me.email){ const sn = h('div', 'sender', nameIn(m.from, current)); sn.style.color = colorOf(m.from).replace('42%', '70%'); b.appendChild(sn); }\n      if(m.kind === 'text') b.appendChild(h('div', null, m.text));\n      else if(m.kind === 'image'){\n        const i = document.createElement('img'); i.src = furl(m.file.url); i.alt = m.file.name || ''; i.loading = 'lazy';\n        i.onclick = () => { const lb = $('#lightbox'); lb.innerHTML = ''; const x = document.createElement('img'); x.src = i.src; lb.appendChild(x); lb.hidden = false; };\n        b.appendChild(i);\n      } else if(m.kind === 'video'){\n        const v = document.createElement('video'); v.src = furl(m.file.url); v.controls = true; v.playsInline = true; v.preload = 'metadata'; b.appendChild(v);\n      } else {\n        const a = document.createElement('a'); a.href = furl(m.file.url); a.download = m.file.name || 'fichier';\n        a.textContent = `\ud83d\udcce ${m.file.name || 'Fichier'} (${sizeStr(m.file.size || 0)})`; b.appendChild(a);\n      }\n      b.appendChild(h('div', 'ts', fmtTime(m.ts)));\n      box.appendChild(b);\n    });\n  box.scrollTop = box.scrollHeight;\n}\n$('#lightbox').onclick = () => $('#lightbox').hidden = true;\n\n$('#sendForm').onsubmit = e => {\n  e.preventDefault();\n  const t = $('#txt').value.trim(); if(!t || !current) return;\n  if(wsSend({t: 'msg', to: current, kind: 'text', text: t})) $('#txt').value = '';\n};\n$('#file').onchange = async e => {\n  const files = [...e.target.files], peer = current; e.target.value = '';\n  for(const f of files){\n    if(f.size > 25e6){ toast(`\u00ab ${f.name} \u00bb d\u00e9passe 25 Mo`); continue; }\n    toast(`Envoi de ${f.name}\u2026`);\n    try{\n      const up = await api(`/upload?name=${encodeURIComponent(f.name)}&type=${encodeURIComponent(f.type || 'application/octet-stream')}`, {method: 'POST', body: f});\n      const kind = /^image\\/(?!svg)/.test(up.type) ? 'image' : up.type.startsWith('video/') ? 'video' : 'file';\n      wsSend({t: 'msg', to: peer, kind, file: {url: up.url}});\n    }catch(ex){ toast(ex.message); }\n  }\n};\n\n/* ---------- appels (WebRTC, signalisation via le serveur) ---------- */\nlet pc = null, localStream = null, callPeer = null, isCaller = false, pending = null;\nlet connectedAt = 0, timerInt = null, ringTO = null, iceQueue = [], callVideo = false, remoteStream = null;\nlet ringCtx = null, ringInt = null;\nfunction startRing(){\n  stopRing();\n  const beep = () => {\n    try{\n      ringCtx = ringCtx || new (window.AudioContext || window.webkitAudioContext)();\n      if(ringCtx.state === 'suspended') ringCtx.resume();\n      const o = ringCtx.createOscillator(), g = ringCtx.createGain();\n      o.frequency.value = 880; g.gain.value = 0.2; o.connect(g); g.connect(ringCtx.destination);\n      o.start(); o.stop(ringCtx.currentTime + 0.35);\n    }catch{}\n    if(navigator.vibrate) navigator.vibrate([300, 150, 300]);\n  };\n  beep(); ringInt = setInterval(beep, 1800);\n}\nfunction stopRing(){ clearInterval(ringInt); ringInt = null; if(navigator.vibrate) navigator.vibrate(0); }\nfunction hideIncoming(){ stopRing(); $('#incoming').hidden = true; }\nfunction failTimer(ms){\n  clearTimeout(ringTO);\n  ringTO = setTimeout(() => { if(pc && !connectedAt){ toast(\"Connexion impossible : le r\u00e9seau bloque l'appel. R\u00e9essaie.\", 6000); hangup(true); } }, ms);\n}\n\nlet mediaNote = '';\nfunction explainMediaError(e){\n  const n = e && e.name;\n  if(n === 'NotAllowedError' || n === 'SecurityError') return \"Autorisation refus\u00e9e. Clique sur le cadenas \ud83d\udd12 \u00e0 c\u00f4t\u00e9 de l'adresse, autorise le micro et la cam\u00e9ra, puis recharge la page.\";\n  if(n === 'NotFoundError' || n === 'OverconstrainedError') return 'Aucun micro ni cam\u00e9ra trouv\u00e9 sur cet appareil.';\n  if(n === 'NotReadableError' || n === 'AbortError') return 'Micro ou cam\u00e9ra d\u00e9j\u00e0 utilis\u00e9s par une autre application.';\n  return \"Impossible d'acc\u00e9der au micro ou \u00e0 la cam\u00e9ra.\";\n}\n// Essaie le maximum : micro+cam\u00e9ra, puis micro seul, puis cam\u00e9ra seule. Ne renvoie jamais null :\n// si rien n'est autoris\u00e9, l'appel continue en mode \u00ab \u00e9coute \u00bb (tu vois/entends l'autre personne).\nasync function getMedia(wantVideo){\n  mediaNote = '';\n  const md = navigator.mediaDevices;\n  if(!md || !md.getUserMedia){\n    mediaNote = window.isSecureContext\n      ? \"Ce navigateur ne peut pas utiliser le micro. Essaie Chrome, Edge, Firefox ou Safari.\"\n      : \"Micro et cam\u00e9ra bloqu\u00e9s : ouvre le site avec une adresse en https:// (pas dans l'aper\u00e7u d'une autre appli).\";\n    toast(mediaNote, 7000); return new MediaStream();\n  }\n  const tries = wantVideo ? [{audio: true, video: true}, {audio: true}, {video: true}] : [{audio: true}];\n  let firstErr = null;\n  for(const c of tries){\n    try{\n      const s = await md.getUserMedia(c);\n      const a = s.getAudioTracks().length > 0, v = s.getVideoTracks().length > 0, notes = [];\n      if(wantVideo && !v) notes.push('Cam\u00e9ra indisponible');\n      if(!a) notes.push(\"Micro indisponible (on ne t'entend pas)\");\n      if(notes.length){\n        mediaNote = notes.join(' \u00b7 ') + (firstErr ? ' \u2014 ' + explainMediaError(firstErr) : '');\n        toast(mediaNote, 7000);\n      }\n      return s;\n    }catch(e){\n      console.warn('getUserMedia', c, e);\n      if(!firstErr || e.name === 'NotAllowedError') firstErr = e;\n    }\n  }\n  mediaNote = explainMediaError(firstErr) + ' Tu peux quand m\u00eame voir et entendre l\\'autre personne.';\n  toast(mediaNote, 9000);\n  return new MediaStream();\n}\nasync function addIce(from, c){\n  if(!c) return;\n  if(pc && pc.remoteDescription && callPeer === from){ try{ await pc.addIceCandidate(c); }catch{} }\n  else iceQueue.push({from, c});\n}\nasync function flushIce(){\n  const q = iceQueue; iceQueue = [];\n  for(const x of q) if(x.from === callPeer){ try{ await pc.addIceCandidate(x.c); }catch{} }\n}\nfunction playRemote(){\n  $('#remoteVideo').play().catch(() => {});\n  $('#remoteAudio').play().catch(() => toast(\"Touche l'\u00e9cran pour activer le son\"));\n}\n$('#call').addEventListener('click', () => { playRemote(); });\nfunction setupPC(wantVideo){\n  pc = new RTCPeerConnection({iceServers: cfg.iceServers, iceCandidatePoolSize: 4});\n  remoteStream = new MediaStream();\n  $('#remoteVideo').srcObject = remoteStream; $('#remoteAudio').srcObject = remoteStream;\n  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));\n  // sans micro/cam\u00e9ra local, on demande quand m\u00eame \u00e0 recevoir l'audio (et la vid\u00e9o si c'est un appel vid\u00e9o)\n  if(!localStream.getAudioTracks().length) pc.addTransceiver('audio', {direction: 'recvonly'});\n  if(wantVideo && !localStream.getVideoTracks().length) pc.addTransceiver('video', {direction: 'recvonly'});\n  const peer = callPeer;\n  pc.onicecandidate = e => { if(e.candidate) wsSend({t: 'ice', to: peer, candidate: e.candidate}); };\n  pc.ontrack = e => {\n    if(!remoteStream.getTracks().includes(e.track)) remoteStream.addTrack(e.track);\n    const upd = () => remoteStream && $('#stage').classList.toggle('audio', !remoteStream.getVideoTracks().some(t => !t.muted && t.readyState === 'live'));\n    e.track.onunmute = upd; e.track.onmute = upd; e.track.onended = upd; upd(); playRemote();\n  };\n  pc.onconnectionstatechange = () => {\n    if(!pc) return;\n    if(pc.connectionState === 'connected' && !connectedAt){\n      connectedAt = Date.now(); clearTimeout(ringTO); $('#stage').classList.add('live'); playRemote();\n      timerInt = setInterval(() => $('#callStatus').textContent = fmtDur(Math.round((Date.now() - connectedAt) / 1000)), 500);\n    }\n    if(pc.connectionState === 'failed'){ toast('Connexion perdue'); hangup(true); }\n  };\n}\nlet swapped = false;\nfunction applySwap(){\n  const r = $('#remoteVideo'), l = $('#localVideo');\n  r.className = swapped ? 'vid-pip' : 'vid-full'; l.className = swapped ? 'vid-full' : 'vid-pip';\n  for(const v of [r, l]) v.style.left = v.style.top = v.style.right = v.style.bottom = '';\n  $('#stage').classList.toggle('swap', swapped);\n}\nfunction pipGesture(v){\n  let sx = 0, sy = 0, bx = 0, by = 0, moved = false, active = false;\n  v.addEventListener('pointerdown', e => {\n    if(!v.classList.contains('vid-pip') && !(swapped && v.id === 'localVideo')) return;\n    const sr = $('#stage').getBoundingClientRect(), vr = v.getBoundingClientRect();\n    active = true; moved = false; sx = e.clientX; sy = e.clientY; bx = vr.left - sr.left; by = vr.top - sr.top;\n    try{ v.setPointerCapture(e.pointerId); }catch{}\n    e.stopPropagation();\n  });\n  v.addEventListener('pointermove', e => {\n    if(!active || v.classList.contains('vid-full')) return;\n    const dx = e.clientX - sx, dy = e.clientY - sy;\n    if(!moved && Math.hypot(dx, dy) < 8) return;\n    moved = true;\n    const sr = $('#stage').getBoundingClientRect();\n    const x = Math.min(Math.max(0, bx + dx), sr.width - v.offsetWidth), y = Math.min(Math.max(0, by + dy), sr.height - v.offsetHeight);\n    v.style.right = v.style.bottom = 'auto'; v.style.left = x + 'px'; v.style.top = y + 'px';\n  });\n  v.addEventListener('pointerup', () => {\n    if(!active) return; active = false;\n    if(!moved && $('#localVideo').srcObject?.getVideoTracks().length){ swapped = !swapped; applySwap(); }\n  });\n  v.addEventListener('pointercancel', () => active = false);\n}\npipGesture($('#localVideo')); pipGesture($('#remoteVideo'));\n\nfunction showCall(peer, status){\n  swapped = false; applySwap();\n  const u = userOf(peer);\n  setAv($('#callAv'), u); $('#callName').textContent = u.name; $('#callStatus').textContent = status;\n  $('#stage').classList.remove('live'); $('#stage').classList.add('audio');\n  const lv = $('#localVideo'); lv.srcObject = localStream;\n  const hasV = localStream.getVideoTracks().length > 0;\n  lv.hidden = !hasV; $('#bCam').hidden = !hasV;\n  $('#bMic').hidden = !localStream.getAudioTracks().length;\n  $('#callNote').textContent = mediaNote;\n  $('#bMic').classList.remove('off'); $('#bCam').classList.remove('off');\n  $('#call').hidden = false;\n}\nasync function startCall(video){\n  if(pc || pending || gcall || !current) return;\n  const peer = current;\n  if(!ws || ws.readyState !== 1) return toast('Pas de connexion au serveur.');\n  localStream = await getMedia(video);\n  callPeer = peer; isCaller = true; callVideo = !!video; connectedAt = 0; iceQueue = [];\n  setupPC(callVideo); showCall(peer, 'Appel en cours\u2026');\n  const off = await pc.createOffer(); await pc.setLocalDescription(off);\n  wsSend({t: 'offer', to: peer, video: callVideo, sdp: {type: off.type, sdp: off.sdp}});\n  ringTO = setTimeout(() => { if(pc && !connectedAt){ toast('Pas de r\u00e9ponse'); hangup(true); } }, 45000);\n}\n$('#callA').onclick = () => isGroup(current) ? startGroupCall(current, false) : startCall(false);\n$('#callV').onclick = () => isGroup(current) ? startGroupCall(current, true) : startCall(true);\n\nfunction onOffer(o){\n  if(pc || pending || gcall){ wsSend({t: 'reject', to: o.from}); return; }\n  pending = o; iceQueue = [];\n  const u = userOf(o.from);\n  setAv($('#inAv'), u); $('#inName').textContent = u.name;\n  $('#inType').textContent = o.video ? 'Appel vid\u00e9o entrant\u2026' : 'Appel audio entrant\u2026';\n  $('#incoming').hidden = false;\n  startRing();\n}\n$('#inNo').onclick = () => {\n  if(!pending) return;\n  if(!pending.group) wsSend({t: 'reject', to: pending.from});\n  pending = null; hideIncoming();\n};\n$('#inYes').onclick = async () => {\n  const o = pending; if(!o) return;\n  pending = null; hideIncoming();\n  if(o.group){ startGroupCall(o.group, o.video); return; }\n  localStream = await getMedia(o.video);\n  callPeer = o.from; isCaller = false; callVideo = !!o.video; connectedAt = 0;\n  setupPC(callVideo); showCall(o.from, 'Connexion\u2026'); failTimer(30000);\n  await pc.setRemoteDescription(o.sdp); await flushIce();\n  const a = await pc.createAnswer(); await pc.setLocalDescription(a);\n  wsSend({t: 'answer', to: o.from, sdp: {type: a.type, sdp: a.sdp}});\n};\nasync function onAnswer(m){\n  if(pc && callPeer === m.from && !pc.currentRemoteDescription){\n    await pc.setRemoteDescription(m.sdp); await flushIce();\n    $('#callStatus').textContent = 'Connexion\u2026'; failTimer(30000);\n  }\n}\n$('#bMic').onclick = () => {\n  const t = localStream?.getAudioTracks()[0]; if(!t) return;\n  t.enabled = !t.enabled; $('#bMic').classList.toggle('off', !t.enabled);\n};\n$('#bCam').onclick = () => {\n  const t = localStream?.getVideoTracks()[0]; if(!t) return;\n  t.enabled = !t.enabled; $('#bCam').classList.toggle('off', !t.enabled);\n};\n$('#bEnd').onclick = () => hangup(true);\n\nfunction hangup(notify){\n  if(!pc && !localStream) return;\n  const peer = callPeer, caller = isCaller;\n  const dur = connectedAt ? Math.round((Date.now() - connectedAt) / 1000) : 0;\n  const wasVideo = callVideo;\n  if(notify && peer && ws && ws.readyState === 1) ws.send(JSON.stringify({t: 'end', to: peer}));\n  clearInterval(timerInt); clearTimeout(ringTO);\n  try{ localStream?.getTracks().forEach(t => t.stop()); }catch{}\n  try{ pc?.close(); }catch{}\n  pc = null; localStream = null; callPeer = null; isCaller = false; connectedAt = 0; iceQueue = [];\n  $('#remoteVideo').srcObject = null; $('#remoteAudio').srcObject = null; remoteStream = null; $('#localVideo').srcObject = null; $('#call').hidden = true;\n  if(caller && peer){\n    const text = dur ? `${wasVideo ? 'Appel vid\u00e9o' : 'Appel audio'} \u00b7 ${fmtDur(dur)}` : 'Appel manqu\u00e9';\n    if(ws && ws.readyState === 1) ws.send(JSON.stringify({t: 'msg', to: peer, kind: 'call', text}));\n  }\n}\nwindow.addEventListener('beforeunload', () => { if(pc && callPeer && ws && ws.readyState === 1) ws.send(JSON.stringify({t: 'end', to: callPeer})); });\n\n/* ---------- appels de groupe ---------- */\nlet gcall = null;\nconst gName = email => gcall ? nameIn(email, gcall.gid) : email;\nfunction gLayout(){\n  const n = $('#ggrid').children.length, portrait = innerHeight > innerWidth;\n  $('#ggrid').style.setProperty('--cols', portrait ? (n <= 2 ? 1 : 2) : Math.ceil(Math.sqrt(n)));\n}\nwindow.addEventListener('resize', () => { if(gcall) gLayout(); });\nfunction gTitle(){\n  if(!gcall) return;\n  const n = gcall.peers.size + 1, g = groupOf(gcall.gid);\n  $('#gtitle').textContent = (g ? g.name : 'Groupe') + ' \u00b7 ' + (gcall.peers.size ? n + ' participants' : 'en attente\u2026');\n}\nfunction setNovid(tile, on){ tile.classList.toggle('novid', on); }\nfunction gTile(email, name, mine){\n  const t = h('div', 'gtile novid' + (mine ? ' me' : '')); t.dataset.email = email;\n  const v = document.createElement('video'); v.autoplay = true; v.playsInline = true; if(mine) v.muted = true;\n  const av = h('div', 'gav', initials(name)); av.style.background = colorOf(email);\n  t.append(v, av, h('div', 'gname', mine ? 'Toi' : name));\n  t.onclick = () => {\n    const g = $('#ggrid'), was = t.classList.contains('big');\n    g.querySelectorAll('.gtile.big').forEach(x => x.classList.remove('big'));\n    g.classList.toggle('focus', !was); if(!was) t.classList.add('big');\n    v.play().catch(() => {});\n  };\n  $('#ggrid').appendChild(t); gLayout(); return t;\n}\nasync function startGroupCall(gid, video){\n  if(pc || pending || gcall || !groupOf(gid)) return;\n  if(!ws || ws.readyState !== 1) return toast('Pas de connexion au serveur.');\n  const local = await getMedia(video);\n  if(gcall) { local.getTracks().forEach(t => t.stop()); return; }\n  gcall = {gid, video: !!video, local, peers: new Map(), timer: null};\n  const g = $('#ggrid'); g.innerHTML = ''; g.classList.remove('focus');\n  const t = gTile(me.email, me.name, true); t.querySelector('video').srcObject = local;\n  setNovid(t, !local.getVideoTracks().length);\n  $('#gMic').hidden = !local.getAudioTracks().length; $('#gCam').hidden = !local.getVideoTracks().length;\n  $('#gMic').classList.remove('off'); $('#gCam').classList.remove('off');\n  $('#gcall').hidden = false; gTitle();\n  wsSend({t: 'gjoin', gid, video: gcall.video});\n  gcall.timer = setTimeout(() => { if(gcall && !gcall.peers.size){ toast(\"Personne n'a rejoint l'appel\"); leaveGroupCall(true); } }, 60000);\n}\nasync function gConnect(email, name, initiator){\n  if(!gcall) return null;\n  if(gcall.peers.has(email)) return gcall.peers.get(email);\n  const gid = gcall.gid, local = gcall.local;\n  const peer = {email, iceQ: [], stream: new MediaStream(), tile: null,\n    pc: new RTCPeerConnection({iceServers: cfg.iceServers, iceCandidatePoolSize: 4})};\n  gcall.peers.set(email, peer);\n  peer.tile = gTile(email, name, false); peer.tile.querySelector('video').srcObject = peer.stream;\n  local.getTracks().forEach(t => peer.pc.addTrack(t, local));\n  if(!local.getAudioTracks().length) peer.pc.addTransceiver('audio', {direction: 'recvonly'});\n  if(gcall.video && !local.getVideoTracks().length) peer.pc.addTransceiver('video', {direction: 'recvonly'});\n  peer.pc.onicecandidate = e => { if(e.candidate) wsSend({t: 'gsig', gid, to: email, kind: 'ice', data: e.candidate}); };\n  peer.pc.ontrack = e => {\n    if(!peer.stream.getTracks().includes(e.track)) peer.stream.addTrack(e.track);\n    const upd = () => setNovid(peer.tile, !peer.stream.getVideoTracks().some(t => !t.muted && t.readyState === 'live'));\n    e.track.onunmute = upd; e.track.onmute = upd; e.track.onended = upd; upd();\n    peer.tile.querySelector('video').play().catch(() => {});\n  };\n  peer.pc.onconnectionstatechange = () => { if(peer.pc.connectionState === 'failed'){ toast(name + ' : connexion perdue'); gDrop(email, gid); } };\n  gTitle();\n  if(initiator){\n    const off = await peer.pc.createOffer(); await peer.pc.setLocalDescription(off);\n    wsSend({t: 'gsig', gid, to: email, kind: 'offer', data: {type: off.type, sdp: off.sdp}});\n  }\n  return peer;\n}\nasync function onGSig(m){\n  if(!gcall || gcall.gid !== m.gid) return;\n  let peer = gcall.peers.get(m.from);\n  const flush = async () => { const q = peer.iceQ; peer.iceQ = []; for(const c of q){ try{ await peer.pc.addIceCandidate(c); }catch{} } };\n  if(m.kind === 'offer'){\n    peer = peer || await gConnect(m.from, gName(m.from), false); if(!peer) return;\n    await peer.pc.setRemoteDescription(m.data); await flush();\n    const a = await peer.pc.createAnswer(); await peer.pc.setLocalDescription(a);\n    wsSend({t: 'gsig', gid: m.gid, to: m.from, kind: 'answer', data: {type: a.type, sdp: a.sdp}});\n  } else if(m.kind === 'answer'){\n    if(peer && !peer.pc.currentRemoteDescription){ await peer.pc.setRemoteDescription(m.data); await flush(); }\n  } else if(m.kind === 'ice' && peer){\n    if(peer.pc.remoteDescription){ try{ await peer.pc.addIceCandidate(m.data); }catch{} } else peer.iceQ.push(m.data);\n  }\n}\nfunction gDrop(email, gid){\n  if(!gcall || gcall.gid !== gid) return;\n  const p = gcall.peers.get(email); if(!p) return;\n  try{ p.pc.close(); }catch{}\n  p.tile.remove(); gcall.peers.delete(email);\n  const g = $('#ggrid'); if(!g.querySelector('.gtile.big')) g.classList.remove('focus');\n  gLayout(); gTitle();\n}\nfunction leaveGroupCall(notify){\n  if(!gcall) return;\n  const g = gcall; gcall = null; clearTimeout(g.timer);\n  if(notify && ws && ws.readyState === 1) ws.send(JSON.stringify({t: 'gleave', gid: g.gid}));\n  g.peers.forEach(p => { try{ p.pc.close(); }catch{} });\n  g.local.getTracks().forEach(t => t.stop());\n  $('#gcall').hidden = true; $('#ggrid').innerHTML = '';\n}\n$('#gEnd').onclick = () => leaveGroupCall(true);\n$('#gMic').onclick = () => { if(!gcall) return; const ts = gcall.local.getAudioTracks(); const on = !(ts[0] && ts[0].enabled); ts.forEach(t => t.enabled = on); $('#gMic').classList.toggle('off', !on); };\n$('#gCam').onclick = () => {\n  if(!gcall) return; const ts = gcall.local.getVideoTracks(); const on = !(ts[0] && ts[0].enabled); ts.forEach(t => t.enabled = on);\n  $('#gCam').classList.toggle('off', !on); const me_ = $('#ggrid .gtile.me'); if(me_) setNovid(me_, !on);\n};\nwindow.addEventListener('beforeunload', () => { if(gcall && ws && ws.readyState === 1) ws.send(JSON.stringify({t: 'gleave', gid: gcall.gid})); });\n\n/* ---------- d\u00e9marrage ---------- */\nif(!window.isSecureContext) setTimeout(() => toast('Pour utiliser micro et cam\u00e9ra, ouvre le site en https://', 8000), 800);\nfunction openSetup(msg){\n  $('#srvUrl').value = BASE; $('#srvErr').textContent = msg || '';\n  $('#zipBox').hidden = !ZIP_B64; $('#setup').hidden = false;\n}\n$('#setupBtn').onclick = () => openSetup();\n$('#srvClose').onclick = () => $('#setup').hidden = true;\n$('#srvSave').onclick = async () => {\n  let u = $('#srvUrl').value.trim().replace(/\\/+$/, '');\n  if(u && !/^https?:\\/\\//i.test(u)) u = 'https://' + u;\n  const old = BASE; BASE = u;\n  $('#srvErr').textContent = 'Connexion\u2026';\n  try{\n    await api('/api/config');\n    localStorage.setItem('server', BASE); location.reload();\n  }catch{ BASE = old; $('#srvErr').textContent = \"Impossible de joindre ce serveur. V\u00e9rifie l'adresse (le premier r\u00e9veil sur Render peut prendre 1 minute : r\u00e9essaie).\"; }\n};\n$('#zipBtn').onclick = () => {\n  const bin = atob(ZIP_B64), arr = new Uint8Array(bin.length);\n  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);\n  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([arr], {type: 'application/zip'}));\n  a.download = 'discuter-serveur.zip'; document.body.appendChild(a); a.click(); a.remove();\n};\n(async function(){\n  let ok = true;\n  try{ cfg = await api('/api/config'); }catch{ ok = false; }\n  setupGoogle();\n  if(token && ok) await boot(); else $('#auth').hidden = false;\n  if(!ok) openSetup(location.protocol === 'file:' ? '' : \"Serveur injoignable. V\u00e9rifie l'adresse ou r\u00e9essaie dans une minute.\");\n})();\n</script>\n</body>\n</html>\n";
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const MAX_UPLOAD = 25 * 1024 * 1024;
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- mini base de données (fichier JSON) ---------- */
const DB_FILE = path.join(DATA_DIR, 'db.json');
let db = { users: {}, sessions: {}, contacts: {}, messages: [], files: {}, groups: {}, nextId: 1 };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch {}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFile(tmp, JSON.stringify(db), err => { if (!err) fs.rename(tmp, DB_FILE, () => {}); });
  }, 300);
}
// nettoie les sessions de plus de 90 jours
for (const [t, s] of Object.entries(db.sessions)) if (Date.now() - s.ts > 90 * 864e5) delete db.sessions[t];

/* ---------- utilitaires ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pub = u => ({ email: u.email, name: u.name });
const hashPw = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, (e, k) => e ? rej(e) : res(k.toString('hex'))));
function newSession(email) {
  const t = crypto.randomBytes(32).toString('hex');
  db.sessions[t] = { email, ts: Date.now() };
  save();
  return t;
}
function sessionUser(token) {
  const s = db.sessions[token];
  return s && db.users[s.email] ? db.users[s.email] : null;
}
function tokenOf(req, url) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : url.searchParams.get('token') || '';
}
function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => {
      n += c.length;
      if (n > limit) { reject(Object.assign(new Error('Fichier trop gros'), { code: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const b = await readBody(req, 100 * 1024);
  try { return JSON.parse(b.toString('utf8') || '{}'); } catch { return {}; }
}
const hits = new Map();
function limited(req) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  const now = Date.now();
  const a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a);
  return a.length > 15;
}
function iceServers() {
  const list = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  if (!process.env.TURN_URL) {
    // relais public gratuit par défaut (sans lui, 4G <-> Wi-Fi échoue très souvent : on ne s'entend pas)
    list.push({ urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' });
  } else {
    list.push({ urls: process.env.TURN_URL.split(',').map(s => s.trim()), username: process.env.TURN_USERNAME || '', credential: process.env.TURN_CREDENTIAL || '' });
  }
  return list;
}
const uid = e => crypto.createHash('sha256').update('discuter:' + e).digest('hex').slice(0, 16);
const mask = e => e.replace(/^(.{1,2}).*(@.*)$/, '$1***$2');
const pubGroup = g => ({ id: g.id, name: g.name, owner: g.owner,
  members: g.members.filter(e => db.users[e]).map(e => ({ email: e, name: db.users[e].name })) });
const groupsOf = email => Object.values(db.groups).filter(g => g.members.includes(email));
const isContact = (a, b) => (db.contacts[a] || []).includes(b);
function linkContacts(a, b) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const l = db.contacts[x] || (db.contacts[x] = []);
    if (!l.includes(y)) l.push(y);
  }
  save();
}

/* ---------- WebSocket : présence, messages, signalisation d'appel ---------- */
const socks = new Map();   // email -> Set<ws>
const busy = new Map();    // email -> { peer, ts }
const emit = (email, obj, except) => {
  const s = socks.get(email); if (!s) return;
  const data = JSON.stringify(obj);
  for (const w of s) if (w !== except && w.readyState === 1) w.send(data);
};
const isBusy = e => { const b = busy.get(e); return b && Date.now() - b.ts < 2 * 3600e3; };
function endCall(a) {
  const b = busy.get(a); if (!b) return null;
  busy.delete(a);
  if (busy.get(b.peer)?.peer === a) busy.delete(b.peer);
  return b.peer;
}
function announcePresence(email, online) {
  for (const c of db.contacts[email] || []) emit(c, { t: 'presence', email, online });
}
function storeMessage(from, to, kind, text, file) {
  const m = { id: db.nextId++, from, to, kind, text: text || '', file: file || null, ts: Date.now() };
  db.messages.push(m); save();
  const targets = to.startsWith('g:') ? (db.groups[to]?.members || []) : [to, from];
  for (const t of new Set(targets)) emit(t, { t: 'msg', m });
}

/* ---- appels de groupe (maillage : chaque participant est relié à chacun des autres) ---- */
const rooms = new Map();   // id du groupe -> { members:Set, video, starter, connectedAt }
function roomLeave(email, gid) {
  const r = rooms.get(gid);
  if (!r || !r.members.has(email)) return;
  r.members.delete(email);
  if (busy.get(email)?.peer === gid) busy.delete(email);
  for (const e of r.members) emit(e, { t: 'gleft', gid, email });
  if (!r.members.size) {
    rooms.delete(gid);
    const g = db.groups[gid];
    if (g) {
      for (const e of g.members) emit(e, { t: 'gend', gid });
      const d = r.connectedAt ? Math.round((Date.now() - r.connectedAt) / 1000) : 0;
      storeMessage(r.starter, gid, 'call', d ? `Appel de groupe · ${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}` : 'Appel de groupe manqué');
    }
  }
}
const roomsLeaveAll = email => { for (const gid of [...rooms.keys()]) roomLeave(email, gid); };

function onWsMessage(ws, raw) {
  let m; try { m = JSON.parse(raw); } catch { return; }
  const me = ws.email;
  if (m.t === 'ping') { ws.send('{"t":"pong"}'); return; }
  if (m.t === 'gjoin') {
    const g = db.groups[m.gid];
    if (!g || !g.members.includes(me)) return;
    let r = rooms.get(g.id);
    if (r && r.members.has(me)) return;
    if (isBusy(me)) { emit(me, { t: 'gbusy' }); return; }
    const nameOf = e => db.users[e]?.name || e;
    if (!r) {
      r = { members: new Set([me]), video: !!m.video, starter: me, connectedAt: 0 };
      rooms.set(g.id, r); busy.set(me, { peer: g.id, ts: Date.now() });
      emit(me, { t: 'gpeers', gid: g.id, peers: [] });
      for (const e of g.members) if (e !== me && socks.has(e) && !isBusy(e)) emit(e, { t: 'gring', gid: g.id, from: me, name: nameOf(me), video: r.video });
    } else {
      const peers = [...r.members].map(e => ({ email: e, name: nameOf(e) }));
      r.members.add(me); busy.set(me, { peer: g.id, ts: Date.now() });
      if (!r.connectedAt) r.connectedAt = Date.now();
      emit(me, { t: 'gpeers', gid: g.id, peers });
    }
    return;
  }
  if (m.t === 'gleave') { roomLeave(me, String(m.gid || '')); return; }
  if (m.t === 'gsig') {
    const r = rooms.get(String(m.gid || ''));
    const dest = String(m.to || '');
    if (!r || !r.members.has(me) || !r.members.has(dest)) return;
    emit(dest, { t: 'gsig', gid: m.gid, from: me, kind: m.kind, data: m.data });
    return;
  }
  const to = typeof m.to === 'string' ? m.to : '';
  if (!to) return;
  if (to.startsWith('g:')) {            // message dans un groupe
    const g = db.groups[to];
    if (m.t !== 'msg' || !g || !g.members.includes(me)) return;
    const kind = ['text', 'image', 'video', 'file'].includes(m.kind) ? m.kind : 'text';
    let file = null;
    if (kind !== 'text') {
      const id = String(m.file?.url || '').replace('/uploads/', '');
      const f = db.files[id]; if (!f) return;
      file = { url: '/uploads/' + id, name: f.name, size: f.size, type: f.type };
    }
    const text = String(m.text || '').slice(0, 4000);
    if (kind === 'text' && !text.trim()) return;
    storeMessage(me, to, kind, text, file);
    return;
  }
  if (!isContact(me, to)) return;
  switch (m.t) {
    case 'msg': {
      const kind = ['text', 'image', 'video', 'file', 'call'].includes(m.kind) ? m.kind : 'text';
      let file = null;
      if (kind === 'image' || kind === 'video' || kind === 'file') {
        const id = String(m.file?.url || '').replace('/uploads/', '');
        const f = db.files[id];
        if (!f) return;
        file = { url: '/uploads/' + id, name: f.name, size: f.size, type: f.type };
      }
      const text = String(m.text || '').slice(0, 4000);
      if (kind === 'text' && !text.trim()) return;
      storeMessage(me, to, kind, text, file);
      break;
    }
    case 'offer':
      if (!socks.has(to)) { emit(me, { t: 'unavailable', from: to }); return; }
      if (isBusy(me) || isBusy(to)) { emit(me, { t: 'busy', from: to }); return; }
      busy.set(me, { peer: to, ts: Date.now() });
      busy.set(to, { peer: me, ts: Date.now() });
      emit(to, { t: 'offer', from: me, video: !!m.video, sdp: m.sdp });
      break;
    case 'answer':
      if (busy.get(me)?.peer !== to) return;
      emit(me, { t: 'taken' }, ws);          // les autres appareils arrêtent de sonner
      emit(to, { t: 'answer', from: me, sdp: m.sdp });
      break;
    case 'ice':
      if (busy.get(me)?.peer !== to) return;
      emit(to, { t: 'ice', from: me, candidate: m.candidate });
      break;
    case 'end':
    case 'reject':
      if (busy.get(me)?.peer === to) endCall(me);
      emit(to, { t: m.t, from: me });
      emit(me, { t: 'taken' }, ws);
      break;
  }
}

function onWsConnection(ws, user) {
  ws.email = user.email; ws.alive = true;
  const first = !socks.has(user.email);
  if (first) socks.set(user.email, new Set());
  socks.get(user.email).add(ws);
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', d => { try { onWsMessage(ws, d.toString()); } catch (e) { console.error(e); } });
  ws.on('close', () => {
    const s = socks.get(user.email); s.delete(ws);
    if (!s.size) {
      socks.delete(user.email);
      roomsLeaveAll(user.email);
      const peer = endCall(user.email);
      if (peer && !peer.startsWith('g:')) emit(peer, { t: 'end', from: user.email });
      announcePresence(user.email, false);
    }
  });
  const online = (db.contacts[user.email] || []).filter(c => socks.has(c));
  ws.send(JSON.stringify({ t: 'hello', online }));
  if (first) announcePresence(user.email, true);
}

/* ---------- HTTP ---------- */
const SAFE_INLINE = /^(image\/(png|jpe?g|gif|webp|avif|heic|heif|bmp)|video\/(mp4|webm|quicktime|ogg|x-m4v)|audio\/[a-z0-9.+-]+)$/i;

function serveUpload(req, res, id) {
  const meta = db.files[id], file = path.join(UPLOAD_DIR, id);
  if (!meta || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(file).size;
  const inline = SAFE_INLINE.test(meta.type);
  const headers = {
    'Content-Type': inline ? meta.type : 'application/octet-stream',
    'Content-Disposition': (inline ? 'inline' : 'attachment') + `; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400'
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    let start = range[1] ? parseInt(range[1], 10) : 0;
    let end = range[2] ? parseInt(range[2], 10) : size - 1;
    if (!range[1] && range[2]) { start = Math.max(0, size - parseInt(range[2], 10)); end = size - 1; }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'Content-Length': size });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(INDEX_HTML);
    }
    if (p === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && p.startsWith('/uploads/')) {
      const id = p.slice(9);
      if (!/^[a-f0-9]{48}$/.test(id)) { res.writeHead(404); return res.end(); }
      return serveUpload(req, res, id);
    }
    if (req.method === 'GET' && p === '/api/config') {
      return send(res, 200, { googleClientId: GOOGLE_CLIENT_ID, iceServers: iceServers() });
    }

    /* --- comptes --- */
    if (req.method === 'POST' && (p === '/api/signup' || p === '/api/login' || p === '/api/google')) {
      if (limited(req)) return send(res, 429, { error: 'Trop de tentatives, réessaie dans une minute.' });
      const b = await readJson(req);

      if (p === '/api/signup') {
        const name = String(b.name || '').trim().slice(0, 40);
        const email = String(b.email || '').trim().toLowerCase();
        const password = String(b.password || '');
        if (!name) return send(res, 400, { error: 'Entre ton nom.' });
        if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'Adresse e-mail invalide.' });
        if (password.length < 6 || password.length > 200) return send(res, 400, { error: 'Le mot de passe doit contenir au moins 6 caractères.' });
        if (db.users[email]) return send(res, 409, { error: 'Un compte existe déjà avec cet e-mail. Connecte-toi.' });
        const salt = crypto.randomBytes(16).toString('hex');
        db.users[email] = { email, name, salt, hash: await hashPw(password, salt), created: Date.now() };
        db.contacts[email] = db.contacts[email] || [];
        save();
        return send(res, 200, { token: newSession(email), user: pub(db.users[email]) });
      }

      if (p === '/api/login') {
        const email = String(b.email || '').trim().toLowerCase();
        const u = db.users[email];
        if (!u) return send(res, 401, { error: "Aucun compte avec cet e-mail. Crée un compte d'abord." });
        if (!u.hash) return send(res, 401, { error: 'Ce compte utilise Google. Clique sur « Continuer avec Google ».' });
        const h = Buffer.from(await hashPw(String(b.password || ''), u.salt), 'hex');
        if (!crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'))) return send(res, 401, { error: 'Mot de passe incorrect.' });
        return send(res, 200, { token: newSession(email), user: pub(u) });
      }

      // Google
      if (!GOOGLE_CLIENT_ID) return send(res, 400, { error: "La connexion Google n'est pas configurée sur le serveur." });
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential || '')));
      const g = await r.json().catch(() => ({}));
      if (!r.ok || g.aud !== GOOGLE_CLIENT_ID || String(g.email_verified) !== 'true' || !g.email) {
        return send(res, 401, { error: 'Connexion Google refusée.' });
      }
      const email = g.email.toLowerCase();
      if (!db.users[email]) {
        db.users[email] = { email, name: String(g.name || email.split('@')[0]).slice(0, 40), google: true, created: Date.now() };
        db.contacts[email] = db.contacts[email] || [];
        save();
      }
      return send(res, 200, { token: newSession(email), user: pub(db.users[email]) });
    }

    /* --- routes protégées --- */
    if (p.startsWith('/api/') || p === '/upload') {
      const user = sessionUser(tokenOf(req, url));
      if (!user) return send(res, 401, { error: 'Session expirée, reconnecte-toi.' });

      if (req.method === 'GET' && p === '/api/me') {
        const contacts = (db.contacts[user.email] || []).filter(e => db.users[e]).map(e => pub(db.users[e]));
        return send(res, 200, { user: pub(user), contacts, groups: groupsOf(user.email).map(pubGroup) });
      }
      if (req.method === 'GET' && p === '/api/history') {
        const mine = new Set(groupsOf(user.email).map(g => g.id));
        const list = db.messages.filter(m => m.from === user.email || m.to === user.email || mine.has(m.to)).slice(-3000);
        return send(res, 200, { messages: list });
      }
      if (req.method === 'POST' && p === '/api/groups') {
        const b = await readJson(req);
        const name = String(b.name || '').trim().slice(0, 40);
        if (!name) return send(res, 400, { error: 'Donne un nom au groupe.' });
        const ids = [...new Set((Array.isArray(b.members) ? b.members : []).map(e => String(e).toLowerCase()))]
          .filter(e => e !== user.email && isContact(user.email, e) && db.users[e]).slice(0, 49);
        if (!ids.length) return send(res, 400, { error: 'Choisis au moins un ami.' });
        const id = 'g:' + crypto.randomBytes(8).toString('hex');
        db.groups[id] = { id, name, owner: user.email, members: [user.email, ...ids], created: Date.now() };
        save();
        const g = pubGroup(db.groups[id]);
        for (const e of ids) emit(e, { t: 'group', group: g, by: user.name });
        return send(res, 200, { group: g });
      }
      if (req.method === 'GET' && p === '/api/users') {
        const have = new Set(db.contacts[user.email] || []);
        const users = Object.values(db.users).filter(u => u.email !== user.email && !have.has(u.email))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr')).slice(0, 1000)
          .map(u => ({ id: uid(u.email), name: u.name, email: mask(u.email), online: socks.has(u.email) }));
        return send(res, 200, { users });
      }
      if (req.method === 'POST' && p === '/api/contacts') {
        const b = await readJson(req);
        let email = String(b.email || '').trim().toLowerCase();
        if (b.id) { const f = Object.keys(db.users).find(e => uid(e) === String(b.id)); if (f) email = f; }
        if (email === user.email) return send(res, 400, { error: "C'est ton propre e-mail." });
        const target = db.users[email];
        if (!target) return send(res, 404, { error: "Cette personne n'a pas encore de compte." });
        linkContacts(user.email, email);
        emit(email, { t: 'contact', contact: pub(user), online: socks.has(user.email) });
        return send(res, 200, { contact: pub(target), online: socks.has(email) });
      }
      if (req.method === 'POST' && p === '/api/logout') {
        delete db.sessions[tokenOf(req, url)]; save();
        return send(res, 200, { ok: true });
      }
      if (req.method === 'POST' && p === '/upload') {
        const buf = await readBody(req, MAX_UPLOAD);
        if (!buf.length) return send(res, 400, { error: 'Fichier vide.' });
        const id = crypto.randomBytes(24).toString('hex');
        const name = path.basename(String(url.searchParams.get('name') || 'fichier')).slice(0, 120) || 'fichier';
        const type = String(url.searchParams.get('type') || req.headers['content-type'] || 'application/octet-stream').slice(0, 100);
        fs.writeFileSync(path.join(UPLOAD_DIR, id), buf);
        db.files[id] = { name, type, size: buf.length, owner: user.email };
        save();
        return send(res, 200, { url: '/uploads/' + id, name, type, size: buf.length });
      }
    }
    send(res, 404, { error: 'Introuvable' });
  } catch (e) {
    if (e && e.code === 413) return send(res, 413, { error: 'Fichier trop gros (25 Mo maximum).' });
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'Erreur serveur' });
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://x');
  const user = url.pathname === '/ws' ? sessionUser(url.searchParams.get('token') || '') : null;
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, ws => onWsConnection(ws, user));
});
// ping régulier : garde la connexion vivante derrière le proxy de Render et nettoie les connexions mortes
setInterval(() => {
  for (const set of socks.values()) for (const ws of set) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; ws.ping();
  }
}, 25000);

server.listen(PORT, '0.0.0.0', () => console.log('Discuter écoute sur le port ' + PORT));
