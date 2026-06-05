// ============================================================
// VARIABLES GLOBALES
// ============================================================
let calendarData = null;
let currentYear = '2026';
let currentCategory = 'todos';
let currentRegimen = 'todos';
let userRFC = '';
let fechaActual = new Date();
let alertTimer = null;

// Días inhábiles fijos (mes-día) - Art. 74 LFT + Art. 12 CFF
const diasInhabilesFijos = [
    '01-01', // Año Nuevo
    '05-01', // Día del Trabajo
    '09-16', // Independencia
    '12-25'  // Navidad
];

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchCalendarData();
    setupModalCloseListener();
    cargarRFCGuardado();
    verificarAlertas();
    setInterval(verificarAlertas, 3600000);
});

function cargarRFCGuardado() {
    const rfcGuardado = localStorage.getItem('flc_rfc');
    if (rfcGuardado) {
        userRFC = rfcGuardado;
        document.getElementById('rfc-input').value = rfcGuardado;
        mostrarMensajeInformativo(`RFC cargado: ${userRFC}. Las fechas de pagos provisionales ya incluyen tu prórroga.`);
    }
}

function guardarRFC(rfc) {
    userRFC = rfc;
    localStorage.setItem('flc_rfc', rfc);
}

function aplicarPrórroga() {
    const input = document.getElementById('rfc-input');
    let rfc = input.value.trim().toUpperCase();
    
    if (rfc.length === 0) {
        userRFC = '';
        localStorage.removeItem('flc_rfc');
        renderCalendar();
        mostrarMensajeInformativo('RFC eliminado. Las fechas vuelven a mostrar el límite general (día 17 de cada mes).');
        return;
    }
    
    if (rfc.length !== 12 && rfc.length !== 13) {
        mostrarMensajeError('El RFC debe tener 12 o 13 caracteres (letras y números). Verifica el formato.');
        return;
    }
    
    guardarRFC(rfc);
    renderCalendar();
    
    // Obtener los días de prórroga según el RFC
    const sextoDigito = rfc.charAt(5);
    let diasAdicionales = 0;
    if (sextoDigito >= '1' && sextoDigito <= '2') diasAdicionales = 1;
    else if (sextoDigito >= '3' && sextoDigito <= '4') diasAdicionales = 2;
    else if (sextoDigito >= '5' && sextoDigito <= '6') diasAdicionales = 3;
    else if (sextoDigito >= '7' && sextoDigito <= '8') diasAdicionales = 4;
    else if (sextoDigito === '9' || sextoDigito === '0') diasAdicionales = 5;
    
    mostrarMensajeInformativo(
        `✅ RFC ${rfc} registrado. ` +
        `Tu sexto dígito (${sextoDigito}) te da ${diasAdicionales} día${diasAdicionales !== 1 ? 's' : ''} ` +
        `adicional${diasAdicionales !== 1 ? 'es' : ''} para pagar tus impuestos mensuales (ISR/IVA/IEPS). ` +
        `En el calendario verás las fechas ajustadas con una etiqueta "Con prórroga RFC".`
    );
}

function mostrarMensajeInformativo(mensaje) {
    const banner = document.getElementById('alert-banner');
    const title = document.getElementById('alert-title');
    const message = document.getElementById('alert-message');
    const dateSpan = document.getElementById('alert-date');
    
    title.innerText = 'ℹ️ Información';
    message.innerText = mensaje;
    dateSpan.innerText = '';
    
    banner.classList.remove('hidden');
    setTimeout(() => {
        banner.style.transform = 'translateX(0)';
    }, 100);
    
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(() => {
        closeAlert();
    }, 8000);
}

