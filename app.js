// ==================== CONFIGURACIÓN GLOBAL ====================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentCalendarType = "todos";
let currentRFCcompleto = "";
let currentTipoContribuyente = "ambos";
let currentRegimen = "todos";

const calendarGrid = document.getElementById("calendarGrid");
const selectMes = document.getElementById("selectMes");
const selectAnio = document.getElementById("selectAnio");

// ==================== DÍAS INHÁBILES Y VACACIONES ====================
const festivosFijos = ["01-01", "05-01", "09-16", "12-25"];

const vacacionesPorEntidad = {
    sat: {
        2024: [{ fecha_inicio: "2024-12-18", fecha_fin: "2025-01-02", descripcion: "Vacaciones SAT: suspensión de plazos fiscales", tipo: "sat" }],
        2025: [
            { fecha_inicio: "2025-04-17", fecha_fin: "2025-04-17", descripcion: "Jueves Santo - Día inhábil SAT", tipo: "sat" },
            { fecha_inicio: "2025-12-18", fecha_fin: "2026-01-02", descripcion: "Vacaciones SAT: suspensión de plazos", tipo: "sat" }
        ],
        2026: []
    },
    tfja: {
        2024: [
            { fecha_inicio: "2024-07-15", fecha_fin: "2024-07-31", descripcion: "Vacaciones TFJA: No corren términos", tipo: "tfja" },
            { fecha_inicio: "2024-12-16", fecha_fin: "2024-12-31", descripcion: "Vacaciones TFJA: Suspensión de plazos", tipo: "tfja" }
        ],
        2025: [
            { fecha_inicio: "2025-07-15", fecha_fin: "2025-07-31", descripcion: "Vacaciones TFJA", tipo: "tfja" },
            { fecha_inicio: "2025-12-16", fecha_fin: "2025-12-31", descripcion: "Vacaciones TFJA", tipo: "tfja" }
        ],
        2026: []
    },
    pjf: {
        2024: [{ fecha_inicio: "2024-12-20", fecha_fin: "2025-01-05", descripcion: "Vacaciones PJF", tipo: "pjf" }],
        2025: [
            { fecha_inicio: "2025-04-14", fecha_fin: "2025-04-20", descripcion: "Semana Santa PJF", tipo: "pjf" },
            { fecha_inicio: "2025-12-20", fecha_fin: "2026-01-05", descripcion: "Vacaciones PJF", tipo: "pjf" }
        ],
        2026: []
    }
};

function getPrimerLunes(anio, mes) {
    let d = new Date(anio, mes, 1);
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    return d;
}
function getTercerLunes(anio, mes) {
    let d = new Date(anio, mes, 1);
    let count = 0;
    while (count < 3) {
        if (d.getDay() === 1) count++;
        if (count < 3) d.setDate(d.getDate() + 1);
    }
    return d;
}

