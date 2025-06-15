// Main App Data
let students = [];
try {
    students = JSON.parse(localStorage.getItem('students')) || [];
} catch (e) {
    console.error("Error parsing student data from localStorage", e);
    students = [];
}

let editingId = null;
let currentFilter = 'all';
let currentSearch = '';
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
const monthlyFee = 50; // Default monthly fee in dollars

const monthNames = [
    "January", "February", "March", "April", 
    "May", "June", "July", "August", 
    "September", "October", "November", "December"
];

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    monthSelect: document.getElementById('monthSelect'),
    yearSelect: document.getElementById('yearSelect'),
    studentName: document.getElementById('studentName'),
    addStudentBtn: document.getElementById('addStudentBtn'),
    progressBar: document.getElementById('progressBar'),
    studentList: document.getElementById('studentList'),
    totalStudents: document.getElementById('totalStudents'),
    paidStudents: document.getElementById('paidStudents'),
    unpaidStudents: document.getElementById('unpaidStudents'),
    darkModeToggle: document.getElementById('darkModeToggle')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeSelectors();
    setupEventListeners();
    renderList();
    updateSummary();
    initDarkMode();
    updateProgressBar();
});

function initializeSelectors() {
    // Initialize month selector
    elements.monthSelect.innerHTML = '';
    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        if (index + 1 === currentMonth) option.selected = true;
        elements.monthSelect.appendChild(option);
    });

    // Initialize year selector
    const startYear = currentYear - 5;
    elements.yearSelect.innerHTML = '';

    for (let y = currentYear; y >= startYear; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        elements.yearSelect.appendChild(option);
    }
}

function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        renderList();
    });

    // Month/year selectors
    elements.monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderList();
        updateProgressBar();
    });

    elements.yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderList();
        updateProgressBar();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderList();
        });
    });

    // Student management
    elements.addStudentBtn.addEventListener('click', addStudent);
    elements.studentName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addStudent();
    });

    // Dark mode toggle
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Student CRUD Operations
function addStudent() {
    const name = elements.studentName.value.trim();

    if (!name) {
        showToast('Fadlan geli magaca ardayga, ugu horreyn', 'error');
        return;
    }

    if (editingId === null) {
        // Add new student
        const newStudent = {
            id: Date.now().toString(),
            name: name,
            payments: {},
            dateAdded: new Date().toISOString()
        };
        students.unshift(newStudent);
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
        showToast('waa lagu daray', 'success');
    } else {
        // Update existing student
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex !== -1) {
            students[studentIndex].name = name;
            saveToLocalStorage();
            renderList();
            showToast('Waa la cusboonaysiiyay', 'success');
        }
        cancelEdit();
    }

    elements.studentName.value = '';
    elements.studentName.focus();
}

function togglePayment(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        if (!student.payments) student.payments = {};
        student.payments[monthKey] = !student.payments[monthKey];
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
    }
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        editingId = studentId;
        elements.studentName.value = student.name;
        elements.studentName.focus();
        elements.addStudentBtn.innerHTML = '<i class="fas fa-save"></i> Kaydi Isbedelka';
        elements.addStudentBtn.classList.add('btn-info');
        elements.addStudentBtn.classList.remove('btn-primary');
    }
}

function deleteStudent(studentId) {
    if (!confirm('Ma hubtaa inaad rabto inaad tirtirto ardaygan?')) return;

    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        students.splice(studentIndex, 1);
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
        if (editingId === studentId) cancelEdit();
        showToast('Waa la tirtiray', 'success');
    }
}

function cancelEdit() {
    editingId = null;
    elements.studentName.value = '';
    elements.addStudentBtn.innerHTML = '<i class="fas fa-plus"></i> Ku dar Ardayga';
    elements.addStudentBtn.classList.add('btn-primary');
    elements.addStudentBtn.classList.remove('btn-info');
}

