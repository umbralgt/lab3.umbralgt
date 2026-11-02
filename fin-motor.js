/* fin-motor.js · v1.5 (Lab 3 Pro: precio por etapas, la obra espera la preventa mínima, ISR repartido, TIR robusta, crédito a la par del capital propio) · UMBRAL Lab 3 · motor compartido: Escalera financiera y Mi fondo de emergencia
   Datos y reglas: Especificación v0.1 (secciones 3 a 7).
   Sin IA, sin red, sin almacenamiento: funciones puras. La interfaz guarda (o no) las respuestas. */
(function(root){

// ==================== DATOS (sección 7) ====================
// v: valor · fecha: ISO del dato (para avisar si vence) · etiqueta: cómo se muestra · fuente · conf: 'oficial' | 'prensa' | 'academico'
// conf 'prensa' = norma oficial leída vía prensa o consultora: PENDIENTE confirmar en texto primario (sección 9).
// frec 'mensual' → aviso 'dato_vencido' si tiene más de 90 días.
const DATOS = {
  tc_tasa_prom_mn:   {v:0.5196, fecha:'2025-12-31', etiqueta:'dic-2025', fuente:'SIB, Informe del Superintendente', conf:'oficial'},
  tc_mora_mn:        {v:0.060,  fecha:'2025-12-31', etiqueta:'dic-2025', fuente:'SIB, Informe del Superintendente', conf:'oficial'},
  tc_tasa_mensual_rango:{v:[0.015,0.0695], fecha:'2026-03-31', etiqueta:'31-mar-2026', fuente:'DIACO, tasas por emisor', conf:'oficial', frec:'mensual'},
  tc_pago_min_pct:   {v:0.02,   fecha:'2026-03-01', etiqueta:'desde mar-2026', fuente:'Reglamento JM-56-2024, art. 8', conf:'prensa'},
  tc_pago_min_piso:  {v:200,    fecha:'2024-05-28', etiqueta:'2024', fuente:'Reglamento JM-56-2024', conf:'prensa'},
  tc_tope_tasa:      {v:null,   fecha:'2024-03-01', etiqueta:'2024', fuente:'Decreto 2-2024', conf:'oficial'}, // sin uso en mensajes v0.1 (contexto)
  tc_convenio_atrasos:{v:2,     fecha:'2024-03-01', etiqueta:'2024', fuente:'Decreto 2-2024', conf:'prensa'}, // v0.1: agregado para D4
  sib_historial_meses:{v:60,    fecha:'2026-01-01', etiqueta:'2026', fuente:'SIB (vía AGN)', conf:'oficial'},  // v0.1: agregado para D4
  activa_sin_tc_mn:  {v:0.1307, fecha:'2026-09-30', etiqueta:'sep-2026', fuente:'Banguat, tasa activa promedio', conf:'oficial', frec:'mensual'}, // sin uso en mensajes v0.1 (contexto)
  pasiva_mn:         {v:0.0462, fecha:'2026-09-30', etiqueta:'sep-2026', fuente:'Banguat, tasa pasiva promedio', conf:'oficial', frec:'mensual'},
  isr_intereses:     {v:0.10,   fecha:'2012-03-05', etiqueta:'vigente', fuente:'Decreto 10-2012, art. 92', conf:'oficial'},
  inflacion_interanual:{v:0.0337,fecha:'2026-08-31', etiqueta:'ago-2026', fuente:'Banguat', conf:'oficial', frec:'mensual'}, // sin uso en mensajes v0.1 (contexto)
  tasa_lider:        {v:0.035,  fecha:'2026-09-23', etiqueta:'23-sep-2026', fuente:'Banguat, Junta Monetaria', conf:'oficial'}, // sin uso en mensajes v0.1 (contexto)
  bono_min:          {v:5000,   fecha:'2026-01-01', etiqueta:'2026', fuente:'Acuerdo Gubernativo 26-2026', conf:'prensa'},
  bono_cupon:        {v:{a1:0.06, a2:0.06125, a3:0.0625}, fecha:'2026-10-01', etiqueta:'01-oct-2026', fuente:'Minfin, Comunicado 156', conf:'oficial', frec:'mensual'},
  bono_vencimiento:  {v:{a1:'14-abr-2027', a2:'14-abr-2028', a3:'13-abr-2029'}, fecha:'2026-10-01', etiqueta:'01-oct-2026', fuente:'Minfin, Comunicado 156', conf:'oficial', frec:'mensual'}, // v0.1.1: el bono "a 1 año" vence en abril 2027
  bono_cupo_pi:      {v:{total:500, libre:295.99}, fecha:'2026-10-01', etiqueta:'01-oct-2026', fuente:'Minfin, Comunicado 156', conf:'oficial', frec:'mensual'},
  igss_subsidio_frac:{v:2/3,    fecha:'2018-01-01', etiqueta:'rev. 2018', fuente:'IGSS, Acuerdo 410', conf:'oficial'},
  igss_subsidio_tope:{v:150,    fecha:'2021-01-01', etiqueta:'vigente', fuente:'IGSS, Acuerdo 1470', conf:'prensa'}, // v0.1.1: la nota IGSS 2022 que lo cita es la misma del "39 semanas" descartado; queda vía prensa hasta leer el Acuerdo 1470
  igss_subsidio_max: {v:{semanasEnf:26, semanas24m:52}, fecha:'2018-01-01', etiqueta:'rev. 2018', fuente:'IGSS, Acuerdo 410', conf:'oficial'},
  igss_cuota_laboral:{v:0.0483, fecha:'2026-01-01', etiqueta:'vigente', fuente:'IGSS', conf:'prensa'},           // v0.1: agregado para H4
  ivs_requisitos:    {v:{edad:60, cuotas:240}, fecha:'2026-01-01', etiqueta:'vigente', fuente:'IGSS, Acuerdo 1492', conf:'oficial'},
  ivs_min_max:       {v:{min:340, max:7200}, fecha:'2026-01-01', etiqueta:'2026', fuente:'IGSS, preguntas frecuentes IVS', conf:'oficial'},
  ivs_formula:       {v:{base:0.50, extra6m:0.005, sobre:120, baseMax:9000}, fecha:'2026-01-01', etiqueta:'vigente', fuente:'IGSS, Acuerdo 1124, art. 16', conf:'prensa'},
  isr_tarifa:        {v:{tasa:0.05, hasta:300000}, fecha:'2012-03-05', etiqueta:'vigente', fuente:'Decreto 10-2012, art. 73', conf:'oficial'},
  isr_deducciones_2026:{v:{fija:48000, extra:3024}, fecha:'2026-05-23', etiqueta:'2026', fuente:'Decretos 10-2012 y 13-2026', conf:'prensa'},
  planilla_iva_tope: {v:12000,  fecha:'2012-03-05', etiqueta:'vigente', fuente:'Decreto 10-2012', conf:'prensa'},
  findex_emergencia: {v:{pueden:85, dificil:45, ahorros:16, familia:34}, fecha:'2024-12-31', etiqueta:'2024', fuente:'Banco Mundial, Global Findex 2025', conf:'oficial'},
  enifh:             {v:{tarjeta:11.0, seguro:11.0, conoceTasas:5.2, noSabeQueja:53.3, enCasa:27.0, credNoFin:26.2, credFin:15.5, cuentaAhorro:38.6, noAlcanza:42.8}, fecha:'2025-06-30', etiqueta:'2025', fuente:'INE, ENIFH 2025', conf:'oficial'}, // v0.1.2: crédito y cuentas, verificados en el informe ENIFH del proyecto
  informalidad:      {v:66,     fecha:'2025-06-30', etiqueta:'T2-2025', fuente:'INE, ENEIC', conf:'oficial'},
  gasto_bolsillo_salud:{v:54,   fecha:'2018-12-31', etiqueta:'pub. 2020', fuente:'OCDE/Banco Mundial', conf:'oficial'},
  day_trading_pierde:{v:97,     fecha:'2015-12-31', etiqueta:'2013-2015', fuente:'Chague, De-Losso y Giovannetti (SSRN 3423101)', conf:'academico'},
  piramides_afectados:{v:20000, fecha:'2022-12-31', etiqueta:'2022', fuente:'PNC/DEIC', conf:'oficial'},
  // v0.5: señales de alerta actuales (investigación del 26-oct-2026)
  juego_trastorno:   {v:{casino:15.8, deportes:9.0}, fecha:'2024-10-24', etiqueta:'oct-2024', fuente:'Comisión de The Lancet Public Health sobre juego', conf:'academico'},
  juego_sin_regulador:{v:true,  fecha:'2026-08-05', etiqueta:'2026', fuente:'Código Penal art. 477; iniciativa 4294 archivada (vía prensa)', conf:'prensa'},
  mp_fraude_diario:  {v:50,     fecha:'2025-11-29', etiqueta:'nov-2025', fuente:'Ministerio Público, Fiscalía de Casos Especiales (vía Prensa Libre)', conf:'prensa'},
  mp_fraude_facebook:{v:33,     fecha:'2025-11-29', etiqueta:'nov-2025', fuente:'Ministerio Público (vía Prensa Libre)', conf:'prensa'},
  // v0.6: pagos extra de ley (para el plan de fondo de emergencia)
  bono14:            {v:{pct:1, mes:7}, fecha:'1992-07-01', etiqueta:'vigente', fuente:'Decreto 42-92, arts. 2 y 3', conf:'oficial'},
  aguinaldo:         {v:{pct:1, mes:12}, fecha:'1978-12-01', etiqueta:'vigente', fuente:'Decreto 76-78 (vía Bloomberg Línea, citando al Ministerio de Trabajo)', conf:'prensa'},
  // v0.7: evidencia de economía del comportamiento (para que los planes se cumplan)
  compromiso_ahorro: {v:{acepto:28.4, aumento:81}, fecha:'2006-05-01', etiqueta:'2006', fuente:'Ashraf, Karlan y Yin, "Tying Odysseus to the Mast" (Filipinas)', conf:'academico'},
  recordatorios:     {v:{general:6, especifico:16}, fecha:'2010-08-01', etiqueta:'2010', fuente:'Karlan, McConnell, Mullainathan y Zinman, NBER (Bolivia, Perú y Filipinas)', conf:'academico'},
  mlm_ftc_17:        {v:17,     fecha:'2024-09-04', etiqueta:'4-sep-2024', fuente:'FTC (EE.UU.), Consumer Advice', conf:'oficial'}, // v0.1.1: verificado en el documento del proyecto
  mlm_ftc:           {v:1000,   fecha:'2024-09-04', etiqueta:'4-sep-2024', fuente:'FTC (EE.UU.)', conf:'oficial'},
  // v0.9 · peldaño 6 ampliado
  pasiva_me:         {v:0.0379, fecha:'2026-09-30', etiqueta:'sep-2026', fuente:'Banguat, tasa pasiva promedio ponderado en moneda extranjera', conf:'oficial', frec:'mensual'},
  fopa_cobertura:    {v:20000,  fecha:'2026-07-18', etiqueta:'jul-2026', fuente:'Ley de Bancos y Grupos Financieros, vía La Hora', conf:'prensa'},
  bono_exento:       {v:true,   fecha:'2026-10-08', etiqueta:'2026', fuente:'Decreto 101-97, art. 71 (i), vía Living in Guatemala y Revista E&N', conf:'prensa'},
  bono_secundario:   {v:true,   fecha:'2021-06-18', etiqueta:'2021', fuente:'Minfin, vía Revista E&N', conf:'prensa'},
  bvn_comision:      {v:[0.002205, 0.0054], fecha:'2026-10-08', etiqueta:'2026', fuente:'Tabla de comisiones de la BVN, vía Living in Guatemala', conf:'prensa'},
  pagare_ejemplo:    {v:0.083334, fecha:'2024-08-09', etiqueta:'2024', fuente:'Prensa Libre (emisión de pagarés en la BVN)', conf:'prensa'},
  eeuu_ret_div:      {v:0.30,   fecha:'2026-10-14', etiqueta:'vigente', fuente:'IRS y PwC Tax Summaries (sin convenio con Guatemala)', conf:'prensa'},
  eeuu_herencia_ex:  {v:60000,  fecha:'2026-10-14', etiqueta:'vigente', fuente:'IRS, formulario 706-NA', conf:'prensa'},
  ucits_ret_div:     {v:0.15,   fecha:'2026-10-01', etiqueta:'vigente', fuente:'Convenio EE.UU.–Irlanda, vía guías fiscales', conf:'prensa'},
  sp500_2008:        {v:-0.37,  fecha:'2008-12-31', etiqueta:'2008', fuente:'S&P Dow Jones Indices (rendimiento total del S&P 500)', conf:'oficial'},
  // v1.0 · peldaño 7: vivienda
  hipo_prom_mn:      {v:0.0941, fecha:'2026-08-31', etiqueta:'ago-2026 (preliminar)', fuente:'Banguat, préstamos para vivienda, vía Living in Guatemala', conf:'prensa', frec:'mensual'},
  hipo_prom_me:      {v:0.0761, fecha:'2026-08-31', etiqueta:'ago-2026 (preliminar)', fuente:'Banguat, préstamos para vivienda, vía Living in Guatemala', conf:'prensa', frec:'mensual'},
  hipo_enganche:     {v:{fha:0.05, banco:0.20}, fecha:'2026-10-05', etiqueta:'oct-2026', fuente:'Condiciones publicadas por bancos, vía Living in Guatemala', conf:'prensa'},
  hipo_plazo_max:    {v:30,     fecha:'2026-10-05', etiqueta:'oct-2026', fuente:'Condiciones publicadas por bancos, vía Living in Guatemala', conf:'prensa'},
  iva_primera_venta: {v:0.12,   fecha:'2012-02-16', etiqueta:'vigente', fuente:'Ley del IVA, Decreto 27-92', conf:'oficial'},
  timbres_reventa:   {v:0.03,   fecha:'2026-10-10', etiqueta:'vigente', fuente:'Ley de Timbres, Decreto 37-92, art. 4, vía Living in Guatemala', conf:'prensa'},
  notario_arancel:   {v:{base:500, pct:0.03, pct2:0.02, desde:100000, hasta:1000000}, fecha:'2026-10-10', etiqueta:'vigente', fuente:'Código de Notariado, arts. 106 y 109, vía Living in Guatemala', conf:'prensa'},
  rgp_inscripcion:   {v:{min:160, porMil:1.5, desde:10000}, fecha:'2026-10-10', etiqueta:'vigente', fuente:'Acuerdo Gubernativo 325-2005, vía Living in Guatemala', conf:'prensa'},
  iusi_escala:       {v:[[2000,0],[20000,0.002],[70000,0.006],[Infinity,0.009]], fecha:'2026-10-10', etiqueta:'hasta 25-nov-2026', fuente:'Decreto 15-98, art. 11', conf:'oficial'},
  iusi_reforma:      {v:{vivienda:0, desde:'2026-11-26', otros:[[500000,0.003],[1000000,0.006],[Infinity,0.009]]}, fecha:'2026-08-28', etiqueta:'Decreto 18-2026', fuente:'Decreto 18-2026, vía Living in Guatemala y Consortium Legal', conf:'prensa'},
  isr_ganancia_inmueble: {v:{exentoDesde:'2027-01-01'}, fecha:'2026-08-28', etiqueta:'desde 2027', fuente:'Decreto 18-2026, vía Consortium Legal', conf:'prensa'},
  isr_rentas_inmueble:   {v:{tasa:0.10, deduccion:0.15}, fecha:'2012-02-16', etiqueta:'vigente', fuente:'Ley de Actualización Tributaria, Decreto 10-2012 (rentas de capital inmobiliario), vía guías fiscales', conf:'prensa'},
  tipo_cambio:       {v:7.6438, fecha:'2026-10-29', etiqueta:'oct-2026', fuente:'Banguat, tipo de cambio de referencia, vía Living in Guatemala', conf:'prensa', frec:'diaria'},
  lab1_proyectos:    {v:{"Zona 4": [6, 80126, 166115], "Zona 12": [12, 44999, 87454], "Zona 18": [4, 44320, 73506], "Mixco": [6, 54525, 94544], "Zona 10": [28, 60551, 160461], "Zona 16": [23, 41715, 175500], "Zona 15": [23, 92753, 184172], "Zona 17": [3, 59897, 67948], "Zona 14": [10, 96153, 172985], "Zona 13": [8, 104333, 169619], "Zona 1": [5, 58974, 80615], "Zona 11": [18, 69044, 128647], "Zona 2": [5, 79230, 96025], "Zona 5": [4, 75543, 129007], "Zona 8": [2, 63717, 73656], "Zona 6": [2, 67300, 82658], "Villa Nueva": [3, 63833, 69628], "Zona 7": [4, 52245, 88859], "San José Pinula": [9, 60897, 104487], "San Miguel Petapa": [5, 65730, 91285], "Fraijanes": [6, 86538, 133974], "Zona 3": [3, 53502, 53502], "Santa Catarina Pinula": [2, 107019, 221193]}, fecha:'2025-12-31', etiqueta:'2025', fuente:'UMBRAL Lab 1, mapa de proyectos activos (precios "desde", en US$)', conf:'umbral'},
  lab1_caprate:      {v:{A:0.0432, B:0.0439, C:0.0476}, fecha:'2026-01-01', etiqueta:'2025', fuente:'INTUS Tendencias 2026, vía UMBRAL Lab 1', conf:'prensa'},
  // v1.1 · lotes financiados por la lotificadora y preventa
  fopavi:            {v:{monto:59000, aporte:1000, salariosMax:4}, fecha:'2025-12-16', etiqueta:'dic-2025', fuente:'Fondo para la Vivienda (FOPAVI), vía La Hora', conf:'prensa'},
  promesa_plazo_max: {v:2, fecha:'1963-09-14', etiqueta:'vigente', fuente:'Código Civil, art. 1681 (promesa sobre inmuebles: máximo 2 años), vía Living in Guatemala', conf:'prensa'},
  lotes_sin_licencia:{v:20, fecha:'2001-12-03', etiqueta:'2001', fuente:'Municipalidad de Guatemala, vía Prensa Libre (más de 20 lotificadoras vendieron sin licencia)', conf:'prensa'},
  // v1.2 · dar
  dar_experimento:   {v:{montos:[5,20]}, fecha:'2008-03-21', etiqueta:'2008', fuente:'Dunn, Aknin y Norton, Science', conf:'academico'},
  dar_paises:        {v:{positivos:120, paises:136}, fecha:'2013-02-01', etiqueta:'2013', fuente:'Aknin y otros, Journal of Personality and Social Psychology (Gallup World Poll 2006-2008)', conf:'academico'},
  dar_brooks:        {v:true, fecha:'2013-11-26', etiqueta:'2013', fuente:'Arthur C. Brooks, columna en The Wall Street Journal, vía The Chronicle of Philanthropy', conf:'prensa'},
  // v1.3 · Lab 3 Pro
  isr_utilidades:    {v:0.25, fecha:'2015-01-01', etiqueta:'vigente', fuente:'Ley de Actualización Tributaria, Decreto 10-2012, vía García Bodán (2024)', conf:'oficial'},
  isr_opcional:      {v:{tasa1:0.05, hasta:30000, tasa2:0.07}, fecha:'2013-01-01', etiqueta:'vigente', fuente:'Decreto 10-2012 (régimen opcional simplificado sobre ingresos), vía García Bodán (2024)', conf:'oficial'},
  licencia_muni:     {v:{valorM2:2000, tasa:0.045, social:0}, fecha:'2004-05-19', etiqueta:'vigente', fuente:'Municipalidad de Guatemala, Acuerdo COM-012-04 (más de 400 m²), vía Living in Guatemala', conf:'oficial'},
  marn_instrumento:  {v:{B2:{consultor:11500, arancel:1500, dias:75}, B1:{consultor:22500, arancel:4000, dias:105}}, fecha:'2026-09-24', etiqueta:'2026', fuente:'AG 137-2016 y AM 199-2016, vía Living in Guatemala (puntos medios de los rangos)', conf:'prensa'},
  credito_empresarial:{v:0.078, fecha:'2026-01-31', etiqueta:'inicio de 2026', fuente:'Mineco con datos de la SIB, vía IberoNews', conf:'prensa'},
  vp_precio_max:     {v:361547, fecha:'2025-04-20', etiqueta:'2025', fuente:'EMVDU, Municipalidad de Guatemala (91 salarios mínimos), vía Prensa Libre', conf:'prensa'},
  mpc_credito:       {v:{tasa91:0.05, tasa170:0.055, enganche:0.05, anios:40}, fecha:'2025-08-01', etiqueta:'2025-2026', fuente:'CHN, Mi Primera Casa (con FHA), preguntas frecuentes', conf:'oficial'},
  absorcion_vp:      {v:{min:10, max:20, techo:30}, fecha:'2026-05-26', etiqueta:'may-2026', fuente:'EMVDU, vía República', conf:'prensa'},
  rango_que_rota:    {v:{min:200000, max:800000, m2min:50, m2max:85}, fecha:'2025-07-31', etiqueta:'T1-2025', fuente:'4S Real Estate, Panorama Inmobiliario 2025', conf:'prensa'}
};

// Supuestos de UMBRAL (no son datos externos; sección 4)
const SUP = {
  emergencia: 10000,      // prueba del tropiezo, escenario A
  cuotaMaxPct: 0.30,      // referencia internacional, no norma guatemalteca
  mesesArranque: 1, mesesFondo: 3, mesesFondoUnico: 6,
  tasaD2Mensual: 0.035,   // umbral de D2 (≈42% anual)
  rendSospechoso: 0.02,   // P1: 2% mensual
  cuotaFijaPctIngreso: 0.10, // escenario A, segunda forma de pago
  maxHallazgos: 6, diasVence: 90
};

// v0.1.1: avisos centralizados para que la interfaz no los redacte por su cuenta
const AVISOS = {
  entrada: 'Esta herramienta es educativa y gratuita. No es asesoría financiera, legal ni tributaria, y no reemplaza a tu banco, a un contador o a un abogado. UMBRAL no vende productos financieros, no recibe comisiones y no recomienda instituciones. Los resultados son estimaciones con datos públicos fechados y supuestos simplificados: pueden no coincidir con tu caso. Tus respuestas se quedan en este teléfono.',
  corto: 'Herramienta educativa. No es asesoría financiera. Verificá cada dato antes de decidir.',
  ilustrativo: 'Ejemplo ilustrativo: el resultado real depende de tu contrato, tus tasas y tus cargos.',
  porVerificar: 'Dato tomado de una fuente secundaria que cita la norma oficial. Si tu decisión depende de él, conviene confirmarlo en el texto oficial o con un profesional.' // v0.1.1: los datos vía prensa se publican con esta marca; no bloquean el lanzamiento
};

const FAMILIAS = ['Promesas','Deuda','Colchón','Horizonte']; // orden de prioridad (sección 5)
// v0.2: nombres que ve la persona. "Promesas" se leía como si la herramienta prometiera algo.
const FAMILIA_NOMBRE = {Promesas:'Ojo con esto', Deuda:'Tus deudas', 'Colchón':'Tu fondo de emergencia', Horizonte:'Largo plazo: retiro e impuestos'};
// v0.3: cada familia se explica en una línea (la prueba mostró que "Tu futuro" no se entendía)
const FAMILIA_EXPLICA = {
  Promesas:'Ofertas que marcaste y que conviene revisar con calma antes de poner dinero.',
  Deuda:'Cuánto te cuestan tus deudas y qué podés hacer para salir antes.',
  'Colchón':'Qué tan protegido estás si mañana pasa algo inesperado.',
  Horizonte:'Lo que hoy decide cómo vas a estar en 10, 20 o 30 años: tu pensión, tu ahorro y tus impuestos.'};

// ==================== UTILIDADES ====================
const num = x => (typeof x==='number' && isFinite(x) && x>=0) ? x : null; // v0.1.1: negativos = dato inválido
function fmtQ(n){ return 'Q' + Math.round(n).toLocaleString('en-US'); }
function fmtPct(x, d){ return (x*100).toFixed(d==null?2:d) + '%'; }
function fmtMeses(m){
  if(m===Infinity) return 'nunca';
  if(m < 24) return m + (m===1?' mes':' meses');
  const a = m/12; return (Number.isInteger(a) ? a : a.toFixed(1)) + ' años';
}
function tasaAnualDe(r){ // tasa de la tarjeta como anual nominal, o null si no la sabe
  const t = r.q_tasa_tc; if(!t || num(t.v)==null) return null;
  // v0.1.1: la interfaz SIEMPRE envía porcentaje (0.99 = 0.99%). Antes, 0.99 se leía como 99%.
  const anual = t.unidad==='mensual' ? t.v*12/100 : t.v/100;
  return tasaPlausible(anual) ? anual : null;
}

function tasaPlausible(anual){ return anual >= 0.06 && anual <= 1.2; } // 0.5% a 10% mensual; fuera de rango = probable error de unidad

// ==================== CÁLCULOS ====================
// Pago mínimo mes a mes (sección 6). o: {saldo, tasaAnual, cuotaFija?, pct?, piso?, maxMeses?}
function simularMinimo(o){
  const i = o.tasaAnual/12, pct = o.pct==null?DATOS.tc_pago_min_pct.v:o.pct, piso = o.piso==null?DATOS.tc_pago_min_piso.v:o.piso;
  const maxM = o.maxMeses||1200;
  let s = o.saldo, m = 0, total = 0, intereses = 0;
  if(s<=0) return {meses:0, totalPagado:0, intereses:0, nunca:false};
  if(o.cuotaFija!=null && o.cuotaFija <= s*i) return {meses:Infinity, totalPagado:Infinity, intereses:Infinity, nunca:true};
  while(s > 0.01 && m < maxM){
    const int = s*i;
    let pago = o.cuotaFija!=null ? o.cuotaFija : Math.max(pct*s + int, piso);
    pago = Math.min(pago, s + int);
    s = s + int - pago; total += pago; intereses += int; m++;
  }
  return {meses:m, totalPagado:total, intereses, nunca: m>=maxM};
}

// Pago mínimo del mes actual (para C, sección 4)
function minimoDelMes(saldo, tasaAnual){
  if(!(saldo>0)) return 0;
  const int = saldo*tasaAnual/12;
  return Math.min(Math.max(DATOS.tc_pago_min_pct.v*saldo + int, DATOS.tc_pago_min_piso.v), saldo + int);
}

// Subsidio IGSS por enfermedad (Acuerdo 410). o: {salario}
function subsidioIGSS(o){
  const diario = Math.min(DATOS.igss_subsidio_frac.v*o.salario/30, DATOS.igss_subsidio_tope.v);
  return {diario, mensual: diario*30, topado: DATOS.igss_subsidio_frac.v*o.salario/30 > DATOS.igss_subsidio_tope.v,
          primerMes: o.salario/30 + 27*diario}; // día 1 lo paga el patrono; días 2-3 sin pago; 27 días de subsidio
}

// Pensión IVS ilustrativa con 240 cuotas (Acuerdo 1124, art. 16). El promedio de 60 meses se aproxima con el salario actual.
function pensionIVS(salario, cuotas){
  const f = DATOS.ivs_formula.v, mm = DATOS.ivs_min_max.v;
  const c = cuotas==null ? DATOS.ivs_requisitos.v.cuotas : cuotas;
  const pct = f.base + f.extra6m*Math.max(0, Math.floor((c - f.sobre)/6));
  const base = Math.min(salario, f.baseMax);
  return Math.max(mm.min, Math.min(mm.max, base*pct));
}

// v0.4: préstamo a cuota fija (sistema francés). Tasa de referencia: promedio de préstamos sin tarjetas (Banguat).
function D_PRESTAMO(){ return DATOS.activa_sin_tc_mn.v; }
function cuotaPrestamo(monto, tasaAnual, meses){
  const i = tasaAnual/12, cuota = monto*i/(1-Math.pow(1+i,-meses));
  return {monto, tasaAnual, meses, cuota, total:cuota*meses, intereses:cuota*meses - monto};
}

function semaforo(meses){ return meses>=3 ? 'verde' : meses>=1 ? 'amarillo' : 'rojo'; }

// Variables derivadas que usan peldaño, tropiezo y reglas
function contexto(r){
  // v0.1.2: la tarjeta y el IGSS son opcionales. Sin respuesta explícita se asume lo de la v0.1 (compatibilidad).
  const tieneTC = r.q_tiene_tc!==false;
  const tieneIGSS = r.q_igss==='si' || (r.q_igss==null && num(r.q_salario)!=null);
  const I = num(r.q_ingreso), G = num(r.q_gastos), A = num(r.q_ahorro), S = tieneTC ? num(r.q_saldo_tc) : 0;
  const otras = num(r.q_cuotas_otras);
  const tasaPropia = tieneTC ? tasaAnualDe(r) : null;
  const tasa = tasaPropia!=null ? tasaPropia : DATOS.tc_tasa_prom_mn.v;
  // v0.1.1: si paga el total, sus compras ya están en sus gastos; sumar el mínimo las contaría dos veces
  const minTC = S==null ? null : (r.q_pago_tc==='total' ? 0 : minimoDelMes(S, tasa));
  const C = (otras==null || minTC==null) ? null : otras + minTC;
  const mesesFondo = r.q_unico===true ? SUP.mesesFondoUnico : SUP.mesesFondo;
  // v0.2: q_retiro puede ser monto (Q ahorrados para el retiro) o sí/no (compatibilidad)
  const retiroMonto = typeof r.q_retiro==='number' ? num(r.q_retiro) : null;
  const tieneRetiro = r.q_retiro==null ? null : (typeof r.q_retiro==='number' ? retiroMonto>0 : r.q_retiro===true);
  const tasaInusual = tieneTC && !!(r.q_tasa_tc && num(r.q_tasa_tc.v)!=null && tasaPropia==null);
  return {I, G, A, S, C, otras, tasa, tasaPropia, tasaInusual, tieneTC, tieneIGSS, retiroMonto, tieneRetiro, minTC, mesesFondo,
          colchonReq: G==null ? null : mesesFondo*G, salario: tieneIGSS ? num(r.q_salario) : null};
}

// ==================== ESCALERA (sección 4) ====================
const PELDANOS = ['','Ordenar el día a día','Fondo de emergencia inicial','Deudas','Protección','Metas','Inversión conservadora'];

function ubicarPeldano(r, x){
  x = x || contexto(r);
  const res = (n, falta) => ({n, nombre:PELDANOS[n], porConfirmar: falta||[]});
  // 1 · G + C ≤ I
  const f1 = ['q_ingreso','q_gastos','q_saldo_tc','q_cuotas_otras'].filter(k => k==='q_saldo_tc' ? (x.tieneTC && num(r[k])==null) : num(r[k])==null);
  if(f1.length) return res(1, f1);
  if(x.G + x.C > x.I) return res(1);
  // 2 · A ≥ 1 × G
  if(x.A==null) return res(2, ['q_ahorro']);
  if(x.A < SUP.mesesArranque*x.G) return res(2);
  // 3 · paga el total (o saldo 0), sin atrasos, C ≤ 30% de I
  if(r.q_atrasos==null || (x.S>0 && r.q_pago_tc==null)) return res(3, ['q_pago_tc','q_atrasos'].filter(k=>r[k]==null));
  const cuotasPlenas = x.S>0 ? x.C : x.otras; // si paga el total, la tarjeta no es cuota de deuda
  if(!(x.S===0 || r.q_pago_tc==='total') || r.q_atrasos>0 || cuotasPlenas > SUP.cuotaMaxPct*x.I) return res(3);
  // 4 · fondo de 3 (o 6) meses + seguro médico
  if(r.q_seguro==null || r.q_seguro==='nose') return res(4, ['q_seguro']);
  if(x.A < x.colchonReq || r.q_seguro!=='si') return res(4);
  // 5 · ahorro para el retiro
  if(x.tieneRetiro==null) return res(5, ['q_retiro']);
  if(!x.tieneRetiro) return res(5);
  return res(6);
}

// v0.3: comparación de cada área contra cuatro niveles. Los cortes son referencias de UMBRAL, no normas.
const NIVELES = ['riesgo','minimo','bien','ideal'];
const NIVEL_NOMBRE = {riesgo:'En riesgo', minimo:'Lo mínimo', bien:'Bien encaminado', ideal:'Ideal'};
function compararNiveles(r, x){
  // v0.4: cada nivel trae "siguiente": qué se espera de la persona para subir, en quetzales.
  x = x || contexto(r);
  const out = [];
  if(x.I && x.G!=null && x.C!=null){
    const sobra = x.I - x.G - x.C, pct = sobra/x.I;
    const n = pct<0 ? 'riesgo' : pct<0.10 ? 'minimo' : pct<0.20 ? 'bien' : 'ideal';
    const meta = p => `Que te sobren al menos ${fmtQ(p*x.I)} al mes (${Math.round(p*100)}% de lo que recibís). Hoy te sobran ${fmtQ(Math.max(0,sobra))}: te faltan ${fmtQ(p*x.I - Math.max(0,sobra))} al mes, bajando gastos o pagos de deudas.`;
    out.push({id:'mes', titulo:'Tu mes', nivel:n,
      dato: pct<0 ? `Gastás ${fmtQ(-sobra)} más de lo que recibís cada mes.` : `Te sobran ${fmtQ(sobra)} al mes: ${Math.round(pct*100)}% de lo que recibís.`,
      escala:['Gastás más de lo que recibís','Te sobra menos de 10%','Te sobra entre 10% y 20%','Te sobra 20% o más'],
      siguiente: n==='riesgo' ? `Que el mes alcance: necesitás bajar ${fmtQ(-sobra)} entre gastos y pagos de deudas, o aumentar tu ingreso en esa cantidad.`
               : n==='minimo' ? meta(0.10) : n==='bien' ? meta(0.20)
               : 'Mantenerlo y destinar lo que sobra a tu fondo de emergencia, tus deudas o tu retiro, en ese orden.'});
  }
  if(x.A!=null && x.G){
    const m = x.A/x.G;
    const n = m<1 ? 'riesgo' : m<3 ? 'minimo' : m<6 ? 'bien' : 'ideal';
    const meta = k => `Llegar a ${k} ${k===1?'mes':'meses'} de gastos guardados (${fmtQ(k*x.G)}). Te faltan ${fmtQ(k*x.G - x.A)}.`;
    out.push({id:'colchon', titulo:'Tu fondo de emergencia', nivel:n, dato:`Tenés ${fmtQ(x.A)}: alcanza para ${m<0.1?'menos de una semana':m.toFixed(1)+' meses'} de gastos.`,
      escala:['Menos de 1 mes','1 a 3 meses','3 a 6 meses','6 meses o más'],
      siguiente: n==='riesgo' ? meta(1) : n==='minimo' ? meta(3) : n==='bien' ? meta(6)
               : 'Mantenerlo separado y usarlo solo para emergencias. Lo que pase de 6 meses puede ir a metas o a inversión conservadora.'});
  }
  if(x.I && r.q_atrasos!=null && (x.otras!=null || !x.tieneTC)){
    const cuotas = x.S>0 ? (x.C||0) : (x.otras||0), pct = cuotas/x.I;
    const caro = x.S>0 && (r.q_pago_tc==='minimo' || r.q_pago_tc==='menos');
    const informal = (r.q_informal||[]).includes('prestamista');
    let n;
    if(r.q_atrasos>0 || caro || informal || pct>0.40) n='riesgo';
    else if(pct>0.30 || (x.S>0 && r.q_pago_tc==='mas')) n='minimo';
    else if(cuotas>0) n='bien'; else n='ideal';
    const pasos = [];
    if(n==='riesgo'){
      if(r.q_atrasos>0) pasos.push('ponerte al día con los pagos atrasados');
      if(informal) pasos.push('salir primero del préstamo con prestamista, aunque sea el más pequeño');
      if(caro) pasos.push('pagar cada mes más que el mínimo de la tarjeta');
      if(pct>0.40) pasos.push(`bajar tus pagos de deudas a menos de ${fmtQ(0.40*x.I)} al mes`);
    }
    out.push({id:'deudas', titulo:'Tus deudas', nivel:n,
      dato: cuotas>0 ? `Pagás unos ${fmtQ(cuotas)} al mes en deudas: ${Math.round(pct*100)}% de lo que recibís${caro?', y pagás solo el mínimo de la tarjeta':''}${r.q_atrasos>0?', con atrasos este año':''}.` : 'No tenés pagos de deudas cada mes.',
      escala:['Atrasos, solo el mínimo o deudas de más de 40% de lo que recibís','Al día y pagando más del mínimo','Al día, con la tarjeta pagada completa y deudas de 30% o menos de lo que recibís','Sin deudas que pagar cada mes'],
      siguiente: n==='riesgo' ? pasos.join('; ') + '.'
               : n==='minimo' ? `Pagar el total de tu tarjeta cada mes y que tus pagos de deudas no pasen de ${fmtQ(0.30*x.I)} al mes (30% de lo que recibís).`
               : n==='bien' ? `Terminar de pagar tus deudas. Hoy pagás ${fmtQ(cuotas)} al mes; cuando terminen, ese dinero queda libre para ahorrar.`
               : 'Mantenerte sin deudas caras. Si algún día necesitás crédito, compará el costo total en quetzales, no solo la cuota.'});
  }
  if(x.tieneRetiro!=null && x.G){
    const anual = 12*x.G, monto = x.retiroMonto || 0;
    const n = !x.tieneRetiro ? 'riesgo' : monto<anual ? 'minimo' : monto<3*anual ? 'bien' : 'ideal';
    out.push({id:'retiro', titulo:'Tu retiro', nivel:n,
      dato: x.tieneRetiro ? `Tenés ${monto ? fmtQ(monto)+' ' : ''}ahorrados para tu retiro, aparte del IGSS.` : 'Todavía no tenés dinero guardado solo para tu retiro, aparte del IGSS.',
      escala:['Sin ahorro aparte para el retiro','Menos de 1 año de tus gastos','De 1 a 3 años de tus gastos','3 años de tus gastos o más'],
      siguiente: n==='riesgo' ? 'Abrir un ahorro solo para tu retiro y apartar ahí una cantidad fija cada mes, aunque sea pequeña. Lo importante es empezar: el tiempo hace más que el monto.'
               : n==='minimo' ? `Llegar a ${fmtQ(anual)} (un año de tus gastos) guardados solo para el retiro. Te faltan ${fmtQ(anual-monto)}.`
               : n==='bien' ? `Llegar a ${fmtQ(3*anual)} (tres años de tus gastos). Te faltan ${fmtQ(3*anual-monto)}.`
               : 'Calcular una meta exacta según tu edad y la pensión del IGSS. Lo hará la herramienta Mis metas (próximamente).'});
  }
  return out;
}

// v0.2: explicación de cada peldaño con los números de la persona (la prueba mostró que el peldaño no se entendía)
const PIDE = ['',
  'Que tus gastos y tus pagos de deudas quepan en tu ingreso.',
  'Tener ahorrado al menos un mes de gastos. Es el mínimo para arrancar: después la meta es 3 meses, y lo ideal, 6.',
  'Estar al día, pagar el total de la tarjeta (si tenés) y que tus pagos de deudas no pasen de 30% de tu ingreso.',
  'Tener ahorrados 3 meses de gastos (6 si sos el único ingreso) y seguro médico.',
  'Tener un ahorro aparte, solo para tu retiro.',
  'Cumplir los cinco peldaños anteriores.'];
function explicarPeldanos(r, x, n){
  x = x || contexto(r);
  const out = [];
  for(let p=1; p<=6; p++){
    const e = {n:p, nombre:PELDANOS[p], pide:PIDE[p], estado: p<n ? 'cumple' : p===n ? 'aqui' : 'despues', por:null, paso:null};
    if(p<=n){
      if(p===1 && x.I!=null && x.G!=null && x.C!=null){
        const sobra = x.I - x.G - x.C;
        e.por = sobra>=0 ? `Tus gastos (${fmtQ(x.G)}) y tus pagos de deudas (${fmtQ(x.C)}) caben en tu ingreso de ${fmtQ(x.I)}. Te quedan unos ${fmtQ(sobra)} al mes.`
                         : `Tus gastos (${fmtQ(x.G)}) y tus pagos de deudas (${fmtQ(x.C)}) suman más que tu ingreso de ${fmtQ(x.I)}: faltan unos ${fmtQ(-sobra)} cada mes.`;
        if(sobra<0) e.paso = `Encontrar cómo cerrar esa diferencia de ${fmtQ(-sobra)} al mes, bajando gastos o pagos de deudas.`;
      }
      if(p===2 && x.A!=null && x.G){
        e.por = x.A>=x.G ? `Tu ahorro de ${fmtQ(x.A)} cubre ${(x.A/x.G).toFixed(1)} meses de gastos: ya pasaste el mínimo de un mes. La meta siguiente es 3 meses.`
                         : `Tu ahorro de ${fmtQ(x.A)} todavía no cubre un mes de gastos (${fmtQ(x.G)}).`;
        if(x.A<x.G) e.paso = `Juntar ${fmtQ(x.G - x.A)} más para completar un mes de gastos.`;
      }
      if(p===3 && x.I!=null){
        const cuotas = x.S>0 ? x.C : x.otras, tope = SUP.cuotaMaxPct*x.I, fallas = [], pasos = [];
        if(r.q_atrasos>0){ fallas.push('tuviste pagos atrasados este año'); pasos.push('Ponerte al día con los pagos atrasados.'); }
        if(x.S>0 && r.q_pago_tc!=='total'){ fallas.push('no pagás el total de tu tarjeta cada mes'); pasos.push('Llegar a pagar el total de tu tarjeta cada mes.'); }
        if(cuotas!=null && cuotas>tope){ fallas.push(`tus pagos de deudas (${fmtQ(cuotas)}) pasan de 30% de tu ingreso (${fmtQ(tope)})`); pasos.push(`Bajar tus pagos de deudas a menos de ${fmtQ(tope)} al mes.`); }
        e.por = fallas.length ? 'Este peldaño pide estar al día y sin deudas caras, pero ' + fallas.join(', ') + '.' : 'Estás al día y tus pagos de deudas no pasan de 30% de tu ingreso.';
        e.paso = pasos[0] || null;
      }
      if(p===4 && x.A!=null && x.G){
        const meses = x.A/x.G, fallas = [];
        if(x.A < x.colchonReq) fallas.push(`tu ahorro cubre ${meses.toFixed(1)} meses y este peldaño pide ${x.mesesFondo}`);
        if(r.q_seguro!=='si') fallas.push('no tenés seguro médico');
        e.por = fallas.length ? 'Este peldaño pide un fondo de emergencia completo y seguro médico, pero ' + fallas.join(' y ') + '.' : `Tenés ${meses.toFixed(1)} meses de gastos ahorrados y seguro médico.`;
        if(x.A < x.colchonReq) e.paso = `Juntar ${fmtQ(x.colchonReq - x.A)} más para tener ${x.mesesFondo} meses de gastos.`;
        else if(r.q_seguro!=='si') e.paso = 'Cotizar un seguro médico y compararlo con lo que hoy cubre tu fondo de emergencia.';
      }
      if(p===5){
        e.por = x.tieneRetiro ? `Tenés ${x.retiroMonto ? fmtQ(x.retiroMonto)+' ' : ''}ahorrados aparte para tu retiro.` : 'Todavía no tenés un ahorro aparte para tu retiro.';
        if(!x.tieneRetiro) e.paso = 'Empezar un ahorro aparte, solo para tu retiro, aunque sea pequeño.';
      }
      if(p===6){ e.por = 'Cumplís los cinco peldaños anteriores.'; e.paso = 'Aprender sobre inversión conservadora, empezando por lo que se ve en "Tu futuro".'; }
      if(e.estado==='aqui' && !e.por) e.por = 'Falta un dato para revisar este peldaño.';
    }
    out.push(e);
  }
  return out;
}

// ==================== PRUEBA DEL TROPIEZO (sección 6) ====================
function pruebaTropiezo(r, x){
  x = x || contexto(r);
  const out = {A:null, B:null};
  // Escenario A: emergencia de Q10,000
  if(x.A!=null){
    const E = SUP.emergencia, faltante = Math.max(0, E - x.A);
    const a = {emergencia:E, cubre:Math.min(E, x.A), faltante};
    if(faltante>0) a.prestamo = cuotaPrestamo(faltante, D_PRESTAMO(), 12); // v0.4: alternativa a la tarjeta
    if(faltante===0){
      a.queda = x.A - E;
      a.semaforo = x.G ? semaforo(a.queda/x.G) : null;
    } else if(!x.tieneTC){
      a.sinTarjeta = true; a.semaforo = 'rojo'; // v0.1.2: sin tarjeta, el faltante habría que conseguirlo prestado
    } else {
      const saldo = (x.S||0) + faltante;
      a.saldoTarjeta = saldo; a.tasa = x.tasa; a.tasaPropia = x.tasaPropia!=null;
      a.soloMinimo = simularMinimo({saldo, tasaAnual:x.tasa});
      if(x.I) {
        a.cuotaFija = Math.round(SUP.cuotaFijaPctIngreso*x.I);
        a.conCuotaFija = simularMinimo({saldo, tasaAnual:x.tasa, cuotaFija:a.cuotaFija});
      }
      // v0.4: comparación justa con el mismo monto (solo el faltante) y la misma cuota que el préstamo
      a.comparaFaltante = {minimo: simularMinimo({saldo:faltante, tasaAnual:x.tasa}),
                           mismaCuota: simularMinimo({saldo:faltante, tasaAnual:x.tasa, cuotaFija:a.prestamo.cuota})};
      a.semaforo = 'rojo';
    }
    out.A = a;
  }
  // Escenario B: un mes sin ingreso (dos variantes)
  if(x.A!=null && x.G!=null && x.C!=null){
    const nec = x.G + x.C;
    const variante = (ing) => {
      const deficit = nec - ing;
      const meses = deficit<=0 ? Infinity : x.A/deficit;
      // v0.1: "te faltan" usa el déficit del escenario; en "sin trabajo" equivale a 3 × (G + C) − A
      return {necesidad:nec, ingreso:ing, meses, semaforo: semaforo(meses),
              faltaVerde: deficit<=0 ? 0 : Math.max(0, 3*deficit - x.A)};
    };
    out.B = {sinTrabajo: variante(0)};
    if(!x.tieneIGSS){
      out.B.enfermedad = Object.assign(variante(0), {subsidioDiario:0, nota:'Sin afiliación al IGSS no hay subsidio por enfermedad.'});
    } else if(x.salario!=null){
      const sub = subsidioIGSS({salario:x.salario});
      out.B.enfermedad = Object.assign(variante(sub.primerMes), {subsidioDiario:sub.diario,
        nota:'Supone que cumplís los requisitos del IGSS para recibir el subsidio.'});
    }
  }
  return out;
}

// ==================== REGLAS (sección 5) ====================
// cond(r, D, x) → bool · calc(r, D, x) → {costoQ, ...} · texto(r, D, x, c) → {vimos, cuesta, dato100, paso}
// fuentes: claves de DATOS que se citan al pie.
const D = DATOS;
const REGLAS = [
  // ---------- DEUDA ----------
  {id:'D1', peldano:3, familia:'Deuda', fuentes:['tc_tasa_prom_mn','tc_mora_mn','tc_pago_min_pct'],
    cond:(r,D,x)=> x.tieneTC && (r.q_pago_tc==='minimo' || r.q_pago_tc==='menos'),
    calc:(r,D,x)=>{
      const saldo = x.S>0 ? x.S : 10000, ejemplo = !(x.S>0);
      const min = simularMinimo({saldo, tasaAnual:x.tasa});
      const cuota = Math.round(saldo*0.10);
      const fija = simularMinimo({saldo, tasaAnual:x.tasa, cuotaFija:cuota});
      return {saldo, ejemplo, min, cuota, fija, costoQ: min.intereses - fija.intereses};
    },
    texto:(r,D,x,c)=>({
      vimos:'Pagar el mínimo te mantiene al día, pero casi todo se va a intereses.',
      cuesta:`Con ${x.tasaPropia!=null?'tu tasa de '+fmtPct(x.tasa,1)+' al año':'la tasa promedio anual de las tarjetas, '+fmtPct(D.tc_tasa_prom_mn.v)+' (unos '+fmtPct(D.tc_tasa_prom_mn.v/12,1)+' al mes)'}, ${fmtQ(c.saldo)} pagados solo con el mínimo tardarían ${fmtMeses(c.min.meses)} y costarían unos ${fmtQ(c.min.totalPagado)}. Con ${fmtQ(c.cuota)} fijos al mes, serían ${fmtMeses(c.fija.meses)} y unos ${fmtQ(c.fija.totalPagado)}.`,
      dato100:`De cada 100 quetzales que se deben en tarjetas de crédito, ${Math.round(D.tc_mora_mn.v*100)} no se están pagando a tiempo.`,
      paso:'Tu emisor puede darte la simulación con tu tasa real; compararla con una cuota fija que puedas sostener ayuda a decidir.',
      ilustrativo:true, supuestos:'Sin compras nuevas, comisiones, seguros ni IVA sobre intereses.'})},

  {id:'D2', familia:'Deuda', fuentes:['tc_tasa_mensual_rango','enifh'],
    cond:(r,D,x)=> x.tieneTC && (x.tasaPropia==null || x.tasaPropia/12 >= SUP.tasaD2Mensual),
    calc:()=>({costoQ:0}),
    texto:(r,D,x)=>({
      vimos: x.tasaInusual ? 'La tasa que escribiste parece fuera de rango; revisá si es mensual o anual.' : x.tasaPropia==null ? 'No conocés la tasa de tu tarjeta.' : `Tu tarjeta cobra ${fmtPct(x.tasaPropia/12)} al mes (${fmtPct(x.tasaPropia,1)} al año).`,
      cuesta:`En la tabla oficial de tasas por emisor, las tasas mensuales en quetzales van desde cerca de ${fmtPct(D.tc_tasa_mensual_rango.v[0],1)} hasta ${fmtPct(D.tc_tasa_mensual_rango.v[1])}.`,
      dato100:`Solo ${Math.round(D.enifh.v.conoceTasas)} de cada 100 adultos saben distinguir los tipos de tasa de interés, por ejemplo la que se anuncia y la que se paga de verdad.`,
      paso:'Tu tasa aparece en tu estado de cuenta; la tabla de DIACO permite ver dónde se ubica.'})},

  {id:'D3', familia:'Deuda', fuentes:['tc_pago_min_pct','enifh'],
    cond:(r,D,x)=> x.tieneTC && (r.q_cuotas_tc==='si' || r.q_cuotas_tc==='nose'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'Tenés (o podrías tener) cuotas o extrafinanciamiento en tu tarjeta.',
      cuesta:'Esas cuotas se cobran aparte del pago mínimo: lo que pagás de verdad cada mes es la suma de ambos.',
      dato100:`Solo ${Math.round(D.enifh.v.conoceTasas)} de cada 100 adultos saben distinguir los tipos de tasa de interés, por ejemplo la que se anuncia y la que se paga de verdad.`,
      paso:'En tu próximo estado de cuenta, la suma del pago mínimo y las cuotas muestra tu pago real.'})},

  {id:'D4', peldano:3, familia:'Deuda', fuentes:['tc_convenio_atrasos','sib_historial_meses','enifh'],
    cond:(r,D)=> r.q_atrasos!=null && r.q_atrasos >= D.tc_convenio_atrasos.v,
    calc:()=>({costoQ:0}),
    texto:(r,D,x)=>({
      vimos:'Se te han atrasado dos o más pagos este año.',
      cuesta:`Si la deuda es con un banco o cooperativa, tu historial en la SIB muestra los últimos ${D.sib_historial_meses.v} meses: un atraso de hoy puede verse hasta ${D.sib_historial_meses.v/12} años.` + (x.tieneTC ? ' Para tarjetas, desde 2024 la ley prevé convenios de pago a partir de dos pagos atrasados.' : ''),
      dato100:`${Math.round(D.enifh.v.noSabeQueja)} de cada 100 adultos no saben dónde presentar una queja.`,
      paso: x.tieneTC ? 'Podés pedir el convenio por escrito a tu emisor y, si no responde, acudir a la SIB. Consultar tu historial en la SIB es gratis.'
                      : 'Hablar con quien te prestó antes del siguiente atraso suele abrir más opciones. Consultar tu historial en la SIB es gratis.'})},

  {id:'D5', familia:'Deuda', fuentes:['enifh'], // v0.1.2: crédito fuera del sistema financiero
    cond:(r)=> (r.q_informal||[]).some(v => v!=='ninguno'),
    calc:(r)=>({costoQ:0, prestamista:(r.q_informal||[]).includes('prestamista')}),
    texto:(r,D,x,c)=>({
      vimos:'Tenés préstamos fuera de bancos y cooperativas.',
      cuesta:'Estos préstamos no siempre dicen cuánto pagarás en total. Saber esa cifra en quetzales, y no solo la cuota, es lo que permite compararlos.' +
        (c.prestamista ? ' Si un prestamista te amenaza o te presiona, podés denunciarlo ante el Ministerio Público o la PNC.' : ''),
      dato100:`No es raro: ${Math.round(D.enifh.v.credNoFin)} de cada 100 adultos tienen algún crédito fuera del sistema financiero, más que los ${Math.round(D.enifh.v.credFin)} que tienen uno en un banco o cooperativa.`,
      paso:'Anotar cuánto debés, a quién y cuánto pagarás en total es un primer paso para ordenar estas deudas.'})},

  // ---------- COLCHÓN ----------
  {id:'C1', peldano:2, familia:'Colchón', fuentes:['findex_emergencia'],
    cond:(r,D,x)=> x.A!=null && x.G!=null && x.A < SUP.mesesArranque*x.G,
    calc:(r,D,x)=>({costoQ: x.G - x.A}),
    texto:(r,D,x,c)=>({
      vimos:'Hoy tu fondo de emergencia cubriría menos de un mes de gastos. No es raro.',
      cuesta:`Te faltan unos ${fmtQ(c.costoQ)} para cubrir un mes completo.`,
      dato100:`De cada 100 guatemaltecos, solo ${D.findex_emergencia.v.ahorros} usarían sus ahorros ante una emergencia; ${D.findex_emergencia.v.familia} recurrirían a familia o amigos.`,
      paso:'Una opción es apartar una cantidad fija el día de pago, antes de gastar, hasta juntar un mes.'})},

  {id:'C2', familia:'Colchón', fuentes:['igss_subsidio_frac','igss_subsidio_tope','igss_subsidio_max'],
    cond:(r,D,x)=> x.tieneIGSS && x.salario!=null && subsidioIGSS({salario:x.salario}).topado && r.q_seguro!=='si',
    calc:(r,D,x)=>{ const s = subsidioIGSS({salario:x.salario}); return {sub:s, costoQ: x.salario - s.mensual}; },
    texto:(r,D,x,c)=>({
      vimos:`Si el IGSS te suspende, recibirías como máximo ${fmtQ(D.igss_subsidio_tope.v)} al día desde el cuarto día, y nada el segundo y el tercero.`,
      cuesta:`Con tu salario de ${fmtQ(x.salario)}, eso es unos ${fmtQ(c.sub.mensual)} al mes: ${fmtQ(c.costoQ)} menos.`,
      dato100:`El subsidio dura como máximo ${D.igss_subsidio_max.v.semanasEnf} semanas por una misma enfermedad.`,
      paso:'Vale la pena ver cuántos meses de esa diferencia cubre tu fondo de emergencia.'})},

  {id:'C3', peldano:4, familia:'Colchón', fuentes:['gasto_bolsillo_salud','enifh'],
    cond:(r)=> r.q_seguro==='no',
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'No tenés seguro médico privado.',
      cuesta:`Más de la mitad de lo que se gasta en salud en Guatemala (${D.gasto_bolsillo_salud.v}%) sale del bolsillo de las familias.`,
      dato100:`${Math.round(D.enifh.v.seguro)} de cada 100 adultos tienen algún seguro.`,
      paso:'Una cotización de seguro médico te permite compararlo con lo que hoy cubriría tu fondo de emergencia.'})},

  {id:'C4', peldano:4, familia:'Colchón', fuentes:['informalidad'],
    cond:(r,D,x)=> r.q_unico===true && x.A!=null && x.G!=null && x.A < SUP.mesesFondoUnico*x.G,
    calc:(r,D,x)=>({costoQ: SUP.mesesFondoUnico*x.G - x.A}),
    texto:(r,D,x,c)=>({
      vimos:'Sos el único ingreso de tu casa y tu fondo de emergencia cubre menos de 6 meses.',
      cuesta:`Si tu trabajo se detuviera, el mercado al que volverías es mayoritariamente informal. Para 6 meses te faltan unos ${fmtQ(c.costoQ)}.`,
      dato100:`De cada 100 personas que trabajan en Guatemala, ${D.informalidad.v} lo hacen sin contrato formal ni IGSS.`,
      paso:'Una meta de 6 meses con un aporte mensual fijo es la referencia más usada.'})},

  {id:'C5', familia:'Colchón', fuentes:['enifh','pasiva_mn','isr_intereses'],
    cond:(r)=> r.q_donde==='casa' && r.q_cuenta!==false,
    calc:(r,D,x)=>({costoQ: x.A ? x.A*D.pasiva_mn.v*(1-D.isr_intereses.v) : 0}),
    texto:(r,D,x,c)=>({
      vimos:'La mayor parte de tu ahorro está en casa.',
      cuesta: c.costoQ>0 ? `No genera intereses y se expone a robo. A la tasa promedio de los depósitos (${fmtPct(D.pasiva_mn.v)} menos ISR) serían hasta unos ${fmtQ(c.costoQ)} al año; una cuenta de ahorro suele pagar menos.` : 'No genera intereses y se expone a robo.',
      dato100:`${Math.round(D.enifh.v.enCasa)} de cada 100 adultos guardan dinero en casa.`,
      paso:'Una cuenta de ahorro o un plazo fijo pequeño puede servir de fondo de emergencia.'})},

  {id:'C7', familia:'Colchón', fuentes:['enifh'], // v0.1.2: sin cuenta de ahorro
    cond:(r)=> r.q_cuenta===false,
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'No tenés una cuenta de ahorro.',
      cuesta:'El dinero en efectivo no genera intereses, se expone a robo y no deja registro de tu esfuerzo.',
      dato100:`${Math.round(D.enifh.v.cuentaAhorro)} de cada 100 adultos tienen una cuenta de ahorro; entre quienes no, la razón más común es que "no les alcanza" (${D.enifh.v.noAlcanza}%).`,
      paso:'Cualquier banco o cooperativa supervisada puede decirte qué pide para abrir una cuenta y si cobra algo por mantenerla.'})},

  {id:'C6', familia:'Colchón', fuentes:['findex_emergencia'],
    cond:(r,D,x)=> (r.q_corazonada==='si' || r.q_corazonada==='dificil') && x.A!=null && x.A < SUP.emergencia,
    calc:(r,D,x)=>({costoQ: SUP.emergencia - x.A}),
    texto:(r,D,x,c)=>({
      vimos: r.q_corazonada==='si' ? `Al inicio dijiste que podrías cubrir ${fmtQ(SUP.emergencia)} sin problema. Casi todos lo creemos.` : `Al inicio dijiste que podrías cubrir ${fmtQ(SUP.emergencia)} con dificultad.`,
      cuesta:`Con lo que tenés disponible hoy, te faltarían unos ${fmtQ(c.costoQ)}.`,
      dato100:`${D.findex_emergencia.v.pueden} de cada 100 dicen que podrían reunir fondos de emergencia; ${D.findex_emergencia.v.dificil} lo harían con mucha dificultad y solo ${D.findex_emergencia.v.ahorros} con ahorros propios.`,
      paso:'La prueba del tropiezo muestra qué pasaría con tus números.'})},

  // ---------- HORIZONTE ----------
  {id:'H1', peldano:6, familia:'Horizonte', fuentes:['bono_min','bono_cupon','bono_vencimiento','bono_cupo_pi','pasiva_mn','isr_intereses'],
    cond:(r,D,x)=> x.peldano>=6 && x.A!=null && x.A - x.colchonReq >= D.bono_min.v,
    calc:(r,D,x)=>{
      const monto = Math.floor((x.A - x.colchonReq)/1000)*1000;
      const dep = D.pasiva_mn.v*(1-D.isr_intereses.v), b = D.bono_cupon.v.a1;
      const alto = monto*(b - dep), bajo = monto*(b*(1-D.isr_intereses.v) - dep);
      return {monto, alto, bajo, costoQ: alto};
    },
    texto:(r,D,x,c)=>({
      vimos:`Tenés unos ${fmtQ(c.monto)} por encima de tu fondo de emergencia.`,
      cuesta:`Los Bonos del Tesoro para pequeños inversionistas empiezan en ${fmtQ(D.bono_min.v)}; el de menor plazo paga ${fmtPct(D.bono_cupon.v.a1)} anual y vence el ${D.bono_vencimiento.v.a1}. Un depósito promedio paga ${fmtPct(D.pasiva_mn.v)}, menos ${fmtPct(D.isr_intereses.v,0)} de ISR. En ${fmtQ(c.monto)}, la diferencia a tasa anual sería de unos ${fmtQ(c.bajo)} a ${fmtQ(c.alto)}, según el tratamiento fiscal del bono.`,
      dato100:`De cada 100 quetzales autorizados para pequeños inversionistas este año, ${Math.round(D.bono_cupo_pi.v.libre/D.bono_cupo_pi.v.total*100)} siguen sin colocarse.`,
      paso:'Un agente de bolsa autorizado puede explicarte el proceso; el tratamiento fiscal conviene confirmarlo con un contador.',
      ilustrativo:true})},

  {id:'H2', peldano:5, familia:'Horizonte', fuentes:['ivs_requisitos','ivs_min_max','ivs_formula','informalidad'],
    cond:(r,D,x)=> num(r.q_edad)!=null && r.q_edad>=18 && r.q_edad<=50 && x.tieneRetiro===false, // v0.1.2: rango ampliado; v0.2: retiro en monto
    calc:(r,D,x)=>{ if(x.salario==null) return {costoQ:0};
      const p = pensionIVS(x.salario); return {pension:p, pct:p/x.salario, costoQ: x.salario - p}; },
    texto:(r,D,x,c)=>({
      vimos: x.tieneIGSS ? 'Hoy tu retiro depende solo del IGSS.' : 'Hoy no cotizás al IGSS ni ahorrás para tu retiro.',
      cuesta:(x.tieneIGSS ? '' : 'Sin cotizar no se acumulan cuotas para la pensión de vejez del IGSS. ') + `La pensión del IGSS pide ${D.ivs_requisitos.v.edad} años y ${D.ivs_requisitos.v.cuotas} cuotas, y va de ${fmtQ(D.ivs_min_max.v.min)} a ${fmtQ(D.ivs_min_max.v.max)}.` +
        (c.pension ? ` Con tu salario de ${fmtQ(x.salario)} y ${D.ivs_requisitos.v.cuotas} cuotas, rondaría ${fmtQ(c.pension)}: el ${Math.round(c.pct*100)}% de tu ingreso actual.` : ''),
      dato100:`De cada 100 personas que trabajan en Guatemala, ${D.informalidad.v} lo hacen sin contrato formal ni IGSS.`,
      paso: x.tieneIGSS ? 'Un primer paso es definir cuánto quisieras recibir al retirarte y cuánto faltaría sobre la pensión del IGSS.' : 'Un primer paso es apartar una cantidad pequeña y fija solo para tu retiro, aunque sea poca.',
      ilustrativo:true})},

  {id:'H3', familia:'Horizonte', fuentes:['ivs_requisitos'],
    cond:(r,D,x)=> x.tieneIGSS && (r.q_huecos==='si' || r.q_huecos==='nose'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'Has tenido (o podrías tener) meses sin cotizar al IGSS.',
      cuesta:`Cada mes sin cotizar retrasa tu pensión: se necesitan ${D.ivs_requisitos.v.cuotas} cuotas.`,
      dato100:`Requisito: ${D.ivs_requisitos.v.cuotas} cuotas y ${D.ivs_requisitos.v.edad} años.`,
      paso:'El IGSS puede informarte cuántas cuotas llevás acumuladas.'})},

  {id:'H4', familia:'Horizonte', fuentes:['planilla_iva_tope','isr_tarifa','isr_deducciones_2026','igss_cuota_laboral'],
    cond:(r,D,x)=> x.tieneIGSS && r.q_planilla!=null && r.q_planilla!=='si' && x.salario!=null && rentaImponible(x.salario) > 0,
    calc:(r,D,x)=>({costoQ: Math.min(D.planilla_iva_tope.v, rentaImponible(x.salario))*D.isr_tarifa.v.tasa}),
    texto:(r,D,x,c)=>({
      vimos: r.q_planilla==='quees' ? 'No conocés la planilla del IVA.' : 'No presentás la planilla del IVA.',
      cuesta:`Podrías estar dejando hasta ${fmtQ(c.costoQ)} al año sobre la mesa. La planilla permite deducir hasta ${fmtQ(D.planilla_iva_tope.v)} y se presenta en los primeros 10 días hábiles de enero en la Agencia Virtual de la SAT.`,
      dato100:'No hay cifra pública de cuántos asalariados la presentan.',
      paso:'Pedir factura con tu NIT en los gastos diarios y guardarlas para enero es lo que permite usarla.'})},

  // ---------- PROMESAS ----------
  {id:'P1', familia:'Promesas', fuentes:['bono_cupon','piramides_afectados'],
    cond:(r)=> (r.q_ofertas||[]).includes('rend2'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>{ const anual = Math.pow(1+SUP.rendSospechoso,12)-1; return {
      vimos:'Te ofrecieron (o participás en) una inversión que promete más de 2% al mes.',
      cuesta:`Un 2% al mes ya es ${fmtPct(anual,0)} al año, más de ${Math.floor(anual/D.bono_cupon.v.a1)} veces lo que paga un Bono del Tesoro.`,
      dato100:`Más de ${D.piramides_afectados.v.toLocaleString('en-US')} guatemaltecos fueron afectados por cinco plataformas piramidales.`,
      paso:'Antes de invertir, la SIB permite verificar si la entidad está autorizada para captar dinero.'}; }},

  {id:'P2', familia:'Promesas', fuentes:['day_trading_pierde'],
    cond:(r)=> (r.q_ofertas||[]).includes('trading'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'Te interesa o pagaste por un curso o señales de trading.',
      cuesta:'Un estudio con datos de todos los day traders de futuros en Brasil (2013-2015) encontró que solo 1 de cada 100 ganó más que el salario mínimo.',
      dato100:`De cada 100 personas que hicieron day trading más de 300 días, ${D.day_trading_pierde.v} perdieron dinero.`,
      paso:'Antes de pagar otro curso, vale la pena pedir resultados verificables de sus alumnos.'})},

  {id:'P3', familia:'Promesas', fuentes:['mlm_ftc','mlm_ftc_17'],
    cond:(r)=> (r.q_ofertas||[]).includes('mlm'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'Participás en un multinivel o lo estás considerando.',
      cuesta:`La FTC de EE.UU. revisó los ingresos que declaran las propias empresas: la mayoría de participantes recibió US$${D.mlm_ftc.v.toLocaleString('en-US')} o menos al año (menos de US$84 al mes).`,
      dato100:`En al menos ${D.mlm_ftc_17.v} de las empresas revisadas, la mayoría de participantes no ganó nada.`,
      paso:'Antes de comprar inventario, conviene calcular cuánto habría que vender solo para recuperarlo.'})},

  {id:'P4', familia:'Promesas', fuentes:['piramides_afectados'],
    cond:(r)=> (r.q_ofertas||[]).includes('membresia'),
    calc:()=>({costoQ:0}),
    texto:(r,D)=>({
      vimos:'Te piden pagar una membresía para ganar por tareas simples.',
      cuesta:'Pagar para poder ganar es la señal más clara de una pirámide.',
      dato100:`Así operaban las plataformas que afectaron a más de ${D.piramides_afectados.v.toLocaleString('en-US')} guatemaltecos.`,
      paso:'Lo más seguro es no pagar. Si ya pagaste, guardá los comprobantes; podés denunciar ante el Ministerio Público.'})}
];