function esDiaInhabil(fecha, entidad) {
    if (fecha.getDay() === 6 || fecha.getDay() === 0) return true;
    const mesDia = `${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
    if (festivosFijos.includes(mesDia)) return true;

    const year = fecha.getFullYear();
    if (fecha.getMonth() === 1 && fecha.toDateString() === getPrimerLunes(year,1).toDateString()) return true;
    if (fecha.getMonth() === 2 && fecha.toDateString() === getTercerLunes(year,2).toDateString()) return true;
    if (fecha.getMonth() === 10 && fecha.toDateString() === getTercerLunes(year,10).toDateString()) return true;

    const fechaStr = fecha.toISOString().split('T')[0];
    if (entidad === "todos") {
        for (let e in vacacionesPorEntidad) {
            if (vacacionesPorEntidad[e][year]?.some(v => fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin)) return true;
        }
        return false;
    }
    return vacacionesPorEntidad[entidad]?.[year]?.some(v => fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) || false;
}

function obtenerPeriodoVacacional(fecha, entidad) {
    const year = fecha.getFullYear();
    const fechaStr = fecha.toISOString().split('T')[0];
    if (entidad === "todos") {
        for (let e in vacacionesPorEntidad) {
            const periodo = vacacionesPorEntidad[e][year]?.find(v => fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin);
            if (periodo) return periodo;
        }
        return null;
    }
    return vacacionesPorEntidad[entidad]?.[year]?.find(v => fechaStr >= v.fecha_inicio && fechaStr <= v.fecha_fin) || null;
}

function moverAlSiguienteDiaHabil(fecha, entidad) {
    let nueva = new Date(fecha);
    while (esDiaInhabil(nueva, entidad)) nueva.setDate(nueva.getDate() + 1);
    return nueva;
}

// ==================== PRÓRROGA RFC ====================
function obtenerDiasProrrogaRFC(rfc) {
    if (!rfc || rfc.length < 6) return 0;
    const d = rfc.charAt(5);
    if (d >= "1" && d <= "2") return 1;
    if (d >= "3" && d <= "4") return 2;
    if (d >= "5" && d <= "6") return 3;
    if (d >= "7" && d <= "8") return 4;
    if (d === "9" || d === "0") return 5;
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

// ==================== GENERACIÓN DE EVENTOS ====================
function generarEventosMes() {
    let eventos = [];
    const year = currentYear, month = currentMonth;
    const activo = (t) => currentCalendarType === "todos" || currentCalendarType === t;

    if (activo("sat")) {
        let fechaPago = new Date(year, month, 17);
        if (fechaPago.getMonth() !== month) fechaPago = new Date(year, month+1, 0);
        let limite = new Date(fechaPago);
        const aplica = currentRFCcompleto && currentRegimen !== "grancontribuyente";
        if (aplica) {
            const pror = obtenerDiasProrrogaRFC(currentRFCcompleto);
            if (pror) limite = sumarDiasHabiles(limite, pror, "sat");
        }
        limite = moverAlSiguienteDiaHabil(limite, "sat");
        eventos.push({ fecha: limite, titulo: "💰 Pago provisional", entidad: "SAT", clase: "sat", obligatorio: true,
            fundamento: "Art. 14 LISR, Art. 31 CFF",
            descripcion: `Pago mensual ISR/IVA/IEPS.${aplica ? ` Prórroga +${obtenerDiasProrrogaRFC(currentRFCcompleto)} días.` : " Sin prórroga."}` });

        let fechaDIOT = new Date(year, month+1, 0);
        eventos.push({ fecha: fechaDIOT, titulo: "📊 DIOT", entidad: "SAT", clase: "sat", obligatorio: true,
            fundamento: "Art. 32 LIVA", descripcion: "Declaración de operaciones con terceros." });

        if (month === 2) {
            let anual = moverAlSiguienteDiaHabil(new Date(year,2,31), "sat");
            eventos.push({ fecha: anual, titulo: "📑 Declaración Anual PM", entidad: "SAT", clase: "sat", obligatorio: true,
                fundamento: "Art. 9 LISR", descripcion: "Personas Morales." });
        }
        if (month === 3) {
            let anual = moverAlSiguienteDiaHabil(new Date(year,3,30), "sat");
            eventos.push({ fecha: anual, titulo: "📄 Declaración Anual PF", entidad: "SAT", clase: "sat", obligatorio: true,
                fundamento: "Art. 150 LISR", descripcion: "Personas Físicas." });
        }
        if (currentRegimen === "resico") {
            let resico = new Date(year, month, 17);
            if (resico.getMonth() !== month) resico = new Date(year, month+1, 0);
            if (currentRFCcompleto) resico = sumarDiasHabiles(resico, obtenerDiasProrrogaRFC(currentRFCcompleto), "sat");
            resico = moverAlSiguienteDiaHabil(resico, "sat");
            eventos.push({ fecha: resico, titulo: "📈 Pago RESICO", entidad: "SAT", clase: "sat", obligatorio: true,
                fundamento: "Art. 113-E LISR", descripcion: "Pago simplificado RESICO." });
        }
    }

    if (activo("imss")) {
        let imss = new Date(year, month, 17);
        if (imss.getMonth() !== month) imss = new Date(year, month+1, 0);
        imss = moverAlSiguienteDiaHabil(imss, "imss");
        eventos.push({ fecha: imss, titulo: "🏥 Cuotas IMSS", entidad: "IMSS", clase: "imss", obligatorio: true,
            fundamento: "Art. 39 LSS", descripcion: "Pago de cuotas obrero-patronales." });
        if (month === 1) {
            let prima = moverAlSiguienteDiaHabil(new Date(year,2,0), "imss");
            eventos.push({ fecha: prima, titulo: "⚠️ Prima de Riesgo", entidad: "IMSS", clase: "imss", obligatorio: true,
                fundamento: "Art. 74 LSS", descripcion: "Último día hábil de febrero." });
        }
    }

    if (activo("infonavit") && month % 2 === 0) {
        let inf = new Date(year, month, 17);
        if (inf.getMonth() !== month) inf = new Date(year, month+1, 0);
        inf = moverAlSiguienteDiaHabil(inf, "infonavit");
        eventos.push({ fecha: inf, titulo: "🏠 Aportaciones INFONAVIT", entidad: "INFONAVIT", clase: "infonavit", obligatorio: true,
            fundamento: "Ley INFONAVIT Art. 29", descripcion: "5% sobre salario, pago bimestral." });
    }

    if (activo("laboral")) {
        if (month === 4 && currentTipoContribuyente !== "fisica") {
            let ptu = moverAlSiguienteDiaHabil(new Date(year,4,30), "laboral");
            eventos.push({ fecha: ptu, titulo: "👔 PTU Personas Morales", entidad: "Laboral", clase: "laboral", obligatorio: true,
                fundamento: "LFT Art. 122 + Art. 12 CFF", descripcion: "Reparto de utilidades." });
        }
        if (month === 5 && currentTipoContribuyente !== "moral") {
            let ptu = moverAlSiguienteDiaHabil(new Date(year,5,29), "laboral");
            eventos.push({ fecha: ptu, titulo: "👔 PTU Personas Físicas", entidad: "Laboral", clase: "laboral", obligatorio: true,
                fundamento: "LFT Art. 122 + Art. 12 CFF", descripcion: "Reparto de utilidades." });
        }
        if (month === 11) {
            let aguinaldo = moverAlSiguienteDiaHabil(new Date(year,11,20), "laboral");
            eventos.push({ fecha: aguinaldo, titulo: "🎄 Aguinaldo", entidad: "Laboral", clase: "laboral", obligatorio: true,
                fundamento: "LFT Art. 87 + Art. 12 CFF", descripcion: "Pago mínimo 15 días." });
        }
    }

    if (activo("tfja") && vacacionesPorEntidad.tfja[year]) {
        for (let v of vacacionesPorEntidad.tfja[year]) {
            let inicio = new Date(v.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month)
                eventos.push({ fecha: inicio, titulo: `⚖️ ${v.descripcion}`, entidad: "TFJA", clase: "tfja", obligatorio: false,
                    fundamento: "Acuerdo Plenario", descripcion: "No corren términos procesales." });
        }
    }

    if (activo("pjf") && vacacionesPorEntidad.pjf[year]) {
        for (let v of vacacionesPorEntidad.pjf[year]) {
            let inicio = new Date(v.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month)
                eventos.push({ fecha: inicio, titulo: `🏛️ ${v.descripcion}`, entidad: "PJF", clase: "pjf", obligatorio: false,
                    fundamento: "Acuerdo CJF", descripcion: "Suspensión de labores." });
        }
    }
    return eventos;
}

// ==================== RENDERIZADO DEL GRID ====================
function renderCalendar() {
    const first = new Date(currentYear, currentMonth, 1);
    let startOffset = (first.getDay() === 0 ? 6 : first.getDay() - 1);
    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    const eventos = generarEventosMes();
    const eventosMap = new Map();
    for (let ev of eventos) {
        const key = ev.fecha.toDateString();
        if (!eventosMap.has(key)) eventosMap.set(key, []);
        eventosMap.get(key).push(ev);
    }

    calendarGrid.innerHTML = "";
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const prevDays = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 0; i < 42; i++) {
        let dayNum, dateObj, isCurrent = true;
        if (i < startOffset) {
            dayNum = prevDays - startOffset + i + 1;
            dateObj = new Date(currentYear, currentMonth-1, dayNum);
            isCurrent = false;
        } else if (i >= startOffset + daysInMonth) {
            dayNum = i - (startOffset + daysInMonth) + 1;
            dateObj = new Date(currentYear, currentMonth+1, dayNum);
            isCurrent = false;
        } else {
            dayNum = i - startOffset + 1;
            dateObj = new Date(currentYear, currentMonth, dayNum);
        }
        const key = dateObj.toDateString();
        const evs = eventosMap.get(key) || [];
        const inh = esDiaInhabil(dateObj, currentCalendarType);
        const vac = obtenerPeriodoVacacional(dateObj, currentCalendarType);
        const esHoy = dateObj.toDateString() === hoy.toDateString();

        const dayDiv = document.createElement("div");
        dayDiv.className = `calendar-day ${!isCurrent ? 'opacity-40' : ''} ${inh ? 'inhabil' : ''} ${esHoy ? 'today' : ''}`;
        if (vac) { dayDiv.classList.add("vacaciones"); dayDiv.setAttribute("data-tooltip", vac.descripcion); }
        dayDiv.innerHTML = `<div class="day-number">${dayNum}</div>`;

        const mostrar = evs.slice(0,2);
        const restantes = evs.length - 2;
        for (let ev of mostrar) {
            const badge = document.createElement("div");
            badge.className = `event-badge ${ev.clase}`;
            badge.innerHTML = `<i class="fa-regular fa-circle-check text-[8px]"></i> <span>${ev.titulo.substring(0,20)}</span>`;
            badge.onclick = (e) => { e.stopPropagation(); mostrarDetalle(ev); };
            dayDiv.appendChild(badge);
        }
        if (restantes > 0) {
            const more = document.createElement("div");
            more.className = "more-events";
            more.innerText = `+${restantes}`;
            more.onclick = (e) => { e.stopPropagation(); mostrarTodos(evs, dayNum); };
            dayDiv.appendChild(more);
        }
        calendarGrid.appendChild(dayDiv);
    }

    if (selectMes) selectMes.value = currentMonth;
    if (selectAnio) selectAnio.value = currentYear;
    const nombreMes = new Date(currentYear, currentMonth, 1).toLocaleString('es-MX', { month: 'long' });
    document.getElementById("monthYearTitle").innerText = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${currentYear}`;
}