function mostrarMensajeError(mensaje) {
    const banner = document.getElementById('alert-banner');
    const title = document.getElementById('alert-title');
    const message = document.getElementById('alert-message');
    const dateSpan = document.getElementById('alert-date');
    
    title.innerText = '❌ Error';
    message.innerText = mensaje;
    dateSpan.innerText = '';
    
    banner.classList.remove('hidden');
    setTimeout(() => {
        banner.style.transform = 'translateX(0)';
    }, 100);
    
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(() => {
        closeAlert();
    }, 5000);
}

// ============================================================
// CÁLCULO DE PRÓRROGA RFC (Art. 31 CFF)
// ============================================================
function calcularPrórrogaRFC(fechaBase) {
    if (!userRFC || userRFC.length < 6) return fechaBase;
    
    const sextoDigito = userRFC.charAt(5);
    let diasAdicionales = 0;
    
    if (sextoDigito >= '1' && sextoDigito <= '2') diasAdicionales = 1;
    else if (sextoDigito >= '3' && sextoDigito <= '4') diasAdicionales = 2;
    else if (sextoDigito >= '5' && sextoDigito <= '6') diasAdicionales = 3;
    else if (sextoDigito >= '7' && sextoDigito <= '8') diasAdicionales = 4;
    else if (sextoDigito === '9' || sextoDigito === '0') diasAdicionales = 5;
    
    if (diasAdicionales === 0) return fechaBase;
    
    let fechaResultado = new Date(fechaBase);
    let diasContados = 0;
    
    while (diasContados < diasAdicionales) {
        fechaResultado.setDate(fechaResultado.getDate() + 1);
        if (!esDiaInhabil(fechaResultado)) {
            diasContados++;
        }
    }
    
    return fechaResultado;
}

function esDiaInhabil(fecha) {
    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) return true;
    
    const mes = fecha.getMonth() + 1;
    const dia = fecha.getDate();
    const mesDia = `${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    
    if (mesDia === '02-05') {
        const primerLunesFebrero = getPrimerLunes(fecha.getFullYear(), 1);
        return fecha.getTime() === primerLunesFebrero.getTime();
    }
    if (mesDia === '03-21') {
        const tercerLunesMarzo = getTercerLunes(fecha.getFullYear(), 2);
        return fecha.getTime() === tercerLunesMarzo.getTime();
    }
    if (mesDia === '11-20') {
        const tercerLunesNoviembre = getTercerLunes(fecha.getFullYear(), 10);
        return fecha.getTime() === tercerLunesNoviembre.getTime();
    }
    
    return diasInhabilesFijos.includes(mesDia);
}

function getPrimerLunes(anio, mes) {
    let fecha = new Date(anio, mes, 1);
    while (fecha.getDay() !== 1) fecha.setDate(fecha.getDate() + 1);
    return fecha;
}

function getTercerLunes(anio, mes) {
    let fecha = new Date(anio, mes, 1);
    let lunesEncontrados = 0;
    while (lunesEncontrados < 3) {
        if (fecha.getDay() === 1) lunesEncontrados++;
        if (lunesEncontrados < 3) fecha.setDate(fecha.getDate() + 1);
    }
    return fecha;
}

// ============================================================
// OBTENER DATOS DEL JSON
// ============================================================
async function fetchCalendarData() {
    try {
        const response = await fetch('fechas.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        
        calendarData = await response.json();
        document.getElementById('footer-disclaimer').innerText = calendarData.disclaimer_legal;
        renderCalendar();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('calendar-grid').innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 text-red-900 rounded-xl p-6 text-center">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-2xl mb-2"></i>
                <p class="font-semibold text-sm">Error al cargar el calendario fiscal.</p>
                <p class="text-xs opacity-80 mt-1">Verifica que el archivo fechas.json exista en el repositorio.</p>
            </div>
        `;
    }
}

function getVisualStatus(event, fechaReferencia) {
    if (fechaReferencia < fechaActual) return 'historico';
    if (event.estatus === 'confirmado') return 'vigente';
    return 'proyectado';
}