function rentaImponible(salarioMensual){ // estimación 2026: salario × 12 − Q48,000 − IGSS − Q3,024 (aguinaldo y Bono 14 exentos)
  const anual = salarioMensual*12, d = DATOS.isr_deducciones_2026.v;
  return anual - d.fija - anual*DATOS.igss_cuota_laboral.v - d.extra;
}

function pie(fuentes){
  const vistas = new Set(), partes = [];
  fuentes.forEach(k => { const d = DATOS[k]; const t = d.fuente + ' (' + d.etiqueta + ')';
    if(!vistas.has(t)){ vistas.add(t); partes.push(t); } });
  return 'Datos: ' + partes.join('; ') + '. Verificalo con tu banco o un contador.';
}

// Máximo 6, al menos uno por familia disparada (sección 5). Orden: familia → la regla del peldaño actual
// → costo en quetzales. v0.1: el peldaño actual va primero para que el primer hallazgo sea el siguiente paso.
function seleccionar(lista, max, peldano){
  const delPeldano = h => h.peldano===peldano ? 0 : 1;
  const orden = (a,b) => FAMILIAS.indexOf(a.familia)-FAMILIAS.indexOf(b.familia) || delPeldano(a)-delPeldano(b)
    || b.costoQ-a.costoQ || a.orden-b.orden;
  const todos = lista.slice().sort(orden), elegidos = [];
  FAMILIAS.forEach(f => { const h = todos.find(t => t.familia===f); if(h && elegidos.length<max) elegidos.push(h); });
  todos.forEach(t => { if(elegidos.length<max && !elegidos.includes(t)) elegidos.push(t); });
  return elegidos.sort(orden);
}