function mostrarDetalle(ev) {
    const modal = document.getElementById("modalDetalle");
    document.getElementById("modalTitulo").innerText = ev.titulo;
    document.getElementById("modalContenido").innerHTML = `
        <div class="space-y-2">
            <div class="flex gap-2 text-[10px] text-slate-500"><i class="fa-regular fa-calendar"></i> ${ev.fecha.toLocaleDateString('es-MX')}</div>
            <div class="flex gap-2"><span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${ev.clase === 'sat' ? 'bg-blue-100 text-blue-700' : ev.clase === 'imss' ? 'bg-orange-100 text-orange-700' : ev.clase === 'infonavit' ? 'bg-green-100 text-green-700' : ev.clase === 'laboral' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}">${ev.entidad}</span>${ev.obligatorio ? '<span class="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatorio</span>' : ''}</div>
            <div class="border-t pt-2 text-xs">${ev.descripcion}</div>
            <div class="bg-slate-50 p-2 rounded-lg text-[10px]"><i class="fa-regular fa-gavel"></i> <strong>Fundamento:</strong> ${ev.fundamento}</div>
        </div>
    `;
    modal.classList.remove("hidden");
}
function mostrarTodos(evs, dia) {
    const modal = document.getElementById("modalDetalle");
    document.getElementById("modalTitulo").innerText = `Eventos del día ${dia}`;
    let html = '<div class="space-y-2">';
    for (let ev of evs) {
        html += `<div class="p-2 bg-slate-50 rounded-lg border-l-4 border-${ev.clase === 'sat' ? 'blue-500' : ev.clase === 'imss' ? 'orange-500' : ev.clase === 'infonavit' ? 'green-500' : ev.clase === 'laboral' ? 'indigo-500' : 'pink-500'}">
            <div class="font-semibold text-navy-900 text-xs">${ev.titulo}</div>
            <div class="text-[10px] text-slate-500">${ev.entidad} • ${ev.obligatorio ? 'Obligatorio' : 'Informativo'}</div>
            <div class="text-[10px] mt-1">${ev.descripcion}</div>
            <div class="text-[9px] text-slate-400 mt-1"><i class="fa-regular fa-gavel"></i> ${ev.fundamento}</div>
        </div>`;
    }
    html += '</div>';
    document.getElementById("modalContenido").innerHTML = html;
    modal.classList.remove("hidden");
}
document.getElementById("cerrarModalBtn")?.addEventListener("click", () => document.getElementById("modalDetalle").classList.add("hidden"));
document.getElementById("modalDetalle")?.addEventListener("click", (e) => { if(e.target === document.getElementById("modalDetalle")) document.getElementById("modalDetalle").classList.add("hidden"); });

