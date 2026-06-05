// ====================================================================
// SISTEMA INTEGRAL DE CALENDARIOS JURÍDICO-FISCALES DE MÉXICO
// Versión 4.0 - Calendario Grid Compacto (Corregido)
// FLC Abogados Tributarios - 2025
// ====================================================================

// ========================= 1. CONFIGURACIÓN GLOBAL ==================
let fechaActual = new Date();
let currentYear = fechaActual.getFullYear();
let currentMonth = fechaActual.getMonth();
let currentCalendarType = "todos";
let currentRFCcompleto = "";
let currentTipoContribuyente = "ambos";
let currentRegimen = "todos";

// Elementos DOM
const calendarGrid = document.getElementById("calendarGrid");
const selectMes = document.getElementById("selectMes");
const selectAnio = document.getElementById("selectAnio");

// ========================= 2. DÍAS INHÁBILES Y VACACIONES ==================
// Festivos fijos del Art. 74 LFT
const festivosFijos = ["01-01", "05-01", "09-16", "12-25"];

// Periodos vacacionales VERIFICADOS para 2024, 2025 (2026 sin publicar)
const vacacionesPorEntidad = {
    sat: {
        2024: [{ fecha_inicio: "2024-12-18", fecha_fin: "2025-01-02", descripcion: "Vacaciones SAT: suspensión de plazos fiscales (no aplica para declaraciones)", tipo: "sat" }],
        2025: [
            { fecha_inicio: "2025-04-17", fecha_fin: "2025-04-17", descripcion: "Jueves Santo - Día inhábil SAT", tipo: "sat" },
            { fecha_inicio: "2025-12-18", fecha_fin: "2026-01-02", descripcion: "Vacaciones SAT: suspensión de plazos fiscales (no aplica para declaraciones)", tipo: "sat" }
        ],
        2026: [] // Aún no publicadas en DOF
    },
    tfja: {
        2024: [
            { fecha_inicio: "2024-07-15", fecha_fin: "2024-07-31", descripcion: "Vacaciones TFJA: No corren términos procesales", tipo: "tfja" },
            { fecha_inicio: "2024-12-16", fecha_fin: "2024-12-31", descripcion: "Vacaciones TFJA: Suspensión de plazos para demandas", tipo: "tfja" }
        ],
        2025: [
            { fecha_inicio: "2025-07-15", fecha_fin: "2025-07-31", descripcion: "Vacaciones TFJA: No corren términos procesales", tipo: "tfja" },
            { fecha_inicio: "2025-12-16", fecha_fin: "2025-12-31", descripcion: "Vacaciones TFJA: Suspensión de plazos para demandas", tipo: "tfja" }
        ],
        2026: [] // Aún no publicadas
    },
    pjf: {
        2024: [
            { fecha_inicio: "2024-12-20", fecha_fin: "2025-01-05", descripcion: "Vacaciones PJF: Suspensión de labores judiciales", tipo: "pjf" }
        ],
        2025: [
            { fecha_inicio: "2025-04-14", fecha_fin: "2025-04-20", descripcion: "Semana Santa PJF: Suspensión de labores judiciales", tipo: "pjf" },
            { fecha_inicio: "2025-12-20", fecha_fin: "2026-01-05", descripcion: "Vacaciones PJF: Plazos congelados", tipo: "pjf" }
        ],
        2026: [] // Aún no publicadas
    }
};

// Funciones auxiliares para días móviles (lunes)
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

// Función unificada para determinar si una fecha es inhábil (considerando "todos")
function esDiaInhabil(fecha, entidadSeleccionada) {
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

    const year = fecha.getFullYear();
    const fechaStr = fecha.toISOString().split('T')[0];

    // Si se selecciona "todos", verificar cualquier entidad
    if (entidadSeleccionada === "todos") {
        for (let ent in vacacionesPorEntidad) {
            if (vacacionesPorEntidad[ent][year]) {
                for (let v of vacacionesPorEntidad[ent][year]) {
                    if (fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) return true;
                }
            }
        }
        return false;
    }

    // Entidad específica
    if (vacacionesPorEntidad[entidadSeleccionada] && vacacionesPorEntidad[entidadSeleccionada][year]) {
        for (let v of vacacionesPorEntidad[entidadSeleccionada][year]) {
            if (fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) return true;
        }
    }
    return false;
}

// Determinar si una fecha está dentro de un periodo vacacional (para tooltip y color)
function obtenerPeriodoVacacional(fecha, entidadSeleccionada) {
    const year = fecha.getFullYear();
    const fechaStr = fecha.toISOString().split('T')[0];

    if (entidadSeleccionada === "todos") {
        for (let ent in vacacionesPorEntidad) {
            if (vacacionesPorEntidad[ent][year]) {
                for (let v of vacacionesPorEntidad[ent][year]) {
                    if (fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) return v;
                }
            }
        }
        return null;
    }
    if (vacacionesPorEntidad[entidadSeleccionada] && vacacionesPorEntidad[entidadSeleccionada][year]) {
        for (let v of vacacionesPorEntidad[entidadSeleccionada][year]) {
            if (fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) return v;
        }
    }
    return null;
}

