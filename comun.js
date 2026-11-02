/* comun.js · Lab 3 · piezas compartidas por las herramientas de la escalera (v1.0)
   Glosario, números que viajan entre herramientas, barrita de la escalera, recordatorios y compartir.
   Los números viajan en el fragmento de la URL (#), que el navegador no envía a ningún servidor,
   y en el almacenamiento de esta pestaña (se borra al cerrarla). */
(function(root){
'use strict';
const M = root.FinMotor;
const U = {};
U.Q = n => M.fmtQ(n);
U.pct = (x, d) => (x*100).toFixed(d==null ? 1 : d).replace(/\.0+$/,'') + '%';
U.esc = s => String(s==null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const esc = U.esc;

// ---------- Direcciones de cada herramienta (la publicación puede cambiarlas) ----------
U.URL = Object.assign({
  portada:'https://lab3.umbralgt.com', escalera:'https://escalera-financiera.umbralgt.com',
  mes:'https://lab3.umbralgt.com/mi-mes/', fondo:'https://fondo-emergencia.umbralgt.com/', deudas:'https://lab3.umbralgt.com/deudas/',
  proteccion:'https://lab3.umbralgt.com/proteccion/', metas:'https://lab3.umbralgt.com/metas/', inversion:'https://lab3.umbralgt.com/inversion/',
  vivienda:'https://lab3.umbralgt.com/vivienda/', resumen:'https://lab3.umbralgt.com/mi-escalera/', datos:'https://lab3.umbralgt.com/datos/', pro:'https://lab3.umbralgt.com/pro/', lab1:'https://lab1.umbralgt.com', lab2:'https://lab2.umbralgt.com'
}, root.UMBRAL_URLS || {});
U.HERRAMIENTAS = [
  {p:1, k:'mes', corto:'Mi mes', nombre:'Mi mes', que:'Que lo que entra cubra lo que sale, y repartir lo que sobra.'},
  {p:2, k:'fondo', corto:'Fondo', nombre:'Mi fondo de emergencia', que:'En qué fecha llegás a 1, 3 y 6 meses de gastos guardados.'},
  {p:3, k:'deudas', corto:'Deudas', nombre:'Plan de deudas', que:'En qué orden pagar y cuándo terminás, comparado con pagar solo el mínimo.'},
  {p:4, k:'proteccion', corto:'Protección', nombre:'Protección', que:'Cuánto aguanta tu hogar si te enfermás o te quedás sin trabajo.'},
  {p:5, k:'metas', corto:'Metas', nombre:'Mis metas', que:'Cuánto apartar al mes para el retiro, los estudios o un enganche.'},
  {p:6, k:'inversion', corto:'Inversión', nombre:'Inversión conservadora', que:'Qué opciones de poco riesgo hay, en Guatemala y afuera, y cuánto ganan de verdad.'},
  {p:7, k:'vivienda', corto:'Vivienda', nombre:'Mi vivienda', que:'Cuánto podés pagar, qué cuesta entrar y si conviene comprar o alquilar.'}
];

// ---------- Números que viajan entre herramientas ----------
// i ingreso · g gastos básicos · gv gc gt gs ge go desglose · a ahorro · s sobra · u único ingreso (1/0)
// ts saldo tarjeta · tt tasa tarjeta (% anual) · tp cómo paga (total/mas/minimo/menos) · co cuotas de préstamos
// pr prestamista (1) · ig IGSS (1/0) · sa salario · se seguro médico (si/no) · e edad · r ahorro para el retiro · p peldaño
const CLAVES = ['i','g','gv','gc','gt','gs','ge','go','a','s','u','ts','tt','tp','co','pr','ig','sa','se','e','r','p'];
const TEXTO = ['tp','se'];
const SS = 'umbral-lab3-numeros';
let D = {}, vinoPorEnlace = false;
function limpiar(o){ const out = {}; CLAVES.forEach(k => { if(o[k]==null || o[k]==='') return;
  if(TEXTO.includes(k)){ out[k] = String(o[k]).slice(0,12); return; }
  const v = Number(o[k]); if(isFinite(v) && v>=0) out[k] = Math.round(v*100)/100; }); return out; }
try{ const t = sessionStorage.getItem(SS); if(t) D = limpiar(JSON.parse(t)); }catch(e){}
try{
  const h = new URLSearchParams(location.hash.slice(1)), o = {};
  CLAVES.forEach(k => { if(h.has(k)) o[k] = h.get(k); });
  if(Object.keys(o).length){ D = Object.assign(D, limpiar(o)); vinoPorEnlace = true; guardarSS(); }
}catch(e){}
function guardarSS(){ try{ sessionStorage.setItem(SS, JSON.stringify(D)); }catch(e){} }
U.datos = () => Object.assign({}, D);
U.vinoPorEnlace = () => vinoPorEnlace;
U.hayDatos = () => Object.keys(D).some(k => k!=='p');
U.actualizar = o => { Object.keys(o).forEach(k => { if(o[k]==null) delete D[k]; }); D = Object.assign(D, limpiar(o)); guardarSS(); U.pintarBarrita(); };
U.olvidar = () => { D = {}; try{ sessionStorage.removeItem(SS); }catch(e){} U.pintarBarrita(); };
U.hash = () => { const h = new URLSearchParams(); Object.keys(D).forEach(k => h.set(k, D[k])); const s = h.toString(); return s ? '#'+s : ''; };
U.link = k => U.URL[k] + U.hash();
U.quitarHash = () => { try{ if(location.hash) history.replaceState(null, '', location.pathname + location.search); }catch(e){} };
// Respuestas de la Escalera (formato del cuestionario) a números del laboratorio
U.desdeEscalera = (r, f) => {
  const det = r.q_gastos_det || {}, x = M.contexto(r);
  return limpiar({i:r.q_ingreso, g:r.q_gastos, gv:det.vivienda, gc:det.comida, gt:det.transporte, gs:det.servicios, ge:det.estudios, go:det.otros,
    a:r.q_ahorro, s: f && f.resumen && f.resumen.queda>0 ? Math.round(f.resumen.queda) : null,
    u: r.q_unico===true ? 1 : r.q_unico===false ? 0 : null,
    ts: x.tieneTC ? r.q_saldo_tc : 0, tt: x.tieneTC && x.tasa ? +(x.tasa*100).toFixed(2) : null, tp: x.tieneTC ? r.q_pago_tc : null,
    co: r.q_cuotas_otras, pr: (r.q_informal||[]).includes('prestamista') ? 1 : null,
    ig: r.q_igss==='si' ? 1 : r.q_igss ? 0 : null, sa: r.q_salario, se: r.q_seguro==='si' ? 'si' : r.q_seguro==='no' ? 'no' : null,
    e: r.q_edad, r: typeof r.q_retiro==='number' ? r.q_retiro : null, p: f ? f.peldano : null});
};
U.cargarEscalera = (r, f) => { D = U.desdeEscalera(r, f); guardarSS(); };

// ---------- Barrita de la escalera ----------
let ACTUAL = 0;
U.barrita = actual => { ACTUAL = actual; U.pintarBarrita(); };
U.pintarBarrita = () => {
  const el = document.getElementById('barrita'); if(!el || !ACTUAL) return;
  const tuyo = D.p || 0;
  el.innerHTML = `<nav class="barrita" aria-label="Las herramientas de la escalera">
    <div class="barrita-cab"><span>La escalera, peldaño por peldaño</span><a href="${U.link('escalera')}">${tuyo ? 'Tu diagnóstico' : '¿En qué peldaño estás?'}</a></div>
    <ol>${U.HERRAMIENTAS.map(h => `<li class="${h.p===ACTUAL?'actual':''} ${h.p===tuyo?'tuyo':''} ${tuyo && h.p<tuyo?'hecho':''}">
      <a href="${h.p===ACTUAL ? '#' : U.link(h.k)}" ${h.p===ACTUAL?'aria-current="page"':''} title="${esc(h.nombre)}: ${esc(h.que)}"><span class="bn">${h.p}</span><span class="bl">${esc(h.corto)}</span></a></li>`).join('')}</ol>
    ${tuyo ? `<p class="barrita-nota">Según tu Escalera financiera, <b>estás en el peldaño ${tuyo}</b>${tuyo===ACTUAL ? ': esta es tu herramienta.' : '.'} Tus números pasan de una herramienta a otra sin salir de tu teléfono.</p>` : ''}
  </nav>`;
  el.querySelector('[aria-current]') && el.querySelector('[aria-current]').addEventListener('click', e => e.preventDefault());
};
// Tarjeta para ir a otra herramienta, con los números
U.puente = (k, titulo, texto) => { const h = U.HERRAMIENTAS.find(x => x.k===k);
  return `<a class="puente" href="${U.link(k)}"><span class="bn">${h.p}</span><span><b>${esc(titulo || h.nombre)}</b><small>${esc(texto || h.que)}</small></span><span class="flecha" aria-hidden="true">›</span></a>`; };

// ---------- Glosario: palabras que se explican al tocarlas ----------
U.GLOSARIO = [
  [/tasa promedio anual de las tarjetas|tasa promedio de las tarjetas/i, 'Tasa promedio de las tarjetas', 'El promedio de lo que cobran al año todas las tarjetas de crédito en quetzales en Guatemala, según la Superintendencia de Bancos (51.96% anual, unos 4.3% al mes). Tu tarjeta puede cobrar más o menos.'],
  [/tasa real|rendimiento real/i, 'Rendimiento real', 'Lo que gana tu dinero después de restar la inflación. Si te pagan 4% y los precios suben 3%, en realidad ganaste cerca de 1%.'],
  [/tasas? de interés/i, 'Tasa de interés', 'Lo que te cobran por prestarte dinero, o lo que te pagan por guardarlo, como porcentaje. Si es mensual, multiplicala por 12 para tener una idea del costo al año.'],
  [/pago mínimo|el mínimo|solo mínimos/i, 'Pago mínimo', 'La cantidad más baja que el banco acepta ese mes para no marcarte atraso. Pagar solo eso hace que la deuda dure mucho más y cueste más.'],
  [/avalancha/i, 'Avalancha', 'Pagar el mínimo en todas las deudas y poner todo lo extra en la que cobra la tasa más alta. Es la forma de pagar menos intereses.'],
  [/bola de nieve/i, 'Bola de nieve', 'Pagar el mínimo en todas las deudas y poner todo lo extra en la más pequeña. Se paga un poco más de intereses, pero terminás una deuda antes y eso ayuda a seguir.'],
  [/saldo/i, 'Saldo', 'Todo lo que debés hoy, no solo lo que compraste este mes.'],
  [/fondo de emergencia/i, 'Fondo de emergencia', 'Dinero guardado solo para imprevistos (una enfermedad, quedarte sin trabajo, una reparación urgente), que podés usar rápido sin pedir prestado.'],
  [/inflación/i, 'Inflación', 'Cuánto suben los precios en un año. Si la inflación es 3%, lo que hoy cuesta Q100 cuesta Q103 dentro de un año.'],
  [/quetzales de hoy/i, 'Quetzales de hoy', 'Montos que ya toman en cuenta la inflación: Q10,000 "de hoy" dentro de 10 años serán más quetzales, pero comprarán lo mismo que Q10,000 hoy.'],
  [/subsidio/i, 'Subsidio del IGSS', 'Dinero que el IGSS paga mientras no podés trabajar por enfermedad o accidente.'],
  [/pensión/i, 'Pensión', 'Pago mensual que recibís al retirarte si cumpliste los requisitos del IGSS (edad y número de cuotas).'],
  [/\bIGSS\b/, 'IGSS', 'Instituto Guatemalteco de Seguridad Social. Si te lo descuentan, tenés atención médica, subsidio si te enfermás y, con suficientes cuotas, pensión.'],
  [/deducible/i, 'Deducible', 'La parte de cada gasto médico que pagás vos antes de que el seguro empiece a pagar.'],
  [/coaseguro/i, 'Coaseguro', 'El porcentaje de la cuenta que seguís pagando vos, aun después del deducible. Por ejemplo, 10% o 20%.'],
  [/preexistencias?/i, 'Preexistencia', 'Una enfermedad que ya tenías antes de contratar el seguro. Muchos seguros no la cubren o la cubren después de un tiempo.'],
  [/\bISR\b/, 'ISR', 'Impuesto Sobre la Renta. Sobre los intereses de cuentas y plazos fijos, el banco retiene 10%.'],
  [/Bonos? del Tesoro/i, 'Bonos del Tesoro', 'Un préstamo que le hacés al Gobierno de Guatemala a cambio de intereses. Para pequeños inversionistas empiezan en Q5,000 y se compran por medio de un agente de bolsa.'],
  [/cupón/i, 'Cupón', 'El interés anual que paga un bono, como porcentaje de lo que invertiste.'],
  [/plazo fijo/i, 'Plazo fijo', 'Dinero que dejás en el banco por un tiempo acordado a cambio de intereses. Normalmente no se puede sacar antes de esa fecha sin perder algo.'],
  [/agente de bolsa/i, 'Agente de bolsa', 'Persona o empresa autorizada para comprar y vender inversiones a tu nombre.'],
  [/transferencia automática/i, 'Transferencia automática', 'Una orden que le das a tu banco para que pase dinero de una cuenta a otra solo, en la fecha que elijás.'],
  [/\bsobres\b/i, 'Sobres', 'Separar el dinero del mes por destino (fijos, futuro, gustos), en cuentas distintas o en sobres de efectivo, para saber cuánto queda de cada cosa.'],
  [/pirámides?|piramidales?/i, 'Pirámide', 'Esquema que paga a los primeros con el dinero de los nuevos. Cuando dejan de entrar personas, se cae y la mayoría pierde.'],
  [/sector informal|informalidad/i, 'Sector informal', 'Trabajos sin contrato formal, por lo general sin IGSS ni prestaciones.'],
  [/\bSIB\b/, 'SIB', 'Superintendencia de Bancos. Supervisa a bancos y otras entidades financieras y atiende quejas.'],
  [/\bDIACO\b/, 'DIACO', 'Dirección de Atención y Asistencia al Consumidor. Publica la tabla de tasas de tarjetas por emisor y atiende quejas.'],
  [/convenio/i, 'Convenio de pago', 'Acuerdo por escrito con quien te prestó para pagar de otra forma, por ejemplo en más tiempo.'],
  [/\bFOPA\b/, 'FOPA', 'Fondo para la Protección del Ahorro. Si un banco cierra, devuelve los depósitos de cada persona hasta Q20,000 por banco. No cubre cooperativas, bonos ni fondos.'],
  [/\bFHA\b/, 'FHA', 'Instituto de Fomento de Hipotecas Aseguradas. Asegura créditos de vivienda, lo que permite a los bancos prestar con menos enganche. Ese seguro se paga dentro de la cuota.'],
  [/\bIUSI\b/, 'IUSI', 'Impuesto Único Sobre Inmuebles: lo cobra la municipalidad cada año según el valor registrado de la propiedad.'],
  [/enganche/i, 'Enganche', 'La parte del precio que pagás al inicio con tu dinero. El resto lo presta el banco.'],
  [/precalificación/i, 'Precalificación', 'Una revisión que hace el banco de tus ingresos y deudas para decirte cuánto te prestaría, antes de que elijás una vivienda.'],
  [/tasas? variables?|variables?\b(?=: pueden subir)/i, 'Tasa variable', 'Una tasa que el banco puede cambiar durante el crédito. Si sube, tu cuota sube.'],
  [/timbres/i, 'Impuesto de timbres', 'Impuesto de 3% que se paga al comprar una vivienda usada. En una vivienda nueva se paga IVA en su lugar.'],
  [/\bETF\b/, 'ETF', 'Un fondo que se compra y se vende en la bolsa como si fuera una acción, y que reúne muchas inversiones a la vez.'],
  [/\bCFD\b|apalancamiento/i, 'CFD y apalancamiento', 'Un CFD es un contrato sobre el precio de algo, no el activo. Con apalancamiento se invierte con dinero prestado: las ganancias y las pérdidas se multiplican.'],
  [/\bbroker\b/i, 'Broker', 'Una empresa que compra y vende inversiones por vos. En otros países cumple el papel de un agente de bolsa.'],
  [/pagarés?/i, 'Pagaré', 'Un documento en el que una empresa se compromete a devolverte lo que le prestaste, con intereses, en una fecha. Si la empresa no paga, se puede perder.'],
  [/\bINGECOP\b/, 'INGECOP', 'Inspección General de Cooperativas: la entidad que fiscaliza a las cooperativas en Guatemala.'],
  [/rendimiento/i, 'Rendimiento', 'Lo que gana tu dinero en un tiempo, expresado como porcentaje.']
];
U.glosar = texto => {
  let html = esc(texto); const usados = new Set();
  U.GLOSARIO.forEach((g, k) => {
    if(usados.has(g[1])) return;
    const m = html.match(new RegExp(g[0].source, g[0].flags.replace('g','')));
    if(!m) return;
    const antes = html.slice(0, m.index);
    if((antes.match(/<span role="button"/g)||[]).length !== (antes.match(/<\/span>/g)||[]).length) return;
    if(/<[^>]*$/.test(antes)) return;
    html = antes + `<span role="button" tabindex="0" class="term" data-g="${k}" aria-expanded="false">${m[0]}</span>` + html.slice(m.index + m[0].length);
    usados.add(g[1]);
  });
  return html;
};
U.activarGlosario = el => {
  el.addEventListener('keydown', e => { if((e.key==='Enter' || e.key===' ') && e.target.classList && e.target.classList.contains('term')){ e.preventDefault(); e.target.click(); } });
  el.addEventListener('click', e => {
    const b = e.target.closest('.term'); if(!b) return;
    e.preventDefault();
    const abierto = b.getAttribute('aria-expanded')==='true';
    document.querySelectorAll('.def').forEach(d => d.remove());
    document.querySelectorAll('.term[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded','false'));
    if(abierto) return;
    const g = U.GLOSARIO[+b.dataset.g];
    (b.closest('p, li, .pregunta, td') || b).insertAdjacentHTML('afterend', `<div class="def" role="note"><b>${esc(g[1])}.</b> ${esc(g[2])}</div>`);
    b.setAttribute('aria-expanded','true');
  });
};

// ---------- Piezas de pantalla ----------
U.bloque = (id, num, titulo, explica, cuerpo, abierto) => `<details class="bloque-r" id="${id}" ${abierto?'open':''}>
    <summary><span class="num">${num}</span><span class="tit"><b>${titulo}</b><small>${explica}</small></span><span class="flecha" aria-hidden="true">›</span></summary>
    <div class="bloque-c">${cuerpo}</div></details>`;
U.campo = (id, etiqueta, ayuda, valor, extra) => `<label class="campo"><span>${etiqueta}${ayuda?` <small>${ayuda}</small>`:''}</span>
    <span class="monto chico-monto"><span>${extra && extra.pre!=null ? extra.pre : 'Q'}</span><input id="${id}" inputmode="decimal" autocomplete="off" value="${valor==null?'':valor}" ${extra && extra.ph ? `placeholder="${extra.ph}"`:''}></span></label>`;
U.leerNum = (idOrEl, raiz) => { const el = typeof idOrEl==='string' ? (raiz||document).querySelector('#'+idOrEl) : idOrEl; if(!el) return null;
  const t = el.value.trim().replace(/[Q\s,%]/g,''); const n = Number(t); return t==='' || !isFinite(n) || n<0 ? null : n; };
U.chips = (grupo, opciones, actual, etiqueta) => `<div class="chips" role="group" aria-label="${esc(etiqueta||grupo)}">${opciones.map(([v,l]) => `<button type="button" class="chip-b" data-${grupo}="${v}" aria-pressed="${String(actual)===String(v)}">${l}</button>`).join('')}</div>`;
U.enlazarChips = (raiz, grupo, alElegir) => raiz.querySelectorAll(`[data-${grupo}]`).forEach(b => b.addEventListener('click', () => {
  raiz.querySelectorAll(`[data-${grupo}]`).forEach(x => x.setAttribute('aria-pressed', x===b)); alElegir(b.dataset[grupo]); }));
U.banner = (origen, extra) => origen==='lab' ? `<div class="origen"><b>Usamos tus números de la escalera.</b> ${extra || 'Podés cambiarlos.'}</div>`
  : `<div class="origen ejemplo"><b>Estos son números de ejemplo.</b> Cambialos por los tuyos y todo se recalcula al instante.</div>`;
// Fuente de un dato del motor, con la marca de fuente secundaria
U.fuente = d => `${esc(d.fuente)}, ${esc(d.etiqueta)}${d.conf==='prensa' ? ' <span class="sello">Fuente secundaria</span>' : ''}`;
U.dato = (texto, ...ds) => `<p class="de100"><b>Un dato:</b> ${texto} <span class="suave chico">(${ds.map(U.fuente).join('; ')})</span></p>`;
U.notaLab = extra => `<div class="nota-lab"><b>Nota de laboratorio</b><p class="chico" style="margin:0 0 6px">${esc(M.AVISOS.entrada)}</p>
  <p class="chico" style="margin:0">${extra ? esc(extra)+' ' : ''}Los cálculos son aproximados y usan datos públicos con su fuente y fecha. Verificalo con tu banco o un contador antes de decidir.</p></div>`;
U.tambienVos = () => `<p class="chico suave" style="margin:8px 0 0">Y si alguien de confianza te lo pide a vos, podés ser esa persona para otro: acompañarlo a ordenar su mes o a hacer su fondo también es una forma de ayudar.</p>`;
U.pie = () => `<p class="suave chico no-imprimir" style="margin-top:14px"><a href="${U.link('resumen')}">Mi escalera en una hoja</a> · <a href="${U.URL.datos}">De dónde salen los datos</a></p><p class="suave chico" style="margin-top:4px">Escalera financiera · versión 1.1 · octubre 2026</p>`;

// ---------- Recordatorio de calendario (.ics) y compartir ----------
function icsFecha(d){ return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0'); }
function icsTexto(s){ return s.replace(/\\/g,'\\\\').replace(/[,;]/g, m => '\\'+m).replace(/\n/g,'\\n'); }
function icsDoblar(l){ const out = []; while(l.length > 60){ out.push(l.slice(0,60)); l = ' ' + l.slice(60); } out.push(l); return out.join('\r\n'); }
// o: {dias:'15'|'-1'|'15,-1'|null, anual:true?, titulo, descripcion, alarma, uid}
U.generarICS = o => {
  const ahora = new Date(); let ini, regla;
  if(o.fecha){ ini = o.fecha; regla = null; }
  else if(o.trimestral){ ini = new Date(ahora.getFullYear(), ahora.getMonth()+1, 1); regla = 'RRULE:FREQ=MONTHLY;INTERVAL=3'; }
  else if(o.anual){ ini = new Date(ahora.getFullYear(), ahora.getMonth()+1, 1); regla = 'RRULE:FREQ=YEARLY'; }
  else {
    const cand = [];
    for(let k=0; k<2; k++) o.dias.split(',').forEach(dd => { const b = new Date(ahora.getFullYear(), ahora.getMonth()+k, 1);
      const d = dd==='-1' ? new Date(b.getFullYear(), b.getMonth()+1, 0) : new Date(b.getFullYear(), b.getMonth(), +dd);
      if(d >= new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())) cand.push(d); });
    ini = cand.sort((a,b)=>a-b)[0]; regla = 'RRULE:FREQ=MONTHLY;BYMONTHDAY='+o.dias;
  }
  const fin = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate()+1);
  const stamp = ahora.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//UMBRAL//Lab 3//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:'+(o.uid||'lab3')+'-'+ahora.getTime()+'@umbralgt.com','DTSTAMP:'+stamp,
    'DTSTART;VALUE=DATE:'+icsFecha(ini),'DTEND;VALUE=DATE:'+icsFecha(fin), regla,
    'SUMMARY:'+icsTexto(o.titulo), 'DESCRIPTION:'+icsTexto(o.descripcion+' Hecho con UMBRAL, Lab 3.'),
    'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT9H','DESCRIPTION:'+icsTexto(o.alarma||o.titulo),'END:VALARM',
    'END:VEVENT','END:VCALENDAR'].filter(Boolean).map(icsDoblar).join('\r\n');
};
U.descargarICS = (o, archivo, estadoEl) => {
  try{
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([U.generarICS(o)], {type:'text/calendar'})); a.download = archivo;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    if(estadoEl) estadoEl.textContent = 'Listo. Abrí el archivo descargado para agregarlo a tu calendario.';
  }catch(e){ if(estadoEl) estadoEl.textContent = 'Este navegador no permitió descargar el archivo.'; }
};
U.compartir = async texto => {
  if(navigator.share){ try{ await navigator.share({text: texto}); return; }catch(e){ if(e && e.name==='AbortError') return; } }
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
};
U.DIAS = [['15','El 15'],['-1','Fin de mes'],['15,-1','Cada quincena']];
// Bloque "Para que se cumpla solo": acciones [{t, html}] numeradas
U.cumplir = (intro, acciones) => `<section class="cumplir"><h2 style="margin-top:0;border:0;padding:0">Para que el plan se cumpla solo</h2>
  <p class="chico">${intro}</p>${acciones.map((a,k) => `<article class="accion"><h3><span class="num">${k+1}</span> ${a.t}</h3>${a.html}</article>`).join('')}</section>`;
U.icsHTML = (id, dia, nota) => `${U.chips('dia-'+id, U.DIAS, dia, 'Cuándo te pagan')}
  <button type="button" class="btn sec" id="ics-${id}" style="margin-top:8px">Agregar a mi calendario</button>
  <p class="suave chico" id="ics-${id}-estado" style="margin:6px 0 0">${nota || 'Se descarga un archivo de calendario. No se envía nada a ningún lado.'}</p>`;

U.mesesTxt = n => n===1 ? '1 mes' : Math.round(n) + ' meses';
U.fechaEn = n => { if(!isFinite(n)) return 'nunca'; const h = new Date(), f = new Date(h.getFullYear(), h.getMonth() + Math.round(n), 1); return M.etiquetaMes(f.getFullYear(), f.getMonth()); };
U.duracion = n => { if(!isFinite(n)) return 'no se termina'; if(n<12) return U.mesesTxt(n); const a = Math.floor(n/12), m = n%12; return `${a} ${a===1?'año':'años'}${m ? ` y ${U.mesesTxt(m)}` : ''}`; };

root.U = U;
})(typeof window!=='undefined' ? window : globalThis);
