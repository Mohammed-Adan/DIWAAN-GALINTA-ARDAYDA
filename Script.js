  // Main App Data
  let students = JSON.parse(localStorage.getItem('students')) || [];
  let editingId = null;
  let currentFilter = 'all';
  let currentSearch = '';
  let currentMonth = new Date().getMonth() + 1;
  let currentYear = new Date().getFullYear();

  const monthNames = [
    "Janaayo", "Febraayo", "Maarso", "Abriil", 
    "May", "Juun", "Luuliyo", "Agoosto", 
    "Sebtembar", "Oktoobar", "Nofembar", "Desembar"
  ];

  // Initialize App
  document.addEventListener('DOMContentLoaded', () => {
    initializeMonthSelector();
    setupEventListeners();
    renderList();
    updateSummary();
    initDarkMode();
  });

  function initializeMonthSelector() {
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = '';
    
    // Add months
    monthNames.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = index + 1;
      option.textContent = month;
      if (index + 1 === currentMonth) option.selected = true;
      monthSelect.appendChild(option);
    });
    
    // Add year selector
    const yearSelect = document.createElement('select');
    for (let y = currentYear; y >= currentYear - 5; y--) {
      const option = document.createElement('option');
      option.value = y;
      option.textContent = y;
      yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;
    document.querySelector('.month-selector').appendChild(yearSelect);

    // Event listeners
    monthSelect.addEventListener('change', (e) => {
      currentMonth = parseInt(e.target.value);
      renderList();
    });

    yearSelect.addEventListener('change', (e) => {
      currentYear = parseInt(e.target.value);
      renderList();
    });
  }

  function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase();
      renderList();
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

    // Add student on Enter key
    document.getElementById('studentName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addStudent();
    });
  }

  // Student CRUD Operations
  function addStudent() {
    const nameInput = document.getElementById('studentName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Fadlan geli magaca ardayga');
      return;
    }

    if (editingId === null) {
      // Add new student
      const newStudent = {
        id: Date.now().toString(),
        name: name,
        payments: {},
        dateAdded: new Date().toLocaleDateString('so-SO')
      };
      students.unshift(newStudent);
      saveToLocalStorage();
      renderList();
      updateSummary();
      
      // Highlight new student
      const newStudentEl = document.querySelector(`[data-id="${newStudent.id}"]`);
      if (newStudentEl) {
        newStudentEl.classList.add('new');
        setTimeout(() => newStudentEl.classList.remove('new'), 3000);
      }
    } else {
      // Update existing student
      const studentIndex = students.findIndex(s => s.id === editingId);
      if (studentIndex !== -1) {
        students[studentIndex].name = name;
        saveToLocalStorage();
        renderList();
      }
      cancelEdit();
    }

    nameInput.value = '';
  }

  function togglePayment(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const monthKey = `${currentYear}-${currentMonth}`;
      if (!student.payments) student.payments = {};
      student.payments[monthKey] = !student.payments[monthKey];
      saveToLocalStorage();
      renderList();
      updateSummary();
    }
  }

  function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
      editingId = studentId;
      document.getElementById('studentName').value = student.name;
      document.getElementById('studentName').focus();
      document.querySelector('.btn-primary i').className = 'fas fa-save';
      document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-save"></i> Kaydi Isbedelka';
    }
  }

  function cancelEdit() {
    editingId = null;
    document.getElementById('studentName').value = '';
    document.querySelector('.btn-primary i').className = 'fas fa-plus';
    document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-plus"></i> Ku dar Arday';
  }

  function deleteStudent(studentId) {
    if (!confirm('Ma hubtaa inaad rabto inaad tirtirto?')) return;
    
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
      students.splice(studentIndex, 1);
      saveToLocalStorage();
      renderList();
      updateSummary();
      if (editingId === studentId) cancelEdit();
    }
  }

  // UI Rendering
  function renderList() {
    const container = document.getElementById('studentList');
    const filteredStudents = filterStudents();

    if (!filteredStudents.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-user-graduate"></i>
          </div>
          <h3 class="empty-title">${currentSearch ? 'Wax arday ah lama helin' : 'Ma jiraan arday diiwaangashan'}</h3>
          <p>${currentSearch ? 'Hmmm.. lama helin wax arday ah' : 'Ku dar ardayda adiga oo isticmaalaya foomka kor'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    filteredStudents.forEach(student => {
      const studentEl = document.createElement('div');
      studentEl.className = 'student-item';
      studentEl.setAttribute('data-id', student.id);

      const monthKey = `${currentYear}-${currentMonth}`;
      const hasPaid = student.payments && student.payments[monthKey];
      
      studentEl.innerHTML = `
  <div class="student-info">
    <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
    <div class="student-details">
      <div class="student-name">${student.name}</div>
      <div class="student-date">${student.dateAdded}</div>
    </div>
  </div>
  <div style="display: flex; align-items: center; gap: var(--space-sm);">
    <span class="payment-status ${hasPaid ? 'paid' : 'unpaid'}">
      ${monthNames[currentMonth-1]}: ${hasPaid ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}
    </span>
    <div class="action-buttons">
      <button class="btn btn-sm ${hasPaid ? 'btn-danger' : 'btn-success'}" 
              onclick="togglePayment('${student.id}')">
        <i class="fas ${hasPaid ? 'fa-times' : 'fa-check'}"></i>
      </button>
      <button class="btn btn-sm btn-warning" 
              onclick="editStudent('${student.id}')">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-sm btn-danger" 
              onclick="deleteStudent('${student.id}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
`;
      container.appendChild(studentEl);
    });
  }

  // Utility Functions
  function filterStudents() {
    const monthKey = `${currentYear}-${currentMonth}`;
    return students.filter(student => {
      const matchesSearch = !currentSearch || 
        student.name.toLowerCase().includes(currentSearch);
      
      const paymentStatus = student.payments && student.payments[monthKey];
      const matchesFilter = currentFilter === 'all' ||
        (currentFilter === 'paid' && paymentStatus) ||
        (currentFilter === 'unpaid' && !paymentStatus);
      
      return matchesSearch && matchesFilter;
    });
  }

  function updateSummary() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const paidCount = students.filter(s => s.payments && s.payments[monthKey]).length;
    
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('paidStudents').textContent = paidCount;
    document.getElementById('unpaidStudents').textContent = students.length - paidCount;
  }

  function saveToLocalStorage() {
    localStorage.setItem('students', JSON.stringify(students));
  }

  // Dark Mode Functions
  function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'enabled' || (!darkMode && prefersDark)) {
      document.body.classList.add('dark-mode');
      document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
  }
  

  document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    document.getElementById('darkModeToggle').innerHTML = isDark ? 
      '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });

  