function moverAlSiguienteDiaHabil(fecha, entidad) {
    let nueva = new Date(fecha);
    while (esDiaInhabil(nueva, entidad)) {
        nueva.setDate(nueva.getDate() + 1);
    }
    return nueva;
}

// ========================= 3. PRÓRROGA RFC ==================
function obtenerDiasProrrogaRFC(rfcCompleto) {
    if (!rfcCompleto || rfcCompleto.length < 6) return 0;
    const sextoDigito = rfcCompleto.charAt(5);
    if (sextoDigito >= "1" && sextoDigito <= "2") return 1;
    if (sextoDigito >= "3" && sextoDigito <= "4") return 2;
    if (sextoDigito >= "5" && sextoDigito <= "6") return 3;
    if (sextoDigito >= "7" && sextoDigito <= "8") return 4;
    if (sextoDigito === "9" || sextoDigito === "0") return 5;
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

// ========================= 4. GENERACIÓN DE EVENTOS ==================
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
    
    // SAT
    if (satActivo) {
        let fechaPago = new Date(year, month, 17);
        if (fechaPago.getMonth() !== month) fechaPago = new Date(year, month + 1, 0);
        let fechaLimite = new Date(fechaPago);
        const aplicaProrroga = currentRFCcompleto && currentRegimen !== "grancontribuyente";
        if (aplicaProrroga) {
            const pror = obtenerDiasProrrogaRFC(currentRFCcompleto);
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
            descripcion: `Declaración mensual de impuestos.${aplicaProrroga ? ` Prórroga RFC: +${obtenerDiasProrrogaRFC(currentRFCcompleto)} días.` : " Sin prórroga RFC."}`
        });
        
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
        if (currentRegimen === "resico") {
            let fechaRESICO = new Date(year, month, 17);
            if (fechaRESICO.getMonth() !== month) fechaRESICO = new Date(year, month + 1, 0);
            if (currentRFCcompleto) fechaRESICO = sumarDiasHabiles(fechaRESICO, obtenerDiasProrrogaRFC(currentRFCcompleto), "sat");
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
    
    // IMSS
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
            descripcion: "Pago de cuotas obrero-patronales."
        });
        if (month === 1) {
            let ultimoDiaFebrero = new Date(year, 2, 0);
            let fechaPrima = moverAlSiguienteDiaHabil(ultimoDiaFebrero, "imss");
            eventos.push({
                fecha: fechaPrima,
                titulo: "⚠️ Prima de Riesgo IMSS",
                entidad: "IMSS",
                clase: "imss",
                obligatorio: true,
                fundamento: "Art. 74 LSS",
                descripcion: "Determinación de prima de riesgo. Último día hábil de febrero."
            });
        }
    }
    
    // INFONAVIT (bimestral)
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
            descripcion: "5% sobre salario base de cotización. Pago bimestral."
        });
    }
    
    // Laboral
    if (laboralActivo) {
        if (month === 4 && currentTipoContribuyente !== "fisica") {
            let fechaPTU = new Date(year, 4, 30);
            fechaPTU = moverAlSiguienteDiaHabil(fechaPTU, "laboral");
            eventos.push({
                fecha: fechaPTU,
                titulo: "👔 PTU Personas Morales",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 122 + LISR Art. 9 + Art. 12 CFF",
                descripcion: "Reparto de utilidades. Aplica prórroga por día inhábil."
            });
        }
        if (month === 5 && currentTipoContribuyente !== "moral") {
            let fechaPTU = new Date(year, 5, 29);
            fechaPTU = moverAlSiguienteDiaHabil(fechaPTU, "laboral");
            eventos.push({
                fecha: fechaPTU,
                titulo: "👔 PTU Personas Físicas",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 122 + LISR Art. 150 + Art. 12 CFF",
                descripcion: "Reparto de utilidades. Aplica prórroga por día inhábil."
            });
        }
        if (month === 11) {
            let fechaAguinaldo = new Date(year, 11, 20);
            fechaAguinaldo = moverAlSiguienteDiaHabil(fechaAguinaldo, "laboral");
            eventos.push({
                fecha: fechaAguinaldo,
                titulo: "🎄 Aguinaldo",
                entidad: "Laboral",
                clase: "laboral",
                obligatorio: true,
                fundamento: "LFT Art. 87 + Art. 12 CFF",
                descripcion: "Pago mínimo de 15 días de salario. Aplica prórroga por día inhábil."
            });
        }
    }
    
    // TFJA (mostrar vacaciones como eventos informativos)
    if (tfjaActivo && vacacionesPorEntidad.tfja[year]) {
        for (let v of vacacionesPorEntidad.tfja[year]) {
            let inicio = new Date(v.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month) {
                eventos.push({
                    fecha: inicio,
                    titulo: `⚖️ ${v.descripcion}`,
                    entidad: "TFJA",
                    clase: "tfja",
                    obligatorio: false,
                    fundamento: "Acuerdo Plenario del TFJA",
                    descripcion: v.descripcion + ". Durante este periodo NO corren términos procesales."
                });
            }
        }
    }
    
    // PJF
    if (pjfActivo && vacacionesPorEntidad.pjf[year]) {
        for (let v of vacacionesPorEntidad.pjf[year]) {
            let inicio = new Date(v.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month) {
                eventos.push({
                    fecha: inicio,
                    titulo: `🏛️ ${v.descripcion}`,
                    entidad: "PJF",
                    clase: "pjf",
                    obligatorio: false,
                    fundamento: "Acuerdo General del CJF",
                    descripcion: v.descripcion + ". Suspensión de labores judiciales."
                });
            }
        }
    }
    
    return eventos;
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
        let dayNumber, dateObj, isCurrentMonth = true;
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
        const periodoVac = obtenerPeriodoVacacional(dateObj, currentCalendarType);
        const esHoy = dateObj.toDateString() === hoy.toDateString();
        
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        if (!isCurrentMonth) dayDiv.classList.add("opacity-40");
        if (esInhabil) dayDiv.classList.add("inhabil");
        if (esHoy) dayDiv.classList.add("today");
        if (periodoVac) {
            dayDiv.classList.add("vacaciones");
            dayDiv.setAttribute("data-tooltip", periodoVac.descripcion);
        }
        
        dayDiv.innerHTML = `<div class="day-number">${dayNumber}</div>`;
        
        const maxMostrar = 2;
        const mostrar = eventosDelDia.slice(0, maxMostrar);
        const restantes = eventosDelDia.length - maxMostrar;
        
        for (let ev of mostrar) {
            const badge = document.createElement("div");
            badge.className = `event-badge ${ev.clase}`;
            badge.innerHTML = `<i class="fa-regular fa-circle-check text-[8px]"></i> <span>${ev.titulo.substring(0, 20)}</span>`;
            badge.addEventListener("click", (e) => {
                e.stopPropagation();
                mostrarDetalleEvento(ev);
            });
            dayDiv.appendChild(badge);
        }
        if (restantes > 0) {
            const moreDiv = document.createElement("div");
            moreDiv.className = "more-events";
            moreDiv.innerHTML = `+${restantes}`;
            moreDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                mostrarTodosEventos(eventosDelDia, dayNumber);
            });
            dayDiv.appendChild(moreDiv);
        }
        calendarGrid.appendChild(dayDiv);
    }
    
    // Actualizar selectores
    if (selectMes) selectMes.value = currentMonth;
    if (selectAnio) selectAnio.value = currentYear;
    const nombreMes = new Date(currentYear, currentMonth, 1).toLocaleString('es-MX', { month: 'long' });
    document.getElementById("monthYearTitle").textContent = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${currentYear}`;
}

// ========================= 6. MODALES ==================
function mostrarDetalleEvento(evento) {
    const modal = document.getElementById("modalDetalle");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalContenido = document.getElementById("modalContenido");
    modalTitulo.textContent = evento.titulo;
    const fechaFormateada = evento.fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    modalContenido.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center gap-2 text-[10px] text-slate-500"><i class="fa-regular fa-calendar"></i><span>${fechaFormateada}</span></div>
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${evento.clase === 'sat' ? 'bg-blue-100 text-blue-700' : evento.clase === 'imss' ? 'bg-orange-100 text-orange-700' : evento.clase === 'infonavit' ? 'bg-green-100 text-green-700' : evento.clase === 'laboral' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}">${evento.entidad}</span>
                ${evento.obligatorio ? '<span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatorio</span>' : '<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Informativo</span>'}
            </div>
            <div class="border-t pt-2"><p class="text-xs text-slate-700">${evento.descripcion}</p></div>
            <div class="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600"><i class="fa-regular fa-gavel mr-1"></i> <strong>Fundamento:</strong> ${evento.fundamento}</div>
        </div>
    `;
    modal.classList.remove("hidden");
}

