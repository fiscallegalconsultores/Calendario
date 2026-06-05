// Variables de Estado
let calendarData = null;
let currentYear = '2025';
let currentCategory = 'todos';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchCalendarData();
    setupModalCloseListener();
});

// Obtener JSON (ruta plana: mismo nivel que index.html)
async function fetchCalendarData() {
    try {
        const response = await fetch('fechas.json');
        if (!response.ok) throw new Error('Error al recuperar el archivo de datos fiscales.');
        
        calendarData = await response.json();
        
        document.getElementById('footer-disclaimer').innerText = calendarData.disclaimer_legal;
        
        renderCalendar();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('calendar-grid').innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 text-red-900 rounded-xl p-6 text-center">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-2xl mb-2"></i>
                <p class="font-semibold">Error al cargar el calendario fiscal.</p>
                <p class="text-sm opacity-80 mt-1">Por favor, intente recargar el sitio web más tarde.</p>
            </div>
        `;
    }
}

// Renderizado principal
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const emptyState = document.getElementById('empty-state');
    grid.innerHTML = '';
    
    if (!calendarData || !calendarData.data[currentYear]) return;
    
    const events = calendarData.data[currentYear].filter(event => {
        if (currentCategory === 'todos') return true;
        return event.categoria === currentCategory;
    });
    
    if (events.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }
    
    events.forEach(event => {
        const card = document.createElement('div');
        
        let categoryStyles = '';
        let categoryIcon = '';
        
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
        
        const statusBadge = event.estatus === 'confirmado' 
            ? `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md"><i class="fa-solid fa-circle-check mr-1"></i>Vigente</span>`
            : `<span class="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-md relative group cursor-help">
                <i class="fa-solid fa-circle-question mr-1"></i>Proyectado
                <span class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-navy-900 text-white text-[10px] p-2 rounded shadow-xl hidden group-hover:block z-10 font-normal leading-normal">Fecha preliminar sujeta a publicación oficial en el DOF.</span>
               </span>`;
        
        let dateDisplay = '';
        if (event.tipo_fecha === 'rango') {
            dateDisplay = `
                <div class="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <i class="fa-regular fa-calendar text-blue-primary"></i>
                    <span>${formatDateStr(event.fecha_inicio)} al ${formatDateStr(event.fecha_fin)}</span>
                </div>`;
        } else {
            dateDisplay = `
                <div class="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <i class="fa-regular fa-calendar text-blue-primary"></i>
                    <span>${formatDateStr(event.fecha_inicio)}</span>
                </div>`;
        }
        
        const criticalBorder = event.obligatorio ? 'ring-2 ring-red-500/20 shadow-red-100' : 'shadow-slate-100';

        card.className = `p-6 rounded-2xl border border-slate-200/80 shadow-lg ${categoryStyles} ${criticalBorder} flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1`;
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="text-xl">${categoryIcon}</div>
                    <div class="flex items-center gap-2">
                        ${event.obligatorio ? '<span class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Crítico</span>' : ''}
                        ${statusBadge}
                    </div>
                </div>
                <h3 class="font-serif text-xl font-bold text-navy-900 mb-2 leading-tight">${event.titulo}</h3>
                <p class="text-slate-600 text-sm line-clamp-3 mb-4">${event.descripcion}</p>
            </div>
            <div class="border-t border-slate-100 pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                ${dateDisplay}
                <button onclick="openFundamentoModal('${event.id}')" class="text-xs font-bold text-blue-primary hover:text-blue-hover transition-colors duration-300 flex items-center self-end sm:self-auto">
                    Ver Fundamento Legal <i class="fa-solid fa-chevron-right ml-1 text-[10px]"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function formatDateStr(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
    activeBtn.classList.remove('bg-slate-100', 'hover:bg-slate-200', 'text-slate-700');
    activeBtn.classList.add('bg-navy-900', 'text-white', 'shadow-md');
    
    renderCalendar();
}

function openFundamentoModal(eventId) {
    if (!calendarData) return;
    const event = calendarData.data[currentYear].find(e => e.id === eventId);
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