// ======================
// IMPORT/EXPORT FUNCTIONS
// ======================

/**
 * Handles importing student data from JSON files
 * with validation, normalization, and duplicate prevention
 */
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const importedData = await readFile(file);
      const normalizedStudents = normalizeImportedData(importedData);
      
      if (normalizedStudents.length === 0) {
        throw new Error('Faylka ma lahan ardayo sax ah');
      }

      const { newStudents, duplicateCount } = filterDuplicates(normalizedStudents);
      
      if (newStudents.length === 0) {
        showAlert('Dhammaan ardayda ayaa hore u jiray', 'info');
        return;
      }

      const confirmed = await showImportConfirmation(newStudents.length, duplicateCount);
      if (!confirmed) return;

      mergeStudents(newStudents);
      showAlert(`Ku daray ${newStudents.length} arday oo cusub`, 'success');
      
    } catch (err) {
      showAlert(`Khalad: ${err.message}`, 'error');
      console.error('Import error:', err);
    }
  };
  
  input.click();
}

/**
 * Exports current student data to JSON file
 */
function exportData() {
  try {
    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        system: "Student Management System",
        version: "1.0"
      },
      students: students.map(cleanStudentForExport)
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ardayda-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (err) {
    showAlert(`Khalad marka la sameeyay export: ${err.message}`, 'error');
  }
}

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Reads file content as text
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(new Error('Qalad akhriska faylka'));
    reader.readAsText(file);
  });
}

