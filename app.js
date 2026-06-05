// ====================================================================
// SISTEMA INTEGRAL DE CALENDARIOS JURÍDICO-FISCALES DE MÉXICO
// Versión 2.0 - Calendario Grid Mensual con Diseño FLC
// FLC Abogados Tributarios - 2025
// ====================================================================

// ========================= 1. CONFIGURACIÓN GLOBAL ==================
let fechaActual = new Date();
let currentYear = fechaActual.getFullYear();
let currentMonth = fechaActual.getMonth();
let currentCalendarType = "todos";
let currentRFCdigit = "";
let currentTipoContribuyente = "ambos";
let currentRegimen = "todos";

// Elementos DOM
const calendarGrid = document.getElementById("calendarGrid");
const monthYearTitle = document.getElementById("monthYearTitle");
const dashboardProximas = document.getElementById("dashboardProximas");
const dashboardSemana = document.getElementById("dashboardSemana");
const dashboardVencidas = document.getElementById("dashboardVencidas");
const dashboardInhabiles = document.getElementById("dashboardInhabiles");

// ========================= 2. DÍAS INHÁBILES POR ENTIDAD ==================
const festivosFijos = ["01-01", "05-01", "09-16", "12-25"];

const inhabilesPorEntidad = {
    sat: [
        { fecha_inicio: "2025-04-17", fecha_fin: "2025-04-17", descripcion: "Jueves Santo" },
        { fecha_inicio: "2025-12-18", fecha_fin: "2026-01-02", descripcion: "Vacaciones SAT" }
    ],
    tfja: [
        { fecha_inicio: "2025-07-15", fecha_fin: "2025-07-31", descripcion: "Vacaciones Verano TFJA" },
        { fecha_inicio: "2025-12-16", fecha_fin: "2025-12-31", descripcion: "Vacaciones Invierno TFJA" }
    ],
    pjf: [
        { fecha_inicio: "2025-04-14", fecha_fin: "2025-04-20", descripcion: "Semana Santa PJF" },
        { fecha_inicio: "2025-12-20", fecha_fin: "2026-01-05", descripcion: "Vacaciones PJF" }
    ]
};

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