// ==================== CONTROLES ====================
document.getElementById("btnMesAnterior")?.addEventListener("click", () => { currentMonth--; if(currentMonth<0){ currentMonth=11; currentYear--; } renderCalendar(); });
document.getElementById("btnMesSiguiente")?.addEventListener("click", () => { currentMonth++; if(currentMonth>11){ currentMonth=0; currentYear++; } renderCalendar(); });
document.getElementById("btnAnioAnterior")?.addEventListener("click", () => { currentYear--; renderCalendar(); });
document.getElementById("btnAnioSiguiente")?.addEventListener("click", () => { currentYear++; renderCalendar(); });
document.getElementById("btnHoy")?.addEventListener("click", () => { const h=new Date(); currentYear=h.getFullYear(); currentMonth=h.getMonth(); renderCalendar(); });
selectMes?.addEventListener("change", (e) => { currentMonth=parseInt(e.target.value); renderCalendar(); });
selectAnio?.addEventListener("change", (e) => { currentYear=parseInt(e.target.value); renderCalendar(); });
document.getElementById("tipoCalendario")?.addEventListener("change", (e) => { currentCalendarType=e.target.value; renderCalendar(); });
document.getElementById("tipoContribuyente")?.addEventListener("change", (e) => { currentTipoContribuyente=e.target.value; renderCalendar(); });
document.getElementById("regimenFiscal")?.addEventListener("change", (e) => { currentRegimen=e.target.value; renderCalendar(); });