function avisosDatos(hoy){
  const out = [];
  Object.keys(DATOS).forEach(k => { const d = DATOS[k];
    if(d.frec==='mensual' && (hoy - new Date(d.fecha))/864e5 > SUP.diasVence) out.push({tipo:'dato_vencido', clave:k}); });
  return out;
}

// ==================== ENTRADA PRINCIPAL ====================
// r: respuestas con claves q_* (sección 3). Montos en quetzales o null ("No sé").
// op: {hoy?: Date, max?: número}
function evaluarFoto(r, op){
  op = op || {};
  const x = contexto(r);
  const peldano = ubicarPeldano(r, x);
  x.peldano = peldano.n;
  const tropiezo = pruebaTropiezo(r, x);
  const disparados = [];
  REGLAS.forEach((R, idx) => {
    if(!R.cond(r, DATOS, x)) return;
    const c = R.calc(r, DATOS, x);
    const t = R.texto(r, DATOS, x, c);
    disparados.push({id:R.id, familia:R.familia, familiaNombre:FAMILIA_NOMBRE[R.familia], familiaExplica:FAMILIA_EXPLICA[R.familia], peldano:R.peldano||null, orden:idx, costoQ: Math.max(0, Math.round(c.costoQ||0)),
      vimos:t.vimos, cuesta:t.cuesta, dato100:t.dato100, paso:t.paso,
      ilustrativo:!!t.ilustrativo, supuestos:t.supuestos||null, notaIlustrativo: t.ilustrativo ? AVISOS.ilustrativo : null,
      fuentes:R.fuentes, pie:pie(R.fuentes),
      porVerificar: R.fuentes.some(k => DATOS[k].conf==='prensa')});
  });
  const hallazgos = seleccionar(disparados, op.max||SUP.maxHallazgos, peldano.n);
  const vistos = new Set(); // v0.3: un mismo dato no se repite en dos tarjetas
  hallazgos.forEach(h => { if(vistos.has(h.dato100)) h.dato100 = null; else vistos.add(h.dato100); });
  const escalera = explicarPeldanos(r, x, peldano.n);
  const aqui = escalera.find(e => e.estado==='aqui');
  return {peldano: peldano.n, nombre: peldano.nombre, porConfirmar: peldano.porConfirmar, escalera, niveles: compararNiveles(r, x),
          siguientePaso: aqui && aqui.paso ? aqui.paso : null,
          resumen: {ingreso:x.I, gastos:x.G, deudas:x.C, queda:(x.I!=null&&x.G!=null&&x.C!=null) ? x.I-x.G-x.C : null,
                    ahorro:x.A, mesesAhorro:(x.A!=null && x.G) ? x.A/x.G : null, retiro:x.retiroMonto},
          tropiezo, hallazgos, disparados: disparados.map(h=>h.id),
          avisos: avisosDatos(op.hoy || new Date()).concat(x.tasaInusual ? [{tipo:'tasa_inusual', clave:'q_tasa_tc'}] : []),
          aviso: AVISOS.corto};
}