function esDiaInhabil(fecha, entidad) {
    const diaSemana = fecha.getDay();
    if (diaSemana === 6 || diaSemana === 0) return true;
    
    const mesDia = `${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    if (festivosFijos.includes(mesDia)) return true;
    
    // Constitución (primer lunes de febrero)
    if (fecha.getMonth() === 1) {
        const primerLunes = getPrimerLunes(fecha.getFullYear(), 1);
        if (fecha.toDateString() === primerLunes.toDateString()) return true;
    }
    
    // Natalicio Juárez (tercer lunes de marzo)
    if (fecha.getMonth() === 2) {
        const tercerLunes = getTercerLunes(fecha.getFullYear(), 2);
        if (fecha.toDateString() === tercerLunes.toDateString()) return true;
    }
    
    // Revolución (tercer lunes de noviembre)
    if (fecha.getMonth() === 10) {
        const tercerLunes = getTercerLunes(fecha.getFullYear(), 10);
        if (fecha.toDateString() === tercerLunes.toDateString()) return true;
    }
    
    // Inhábiles específicos por entidad
    if (entidad !== "todos" && inhabilesPorEntidad[entidad]) {
        const fechaStr = fecha.toISOString().split('T')[0];
        for (let r of inhabilesPorEntidad[entidad]) {
            if (fechaStr >= r.fecha_inicio && fechaStr <= (r.fecha_fin || r.fecha_inicio)) return true;
        }
    }
    
    return false;
}

function moverAlSiguienteDiaHabil(fecha, entidad) {
    let nueva = new Date(fecha);
    while (esDiaInhabil(nueva, entidad)) {
        nueva.setDate(nueva.getDate() + 1);
    }
    return nueva;
}

function obtenerDiasProrrogaRFC(digito) {
    if (!digito) return 0;
    if (digito >= "1" && digito <= "2") return 1;
    if (digito >= "3" && digito <= "4") return 2;
    if (digito >= "5" && digito <= "6") return 3;
    if (digito >= "7" && digito <= "8") return 4;
    if (digito === "9" || digito === "0") return 5;
    return 0;
}

function sumarDiasHabiles(fecha, dias, entidad) {
    let nueva = new Date(fecha);
    for (let i = 0; i < dias; i++) {
        nueva.setDate(nueva.getDate() + 1);
        while (esDiaInhabil(nueva, entidad)) nueva.setDate(nueva.getDate() + 1);
    }
    return nueva;
}

// ========================= 3. GENERACIÓN DE EVENTOS POR MÓDULO ==================
function generarEventosMes() {
    let eventos = [];
    const year = currentYear;
    const month = currentMonth;
    
    const satActivo = (currentCalendarType === "todos" || currentCalendarType === "sat");
    const imssActivo = (currentCalendarType === "todos" || currentCalendarType === "imss");
    const infonavitActivo = (currentCalendarType === "todos" || currentCalendarType === "infonavit");
    const laboralActivo = (currentCalendarType === "todos" || currentCalendarType === "laboral");
    const tfjaActivo = (currentCalendarType === "todos" || currentCalendarType === "tfja");
    const pjfActivo = (currentCalendarType === "todos" || currentCalendarType === "pjf");
    
    // ========== SAT ==========
    if (satActivo) {
        // Pago provisional (día 17)
        let fechaPago = new Date(year, month, 17);
        if (fechaPago.getMonth() !== month) fechaPago = new Date(year, month + 1, 0);
        let fechaLimite = new Date(fechaPago);
        
        const aplicaProrroga = currentRFCdigit && currentRegimen !== "grancontribuyente";
        if (aplicaProrroga) {
            const pror = obtenerDiasProrrogaRFC(currentRFCdigit);
            if (pror > 0) fechaLimite = sumarDiasHabiles(fechaLimite, pror, "sat");
        }
        fechaLimite = moverAlSiguienteDiaHabil(fechaLimite, "sat");
        
        eventos.push({
            fecha: fechaLimite,
            titulo: "💰 Pago provisional (ISR/IVA/IEPS)",
            entidad: "SAT",
            clase: "sat",
            obligatorio: true,
            fundamento: "Art. 14 LISR, Art. 5-D LIVA, Art. 31 CFF",
            descripcion: `Declaración mensual de impuestos.${aplicaProrroga ? ` Prórroga RFC aplicada: +${obtenerDiasProrrogaRFC(currentRFCdigit)} días.` : " Sin prórroga RFC."}`
        });
        
        // DIOT (último día del mes siguiente)
        let fechaDIOT = new Date(year, month + 1, 0);
        eventos.push({
            fecha: fechaDIOT,
            titulo: "📊 DIOT",
            entidad: "SAT",
            clase: "sat",
            obligatorio: true,
            fundamento: "Art. 32 LIVA + RMF 4.5.1",
            descripcion: "Declaración Informativa de Operaciones con Terceros."
        });
        
        // Declaración Anual PM (marzo)
        if (month === 2) {
            let fechaAnualPM = new Date(year, 2, 31);
            fechaAnualPM = moverAlSiguienteDiaHabil(fechaAnualPM, "sat");
            eventos.push({
                fecha: fechaAnualPM,
                titulo: "📑 Declaración Anual Personas Morales",
                entidad: "SAT",
                clase: "sat",
                obligatorio: true,
                fundamento: "Art. 9 LISR",
                descripcion: "Consolidación del ejercicio fiscal anterior para empresas."
            });
        }
        
        // Declaración Anual PF (abril)
        if (month === 3) {
            let fechaAnualPF = new Date(year, 3, 30);
            fechaAnualPF = moverAlSiguienteDiaHabil(fechaAnualPF, "sat");
            eventos.push({
                fecha: fechaAnualPF,
                titulo: "📄 Declaración Anual Personas Físicas",
                entidad: "SAT",
                clase: "sat",
                obligatorio: true,
                fundamento: "Art. 150 LISR",
                descripcion: "Consolidación de ingresos y deducciones personales."
            });
        }
        
        // RESICO
        if (currentRegimen === "resico") {
            let fechaRESICO = new Date(year, month, 17);
            if (fechaRESICO.getMonth() !== month) fechaRESICO = new Date(year, month + 1, 0);
            if (currentRFCdigit) fechaRESICO = sumarDiasHabiles(fechaRESICO, obtenerDiasProrrogaRFC(currentRFCdigit), "sat");
            fechaRESICO = moverAlSiguienteDiaHabil(fechaRESICO, "sat");
            eventos.push({
                fecha: fechaRESICO,
                titulo: "📈 Pago RESICO",
                entidad: "SAT",
                clase: "sat",
                obligatorio: true,
                fundamento: "Art. 113-E / 211 LISR",
                descripcion: "Pago simplificado de ISR para RESICO."
            });
        }
    }
    
    // ========== IMSS ==========
    if (imssActivo) {
        let fechaIMSS = new Date(year, month, 17);
        if (fechaIMSS.getMonth() !== month) fechaIMSS = new Date(year, month + 1, 0);
        fechaIMSS = moverAlSiguienteDiaHabil(fechaIMSS, "imss");
        eventos.push({
            fecha: fechaIMSS,
            titulo: "🏥 Cuotas IMSS",
            entidad: "IMSS",
            clase: "imss",
            obligatorio: true,
            fundamento: "Art. 39 LSS",
            descripcion: "Pago de cuotas obrero-patronales (Riesgo de Trabajo, Enfermedades, Invalidez, Guarderías, CES)."
        });
        
        // Prima de Riesgo (febrero)
        if (month === 1) {
            let fechaPrima = new Date(year, 1, 28);
            fechaPrima = moverAlSiguienteDiaHabil(fechaPrima, "imss");
            eventos.push({
                fecha: fechaPrima,
                titulo: "⚠️ Prima de Riesgo IMSS",
                entidad: "IMSS",
                clase: "imss",
                obligatorio: true,
                fundamento: "Art. 74 LSS",
                descripcion: "Determinación de prima de riesgo de trabajo basado en siniestralidad del año anterior."
            });
        }
    }
    
    // ========== INFONAVIT (bimestral, meses pares: 0,2,4,6,8,10) ==========
    if (infonavitActivo && month % 2 === 0) {
        let fechaInfonavit = new Date(year, month, 17);
        if (fechaInfonavit.getMonth() !== month) fechaInfonavit = new Date(year, month + 1, 0);
        fechaInfonavit = moverAlSiguienteDiaHabil(fechaInfonavit, "infonavit");
        eventos.push({
            fecha: fechaInfonavit,
            titulo: "🏠 Aportaciones INFONAVIT",
            entidad: "INFONAVIT",
            clase: "infonavit",
            obligatorio: true,
            fundamento: "Ley INFONAVIT Art. 29",
            descripcion: "5% sobre salario base de cotización + amortizaciones. Pago bimestral."
        });
    }
    
    // ========== LABORAL ==========
    if (laboralActivo) {
        // PTU Personas Morales (30 mayo)
        if (month === 4 && currentTipoContribuyente !== "fisica") {
            let fechaPTU = new Date(year, 4, 30);
            fechaPTU = moverAlSiguienteDiaHabil(fechaPTU, "laboral");
            eventos.push({
                fecha: fechaPTU,
                titulo: "👔 PTU Personas Morales",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 122 + LISR Art. 9",
                descripcion: "Reparto de utilidades (10% de utilidades fiscales) para trabajadores de empresas."
            });
        }
        
        // PTU Personas Físicas (29 junio)
        if (month === 5 && currentTipoContribuyente !== "moral") {
            let fechaPTU = new Date(year, 5, 29);
            fechaPTU = moverAlSiguienteDiaHabil(fechaPTU, "laboral");
            eventos.push({
                fecha: fechaPTU,
                titulo: "👔 PTU Personas Físicas",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 122 + LISR Art. 150",
                descripcion: "Reparto de utilidades para trabajadores de personas físicas con actividad empresarial."
            });
        }
        
        // Aguinaldo (20 diciembre)
        if (month === 11) {
            let fechaAguinaldo = new Date(year, 11, 20);
            fechaAguinaldo = moverAlSiguienteDiaHabil(fechaAguinaldo, "laboral");
            eventos.push({
                fecha: fechaAguinaldo,
                titulo: "🎄 Aguinaldo",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 87",
                descripcion: "Pago mínimo de 15 días de salario antes del 20 de diciembre."
            });
        }
    }
    
    // ========== TFJA (días inhábiles como eventos) ==========
    if (tfjaActivo && inhabilesPorEntidad.tfja) {
        const fechaStrActual = `${year}-${String(month+1).padStart(2,'0')}`;
        for (let r of inhabilesPorEntidad.tfja) {
            if (r.fecha_inicio.startsWith(fechaStrActual) || 
                (r.fecha_fin && r.fecha_fin.startsWith(fechaStrActual))) {
                let fechaEvento = new Date(r.fecha_inicio);
                if (fechaEvento.getMonth() === month) {
                    eventos.push({
                        fecha: fechaEvento,
                        titulo: `⚖️ ${r.descripcion}`,
                        entidad: "TFJA",
                        clase: "tfja",
                        obligatorio: false,
                        fundamento: "Acuerdo Plenario del TFJA",
                        descripcion: "Día inhábil para términos procesales. No corren plazos para demandas de nulidad."
                    });
                }
            }
        }
    }
    
    // ========== PJF ==========
    if (pjfActivo && inhabilesPorEntidad.pjf) {
        const fechaStrActual = `${year}-${String(month+1).padStart(2,'0')}`;
        for (let r of inhabilesPorEntidad.pjf) {
            if (r.fecha_inicio.startsWith(fechaStrActual) || 
                (r.fecha_fin && r.fecha_fin.startsWith(fechaStrActual))) {
                let fechaEvento = new Date(r.fecha_inicio);
                if (fechaEvento.getMonth() === month) {
                    eventos.push({
                        fecha: fechaEvento,
                        titulo: `🏛️ ${r.descripcion}`,
                        entidad: "PJF",
                        clase: "pjf",
                        obligatorio: false,
                        fundamento: "Acuerdo General del CJF",
                        descripcion: "Suspensión de labores judiciales. Plazos procesales congelados."
                    });
                }
            }
        }
    }
    
    return eventos;
}

// ========================= 4. ACTUALIZACIÓN DEL DASHBOARD ==================
function actualizarDashboard(eventos) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const finSemana = new Date(hoy);
    finSemana.setDate(hoy.getDate() + 7);
    
    let proximas = 0;
    let semana = 0;
    let vencidas = 0;
    let inhabiles = 0;
    
    for (let ev of eventos) {
        const fechaEv = new Date(ev.fecha);
        if (fechaEv >= hoy) {
            proximas++;
            if (fechaEv <= finSemana) semana++;
        } else {
            vencidas++;
        }
    }
    
    // Contar días inhábiles en el mes actual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const fecha = new Date(currentYear, currentMonth, d);
        if (esDiaInhabil(fecha, currentCalendarType)) inhabiles++;
    }
    
    dashboardProximas.textContent = proximas;
    dashboardSemana.textContent = semana;
    dashboardVencidas.textContent = vencidas;
    dashboardInhabiles.textContent = inhabiles;
}

// ========================= 5. RENDERIZADO DEL GRID ==================
function renderCalendar() {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    let startOffset = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const eventos = generarEventosMes();
    const eventosPorFecha = new Map();
    
    for (let ev of eventos) {
        const key = ev.fecha.toDateString();
        if (!eventosPorFecha.has(key)) eventosPorFecha.set(key, []);
        eventosPorFecha.get(key).push(ev);
    }
    
    calendarGrid.innerHTML = "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = 0; i < 42; i++) {
        let dayNumber;
        let dateObj;
        let isCurrentMonth = true;
        
        if (i < startOffset) {
            dayNumber = daysInPrevMonth - startOffset + i + 1;
            dateObj = new Date(currentYear, currentMonth - 1, dayNumber);
            isCurrentMonth = false;
        } else if (i >= startOffset + daysInMonth) {
            dayNumber = i - (startOffset + daysInMonth) + 1;
            dateObj = new Date(currentYear, currentMonth + 1, dayNumber);
            isCurrentMonth = false;
        } else {
            dayNumber = i - startOffset + 1;
            dateObj = new Date(currentYear, currentMonth, dayNumber);
            isCurrentMonth = true;
        }
        
        const fechaKey = dateObj.toDateString();
        const eventosDelDia = eventosPorFecha.get(fechaKey) || [];
        const esInhabil = esDiaInhabil(dateObj, currentCalendarType);
        const esHoy = dateObj.toDateString() === hoy.toDateString();
        
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        if (!isCurrentMonth) dayDiv.classList.add("opacity-40");
        if (esInhabil) dayDiv.classList.add("inhabil");
        if (esHoy) dayDiv.classList.add("today");
        
        dayDiv.innerHTML = `<div class="day-number">${dayNumber}</div>`;
        
        // Mostrar máximo 3 eventos
        const maxMostrar = 3;
        const mostrar = eventosDelDia.slice(0, maxMostrar);
        const restantes = eventosDelDia.length - maxMostrar;
        
        for (let ev of mostrar) {
            const badge = document.createElement("div");
            badge.className = `event-badge ${ev.clase}`;
            badge.innerHTML = `<i class="fa-regular fa-circle-check text-[9px]"></i> <span>${ev.titulo}</span>`;
            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                mostrarDetalleEvento(ev);
            });
            dayDiv.appendChild(badge);
        }
        
        if (restantes > 0) {
            const moreDiv = document.createElement("div");
            moreDiv.className = "more-events text-xs text-blue-600 font-medium";
            moreDiv.innerHTML = `+${restantes} más...`;
            moreDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                mostrarTodosEventos(eventosDelDia, dayNumber);
            });
            dayDiv.appendChild(moreDiv);
        }
        
        calendarGrid.appendChild(dayDiv);
    }
    
    actualizarDashboard(eventos);
    
    const nombreMes = dateObj.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    monthYearTitle.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
}

// ========================= 6. MODALES Y DETALLES ==================
function mostrarDetalleEvento(evento) {
    const modal = document.getElementById("modalDetalle");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalContenido = document.getElementById("modalContenido");
    
    modalTitulo.textContent = evento.titulo;
    
    const fechaFormateada = evento.fecha.toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    modalContenido.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center gap-2 text-xs text-slate-500">
                <i class="fa-regular fa-calendar"></i>
                <span>${fechaFormateada}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${evento.clase === 'sat' ? 'bg-blue-100 text-blue-700' : evento.clase === 'imss' ? 'bg-orange-100 text-orange-700' : evento.clase === 'infonavit' ? 'bg-green-100 text-green-700' : evento.clase === 'laboral' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}">
                    ${evento.entidad}
                </span>
                ${evento.obligatorio ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatorio</span>' : '<span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Informativo</span>'}
            </div>
            <div class="border-t pt-3">
                <p class="text-sm text-slate-700">${evento.descripcion}</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                <i class="fa-regular fa-gavel mr-1"></i> <strong>Fundamento:</strong> ${evento.fundamento}
            </div>
        </div>
    `;
    
    modal.classList.remove("hidden");
}