// UI Rendering
function renderList() {
    const filteredStudents = filterStudents();

    if (!filteredStudents.length) {
        elements.studentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book-reader"></i>
                </div>
                <h3 class="empty-title">${currentSearch ? 'Wax arday ah lama helin' : 'Ma jiraan arday diiwaangashan'}</h3>
                <p>${currentSearch ? 'Hmmm.. lama helin wax arday ah oo ku habboon raadintaada' : 'Ku dar ardayda adiga oo isticmaalaya foomka kor'}</p>
            </div>
        `;
        return;
    }

    elements.studentList.innerHTML = '';
    filteredStudents.forEach(student => {
        const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        const hasPaid = student.payments?.[monthKey] || false;

        const studentEl = document.createElement('div');
        studentEl.className = 'student-item';
        studentEl.setAttribute('data-id', student.id);
        studentEl.innerHTML = `
            <div class="student-info">
                <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
                <div class="student-details">
                    <div class="student-name">${student.name}</div>
                    <div class="student-date">${new Date(student.dateAdded).toLocaleDateString('so-SO')}</div>
                </div>
            </div>
            <div class="payment-status-container">
                <span class="payment-status ${hasPaid ? 'paid' : 'unpaid'}">
                    <i class="fas ${hasPaid ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${monthNames[currentMonth-1]}
                </span>
                <div class="segmented-actions">
                    <div class="segmented-group">
                        <button class="segmented-btn pay-toggle ${hasPaid ? 'paid' : 'unpaid'}" 
                                onclick="togglePayment('${student.id}')">
                            <i class="fas ${hasPaid ? 'fa-check' : 'fa-times'}"></i>
                        </button>
                        <button class="segmented-btn" onclick="editStudent('${student.id}')">
                            <i class="fas fa-pencil"></i>
                        </button>
                        <button class="segmented-btn delete" onclick="deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        elements.studentList.appendChild(studentEl);
    });
}

// Utility Functions
function filterStudents() {
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    return students.filter(student => {
        const matchesSearch = !currentSearch || 
            student.name.toLowerCase().includes(currentSearch);
        const paymentStatus = student.payments?.[monthKey] || false;
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'paid' && paymentStatus) ||
            (currentFilter === 'unpaid' && !paymentStatus);
        return matchesSearch && matchesFilter;
    });
}

function updateSummary() {
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const paidCount = students.filter(s => s.payments?.[monthKey]).length;
    
    elements.totalStudents.textContent = students.length;
    elements.paidStudents.textContent = paidCount;
    elements.unpaidStudents.textContent = students.length - paidCount;
}

function updateProgressBar() {
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const paidCount = students.filter(s => s.payments?.[monthKey]).length;
    const percentage = students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0;

    elements.progressBar.style.width = `${percentage}%`;
    elements.progressBar.setAttribute('aria-valuenow', percentage);
    elements.progressBar.title = `${percentage}% lacag bixi (${paidCount}/${students.length})`;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('students', JSON.stringify(students));
    } catch (e) {
        showToast('Khalad: Xogta aad ku kaydisay waa ay weydaan!', 'error');
        console.error("LocalStorage error:", e);
    }
}

// Data Import/Export
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            try {
                const importedData = JSON.parse(event.target.result);
                const newStudents = Array.isArray(importedData) ? importedData : 
                                  (importedData.students || []);
                
                if (newStudents.length > 0 && confirm(`Ma hubtaa inaad ku darto ${newStudents.length} arday?`)) {
                    students = [...newStudents, ...students];
                    saveToLocalStorage();
                    renderList();
                    updateSummary();
                    updateProgressBar();
                    showToast(`${newStudents.length} arday ayaa loo soo dajiyay`, 'success');
                }
            } catch (err) {
                showToast('Khalad ayaa dhacay marka la akhrinayay faylka', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportData() {
    if (students.length === 0) {
        showToast('Ma jiraan xog la dhoofin karo', 'error');
        return;
    }

    const data = {
        students: students,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ardayda-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Waa la dhoofiyay oo laguu dajiay', 'success');
}

function clearData() {
    if (students.length === 0) {
        showToast('Ma jiraan xog la tirtiri karo', 'error');
        return;
    }

    if (confirm('Ma hubtaa inaad tirtirto dhammaan xogta ardayda?\nTani waa mid aan dib loo soo celin karin!')) {
        students = [];
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
        showToast('Dhammaan xogta ayaa la tirtiray', 'success');
    }
}

// Dark Mode Functions
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        elements.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    elements.darkModeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 10);
}