// ==================== PLAN DE FONDO DE EMERGENCIA (v0.6) ====================
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function etiquetaMes(anio, mes){ return MESES_CORTO[mes] + ' ' + anio; } // mes 0-11
function sumarMeses(d, n){ const t = d.anio*12 + d.mes + n; return {anio: Math.floor(t/12), mes: t%12}; }
function nivelFondo(meses){ return meses<1 ? 'riesgo' : meses<3 ? 'minimo' : meses<6 ? 'bien' : 'ideal'; }

// o: {gastos, ahorro, aporte, bono14, aguinaldo (montos destinados al fondo), desde:{anio, mes}, maxMeses}
// Aportes al final de cada mes, empezando el mes actual. Sin intereses: es el escenario prudente.
function planFondo(o){
  const G = o.gastos, maxM = o.maxMeses || 120, desde = o.desde;
  const metas = [1,3,6].map(k => ({meses:k, monto:k*G, alcanzado: o.ahorro >= k*G, en:null, fecha:null}));
  const serie = [{n:0, ...desde, etiqueta: etiquetaMes(desde.anio, desde.mes), saldo:o.ahorro}];
  let saldo = o.ahorro;
  for(let n=1; n<=maxM && metas.some(m => !m.alcanzado && m.en==null); n++){
    const f = sumarMeses(desde, n-1);
    saldo += (o.aporte||0);
    if(o.bono14 && f.mes===DATOS.bono14.v.mes-1) saldo += o.bono14;
    if(o.aguinaldo && f.mes===DATOS.aguinaldo.v.mes-1) saldo += o.aguinaldo;
    serie.push({n, ...f, etiqueta: etiquetaMes(f.anio, f.mes), saldo});
    metas.forEach(m => { if(!m.alcanzado && m.en==null && saldo >= m.monto){ m.en = n; m.fecha = etiquetaMes(f.anio, f.mes); } });
  }
  const mesesHoy = G ? o.ahorro/G : 0;
  const siguiente = metas.find(m => !m.alcanzado) || null;
  return {metas, serie, mesesHoy, nivel: nivelFondo(mesesHoy), siguiente,
          sinAvance: !(o.aporte>0) && !(o.bono14>0) && !(o.aguinaldo>0)};
}
function aporteNecesario(gastos, ahorro, mesesMeta, plazo){ return Math.max(0, (mesesMeta*gastos - ahorro)/plazo); }
function valorReal(monto, anios, inflacion){ return monto/Math.pow(1 + (inflacion==null ? DATOS.inflacion_interanual.v : inflacion), anios); }