function mostrarTodosEventos(eventos, dia) {
    const modal = document.getElementById("modalDetalle");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalContenido = document.getElementById("modalContenido");
    
    modalTitulo.textContent = `Eventos del día ${dia}`;
    
    let html = '<div class="space-y-3">';
    for (let ev of eventos) {
        html += `
            <div class="p-3 bg-slate-50 rounded-xl border-l-4 border-${ev.clase === 'sat' ? 'blue-500' : ev.clase === 'imss' ? 'orange-500' : ev.clase === 'infonavit' ? 'green-500' : ev.clase === 'laboral' ? 'indigo-500' : 'pink-500'}">
                <div class="font-semibold text-navy-900 text-sm">${ev.titulo}</div>
                <div class="text-xs text-slate-500 mt-1">${ev.entidad} • ${ev.obligatorio ? 'Obligatorio' : 'Informativo'}</div>
                <div class="text-xs text-slate-600 mt-2">${ev.descripcion}</div>
                <div class="text-[10px] text-slate-400 mt-2"><i class="fa-regular fa-gavel"></i> ${ev.fundamento}</div>
            </div>
        `;
    }
    html += '</div>';
    
    modalContenido.innerHTML = html;
    modal.classList.remove("hidden");
}

// Cerrar modal
document.getElementById("cerrarModalBtn")?.addEventListener("click", () => {
    document.getElementById("modalDetalle").classList.add("hidden");
});
document.getElementById("modalDetalle")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalDetalle")) {
        document.getElementById("modalDetalle").classList.add("hidden");
    }
});