/**
 * Normalizes imported student data to consistent format
 */
function normalizeImportedData(data) {
  try {
    // Parse if string
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    // Extract students array if wrapped in object
    if (data && typeof data === 'object' && !Array.isArray(data) && data.students) {
      data = data.students;
    }

    // Ensure we have an array
    if (!Array.isArray(data)) {
      throw new Error('Foomka xogta ma ahan mid sax ah');
    }

    return data
      .map(student => {
        // Skip invalid entries
        if (!student || typeof student !== 'object') return null;
        
        // Generate stable ID if missing
        const id = student.id || generateStudentId(student);
        
        // Normalize payments
        const payments = normalizePayments(student.payments);
        
        return {
          id,
          name: String(student.name || 'Arday aan magac lahayn'),
          payments,
          dateAdded: student.dateAdded || new Date().toISOString(),
          _source: 'imported',
          _importedAt: new Date().toISOString()
        };
      })
      .filter(Boolean); // Remove any null entries
  } catch (err) {
    throw new Error(`Qalad habaynta xogta: ${err.message}`);
  }
}

/**
 * Generates a stable ID for imported students
 */
function generateStudentId(student) {
  const namePart = student.name 
    ? student.name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20)
    : 'anonymous';
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `imported-${namePart}-${randomPart}`;
}

/**
 * Normalizes payments object structure
 */
function normalizePayments(payments) {
  const normalized = {};
  
  if (payments && typeof payments === 'object') {
    for (const [key, value] of Object.entries(payments)) {
      // Only include valid month-year keys and boolean values
      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) {
        normalized[key] = Boolean(value);
      }
    }
  }
  
  return normalized;
}

/**
 * Filters out duplicate students
 */
function filterDuplicates(newStudents) {
  const existingIds = new Set(students.map(s => s.id));
  const duplicates = new Set();
  
  const uniqueStudents = newStudents.filter(student => {
    if (existingIds.has(student.id)) {
      duplicates.add(student.id);
      return false;
    }
    return true;
  });
  
  return {
    newStudents: uniqueStudents,
    duplicateCount: duplicates.size
  };
}

/**
 * Shows import confirmation dialog with stats
 */
async function showImportConfirmation(newCount, duplicateCount) {
  return new Promise(resolve => {
    const message = [
      `Waxaad rabtaa inaad ku dartid ${newCount} arday oo cusub?`,
      duplicateCount > 0 && `${duplicateCount} arday ayaa la diiday, waayo horey ayay igu jireen liiskaaga(duplicates)`
    ].filter(Boolean).join('\n\n');
    
    // Use your existing confirm dialog or this fallback
    resolve(confirm(message));
  });
}

/**
 * Merges new students with existing ones
 */
function mergeStudents(newStudents) {
  // Create a deep copy to avoid reference issues
  const studentsToAdd = JSON.parse(JSON.stringify(newStudents));
  
  // Add to beginning of array so they appear first
  students.unshift(...studentsToAdd);
  
  // Enforce maximum students if needed
  if (students.length > 1000) { // Example limit
    students = students.slice(0, 1000);
    showAlert('Xadka ugu badan ee ardayda ayaa la gaaray', 'warning');
  }
  
  saveToLocalStorage();
  renderList();
  updateSummary();
}

/**
 * Prepares student data for export
 */
function cleanStudentForExport(student) {
  return {
    id: student.id,
    name: student.name,
    payments: student.payments,
    dateAdded: student.dateAdded
    // Exclude internal fields like _source, _importedAt
  };
}

function toggleFab() {
  document.querySelector('.fab-container').classList.toggle('open');
}