function mostrarAlerta(mensaje, tipo) {
    const panel = document.getElementById("alertaPanel");
    document.getElementById("alertaTitulo").innerHTML = tipo==="error" ? "❌ Error" : (tipo==="success" ? "✅ Éxito" : "ℹ️ Info");
    document.getElementById("alertaMensaje").innerHTML = mensaje;
    panel.classList.remove("hidden");
    setTimeout(() => panel.style.transform = "translateX(0)", 10);
    setTimeout(() => { panel.style.transform = "translateX(100%)"; setTimeout(() => panel.classList.add("hidden"), 300); }, 4000);
}
document.getElementById("cerrarAlertaBtn")?.addEventListener("click", () => { const p=document.getElementById("alertaPanel"); p.style.transform="translateX(100%)"; setTimeout(()=>p.classList.add("hidden"),300); });
document.getElementById("aplicarProrrogaBtn")?.addEventListener("click", () => {
    const rfc = document.getElementById("rfcCompleto").value.trim().toUpperCase();
    if (!rfc) { currentRFCcompleto=""; mostrarAlerta("RFC eliminado. Sin prórroga.","info"); }
    else if (rfc.length===12 || rfc.length===13) {
        currentRFCcompleto = rfc;
        const dias = obtenerDiasProrrogaRFC(rfc);
        mostrarAlerta(`RFC ${rfc} - Prórroga +${dias} días.`,"success");
    } else { mostrarAlerta("RFC inválido (12 o 13 dígitos)","error"); return; }
    renderCalendar();
});
document.getElementById("limpiarRFCBtn")?.addEventListener("click", () => { currentRFCcompleto=""; document.getElementById("rfcCompleto").value=""; mostrarAlerta("RFC eliminado.","info"); renderCalendar(); });

renderCalendar();