function mostrarTodosEventos(eventos, dia) {
    const modal = document.getElementById("modalDetalle");
    const modalTitulo = document.getElementById("modalTitulo");
    const modalContenido = document.getElementById("modalContenido");
    modalTitulo.textContent = `Eventos del día ${dia}`;
    let html = '<div class="space-y-2">';
    for (let ev of eventos) {
        html += `<div class="p-2 bg-slate-50 rounded-lg border-l-4 border-${ev.clase === 'sat' ? 'blue-500' : ev.clase === 'imss' ? 'orange-500' : ev.clase === 'infonavit' ? 'green-500' : ev.clase === 'laboral' ? 'indigo-500' : 'pink-500'}">
            <div class="font-semibold text-navy-900 text-xs">${ev.titulo}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">${ev.entidad} • ${ev.obligatorio ? 'Obligatorio' : 'Informativo'}</div>
            <div class="text-[10px] text-slate-600 mt-1">${ev.descripcion}</div>
            <div class="text-[9px] text-slate-400 mt-1"><i class="fa-regular fa-gavel"></i> ${ev.fundamento}</div>
        </div>`;
    }
    html += '</div>';
    modalContenido.innerHTML = html;
    modal.classList.remove("hidden");
}

document.getElementById("cerrarModalBtn")?.addEventListener("click", () => document.getElementById("modalDetalle").classList.add("hidden"));
document.getElementById("modalDetalle")?.addEventListener("click", (e) => { if (e.target === document.getElementById("modalDetalle")) document.getElementById("modalDetalle").classList.add("hidden"); });

