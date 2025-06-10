    // Main App Data
    let students = JSON.parse(localStorage.getItem('students')) || [];
    let editingId = null;
    let currentFilter = 'all';
    let currentSearch = '';
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    const monthlyFee = 50; // Default monthly fee in dollars

    const monthNames = [
      "Janaayo", "Febraayo", "Maarso", "Abriil", 
      "May", "Juun", "Luuliyo", "Agoosto", 
      "Sebtembar", "Oktoobar", "Nofembar", "Desembar"
    ];

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
      const monthSelect = document.getElementById('monthSelect');
      const yearSelect = document.getElementById('yearSelect');
      
      // Initialize month selector
      monthSelect.innerHTML = '';
      monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        if (index + 1 === currentMonth) option.selected = true;
        monthSelect.appendChild(option);
      });
      
      // Initialize year selector
      yearSelect.innerHTML = '';
      for (let y = currentYear + 1; y >= currentYear - 5; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
      }

      // Event listeners
      monthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderList();
        updateProgressBar();
      });

      yearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderList();
        updateProgressBar();
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

      // Add student button
      document.getElementById('addStudentBtn').addEventListener('click', addStudent);

      // Add student on Enter key
      document.getElementById('studentName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addStudent();
      });

    
    }

    function updateProgressBar() {
      const monthKey = `${currentYear}-${currentMonth}`;
      const paidCount = students.filter(s => s.payments && s.payments[monthKey]).length;
      const totalStudents = students.length;
      const percentage = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;
      
      const progressBar = document.getElementById('progressBar');
      progressBar.style.width = `${percentage}%`;
      progressBar.title = `${percentage}% lacag bixi (${paidCount}/${totalStudents})`;
    }

    // Student CRUD Operations
    function addStudent() {
      const nameInput = document.getElementById('studentName');
      const name = nameInput.value.trim();

      if (!name) {
        showToast('Fadlan geli magaca ardayga', 'error');
        return;
      }

      if (editingId === null) {
        // Add new student
        const newStudent = {
          id: Date.now().toString(),
          name: name,
          payments: {},
          dateAdded: new Date().toLocaleDateString('so-SO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };
        students.unshift(newStudent);
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
        
        // Highlight new student
        const newStudentEl = document.querySelector(`[data-id="${newStudent.id}"]`);
        if (newStudentEl) {
          newStudentEl.classList.add('new');
          setTimeout(() => newStudentEl.classList.remove('new'), 3000);
        }
        
        showToast('Ardayga cusub ayaa loo gu daray', 'success');
      } else {
        // Update existing student
        const studentIndex = students.findIndex(s => s.id === editingId);
        if (studentIndex !== -1) {
          students[studentIndex].name = name;
          saveToLocalStorage();
          renderList();
          showToast('Magaca ardayga waa la cusboonaysiiyay', 'success');
        }
        cancelEdit();
      }

      nameInput.value = '';
      nameInput.focus();
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
        updateProgressBar();
        
        const status = student.payments[monthKey] ? 'Bixiyay' : 'Aan bixin';
        showToast(`Xaaladda ardayga waxaa loo beddelay ${status}`, 'success');
      }
    }

    function editStudent(studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        editingId = studentId;
        const nameInput = document.getElementById('studentName');
        nameInput.value = student.name;
        nameInput.focus();
        
        const addBtn = document.getElementById('addStudentBtn');
        addBtn.innerHTML = '<i class="fas fa-save"></i> Kaydi Isbedelka';
        addBtn.classList.add('btn-info');
        addBtn.classList.remove('btn-primary');
      }
    }

    function cancelEdit() {
      editingId = null;
      document.getElementById('studentName').value = '';
      
      const addBtn = document.getElementById('addStudentBtn');
      addBtn.innerHTML = '<i class="fas fa-plus"></i> Ku dar Ardayga';
      addBtn.classList.add('btn-primary');
      addBtn.classList.remove('btn-info');
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
        showToast('Ardayga ayaa la tirtiray', 'success');
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
              <i class="fas fa-book-reader"></i>
            </div>
            <h3 class="empty-title">${currentSearch ? 'Wax arday ah lama helin' : 'Ma jiraan arday diiwaangashan'}</h3>
            <p>${currentSearch ? 'Hmmm.. lama helin wax arday ah oo ku habboon raadintaada' : 'Ku dar ardayda adiga oo isticmaalaya foomka kor'}</p>
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
              <div class="student-name" title="${student.name}">${student.name}</div>
              <div class="student-date">${student.dateAdded}</div>
            </div>
          </div>
          <div class="payment-status-container">
            <span class="payment-status ${hasPaid ? 'paid' : 'unpaid'}">
              <i class="fas ${hasPaid ? 'fa-check-circle' : 'fa-times-circle'}"></i>
              ${monthNames[currentMonth-1]}
            </span>
            <div class="action-buttons">
              <button class="btn btn-sm ${hasPaid ? 'btn-danger' : 'btn-success'} tooltip" 
                      onclick="togglePayment('${student.id}')" title="${hasPaid ? 'U celi in aan bixin' : 'Muuji inuu bixiyay'}">
                <i class="fas ${hasPaid ? 'fa-times' : 'fa-check'}"></i>
                <span class="tooltip-text">${hasPaid ? 'U celi in aan bixin' : 'Muuji inuu bixiyay'}</span>
              </button>
              <button class="btn btn-sm btn-warning tooltip" 
                      onclick="editStudent('${student.id}')" title="Wax ka beddel">
                <i class="fas fa-edit"></i>
                <span class="tooltip-text">Wax ka beddel</span>
              </button>
              <button class="btn btn-sm btn-danger tooltip" 
                      onclick="deleteStudent('${student.id}')" title="Tirtir">
                <i class="fas fa-trash"></i>
                <span class="tooltip-text">Tirtir</span>
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
      const totalAmount = paidCount * monthlyFee;
      
      document.getElementById('totalStudents').textContent = students.length;
      document.getElementById('paidStudents').textContent = paidCount;
      document.getElementById('unpaidStudents').textContent = students.length - paidCount;
      document.getElementById('totalAmount').textContent = totalAmount;
    }

    function saveToLocalStorage() {
      localStorage.setItem('students', JSON.stringify(students));
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
            const normalizedStudents = normalizeImportedData(importedData);
            
            if (normalizedStudents.length > 0) {
              if (confirm(`Ma hubtaa inaad rabto inaad ku daro ${normalizedStudents.length} arday oo cusub?`)) {
                students = [...normalizedStudents, ...students];
                saveToLocalStorage();
                renderList();
                updateSummary();
                updateProgressBar();
                showToast(`${normalizedStudents.length} arday ayaa loo soo dajiyay`, 'success');
              }
            } else {
              showToast('Faylka aad soo dejisay ma lahan xog macquul ah', 'error');
            }
          } catch (err) {
            showToast('Khalad ayaa dhacay marka la akhrinayay faylka: ' + err.message, 'error');
          }
        };
        
        reader.onerror = () => {
          showToast('Khalad ayaa dhacay marka la akhrinayay faylka', 'error');
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    }

    function normalizeImportedData(data) {
      if (!Array.isArray(data)) {
        if (typeof data === 'object' && data.students) {
          data = data.students;
        } else {
          return [];
        }
      }

      return data.map(student => {
        const normalized = {
          id: student.id || Date.now().toString(),
          name: student.name || 'Arday aan magac lahayn',
          payments: student.payments || {},
          dateAdded: student.dateAdded || new Date().toLocaleDateString('so-SO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        };

        if (student.payments) {
          normalized.payments = {};
          for (const [monthKey, paid] of Object.entries(student.payments)) {
            normalized.payments[monthKey] = Boolean(paid);
          }
        }

        return normalized;
      });
    }

    function exportData() {
      if (students.length === 0) {
        showToast('Ma jiraan xog la dhoofin karo', 'error');
        return;
      }
      
      const data = {
        students: students,
        exportedAt: new Date().toISOString(),
        totalStudents: students.length
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `ardayda-${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showToast('Xogta ayaa si guul leh loo dhoofiyay', 'success');
    }

    function clearData() {
      if (students.length === 0) {
        showToast('Ma jiraan xog la tirtiri karo', 'error');
        return;
      }
      
      if (confirm('Ma hubtaa inaad rabto inaad tirtirto dhammaan xogta ardayda?\nTani waa mid aan dib uga soo celin karin!')) {
        students = [];
        saveToLocalStorage();
        renderList();
        updateSummary();
        updateProgressBar();
        cancelEdit();
        showToast('Dhammaan xogta ayaa la tirtiray', 'success');
      }
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
    
    // Toast notification
    function showToast(message, type = 'info') {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.className = 'toast';
      toast.classList.add(type);
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

function addStudent() {
  const nameInput = document.getElementById('studentName');
  const name = nameInput.value.trim();

  if (!name) {
    showToast('Please enter student name', 'error');
    return;
  }

  // Add student logic here...
  const newStudent = {
    id: Date.now().toString(),
    name: name,
    payments: {},
    dateAdded: new Date().toLocaleDateString('so-SO')
  };
  
  students.unshift(newStudent);
  saveToLocalStorage();
  renderList();

  // CLEAR THE INPUT FIELD (THIS IS THE KEY PART)
  nameInput.value = ''; // This line does the clearing
  nameInput.focus();   // Optional: keeps the field ready for next entry

  showToast('Student added successfully', 'success');
}

function addStudent() {
  const nameInput = document.getElementById('studentName');
  const name = nameInput.value.trim();

  if (!name) {
    showToast('Please enter student name', 'error');
    return;
  }

  // 1. Add student to list
  const newStudent = {
    id: Date.now().toString(),
    name: name,
    payments: {},
    dateAdded: new Date().toLocaleDateString('so-SO')
  };
  students.unshift(newStudent);
  saveToLocalStorage();
  renderList();

  // 2. Clear the input field
  nameInput.value = '';

  // 3. Hide the keyboard (two methods)
  
  // METHOD 1: Blur the input (most reliable)
  nameInput.blur(); // This makes the keyboard disappear

  // METHOD 2: Switch focus to another element
  // document.getElementById('someOtherElement').focus();
  
  showToast('Student added successfully', 'success');
}