function filtrarPorRegimen(event) {
    if (currentRegimen === 'todos') return true;
    const regimenes = event.regimenes || [];
    return regimenes.includes(currentRegimen);
}

// ============================================================
// RENDERIZADO PRINCIPAL
// ============================================================
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const emptyState = document.getElementById('empty-state');
    grid.innerHTML = '';
    
    if (!calendarData || !calendarData.data[currentYear]) return;
    
    let events = calendarData.data[currentYear].filter(event => {
        if (currentCategory !== 'todos' && event.categoria !== currentCategory) return false;
        return filtrarPorRegimen(event);
    });
    
    if (events.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');
    
    events.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
    
    events.forEach(event => {
        const card = document.createElement('div');
        
        let fechaComparacion;
        let prorrogaAplicada = false;
        let fechaConPrórroga = null;
        let fechaOriginalStr = '';
        
        // Solo aplicar prórroga a pagos provisionales (id que contiene "PROV" o "RESICO")
        const aplicaProrroga = event.prorroga_rfc && userRFC && event.tipo_fecha === 'puntual' && 
                               (event.id.includes('PROV') || event.id.includes('RESICO'));
        
        if (aplicaProrroga) {
            fechaOriginalStr = event.fecha_inicio;
            fechaConPrórroga = calcularPrórrogaRFC(new Date(event.fecha_inicio));
            fechaComparacion = fechaConPrórroga;
            prorrogaAplicada = true;
        } else if (event.tipo_fecha === 'rango') {
            fechaComparacion = new Date(event.fecha_fin);
        } else {
            fechaComparacion = new Date(event.fecha_inicio);
        }
        
        const visualStatus = getVisualStatus(event, fechaComparacion);
        
        let categoryStyles = '', categoryIcon = '';
        switch (event.categoria) {
            case 'fiscal':
                categoryStyles = 'border-l-4 border-blue-primary bg-white';
                categoryIcon = '<i class="fa-solid fa-file-invoice-dollar text-blue-primary"></i>';
                break;
            case 'jurisdiccional':
                categoryStyles = 'border-l-4 border-slate-800 bg-white';
                categoryIcon = '<i class="fa-solid fa-gavel text-slate-800"></i>';
                break;
            case 'festivo':
                categoryStyles = 'border-l-4 border-slate-400 bg-white';
                categoryIcon = '<i class="fa-solid fa-calendar-day text-slate-500"></i>';
                break;
        }
        
        let statusBadge = '';
        if (visualStatus === 'historico') {
            statusBadge = `<span class="bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md"><i class="fa-regular fa-clock mr-1"></i>Histórico</span>`;
        } else if (visualStatus === 'vigente') {
            statusBadge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md"><i class="fa-solid fa-circle-check mr-1"></i>Vigente</span>`;
        } else {
            statusBadge = `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md relative group cursor-help">
                <i class="fa-solid fa-circle-question mr-1"></i>Proyectado
                <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-44 bg-navy-900 text-white text-[9px] p-1.5 rounded shadow-xl hidden group-hover:block z-10">Pendiente de publicación oficial</span>
               </span>`;
        }
        
        let dateDisplay = '';
        if (prorrogaAplicada && fechaConPrórroga) {
            const fechaOriginalDate = new Date(fechaOriginalStr);
            const diffDias = Math.round((fechaConPrórroga - fechaOriginalDate) / (1000 * 60 * 60 * 24));
            dateDisplay = `
                <div class="text-sm font-bold bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                    <i class="fa-regular fa-calendar text-blue-primary mr-1"></i>
                    <span class="text-blue-primary">${formatDateStr(fechaConPrórroga)}</span>
                    <span class="text-[9px] text-slate-500 block mt-0.5">(Original: ${formatDateStr(fechaOriginalStr)} | +${diffDias} días por RFC)</span>
                </div>`;
        } else if (event.tipo_fecha === 'rango') {
            dateDisplay = `<div class="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg"><i class="fa-regular fa-calendar text-blue-primary mr-1"></i>${formatDateStr(event.fecha_inicio)} al ${formatDateStr(event.fecha_fin)}</div>`;
        } else {
            dateDisplay = `<div class="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg"><i class="fa-regular fa-calendar text-blue-primary mr-1"></i>${formatDateStr(event.fecha_inicio)}</div>`;
        }
        
        let periodicidadBadge = event.periodicidad ? `<span class="bg-slate-100 text-slate-500 text-[9px] font-medium px-1.5 py-0.5 rounded-md uppercase">${event.periodicidad}</span>` : '';
        let prorrogaBadge = (aplicaProrroga) ? `<span class="bg-blue-100 text-blue-700 text-[9px] font-medium px-1.5 py-0.5 rounded-md"><i class="fa-solid fa-id-card mr-0.5"></i>Con prórroga RFC</span>` : '';
        let regimenBadge = '';
        if (event.regimenes) {
            if (event.regimenes.includes('RESICO')) regimenBadge += `<span class="bg-teal-50 text-teal-600 text-[9px] font-medium px-1.5 py-0.5 rounded-md">RESICO</span> `;
            if (event.regimenes.includes('sueldos')) regimenBadge += `<span class="bg-purple-50 text-purple-600 text-[9px] font-medium px-1.5 py-0.5 rounded-md">Sueldos</span> `;
            if (event.regimenes.includes('general')) regimenBadge += `<span class="bg-orange-50 text-orange-600 text-[9px] font-medium px-1.5 py-0.5 rounded-md">General</span> `;
        }
        
        const criticalBorder = event.obligatorio ? 'ring-2 ring-red-500/20 shadow-red-100' : '';
        
        card.className = `p-4 rounded-xl border border-slate-200 shadow-md ${categoryStyles} ${criticalBorder} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`;
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-3">
                    <div class="text-lg">${categoryIcon}</div>
                    <div class="flex items-center gap-1.5">
                        ${event.obligatorio ? '<span class="bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">Crítico</span>' : ''}
                        ${statusBadge}
                    </div>
                </div>
                <h3 class="font-serif text-lg font-bold text-navy-900 mb-1 leading-tight">${event.titulo}</h3>
                <p class="text-slate-600 text-xs line-clamp-2 mb-3">${event.descripcion}</p>
                <div class="flex flex-wrap gap-1 mb-2">
                    ${periodicidadBadge}
                    ${prorrogaBadge}
                    ${regimenBadge}
                </div>
            </div>
            <div class="border-t border-slate-100 pt-3 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                ${dateDisplay}
                <button onclick="openFundamentoModal('${event.id}')" class="text-[10px] font-bold text-blue-primary hover:text-blue-hover transition-colors">
                    Ver Fundamento <i class="fa-solid fa-chevron-right ml-0.5 text-[8px]"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function formatDateStr(dateInput) {
    let date;
    if (typeof dateInput === 'string') {
        const parts = dateInput.split('-');
        date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
        date = dateInput;
    }
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================
// ALERTAS
// ============================================================
function verificarAlertas() {
    if (!calendarData) return;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let alertas = [];
    
    for (const year in calendarData.data) {
        for (const event of calendarData.data[year]) {
            if (event.categoria === 'festivo') continue;
            
            let fechaEvento;
            if (event.tipo_fecha === 'rango') {
                fechaEvento = new Date(event.fecha_fin);
            } else {
                fechaEvento = new Date(event.fecha_inicio);
            }
            
            const aplicaProrroga = event.prorroga_rfc && userRFC && event.tipo_fecha === 'puntual' && 
                                   (event.id.includes('PROV') || event.id.includes('RESICO'));
            if (aplicaProrroga) {
                fechaEvento = calcularPrórrogaRFC(fechaEvento);
            }
            
            const diffTime = fechaEvento - hoy;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 15 || diffDays === 7 || diffDays === 3 || diffDays === 1) {
                alertas.push({
                    titulo: event.titulo,
                    fecha: fechaEvento,
                    dias: diffDays,
                    id: event.id
                });
            }
        }
    }
    
    if (alertas.length > 0) {
        mostrarAlerta(alertas[0]);
    }
}

function mostrarAlerta(alerta) {
    const banner = document.getElementById('alert-banner');
    const title = document.getElementById('alert-title');
    const message = document.getElementById('alert-message');
    const dateSpan = document.getElementById('alert-date');
    
    let textoDias = '';
    if (alerta.dias === 15) textoDias = 'en 15 días';
    else if (alerta.dias === 7) textoDias = 'en 7 días';
    else if (alerta.dias === 3) textoDias = 'en 3 días';
    else if (alerta.dias === 1) textoDias = 'mañana';
    
    title.innerText = `⚠️ Próxima fecha crítica`;
    message.innerText = `${alerta.titulo} ${textoDias}`;
    dateSpan.innerText = formatDateStr(alerta.fecha);
    
    banner.classList.remove('hidden');
    setTimeout(() => {
        banner.style.transform = 'translateX(0)';
    }, 100);
    
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = setTimeout(() => {
        closeAlert();
    }, 10000);
}

function closeAlert() {
    const banner = document.getElementById('alert-banner');
    banner.style.transform = 'translateX(100%)';
    setTimeout(() => {
        banner.classList.add('hidden');
    }, 300);
}

// ============================================================
// FUNCIONES DE CONTROL
// ============================================================
function switchYear(year) {
    currentYear = year;
    document.querySelectorAll('.year-tab').forEach(tab => {
        tab.classList.remove('border-blue-primary', 'text-blue-primary');
        tab.classList.add('border-transparent', 'text-slate-500', 'hover:text-navy-900');
    });
    const activeTab = document.getElementById(`tab-${year}`);
    activeTab.classList.remove('border-transparent', 'text-slate-500', 'hover:text-navy-900');
    activeTab.classList.add('border-blue-primary', 'text-blue-primary');
    renderCalendar();
}

function filterCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.cat-filter').forEach(btn => {
        btn.classList.remove('bg-navy-900', 'text-white', 'shadow-md');
        btn.classList.add('bg-slate-100', 'hover:bg-slate-200', 'text-slate-700');
    });
    const activeBtn = document.getElementById(`filter-${category}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-slate-100', 'hover:bg-slate-200', 'text-slate-700');
        activeBtn.classList.add('bg-navy-900', 'text-white', 'shadow-md');
    }
    renderCalendar();
}

const regimenSelect = document.getElementById('regimen-select');
if (regimenSelect) {
    regimenSelect.addEventListener('change', (e) => {
        currentRegimen = e.target.value;
        renderCalendar();
    });
}

function openFundamentoModal(eventId) {
    if (!calendarData) return;
    
    let event = null;
    for (const year in calendarData.data) {
        event = calendarData.data[year].find(e => e.id === eventId);
        if (event) break;
    }
    if (!event) return;
    
    document.getElementById('modal-autoridad').innerText = `${event.autoridad} • ${event.categoria}`;
    document.getElementById('modal-titulo').innerText = event.titulo;
    document.getElementById('modal-fundamento').innerText = event.fundamento;
    document.getElementById('modal-descripcion').innerText = event.descripcion;
    
    const modal = document.getElementById('fundamento-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.firstElementChild.classList.remove('scale-95');
        modal.firstElementChild.classList.add('scale-100');
    }, 10);
}

function closeFundamentoModal() {
    const modal = document.getElementById('fundamento-modal');
    modal.firstElementChild.classList.remove('scale-100');
    modal.firstElementChild.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 150);
}

function setupModalCloseListener() {
    const modal = document.getElementById('fundamento-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFundamentoModal();
    });
}