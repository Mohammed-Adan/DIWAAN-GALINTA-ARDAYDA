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

  

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = event => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Validate and normalize the imported data
        const normalizedStudents = normalizeImportedData(importedData);
        
        if (normalizedStudents.length > 0) {
          if (confirm(`Ma hubtaa inaad rabto inaad ku daro ${normalizedStudents.length} arday oo cusub?`)) {
            students = [...normalizedStudents, ...students];
            saveToLocalStorage();
            renderList();
            updateSummary();
            showAlert(`${normalizedStudents.length} arday ayaa loo soo dajiyay si guul leh`, 'success');
          }
        } else {
          showAlert('Faylka aad soo dejisay ma lahan xog macquul ah', 'error');
        }
      } catch (err) {
        showAlert('Khalad ayaa dhacay marka la akhrinayay faylka: ' + err.message, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// New function to normalize imported data
function normalizeImportedData(data) {
  // Handle case where data is not an array
  if (!Array.isArray(data)) {
    if (typeof data === 'object' && data.students) {
      data = data.students; // Handle exports that wrap the array in an object
    } else {
      return [];
    }
  }

  return data.map(student => {
    // Ensure required fields exist
    const normalized = {
      id: student.id || Date.now().toString(),
      name: student.name || 'Arday aan magac lahayn',
      payments: student.payments || {},
      dateAdded: student.dateAdded || new Date().toLocaleDateString('so-SO')
    };

    // Normalize payments structure if it exists
    if (student.payments) {
      normalized.payments = {};
      for (const [monthKey, paid] of Object.entries(student.payments)) {
        // Ensure payment values are boolean
        normalized.payments[monthKey] = Boolean(paid);
      }
    }

    return normalized;
  });
}

function exportData() {
  const dataStr = JSON.stringify(students, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `ardayda-${new Date().toISOString().slice(0,10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}
