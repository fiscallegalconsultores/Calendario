// ====================================================================
// SISTEMA INTEGRAL DE CALENDARIOS JURÍDICO-FISCALES DE MÉXICO
// Versión 2.0 - Calendario Grid Mensual
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

function esDiaInhabil(fecha, entidad) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    const diaSemana = fecha.getDay();
    
    // Sábado o domingo
    if (diaSemana === 6 || diaSemana === 0) return true;
    
    const fechaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    // Festivos fijos
    const festivosFijos = ["01-01", "05-01", "09-16", "12-25"];
    const mesDia = `${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (festivosFijos.includes(mesDia)) return true;
    
    // Lunes de febrero (Constitución)
    if (month === 1) {
        let primerLunes = new Date(year, 1, 1);
        while (primerLunes.getDay() !== 1) primerLunes.setDate(primerLunes.getDate() + 1);
        if (fecha.toDateString() === primerLunes.toDateString()) return true;
    }
    
    // Tercer lunes de marzo (Juárez)
    if (month === 2) {
        let count = 0;
        let tercerLunes = new Date(year, 2, 1);
        while (count < 3) {
            if (tercerLunes.getDay() === 1) count++;
            if (count < 3) tercerLunes.setDate(tercerLunes.getDate() + 1);
        }
        if (fecha.toDateString() === tercerLunes.toDateString()) return true;
    }
    
    // Tercer lunes de noviembre (Revolución)
    if (month === 10) {
        let count = 0;
        let tercerLunes = new Date(year, 10, 1);
        while (count < 3) {
            if (tercerLunes.getDay() === 1) count++;
            if (count < 3) tercerLunes.setDate(tercerLunes.getDate() + 1);
        }
        if (fecha.toDateString() === tercerLunes.toDateString()) return true;
    }
    
    // Inhábiles específicos por entidad
    if (entidad !== "todos" && inhabilesPorEntidad[entidad]) {
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

// ========================= 3. GENERACIÓN DE EVENTOS ==================
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
    
    // SAT: Pagos provisionales (día 17)
    if (satActivo) {
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
            fundamento: "Art. 14 LISR, Art. 5-D LIVA",
            descripcion: `Pago de impuestos del mes anterior.${aplicaProrroga ? ` Prórroga RFC: +${obtenerDiasProrrogaRFC(currentRFCdigit)} días.` : " Sin prórroga RFC."}`
        });
        
        // DIOT (último día del mes siguiente)
        let fechaDIOT = new Date(year, month + 1, 0);
        eventos.push({
            fecha: fechaDIOT,
            titulo: "📊 DIOT",
            entidad: "SAT",
            clase: "sat",
            obligatorio: true,
            fundamento: "Art. 32 LIVA",
            descripcion: "Declaración Informativa de Operaciones con Terceros."
        });
        
        // Declaraciones anuales
        if (month === 2) {
            eventos.push({
                fecha: new Date(year, 2, 31),
                titulo: "📑 Declaración Anual Personas Morales",
                entidad: "SAT",
                clase: "sat",
                obligatorio: true,
                fundamento: "Art. 9 LISR",
                descripcion: "Consolidación del ejercicio fiscal anterior."
            });
        }
        if (month === 3) {
            eventos.push({
                fecha: new Date(year, 3, 30),
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
                fundamento: "Art. 113-E LISR",
                descripcion: "Pago simplificado para RESICO."
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
            let fechaPrima = new Date(year, 1, 28);
            fechaPrima = moverAlSiguienteDiaHabil(fechaPrima, "imss");
            eventos.push({
                fecha: fechaPrima,
                titulo: "⚠️ Prima de Riesgo IMSS",
                entidad: "IMSS",
                clase: "imss",
                obligatorio: true,
                fundamento: "Art. 74 LSS",
                descripcion: "Determinación de prima de riesgo de trabajo."
            });
        }
    }
    
    // INFONAVIT (bimestral, meses pares: 0,2,4,6,8,10)
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
            descripcion: "5% sobre salario base de cotización."
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
                fundamento: "LFT Art. 122",
                descripcion: "Reparto de utilidades para trabajadores."
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
                fundamento: "LFT Art. 122",
                descripcion: "Reparto de utilidades para trabajadores."
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
                fundamento: "LFT Art. 87",
                descripcion: "Pago mínimo de 15 días de salario."
            });
        }
    }
    
    // TFJA (mostrar días inhábiles como eventos informativos)
    if (tfjaActivo && inhabilesPorEntidad.tfja) {
        for (let r of inhabilesPorEntidad.tfja) {
            let inicio = new Date(r.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month) {
                eventos.push({
                    fecha: inicio,
                    titulo: `⚖️ ${r.descripcion}`,
                    entidad: "TFJA",
                    clase: "tfja",
                    obligatorio: false,
                    fundamento: "Acuerdo Plenario",
                    descripcion: "Día inhábil para términos procesales."
                });
            }
        }
    }
    
    // PJF
    if (pjfActivo && inhabilesPorEntidad.pjf) {
        for (let r of inhabilesPorEntidad.pjf) {
            let inicio = new Date(r.fecha_inicio);
            if (inicio.getFullYear() === year && inicio.getMonth() === month) {
                eventos.push({
                    fecha: inicio,
                    titulo: `🏛️ ${r.descripcion}`,
                    entidad: "PJF",
                    clase: "pjf",
                    obligatorio: false,
                    fundamento: "Acuerdo General",
                    descripcion: "Suspensión de labores judiciales."
                });
            }
        }
    }
    
    return eventos;
}

// ========================= 4. RENDERIZADO DEL GRID ==================
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
    
    // Días del mes anterior (para rellenar)
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = 0; i < 42; i++) {
        let dayNumber;
        let dateObj;
        let isCurrentMonth = true;
        
        if (i < startOffset) {
            // Día del mes anterior
            dayNumber = daysInPrevMonth - startOffset + i + 1;
            dateObj = new Date(currentYear, currentMonth - 1, dayNumber);
            isCurrentMonth = false;
        } else if (i >= startOffset + daysInMonth) {
            // Día del mes siguiente
            dayNumber = i - (startOffset + daysInMonth) + 1;
            dateObj = new Date(currentYear, currentMonth + 1, dayNumber);
            isCurrentMonth = false;
        } else {
            // Día del mes actual
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
        
        // Mostrar máximo 3 eventos + contador
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
    
    // Actualizar dashboard
    actualizarDashboard(eventos);
    
    // Mes y año en el título
    const