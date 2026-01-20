/**
 * ProPlanner - Modular Vanilla JS Version
 */

// --- STATE MANAGEMENT ---
const Store = {
    currentUser: JSON.parse(localStorage.getItem('planner_user')) || null,
    users: JSON.parse(localStorage.getItem('planner_users_db')) || [],
    tasks: JSON.parse(localStorage.getItem('planner_tasks')) || [],
    currentDate: new Date(), // Used for week navigation
    currentView: 'calendar', // 'calendar' or 'history'
    availableTags: JSON.parse(localStorage.getItem('planner_tags')) || ['work', 'meeting', 'important', 'urgent', 'personal', 'project', 'review', 'planning', 'follow-up', 'deadline'],
    activeFilters: {
        status: 'all',
        tags: []
    },
    historyFilters: {
        tags: []
    },
    currentTaskTags: [], // Temporary tags for current task being edited
    pomodoroVisible: JSON.parse(localStorage.getItem('planner_pomodoro_visible')) !== false, // Default true

    save() {
        localStorage.setItem('planner_user', JSON.stringify(this.currentUser));
        localStorage.setItem('planner_users_db', JSON.stringify(this.users));
        localStorage.setItem('planner_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('planner_tags', JSON.stringify(this.availableTags));
        localStorage.setItem('planner_pomodoro_visible', JSON.stringify(this.pomodoroVisible));
    },

    addTag(tag) {
        const normalized = tag.trim().toLowerCase();
        if (normalized && !this.availableTags.includes(normalized)) {
            this.availableTags.push(normalized);
            this.save();
        }
    },

    removeTag(tag) {
        this.availableTags = this.availableTags.filter(t => t !== tag);
        this.save();
    },

    login(email, password) {
        // Universal Admin Access
        if (email === 'admin' && password === 'admin') {
            let adminUser = this.users.find(u => u.email === 'admin');
            if (!adminUser) {
                adminUser = {
                    id: 'admin',
                    name: 'Admin',
                    email: 'admin',
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`
                };
                this.users.push({ ...adminUser, password: 'admin' });
            }
            this.currentUser = { ...adminUser };
            delete this.currentUser.password;
            this.save();
            return true;
        }

        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password;
            this.save();
            return true;
        }
        return false;
    },

    register(name, email, password) {
        if (this.users.some(u => u.email === email)) return false;
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };
        this.users.push(newUser);
        this.save();
        return this.login(email, password);
    },

    logout() {
        this.currentUser = null;
        this.save();
        location.reload();
    }
};

// --- DOM ELEMENTS ---
const DOM = {
    authOverlay: document.getElementById('auth-overlay'),
    appContainer: document.getElementById('app-container'),
    loginCard: document.getElementById('login-card'),
    registerCard: document.getElementById('register-card'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    goToRegister: document.getElementById('go-to-register'),
    goToLogin: document.getElementById('go-to-login'),

    userName: document.getElementById('user-display-name'),
    headerAvatar: document.getElementById('header-avatar'),
    logoutBtn: document.getElementById('logout-btn'),

    currentWeekLabel: document.getElementById('current-week-label'),
    prevWeek: document.getElementById('prev-week'),
    nextWeek: document.getElementById('next-week'),

    dayHeaders: document.getElementById('calendar-header-days'),
    timeLabels: document.getElementById('time-labels-container'),
    dayColumns: document.querySelectorAll('.day-column'),

    addTaskBtn: document.getElementById('add-task-btn'),
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form'),
    cancelTask: document.getElementById('cancel-task'),
    deleteTaskBtn: document.getElementById('delete-task-btn'),
    completeTaskBtn: document.getElementById('complete-task-btn'),
    formError: document.getElementById('form-error'),

    todayList: document.getElementById('today-task-list'),
    upcomingList: document.getElementById('upcoming-task-list'),

    // Navigation Tabs
    tabCalendar: document.getElementById('tab-calendar'),
    tabHistory: document.getElementById('tab-history'),
    calendarView: document.querySelector('.calendar-view'),
    historyView: document.getElementById('history-view'),
    weekNavContainer: document.getElementById('week-nav-container'),
    sidebar: document.querySelector('.sidebar'),
    historyList: document.getElementById('history-list'),
    historyStats: document.getElementById('history-stats'),

    // Tags & Filters
    tagInput: document.getElementById('tag-input'),
    tagsDisplay: document.getElementById('tags-display'),
    tagSuggestions: document.getElementById('tag-suggestions'),
    tagFilterList: document.getElementById('tag-filter-list'),
    clearFilters: document.getElementById('clear-filters'),

    // History Filters
    historyTagFilterList: document.getElementById('history-tag-filter-list'),
    clearHistoryFilters: document.getElementById('clear-history-filters'),

    // Pomodoro
    togglePomodoroBtn: document.getElementById('toggle-pomodoro-btn'),
    pomodoroWidget: document.getElementById('pomodoro-widget')
};

// --- AUTH LOGIC ---
function initAuth() {
    if (Store.currentUser) {
        DOM.authOverlay.classList.add('hidden');
        DOM.appContainer.classList.remove('hidden');
        renderApp();
    }

    DOM.goToRegister.onclick = () => {
        DOM.loginCard.classList.add('hidden');
        DOM.registerCard.classList.remove('hidden');
    };

    DOM.goToLogin.onclick = () => {
        DOM.registerCard.classList.add('hidden');
        DOM.loginCard.classList.remove('hidden');
    };

    DOM.loginForm.onsubmit = (e) => {
        e.preventDefault();
        const success = Store.login(
            document.getElementById('login-email').value,
            document.getElementById('login-password').value
        );
        if (success) location.reload();
        else alert('Invalid credentials');
    };

    DOM.registerForm.onsubmit = (e) => {
        e.preventDefault();
        const success = Store.register(
            document.getElementById('reg-name').value,
            document.getElementById('reg-email').value,
            document.getElementById('reg-password').value
        );
        if (success) location.reload();
        else alert('User already exists');
    };

    DOM.logoutBtn.onclick = () => Store.logout();

    // View Switching
    DOM.tabCalendar.onclick = () => switchView('calendar');
    DOM.tabHistory.onclick = () => switchView('history');

    // Pomodoro Toggle
    if (DOM.togglePomodoroBtn) {
        DOM.togglePomodoroBtn.onclick = () => togglePomodoro();
    }
}

function switchView(view) {
    Store.currentView = view;
    if (view === 'calendar') {
        DOM.tabCalendar.classList.add('active');
        DOM.tabHistory.classList.remove('active');
        DOM.calendarView.classList.remove('hidden');
        DOM.sidebar.classList.remove('hidden');
        DOM.historyView.classList.add('hidden');
        DOM.weekNavContainer.style.display = 'flex';
        if (typeof renderTagFilters === 'function') renderTagFilters(false); // Calendar: active tasks only
        renderCalendar();
        renderSidebar();
    } else {
        DOM.tabCalendar.classList.remove('active');
        DOM.tabHistory.classList.add('active');
        DOM.calendarView.classList.add('hidden');
        DOM.sidebar.classList.add('hidden');
        DOM.historyView.classList.remove('hidden');
        DOM.weekNavContainer.style.display = 'none';
        if (typeof renderTagFilters === 'function') renderTagFilters(true, DOM.historyTagFilterList); // History: completed tasks only
        renderHistory();
    }
}

// --- CALENDAR LOGIC ---
const COLORS = {
    purple: { bg: 'var(--pastel-purple)', text: 'var(--pastel-purple-text)' },
    blue: { bg: 'var(--pastel-blue)', text: 'var(--pastel-blue-text)' },
    green: { bg: 'var(--pastel-green)', text: 'var(--pastel-green-text)' },
    orange: { bg: 'var(--pastel-orange)', text: 'var(--pastel-orange-text)' },
    pink: { bg: 'var(--pastel-pink)', text: 'var(--pastel-pink-text)' }
};

function getWeekDays(date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    // Monday start adjustment
    const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const next = new Date(startOfWeek);
        next.setDate(startOfWeek.getDate() + i);
        days.push(next);
    }
    return days;
}

// BUG FIX: Consistent Local Date String
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTaskStatus(task) {
    const now = new Date();
    const [h, m] = task.endTime.split(':').map(Number);
    const endDateTime = new Date(task.endDate || task.date);
    endDateTime.setHours(h, m, 0, 0);

    if (task.completed) {
        const completionTime = new Date(task.completedAt);
        return completionTime > endDateTime ? 'completed_late' : 'completed_on_time';
    }

    if (now > endDateTime) return 'overdue';
    return 'active';
}

function renderApp() {
    DOM.userName.textContent = Store.currentUser.name;
    DOM.headerAvatar.innerHTML = `<img src="${Store.currentUser.avatarUrl}" alt="Avatar">`;

    // Initialize tags and filters
    if (typeof initTagInput === 'function') initTagInput();
    if (typeof initFilters === 'function') initFilters();
    if (typeof renderTagFilters === 'function') renderTagFilters(false); // Calendar: active tasks only

    // Initialize Pomodoro visibility
    updatePomodoroVisibility();

    renderCalendar();
    renderSidebar();
}

function renderCalendar() {
    const days = getWeekDays(Store.currentDate);

    // Label: Show Range (e.g., Aug 16 - Aug 22, 2021)
    const options = { month: 'short', day: 'numeric' };
    const startStr = days[0].toLocaleDateString('en-US', options);
    const endStr = days[6].toLocaleDateString('en-US', options);
    const yearStr = days[6].getFullYear();
    DOM.currentWeekLabel.textContent = `${startStr} - ${endStr}, ${yearStr}`;

    // Headers
    DOM.dayHeaders.innerHTML = '<div class="time-header-spacer"></div>';
    days.forEach(date => {
        const isToday = date.toDateString() === new Date().toDateString();
        const head = document.createElement('div');
        head.className = `day-header ${isToday ? 'today' : ''}`;
        head.innerHTML = `
            <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div class="day-number">${date.getDate()}</div>
        `;
        DOM.dayHeaders.appendChild(head);
    });

    // Time Labels
    DOM.timeLabels.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const label = document.createElement('div');
        label.className = 'time-slot-label';
        label.textContent = `${i.toString().padStart(2, '0')}:00`;
        DOM.timeLabels.appendChild(label);
    }

    // Task Rendering
    DOM.dayColumns.forEach((col, idx) => {
        col.innerHTML = '';
        const dayDateStr = getLocalDateString(days[idx]);

        let dayTasks = Store.tasks.filter(t => {
            if (t.createdByUserId !== Store.currentUser.id) return false;
            if (t.completed) return false; // Don't show completed tasks in calendar
            // Task is visible if: start <= day <= end
            return t.date <= dayDateStr && (t.endDate || t.date) >= dayDateStr;
        });

        // Apply filters
        if (typeof applyFilters === 'function') {
            dayTasks = applyFilters(dayTasks);
        }

        dayTasks.forEach(task => {
            const card = createTaskCard(task, dayDateStr);
            col.appendChild(card);
        });
    });
}

function createTaskCard(task, currentDayStr) {
    const status = getTaskStatus(task);
    const isMultiDay = task.endDate && task.endDate !== task.date;
    const card = document.createElement('div');

    // Determine boundary days
    const isStartDay = task.date === currentDayStr;
    const isEndDay = (task.endDate || task.date) === currentDayStr;
    const isMiddleDay = isMultiDay && !isStartDay && !isEndDay;

    card.className = `task-card ${task.completed ? 'completed' : ''} ${status === 'overdue' ? 'overdue' : ''} ${status === 'completed_late' ? 'completed_late' : ''} ${isMultiDay ? 'multi-day' : ''}`;

    const [startH, startM] = task.startTime.split(':').map(Number);
    const [endH, endM] = task.endTime.split(':').map(Number);

    let top = 0;
    let height = 1440; // Default full day for middle days

    if (isStartDay && isEndDay) {
        // Single day task
        top = (startH * 60 + startM);
        height = ((endH - startH) * 60 + (endM - startM));
        card.style.zIndex = '10';
    } else if (isStartDay) {
        // First day of multi-day: start time to end of day
        top = (startH * 60 + startM);
        height = 1440 - top;
    } else if (isEndDay) {
        // Last day of multi-day: start of day to end time
        top = 0;
        height = (endH * 60 + endM);
    } else {
        // Middle day: full height
        top = 0;
        height = 1440;
    }

    card.style.top = `${top}px`;
    card.style.height = `${height}px`;
    card.style.backgroundColor = COLORS[task.color || 'purple'].bg;
    card.style.color = COLORS[task.color || 'purple'].text;
    card.style.borderLeftColor = status === 'completed_late' ? '#ef4444' : COLORS[task.color || 'purple'].text;

    let badge = '';
    if (status === 'overdue') badge = '<span class="status-badge" style="color:#ef4444">OVERDUE</span>';
    if (status === 'completed_on_time') badge = '<span class="status-badge" style="color:var(--pastel-green-text)">✓ DONE</span>';
    if (status === 'completed_late') badge = '<span class="status-badge" style="color:#ef4444">✓ LATE</span>';

    card.onclick = (e) => {
        if (!e.target.closest('.task-owner-avatar')) {
            openDetailPanel(task.id);
        }
    };

    // Build tags HTML
    let tagsHTML = '';
    if (task.tags && task.tags.length > 0) {
        const tagsStr = task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('');
        tagsHTML = `<div class="task-tags">${tagsStr}</div>`;
    }

    card.innerHTML = `
        <div style="position:relative">
            <div class="task-title" title="${task.description || ''}">${task.title}</div>
            <div class="task-time">${isMultiDay ? (isStartDay ? 'Starts ' + task.startTime : isEndDay ? 'Ends ' + task.endTime : 'Full Day') : task.startTime + ' - ' + task.endTime}</div>
            ${tagsHTML}
            ${badge}
        </div>
        <img src="${Store.currentUser.avatarUrl}" class="task-owner-avatar" title="Created by You">
    `;

    return card;
}

// --- TASK ACTIONS ---
DOM.addTaskBtn.onclick = () => {
    DOM.taskForm.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('task-end-date').value = '';
    DOM.deleteTaskBtn.style.display = 'none';
    DOM.completeTaskBtn.style.display = 'none';
    DOM.formError.style.display = 'none';

    // Reset tags
    Store.currentTaskTags = [];
    if (typeof renderTaskTags === 'function') renderTaskTags();
    if (typeof renderTagSuggestions === 'function') renderTagSuggestions();

    // Set default date to today in local time
    document.getElementById('task-date').value = getLocalDateString(new Date());

    DOM.taskModal.classList.add('active');
};

DOM.cancelTask.onclick = () => {
    Store.currentTaskTags = [];
    if (typeof renderTaskTags === 'function') renderTaskTags();
    DOM.taskModal.classList.remove('active');
};

DOM.taskForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const date = document.getElementById('task-date').value;
    const endDate = document.getElementById('task-end-date').value || date; // Use start date if end date not provided
    const startTime = document.getElementById('task-start').value;
    const endTime = document.getElementById('task-end').value;
    const color = document.getElementById('task-color').value;

    // VALIDATION: Prevent Past Tasks & Date range logic
    const now = new Date();
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startH, startM, 0, 0);
    const endDateTime = new Date(endDate); // Use endDate for end time comparison
    endDateTime.setHours(endH, endM, 0, 0);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    // Only block past-date if it's a NEW task
    if (!id && selectedDateObj < todayDate) {
        showError("You cannot create a task in the past.");
        return;
    }

    if (endDateTime < startDateTime) {
        showError("The end date/time cannot be before the start date/time.");
        return;
    }

    const oldTask = id ? Store.tasks.find(t => t.id === id) : null;

    const taskData = {
        id: id || Date.now().toString(),
        title,
        description,
        date,
        endDate,
        startTime,
        endTime,
        color,
        tags: Store.currentTaskTags || [], // Add tags
        completed: oldTask ? oldTask.completed : false,
        completedAt: oldTask ? oldTask.completedAt : null,
        comments: oldTask ? (oldTask.comments || []) : [], // Preserve comments
        createdByUserId: Store.currentUser.id,
        assignedUserIds: [Store.currentUser.id]
    };

    if (id) {
        const idx = Store.tasks.findIndex(t => t.id === id);
        Store.tasks[idx] = taskData;

        // If this task is active in detail panel, refresh it
        if (Store.activeTaskId === id) {
            openDetailPanel(id);
        }
    } else {
        Store.tasks.push(taskData);
    }

    Store.save();
    DOM.taskModal.classList.remove('active');

    // Update tag filters after saving
    if (typeof renderTagFilters === 'function') {
        if (Store.currentView === 'calendar') {
            renderTagFilters(false); // Active tasks only
        } else {
            renderTagFilters(true, DOM.historyTagFilterList); // Completed tasks only
        }
    }

    renderCalendar();
    renderSidebar();
};

function showError(msg) {
    DOM.formError.textContent = msg;
    DOM.formError.style.display = 'block';
}

function editTask(task) {
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-end-date').value = task.endDate || task.date;
    document.getElementById('task-start').value = task.startTime;
    document.getElementById('task-end').value = task.endTime;
    document.getElementById('task-color').value = task.color;

    // Load tags
    Store.currentTaskTags = task.tags || [];
    if (typeof renderTaskTags === 'function') renderTaskTags();
    if (typeof renderTagSuggestions === 'function') renderTagSuggestions();

    document.getElementById('modal-title').textContent = 'Task Details';
    DOM.deleteTaskBtn.style.display = 'block';
    DOM.completeTaskBtn.style.display = task.completed ? 'none' : 'block';
    DOM.formError.style.display = 'none';

    DOM.deleteTaskBtn.onclick = () => {
        Store.tasks = Store.tasks.filter(t => t.id !== task.id);
        Store.save();

        // Update tag filters after deletion
        if (typeof renderTagFilters === 'function') {
            if (Store.currentView === 'calendar') {
                renderTagFilters(false);
            } else {
                renderTagFilters(true, DOM.historyTagFilterList);
            }
        }

        // Auto-close detail panel if the deleted task was being viewed
        if (Store.activeTaskId === task.id) {
            closeDetailPanel();
        }

        DOM.taskModal.classList.remove('active');
        renderCalendar();
        renderSidebar();
    };

    DOM.completeTaskBtn.onclick = () => {
        const t = Store.tasks.find(tk => tk.id === task.id);
        t.completed = true;
        t.completedAt = new Date().toISOString();
        Store.save();
        DOM.taskModal.classList.remove('active');
        renderCalendar();
        renderSidebar();
    };

    DOM.taskModal.classList.add('active');
}

// --- NAVIGATION & DRAG ---
let isDragging = false;
let startX = 0;
const DRAG_THRESHOLD = 200; // Increased to slow down live flipping

const calendarView = document.querySelector('.calendar-view');

calendarView.onmousedown = (e) => {
    isDragging = true;
    startX = e.pageX;
};

window.onmousemove = (e) => {
    if (!isDragging) return;
    const currentX = e.pageX;
    const diffX = startX - currentX;

    // BUG FIX: Live changes - trigger change during drag
    if (Math.abs(diffX) > DRAG_THRESHOLD) {
        if (diffX > 0) {
            Store.currentDate.setDate(Store.currentDate.getDate() + 7);
        } else {
            Store.currentDate.setDate(Store.currentDate.getDate() - 7);
        }
        // Update startX so we can continue dragging multiple weeks
        startX = currentX;
        renderCalendar();
        renderSidebar();
    }
};

window.onmouseup = (e) => {
    isDragging = false;
};

DOM.prevWeek.onclick = () => {
    Store.currentDate.setDate(Store.currentDate.getDate() - 7);
    renderCalendar();
    renderSidebar();
};

DOM.nextWeek.onclick = () => {
    Store.currentDate.setDate(Store.currentDate.getDate() + 7);
    renderCalendar();
    renderSidebar();
};

// --- SIDEBAR ---
function renderSidebar() {
    const today = getLocalDateString(new Date());
    let userTasks = Store.tasks.filter(t => t.createdByUserId === Store.currentUser.id && !t.completed);

    // Apply filters
    if (typeof applyFilters === 'function') {
        userTasks = applyFilters(userTasks);
    }

    const todayTasks = userTasks.filter(t => {
        const start = t.date;
        const end = t.endDate || t.date;
        return today >= start && today <= end;
    });

    const upcomingTasks = userTasks.filter(t => t.date > today);

    DOM.todayList.innerHTML = todayTasks.length ? '' : '<p style="font-size:0.8rem; color:var(--text-muted)">No tasks for today</p>';
    todayTasks.forEach(t => DOM.todayList.appendChild(createMiniTask(t)));

    DOM.upcomingList.innerHTML = upcomingTasks.length ? '' : '<p style="font-size:0.8rem; color:var(--text-muted)">No upcoming tasks</p>';
    upcomingTasks.forEach(t => DOM.upcomingList.appendChild(createMiniTask(t)));
}

function toggleTaskCompletion(taskId, e) {
    if (e) e.stopPropagation();
    const task = Store.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        Store.save();

        // Update tag filters after task completion status changes
        if (typeof renderTagFilters === 'function') {
            renderTagFilters(false); // Always update calendar filters
            if (Store.currentView === 'history') {
                renderTagFilters(true, DOM.historyTagFilterList);
            }
        }

        if (Store.currentView === 'history') {
            renderHistory();
        } else {
            renderCalendar();
            renderSidebar();
        }
    }
}

// Update sidebar rendering to include click handler
function createMiniTask(task) {
    const status = getTaskStatus(task);
    const el = document.createElement('div');
    el.className = `mini-task-item ${task.completed ? 'completed' : ''} ${status === 'overdue' ? 'overdue' : ''}`;
    el.onclick = (e) => {
        if (!e.target.classList.contains('status-check')) {
            openDetailPanel(task.id);
        }
    };
    el.innerHTML = `
        <div class="status-check" onclick="toggleTaskCompletion('${task.id}', event)">${task.completed ? '✓' : ''}</div>
        <div style="flex:1">
            <div style="font-weight:600">${task.title}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">${task.startTime} - ${task.endTime}</div>
        </div>
        ${status === 'overdue' ? '<span style="color:#ef4444; font-size:0.7rem; font-weight:700">!</span>' : ''}
    `;
    return el;
}

// Attach global toggle function
window.toggleTaskCompletion = toggleTaskCompletion;

// --- DETAIL PANEL ---
function openDetailPanel(taskId) {
    const task = Store.tasks.find(t => t.id === taskId);
    if (!task) return;

    Store.activeTaskId = taskId;
    document.getElementById('detail-title').textContent = task.title;
    document.getElementById('detail-description').textContent = task.description || 'No description provided.';

    // Hook up edit button
    document.getElementById('edit-task-from-detail').onclick = () => {
        editTask(task);
    };

    renderComments(task);
    DOM.appContainer.classList.add('panel-active');
}

function closeDetailPanel() {
    DOM.appContainer.classList.remove('panel-active');
    Store.activeTaskId = null;
}

function renderComments(task) {
    const list = document.getElementById('comment-list');
    list.innerHTML = '';

    const comments = task.comments || [];
    if (comments.length === 0) {
        list.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted)">No updates yet.</p>';
        return;
    }

    comments.forEach(c => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `
            <div class="comment-meta">
                <strong>${c.userName}</strong>
                <span>${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="comment-content">${c.text}</div>
        `;
        list.appendChild(item);
    });
}

document.getElementById('post-comment-btn').onclick = () => {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text || !Store.activeTaskId) return;

    const task = Store.tasks.find(t => t.id === Store.activeTaskId);
    if (!task) return;

    if (!task.comments) task.comments = [];

    task.comments.push({
        userName: Store.currentUser.name,
        text,
        timestamp: Date.now()
    });

    Store.save();
    renderComments(task);
    input.value = '';
};

// Keyboard support
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDetailPanel();
        if (DOM.taskModal.classList.contains('active')) {
            Store.currentTaskTags = [];
            if (typeof renderTaskTags === 'function') renderTaskTags();
            DOM.taskModal.classList.remove('active');
        }
    }
});

document.getElementById('comment-input').onkeydown = (e) => {
    if (e.key === 'Enter') {
        document.getElementById('post-comment-btn').click();
    }
};

window.closeDetailPanel = closeDetailPanel;
window.openDetailPanel = openDetailPanel;

// --- HISTORY LOGIC ---
function renderHistory() {
    let completedTasks = Store.tasks
        .filter(t => t.createdByUserId === Store.currentUser.id && t.completed)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Apply tag filters
    if (Store.historyFilters.tags.length > 0) {
        completedTasks = completedTasks.filter(task => {
            if (!task.tags || !Array.isArray(task.tags)) return false;
            return Store.historyFilters.tags.every(filterTag => task.tags.includes(filterTag));
        });
    }

    DOM.historyStats.textContent = `${completedTasks.length} tasks completed`;
    DOM.historyList.innerHTML = completedTasks.length ? '' : '<p style="text-align:center; color:var(--text-muted); padding: 2rem;">No completed tasks yet.</p>';

    completedTasks.forEach(task => {
        const status = getTaskStatus(task);
        const item = document.createElement('div');
        item.className = 'history-item';
        item.onclick = () => openDetailPanel(task.id);

        const statusLabel = status === 'completed_late' ? 'Completed Late' : 'On Time';
        const statusClass = status === 'completed_late' ? 'status-late' : 'status-on-time';

        item.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-title">${task.title}</div>
                <div class="history-item-meta">
                    Completed on ${new Date(task.completedAt).toLocaleDateString()} at ${new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div class="history-item-status ${statusClass}">
                ${statusLabel}
            </div>
        `;
        DOM.historyList.appendChild(item);
    });
}

// --- POMODORO TOGGLE ---
function togglePomodoro() {
    Store.pomodoroVisible = !Store.pomodoroVisible;
    Store.save();
    updatePomodoroVisibility();
}

function updatePomodoroVisibility() {
    if (!DOM.pomodoroWidget) return;

    if (Store.pomodoroVisible) {
        DOM.pomodoroWidget.style.display = 'block';
        // Resume timer state if it exists
        if (window.PomodoroTimer && window.PomodoroTimer.wasRunningBeforeHide) {
            window.PomodoroTimer.start();
            window.PomodoroTimer.wasRunningBeforeHide = false;
        }
        if (DOM.togglePomodoroBtn) {
            DOM.togglePomodoroBtn.style.opacity = '1';
        }
    } else {
        // Pause timer if running
        if (window.PomodoroTimer && window.PomodoroTimer.isRunning) {
            window.PomodoroTimer.wasRunningBeforeHide = true;
            window.PomodoroTimer.pause();
        }
        DOM.pomodoroWidget.style.display = 'none';
        if (DOM.togglePomodoroBtn) {
            DOM.togglePomodoroBtn.style.opacity = '0.5';
        }
    }
}

window.togglePomodoro = togglePomodoro;
window.updatePomodoroVisibility = updatePomodoroVisibility;

// --- INIT ---
initAuth();