// ========================= 7. CONTROLADORES ==================
document.getElementById("btnMesAnterior")?.addEventListener("click", () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
document.getElementById("btnMesSiguiente")?.addEventListener("click", () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
document.getElementById("btnAnioAnterior")?.addEventListener("click", () => { currentYear--; renderCalendar(); });
document.getElementById("btnAnioSiguiente")?.addEventListener("click", () => { currentYear++; renderCalendar(); });
document.getElementById("btnHoy")?.addEventListener("click", () => { const hoy = new Date(); currentYear = hoy.getFullYear(); currentMonth = hoy.getMonth(); renderCalendar(); });
selectMes?.addEventListener("change", (e) => { currentMonth = parseInt(e.target.value); renderCalendar(); });
selectAnio?.addEventListener("change", (e) => { currentYear = parseInt(e.target.value); renderCalendar(); });
document.getElementById("tipoCalendario")?.addEventListener("change", (e) => { currentCalendarType = e.target.value; renderCalendar(); });
document.getElementById("tipoContribuyente")?.addEventListener("change", (e) => { currentTipoContribuyente = e.target.value; renderCalendar(); });
document.getElementById("regimenFiscal")?.addEventListener("change", (e) => { currentRegimen = e.target.value; renderCalendar(); });

// RFC
function mostrarAlerta(mensaje, tipo) {
    const alertaPanel = document.getElementById("alertaPanel");
    const alertaTitulo = document.getElementById("alertaTitulo");
    const alertaMensaje = document.getElementById("alertaMensaje");
    alertaTitulo.innerHTML = tipo === "error" ? "❌ Error" : (tipo === "success" ? "✅ Éxito" : "ℹ️ Información");
    alertaMensaje.innerHTML = mensaje;
    alertaPanel.classList.remove("hidden");
    setTimeout(() => alertaPanel.style.transform = "translateX(0)", 10);
    setTimeout(() => { alertaPanel.style.transform = "translateX(100%)"; setTimeout(() => alertaPanel.classList.add("hidden"), 300); }, 4000);
}
document.getElementById("cerrarAlertaBtn")?.addEventListener("click", () => { const a = document.getElementById("alertaPanel"); a.style.transform = "translateX(100%)"; setTimeout(() => a.classList.add("hidden"), 300); });
document.getElementById("aplicarProrrogaBtn")?.addEventListener("click", () => {
    const input = document.getElementById("rfcCompleto");
    let rfc = input.value.trim().toUpperCase();
    if (rfc.length === 0) { currentRFCcompleto = ""; mostrarAlerta("RFC eliminado. Sin prórroga.", "info"); }
    else if (rfc.length === 12 || rfc.length === 13) { currentRFCcompleto = rfc; const dias = obtenerDiasProrrogaRFC(rfc); const sexto = rfc.charAt(5); mostrarAlerta(`RFC ${rfc} registrado. Sexto dígito: ${sexto}. Prórroga: +${dias} día${dias !== 1 ? 's' : ''}.`, "success"); }
    else { mostrarAlerta("RFC inválido (12 o 13 dígitos).", "error"); return; }
    renderCalendar();
});
document.getElementById("limpiarRFCBtn")?.addEventListener("click", () => { currentRFCcompleto = ""; document.getElementById("rfcCompleto").value = ""; mostrarAlerta("RFC eliminado.", "info"); renderCalendar(); });

renderCalendar();