// ========================= 7. CONTROLADORES DE INTERFAZ ==================
// Navegación
document.getElementById("btnMesAnterior")?.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

document.getElementById("btnMesSiguiente")?.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

document.getElementById("btnAnioAnterior")?.addEventListener("click", () => {
    currentYear--;
    renderCalendar();
});

document.getElementById("btnAnioSiguiente")?.addEventListener("click", () => {
    currentYear++;
    renderCalendar();
});

document.getElementById("btnHoy")?.addEventListener("click", () => {
    const hoy = new Date();
    currentYear = hoy.getFullYear();
    currentMonth = hoy.getMonth();
    renderCalendar();
});

// Selectores
document.getElementById("tipoCalendario")?.addEventListener("change", (e) => {
    currentCalendarType = e.target.value;
    renderCalendar();
});

document.getElementById("tipoContribuyente")?.addEventListener("change", (e) => {
    currentTipoContribuyente = e.target.value;
    renderCalendar();
});

document.getElementById("regimenFiscal")?.addEventListener("change", (e) => {
    currentRegimen = e.target.value;
    renderCalendar();
});

// Prórroga RFC
document.getElementById("aplicarProrrogaBtn")?.addEventListener("click", () => {
    const input = document.getElementById("rfcDigit");
    let digito = input.value.trim();
    if (digito.length === 0) {
        currentRFCdigit = "";
        mostrarAlerta("RFC eliminado. Las fechas vuelven al límite general (día 17).", "info");
    } else if (/^[0-9]$/.test(digito)) {
        currentRFCdigit = digito;
        const dias = obtenerDiasProrrogaRFC(digito);
        mostrarAlerta(`RFC registrado. Tu dígito (${digito}) te da ${dias} día${dias !== 1 ? 's' : ''} adicional${dias !== 1 ? 'es' : ''} para pagos provisionales SAT.`, "success");
    } else {
        mostrarAlerta("Ingresa un dígito válido (0-9)", "error");
        return;
    }
    renderCalendar();
});

// Alerta flotante
function mostrarAlerta(mensaje, tipo) {
    const alertaPanel = document.getElementById("alertaPanel");
    const alertaTitulo = document.getElementById("alertaTitulo");
    const alertaMensaje = document.getElementById("alertaMensaje");
    
    if (tipo === "error") alertaTitulo.innerHTML = "❌ Error";
    else if (tipo === "success") alertaTitulo.innerHTML = "✅ Éxito";
    else alertaTitulo.innerHTML = "ℹ️ Información";
    
    alertaMensaje.innerHTML = mensaje;
    alertaPanel.classList.remove("hidden");
    setTimeout(() => {
        alertaPanel.style.transform = "translateX(0)";
    }, 10);
    
    setTimeout(() => {
        alertaPanel.style.transform = "translateX(100%)";
        setTimeout(() => alertaPanel.classList.add("hidden"), 300);
    }, 4000);
}

document.getElementById("cerrarAlertaBtn")?.addEventListener("click", () => {
    const alertaPanel = document.getElementById("alertaPanel");
    alertaPanel.style.transform = "translateX(100%)";
    setTimeout(() => alertaPanel.classList.add("hidden"), 300);
});

// Inicializar
renderCalendar();