// ==================== PLAN DE DEUDAS (v0.8) ====================
// d: {nombre, saldo, tasaAnual (fracción), tipo:'tarjeta'|'cuota', cuota}
// estrategia: 'minimos' (solo lo mínimo, lo liberado no se reutiliza) | 'avalancha' (extra a la tasa más alta) | 'bola' (extra a la más pequeña)
function planDeudas(deudas, presupuesto, estrategia, maxMeses){
  maxM = maxMeses || 600;
  const ds = deudas.filter(d => d.saldo>0).map((d,k) => ({...d, k, s:d.saldo, fin:null}));
  const minimo = (d) => { const i = d.tasaAnual/12, int = d.s*i;
    const m = d.tipo==='tarjeta' ? Math.max(DATOS.tc_pago_min_pct.v*d.s + int, DATOS.tc_pago_min_piso.v) : (d.cuota||0);
    return Math.min(m, d.s + int); };
  const minInicial = ds.reduce((t,d) => t + minimo(d), 0);
  const serie = [ds.reduce((t,d)=>t+d.s,0)]; let intereses = 0, pagado = 0, n = 0;
  const insuficiente = estrategia!=='minimos' && presupuesto < minInicial - 0.5;
  while(ds.some(d => d.s>0.01) && n < maxM){
    n++;
    const mins = ds.map(d => d.s>0.01 ? minimo(d) : 0);
    let extra = estrategia==='minimos' || insuficiente ? 0 : Math.max(0, presupuesto - mins.reduce((a,b)=>a+b,0));
    ds.forEach((d,k) => { if(d.s<=0.01) return; const int = d.s*d.tasaAnual/12; intereses += int; d.s += int - mins[k]; pagado += mins[k]; });
    const orden = ds.filter(d => d.s>0.01).sort(estrategia==='avalancha' ? (a,b) => b.tasaAnual-a.tasaAnual || a.s-b.s : (a,b) => a.s-b.s || b.tasaAnual-a.tasaAnual);
    for(const d of orden){ if(extra<=0) break; const p = Math.min(extra, d.s); d.s -= p; extra -= p; pagado += p; }
    ds.forEach(d => { if(d.s<=0.01 && d.fin==null){ d.s = 0; d.fin = n; } });
    serie.push(ds.reduce((t,d)=>t+Math.max(0,d.s),0));
  }
  const nunca = ds.some(d => d.s>0.01);
  return {meses: nunca ? Infinity : n, intereses, pagado, serie, nunca, insuficiente, minInicial,
          orden: ds.filter(d => d.fin!=null).sort((a,b)=>a.fin-b.fin).map(d => ({nombre:d.nombre, mes:d.fin}))};
}
var maxM;

// ==================== PROTECCIÓN (v0.8) ====================
// Cuánto aguanta el hogar si la persona se enferma y no puede trabajar, mes por mes.
function coberturaEnfermedad(o){ // {salario, igss, gastos, cuotas, ahorro, meses}
  const meses = o.meses || 6, nec = (o.gastos||0) + (o.cuotas||0);
  const sub = o.igss && o.salario ? subsidioIGSS({salario:o.salario}) : null;
  const tope = DATOS.igss_subsidio_max.v.semanasEnf*7; // días de subsidio por una misma enfermedad
  let ahorro = o.ahorro||0, aguanta = null; const filas = [];
  for(let k=1; k<=meses; k++){
    let ingreso = 0;
    if(sub){ const d0 = (k-1)*30, diasSub = Math.max(0, Math.min(k*30, tope+3) - Math.max(d0, 3)); ingreso = (k===1 ? o.salario/30 : 0) + diasSub*sub.diario; }
    const falta = Math.max(0, nec - ingreso); ahorro -= falta;
    if(ahorro < 0 && aguanta==null) aguanta = k-1 + (ahorro+falta)/Math.max(falta,1);
    filas.push({mes:k, ingreso, necesidad:nec, falta, ahorroQueda: Math.max(0, ahorro)});
  }
  return {filas, subsidio: sub, aguantaMeses: aguanta==null ? meses : Math.max(0, aguanta), cubreTodo: aguanta==null};
}

// ==================== METAS (v0.8) ====================
function tasaReal(nominal, inflacion){ return (1+nominal)/(1+(inflacion==null ? DATOS.inflacion_interanual.v : inflacion)) - 1; }
function rendimientoConservadorReal(){ return tasaReal(DATOS.pasiva_mn.v*(1-DATOS.isr_intereses.v)); } // plazo fijo promedio, después de ISR e inflación
// Aporte mensual para llegar a "meta" (en quetzales de hoy) en "anios", con lo que ya se tiene y un rendimiento real anual.
function aporteMeta(o){
  const n = Math.max(1, Math.round(o.anios*12)), r = Math.pow(1 + (o.tasaReal||0), 1/12) - 1;
  const crece = Math.pow(1+r, n), falta = Math.max(0, o.meta - (o.tengo||0)*crece);
  return r===0 ? falta/n : falta*r/(crece-1);
}
// Capital para completar un ingreso mensual en el retiro (quetzales de hoy, sin rendimiento durante el retiro: escenario prudente)
function capitalRetiro(o){ return Math.max(0, (o.ingresoDeseado||0) - (o.pension||0)) * 12 * (o.aniosRetiro||20); }

// ==================== INVERSIÓN CONSERVADORA (v0.8) ====================
// Ganancia de un monto por un plazo (años), antes y después de ISR e inflación.
function rendimientoOpcion(o){ // {monto, anios, tasa, isr}
  const bruto = o.monto*o.tasa*o.anios, neto = bruto*(1-(o.isr||0));
  const real = o.monto*(Math.pow(1 + o.tasa*(1-(o.isr||0)), o.anios) / Math.pow(1+DATOS.inflacion_interanual.v, o.anios) - 1);
  return {bruto, neto, real};
}
function mensualAnual(pctMensual){ return Math.pow(1+pctMensual, 12) - 1; }

// ==================== VIVIENDA (v1.0) ====================
function cuotaHipoteca(prestamo, tasaAnual, anios){ return prestamo>0 ? cuotaPrestamo(prestamo, tasaAnual, Math.round(anios*12)).cuota : 0; }
function saldoHipoteca(prestamo, tasaAnual, anios, mesesPagados){
  const i = tasaAnual/12, n = Math.round(anios*12), c = cuotaHipoteca(prestamo, tasaAnual, anios), k = Math.min(mesesPagados, n);
  return Math.max(0, prestamo*Math.pow(1+i,k) - c*(Math.pow(1+i,k)-1)/i);
}
// Precio máximo: la cuota de la vivienda más tus otras deudas y el mantenimiento no pasan de maxPct del ingreso
function precioMaximo(o){ // {ingreso, otrasCuotas, mant, enganche, tasa, anios, maxPct}
  const pct = o.maxPct || SUP.cuotaMaxPct, n = Math.round(o.anios*12), i = o.tasa/12;
  const cuota = Math.max(0, pct*o.ingreso - (o.otrasCuotas||0) - (o.mant||0));
  const prestamo = cuota>0 ? cuota*(1-Math.pow(1+i,-n))/i : 0;
  return {cuota, prestamo, precio: prestamo + (o.enganche||0)};
}
// Gastos para comprar: impuesto (IVA en primera venta, normalmente incluido en el precio; timbres en reventa), notario y registro
function costosCompra(precio, nuevo){
  const na = DATOS.notario_arancel.v, rg = DATOS.rgp_inscripcion.v;
  const impuesto = nuevo ? 0 : precio*DATOS.timbres_reventa.v;
  const ivaIncluido = nuevo ? precio*DATOS.iva_primera_venta.v/(1+DATOS.iva_primera_venta.v) : 0;
  const notario = precio > na.desde ? na.base + precio*(precio>na.hasta ? na.pct2 : na.pct) : null; // fórmula del arancel sin pacto, sobre el valor
  const registro = rg.min + Math.max(0, Math.ceil((precio - rg.desde)/1000))*rg.porMil;
  return {impuesto, ivaIncluido, notario, registro, total: impuesto + (notario||0) + registro, notarioSinDato: notario==null};
}
function iusiAnual(valor, uso, fecha){ // uso: 'vivienda' | 'otro'
  const ref = fecha || new Date(), ref2 = new Date(DATOS.iusi_reforma.v.desde+'T00:00:00');
  const tramo = esc => { for(const [hasta, t] of esc) if(valor <= hasta) return t; return 0; };
  if(ref >= ref2) return uso==='vivienda' ? 0 : valor*tramo(DATOS.iusi_reforma.v.otros);
  return valor*tramo(DATOS.iusi_escala.v);
}
// Comprar o alquilar: patrimonio de cada camino, mes a mes. Quien paga menos cada mes invierte la diferencia a una tasa conservadora.
function comprarVsAlquilar(o){ // {precio, enganche, costos, tasa, anios, mant, alquiler, aprec, horizonte, rendimiento}
  const H = Math.round((o.horizonte||10)*12), prestamo = Math.max(0, o.precio - o.enganche), c = cuotaHipoteca(prestamo, o.tasa, o.anios);
  const rm = Math.pow(1 + (o.rendimiento!=null ? o.rendimiento : DATOS.pasiva_mn.v*(1-DATOS.isr_intereses.v)), 1/12) - 1;
  const inf = DATOS.inflacion_interanual.v;
  let invA = o.enganche + (o.costos||0), invC = 0, alq = o.alquiler; const serie = [];
  for(let k=1; k<=H; k++){
    if(k>1 && (k-1)%12===0) alq *= 1+inf;
    const pagoC = (k <= o.anios*12 ? c : 0) + (o.mant||0), dif = pagoC - alq;
    invA = invA*(1+rm) + Math.max(0, dif); invC = invC*(1+rm) + Math.max(0, -dif);
    if(k%12===0 || k===H){
      const valor = o.precio*Math.pow(1+(o.aprec||0), k/12);
      serie.push({anio:k/12, comprar: valor - saldoHipoteca(prestamo, o.tasa, o.anios, k) + invC, alquilar: invA, valor});
    }
  }
  const fin = serie[serie.length-1];
  return {cuota:c, serie, comprar:fin.comprar, alquilar:fin.alquilar, diferencia: fin.comprar - fin.alquilar};
}
// Comprar para rentar: lo que queda al año y cuánto rinde sobre lo invertido
function rentaInversion(o){ // {precio, costos, alquiler, mesesVacios, mant, iusi}
  const r = DATOS.isr_rentas_inmueble.v, bruto = o.alquiler*(12 - (o.mesesVacios||0));
  const isr = bruto*(1-r.deduccion)*r.tasa, gastos = (o.mant||0)*12 + (o.iusi||0);
  const neto = bruto - isr - gastos, invertido = o.precio + (o.costos||0);
  return {bruto, isr, gastos, neto, invertido, rendimiento: invertido>0 ? neto/invertido : 0};
}

// ==================== FINANCIAMIENTO DIRECTO DE LA LOTIFICADORA (v1.1) ====================
// Tasa anual que esconde una cuota fija: la que iguala lo que se financia con las cuotas (búsqueda por bisección).
function tasaImplicita(financiado, cuota, meses){
  if(!(financiado>0) || !(cuota>0) || !(meses>0)) return null;
  if(cuota*meses <= financiado) return 0;
  const vp = i => cuota*(1-Math.pow(1+i,-meses))/i;
  let lo = 1e-7, hi = 0.2;
  for(let k=0; k<200; k++){ const m = (lo+hi)/2; if(vp(m) > financiado) lo = m; else hi = m; }
  return Math.pow(1+(lo+hi)/2, 12) - 1;
}
// Plan de pagos directo: total, tasa, en qué mes ya pagaste el precio de contado y lo pagado a cada año
function planLote(o){ // {contado, enganche, cuota, anios}
  const n = Math.round(o.anios*12), fin = Math.max(0, (o.contado||0) - (o.enganche||0));
  const total = (o.enganche||0) + o.cuota*n, tasa = o.contado ? tasaImplicita(fin, o.cuota, n) : null;
  const mesContado = o.contado ? Math.max(0, Math.ceil(((o.contado||0) - (o.enganche||0))/o.cuota)) : null;
  const pagadoAl = a => (o.enganche||0) + o.cuota*Math.min(n, Math.round(a*12));
  // Ahorrar la cuota en vez de pagarla: en cuántos meses junto el precio de contado (plazo fijo promedio, después de ISR)
  const r = Math.pow(1 + DATOS.pasiva_mn.v*(1-DATOS.isr_intereses.v), 1/12) - 1;
  let saldo = o.enganche||0, mesAhorro = null;
  for(let k=1; k<=n && o.contado; k++){ saldo = saldo*(1+r) + o.cuota; if(saldo >= o.contado){ mesAhorro = k; break; } }
  return {meses:n, total, extra: o.contado ? total - o.contado : null, tasa, mesContado, mesAhorro, pagadoAl};
}

// ==================== LAB 3 PRO · DESARROLLO INMOBILIARIO (v1.3) ====================
// Flujo mensual de un desarrollo: terreno, trámites, obra, preventa, entrega, IVA, ISR y crédito de construcción.
// Todo en quetzales con IVA incluido en los precios; los costos facturables generan crédito fiscal.
function tirMensual(f){
  const vpn = r => f.reduce((t, x, k) => t + x/Math.pow(1+r, k), 0);
  // busca el cambio de signo más cercano a 0 en una malla, luego bisección
  const malla = []; for(let r=-0.5; r<=1.0001; r+=0.0025) malla.push(r);
  let mejor = null;
  for(let i=1; i<malla.length; i++){ const a = vpn(malla[i-1]), b = vpn(malla[i]); if(a===0) return malla[i-1]; if(Math.sign(a)!==Math.sign(b)){ const c = [malla[i-1], malla[i]]; if(!mejor || Math.abs(c[0]) < Math.abs(mejor[0])) mejor = c; } }
  if(!mejor) return null;
  let lo = mejor[0], hi = mejor[1]; const sLo = Math.sign(vpn(lo));
  for(let k=0; k<200; k++){ const m = (lo+hi)/2; if(Math.sign(vpn(m)) === sLo) lo = m; else hi = m; }
  return (lo+hi)/2;
}
function anual(r){ return r==null ? null : Math.pow(1+r, 12) - 1; }
function vanAnual(f, tasaAnual){ const r = Math.pow(1+tasaAnual, 1/12) - 1; return f.reduce((t, x, k) => t + x/Math.pow(1+r, k), 0); }
function desarrollo(o){
  const IVA = DATOS.iva_primera_venta.v, fIVA = IVA/(1+IVA);
  const n = Math.max(1, Math.round(o.unidades)), m2v = n*o.m2Unidad, m2c = m2v/(o.eficiencia||0.8);
  const m2Sot = o.sotano ? (o.plazas||0)*(o.m2Plaza||30) : 0;
  const T0 = Math.max(0, Math.round(o.mesesTramites)), O = Math.max(1, Math.round(o.mesesObra));
  const sp = Math.max(0, T0 - (o.preventaAntes==null ? 4 : o.preventaAntes));
  const precio = o.precioUnidad;
  // Con crédito, el banco desembolsa hasta llegar a la preventa mínima: si la preventa va lenta, la obra espera
  const permuta0 = o.pagoTerreno==='permuta' ? Math.min(Math.max(1, Math.round(o.unidades))-1, Math.ceil(o.terreno/Math.max(1, o.precioUnidad))) : 0;
  const nV0 = Math.max(1, Math.round(o.unidades)) - permuta0, meta = Math.ceil((o.preventaMin||0)*nV0 - 1e-9);
  let tp = sp; if((o.ltc||0) > 0 && o.esperarPreventa !== false && meta > 0){ let ac = 0; for(let t=sp; t<sp+600; t++){ ac += o.absorcion; if(Math.floor(ac + 1e-9) >= meta){ tp = t + 1; break; } } }
  const T = (o.ltc||0) > 0 && o.esperarPreventa !== false ? Math.max(T0, Math.min(tp, T0 + 36)) : T0, E = T + O;
  // --- costos (con IVA donde se factura) ---
  const obraSup = m2c*o.cm2, obraSotano = m2Sot*(o.cSot||0), obraBase = obraSup + obraSotano;
  const obra = obraSup*(1 + (o.instalaciones||0)) + obraBase*(o.imprevistos||0) + obraSotano;
  const diseno = obraBase*(o.diseno||0), admin = obraBase*(o.admin||0);
  const urban = (o.m2Terreno||0)*(o.urbanM2||0);
  const lic = o.social ? 0 : m2c*DATOS.licencia_muni.v.valorM2*DATOS.licencia_muni.v.tasa;
  const mi = DATOS.marn_instrumento.v[o.marn || (n>60 ? 'B1' : 'B2')], marn = mi.consultor + mi.arancel;
  const permuta = o.pagoTerreno==='permuta' ? Math.min(n-1, Math.ceil(o.terreno/Math.max(1, o.precioUnidad))) : 0, nVenta = n - permuta;
  const N = E + Math.ceil(nVenta/Math.max(0.1, o.absorcion)) + 6, H = Math.min(240, Math.max(N, E+2));
  const z = () => Array(H+1).fill(0);
  const costo = z(), facturable = z(), ingreso = z(), vendidas = z(), comis = z();
  if(o.pagoTerreno==='diferido'){ costo[0] += o.terreno/2; costo[T] += o.terreno/2; } else if(!permuta) costo[0] += o.terreno;
  for(let k=0; k<Math.max(1,T0); k++){ costo[k] += diseno/Math.max(1,T0); facturable[k] += diseno/Math.max(1,T0); }
  costo[Math.max(0,T0-1)] += lic + marn; facturable[Math.max(0,T0-1)] += mi.consultor;
  const w = Array.from({length:O}, (_,k) => Math.sin(Math.PI*(k+0.5)/O)), sw = w.reduce((a,b)=>a+b,0);
  for(let k=0; k<O; k++){ const c = obra*w[k]/sw + admin/O; costo[T+k] += c; facturable[T+k] += c; }
  for(let k=Math.max(0,O-3); k<O; k++){ costo[T+k] += urban/Math.min(3,O); facturable[T+k] += urban/Math.min(3,O); }
  // --- ventas: absorción mensual desde el inicio de la preventa; el precio sube por etapas hasta el de entrega ---
  let quedan = nVenta, ventasTot = 0, acum = 0;
  for(let t=sp; t<=H && quedan>0; t++){
    acum += o.absorcion; let u = Math.min(quedan, Math.floor(acum + 1e-9) - (nVenta - quedan)); if(u<=0) continue;
    quedan -= u; vendidas[t] = u;
    // lista de precios por etapas: el descuento se va cerrando a medida que se vende, no con el calendario
    const yaVendidas = nVenta - quedan - u, pf = precio*(1 - (o.descuentoPreventa||0)*Math.max(0, 1 - (yaVendidas + u/2)/nVenta));
    const v = u*pf; ventasTot += v; comis[t] += v*(o.comision||0); costo[t] += v*(o.comision||0); facturable[t] += v*(o.comision||0);
    if(t >= E) ingreso[t] += v;
    else { const eng = v*(o.enganche||0), m = E - t; for(let k=t; k<E; k++) ingreso[k] += eng/m; ingreso[E] += v - eng; }
  }
  // --- unidades terminadas sin vender: cuota de mantenimiento, seguro e impuestos mientras esperan comprador ---
  let vendidasAcum = 0, inventario = 0;
  for(let t=0; t<=H; t++){ vendidasAcum += vendidas[t]; if(t >= E){ const c = (nVenta - vendidasAcum)*precio*(o.costoInventario||0); if(c>0){ costo[t] += c; inventario += c; } } }
  // --- impuestos y crédito, mes a mes ---
  const op = DATOS.isr_opcional.v, tasaM = (o.tasaCredito||0)/12;
  const limite = (o.ltc||0)*(obra + diseno + admin + urban + lic + marn);
  let deb = 0, cred = 0, ivaPag = 0, saldo = 0, intereses = 0, isrPag = 0, vendAcum = 0, capital = 0, capMax = 0;
  const flujoCap = z(), flujoProy = z(), caja = z(), credSaldo = z(), iva = z(), isr = z();
  for(let t=0; t<=H; t++){
    deb += ingreso[t]*fIVA; cred += facturable[t]*fIVA;
    iva[t] = Math.max(0, deb - cred - ivaPag); ivaPag += iva[t];
    if(o.regimen==='opcional'){ const b = ingreso[t]*(1-fIVA); isr[t] = op.tasa1*Math.min(b, op.hasta) + op.tasa2*Math.max(0, b - op.hasta); isrPag += isr[t]; }
    const interes = saldo*tasaM; intereses += interes;
    vendAcum += vendidas[t];
    const neto = ingreso[t] - costo[t] - iva[t] - isr[t];
    flujoProy[t] = neto;
    let need = -neto + interes;
    const disponible = t >= T && vendAcum >= (o.preventaMin||0)*nVenta;
    // El banco desembolsa a la par del dinero propio (pari passu): de cada quetzal que falta, pone su parte (ltc); con 'creditoPrimero', pone todo hasta su límite
    if(need > 0){ const parte = o.desembolso==='creditoPrimero' ? 1 : (o.ltc||0); const d = disponible ? Math.min(need*parte, Math.max(0, limite - saldo)) : 0; saldo += d; need -= d; flujoCap[t] = -need; capital += need; }
    else { let s2 = -need; const r = Math.min(s2, saldo); saldo -= r; s2 -= r; flujoCap[t] = s2; capital -= s2; }
    capMax = Math.max(capMax, capital); credSaldo[t] = saldo; caja[t] = -capital;
  }
  // ISR sobre utilidades al final (no se presta para pagarlo)
  const baseIngresos = ingreso.reduce((a,b)=>a+b,0)*(1-fIVA), baseCostos = costo.reduce((a,b)=>a+b,0) - cred;
  const utilidadAntes = baseIngresos - baseCostos - intereses;
  // ISR sobre utilidades: se paga a medida que se escritura (pagos a cuenta), en proporción a lo cobrado desde la entrega
  if(o.regimen!=='opcional'){ const imp = Math.max(0, utilidadAntes)*DATOS.isr_utilidades.v; isrPag = imp;
    const base = ingreso.map((x,k) => k >= E ? x : 0); const sb = base.reduce((a,b)=>a+b,0) || 1; let acu = 0;
    for(let k=0; k<=H; k++){ const p = imp*base[k]/sb; if(p){ flujoCap[k] -= p; flujoProy[k] -= p; } acu += p; caja[k] -= acu; } }
  const utilidad = flujoCap.reduce((a,b)=>a+b,0);
  const fin = flujoCap.reduce((u,x,k) => x!==0 ? k : u, 0);
  const fc = flujoCap.slice(0, fin+1), fp = flujoProy.slice(0, flujoProy.reduce((u,x,k) => x!==0 ? k : u, 0)+1);
  const costoTotal = costo.reduce((a,b)=>a+b,0) + ivaPag + isrPag + intereses;
  const precioNetoProm = ventasTot/Math.max(1, nVenta);
  const costoTerreno = permuta ? 0 : o.terreno, vSin = ventasTot*(1-fIVA);
  const directo = obra + urban, costoAntesISR = costoTotal - isrPag;
  let accum = 0, payback = null, negativo = false;
  for(let k=0; k<=fin; k++){ accum += flujoCap[k]; if(accum < -1) negativo = true; if(negativo && accum >= 0 && payback==null) payback = k; }
  return {
    permuta, nVenta, incidenciaTerreno: o.terreno/Math.max(1, ventasTot + permuta*precio), directoVentas: directo/Math.max(1, vSin),
    margenBruto: (vSin - (costoTerreno + directo))/Math.max(1, vSin), margenAntesISR: (utilidad + isrPag)/Math.max(1, vSin),
    costoM2: costoAntesISR/Math.max(1, m2v), precioM2: precio/Math.max(1, o.m2Unidad), payback,
    unidades:n, m2v, m2c, m2Sot, E, sp, inicioObra:T, esperaPreventa:T - T0, predesarrollo: (permuta ? 0 : (o.pagoTerreno==='diferido' ? o.terreno/2 : o.terreno)) + diseno + lic + marn, H:fin, ventas:ventasTot, ventasSinIVA:ventasTot*(1-fIVA),
    costos:{terreno: permuta ? 0 : o.terreno, obra, diseno, admin, urban, licencia:lic, marn, comision:comis.reduce((a,b)=>a+b,0), inventario, iva:ivaPag, isr:isrPag, intereses},
    costoTotal, utilidad, utilidadAntes, margenVentas: utilidad/(ventasTot*(1-fIVA)), margenInversion: utilidad/costoTotal,
    tirCapital: anual(tirMensual(fc)), tirProyecto: anual(tirMensual(fp)), van: vanAnual(fp, o.descuento||0.12),
    exposicion: capMax, limiteCredito: limite, mesesTotal: fin, multiplo: capMax>0 ? (capMax+utilidad)/capMax : null,
    equilibrioUnidades: Math.ceil(costoTotal/Math.max(1, precioNetoProm)), costoAntesISR,
    serie:{caja, credSaldo, ingreso, costo, vendidas}, ventaFin: vendidas.reduce((u,x,k) => x>0 ? k : u, 0)
  };
}
// Construir para rentar: rendimiento sobre costo (supuestos del Lab 2: vacancia 8%, gastos 15%)
function rentaEdificio(o){ const noi = o.m2v*o.rentaM2*12*(1-0.08)*(1-0.15); return {noi, rendimiento: noi/Math.max(1, o.costo)}; }
// Construir para rentar y quedarse con el edificio: deuda de largo plazo al terminar la obra, renta que sube con la inflación,
// valor del edificio por su renta (cap rate) al final. o: {costo, m2v, rentaM2, vacancia, gastos, crecimiento, deudaPct, tasa, plazo, anios, capSalida}
function rentaPatrimonio(o){
  const anios = Math.max(1, Math.round(o.anios||10)), deuda = o.costo*(o.deudaPct||0), capital = o.costo - deuda;
  const cuotaAnual = deuda>0 ? cuotaPrestamo(deuda, o.tasa, Math.round((o.plazo||20)*12)).cuota*12 : 0;
  const filas = [], flujo = [-capital]; let noi1 = null, saldo = deuda;
  for(let a=1; a<=anios; a++){
    const bruto = o.m2v*o.rentaM2*12*Math.pow(1+(o.crecimiento||0), a-1);
    const noi = bruto*(1-(o.vacancia||0))*(1-(o.gastos||0)); if(a===1) noi1 = noi;
    const servicio = a <= (o.plazo||20) ? cuotaAnual : 0, caja = noi - servicio;
    saldo = deuda>0 ? saldoHipoteca(deuda, o.tasa, o.plazo||20, a*12) : 0;
    filas.push({anio:a, noi, servicio, caja, dscr: servicio>0 ? noi/servicio : null}); flujo.push(caja);
  }
  const noiSig = filas[anios-1].noi*(1+(o.crecimiento||0)), valor = noiSig/Math.max(0.01, o.capSalida||0.06);
  flujo[anios] += valor - saldo;
  return {deuda, capital, noi1, rendimientoCosto: noi1/Math.max(1, o.costo), cashOnCash: filas[0].caja/Math.max(1, capital),
    dscr1: filas[0].dscr, valorFinal: valor, saldoFinal: saldo, valorCreado: noi1/Math.max(0.01, o.capSalida||0.06) - o.costo,
    tir: tirMensual(flujo), filas, gananciaTotal: flujo.reduce((t,x)=>t+x,0)};
}

const API = {tirMensual, anual, vanAnual, desarrollo, rentaEdificio, rentaPatrimonio, tasaImplicita, planLote, cuotaHipoteca, saldoHipoteca, precioMaximo, costosCompra, iusiAnual, comprarVsAlquilar, rentaInversion, planDeudas, coberturaEnfermedad, tasaReal, rendimientoConservadorReal, aporteMeta, capitalRetiro, rendimientoOpcion, mensualAnual, planFondo, aporteNecesario, valorReal, nivelFondo, etiquetaMes, sumarMeses, DATOS, SUP, AVISOS, REGLAS, FAMILIAS, FAMILIA_NOMBRE, FAMILIA_EXPLICA, NIVELES, NIVEL_NOMBRE, compararNiveles, PIDE, explicarPeldanos, PELDANOS, evaluarFoto, ubicarPeldano, pruebaTropiezo,
  simularMinimo, subsidioIGSS, pensionIVS, rentaImponible, contexto, tasaPlausible, fmtQ, fmtPct, fmtMeses};
if(typeof module!=='undefined' && module.exports) module.exports = API; else root.FinMotor = API;
})(typeof window!=='undefined'?window:globalThis);
