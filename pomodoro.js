/**
 * Pomodoro Timer Module
 */

const PomodoroTimer = {
    workDuration: 25 * 60, // 25 minutes in seconds
    breakDuration: 5 * 60, // 5 minutes in seconds
    timeRemaining: 25 * 60,
    isRunning: false,
    mode: 'work', // 'work' or 'break'
    sessionsCompleted: 0,
    linkedTaskId: null,
    intervalId: null,
    wasRunningBeforeHide: false, // Track if timer was running when hidden

    // DOM Elements
    widget: null,
    timeDisplay: null,
    modeDisplay: null,
    sessionsDisplay: null,
    startBtn: null,
    pauseBtn: null,
    resetBtn: null,
    minimizeBtn: null,
    taskSelect: null,

    init() {
        this.widget = document.getElementById('pomodoro-widget');
        this.timeDisplay = document.getElementById('pomodoro-time');
        this.modeDisplay = document.getElementById('pomodoro-mode');
        this.sessionsDisplay = document.getElementById('pomodoro-sessions-count');
        this.startBtn = document.getElementById('pomodoro-start');
        this.pauseBtn = document.getElementById('pomodoro-pause');
        this.resetBtn = document.getElementById('pomodoro-reset');
        this.minimizeBtn = document.getElementById('pomodoro-minimize');
        this.taskSelect = document.getElementById('pomodoro-task-select');

        if (!this.widget) return;

        // Event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        this.taskSelect.addEventListener('change', (e) => this.linkTask(e.target.value));

        // Enable dragging
        this.initDrag();

        // Load saved state
        this.loadState();
        this.updateDisplay();
        this.updateTaskList();
    },

    initDrag() {
        const header = this.widget.querySelector('.pomodoro-header');
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        // Load saved position
        const savedPos = localStorage.getItem('pomodoro_position');
        if (savedPos) {
            const { x, y } = JSON.parse(savedPos);
            this.widget.style.right = 'auto';
            this.widget.style.bottom = 'auto';
            this.widget.style.left = x + 'px';
            this.widget.style.top = y + 'px';
        }

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = this.widget.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();

                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;

                // Keep widget within viewport
                const maxX = window.innerWidth - this.widget.offsetWidth;
                const maxY = window.innerHeight - this.widget.offsetHeight;

                const boundedX = Math.max(0, Math.min(x, maxX));
                const boundedY = Math.max(0, Math.min(y, maxY));

                this.widget.style.right = 'auto';
                this.widget.style.bottom = 'auto';
                this.widget.style.left = boundedX + 'px';
                this.widget.style.top = boundedY + 'px';
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';

                // Save position
                const rect = this.widget.getBoundingClientRect();
                localStorage.setItem('pomodoro_position', JSON.stringify({
                    x: rect.left,
                    y: rect.top
                }));
            }
        });

        // Touch support for mobile
        header.addEventListener('touchstart', (e) => {
            isDragging = true;
            const rect = this.widget.getBoundingClientRect();
            offsetX = e.touches[0].clientX - rect.left;
            offsetY = e.touches[0].clientY - rect.top;
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();

                const x = e.touches[0].clientX - offsetX;
                const y = e.touches[0].clientY - offsetY;

                const maxX = window.innerWidth - this.widget.offsetWidth;
                const maxY = window.innerHeight - this.widget.offsetHeight;

                const boundedX = Math.max(0, Math.min(x, maxX));
                const boundedY = Math.max(0, Math.min(y, maxY));

                this.widget.style.right = 'auto';
                this.widget.style.bottom = 'auto';
                this.widget.style.left = boundedX + 'px';
                this.widget.style.top = boundedY + 'px';
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                const rect = this.widget.getBoundingClientRect();
                localStorage.setItem('pomodoro_position', JSON.stringify({
                    x: rect.left,
                    y: rect.top
                }));
            }
        });
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.widget.classList.add('running');
        this.startBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');

        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            if (this.timeRemaining <= 0) {
                this.complete();
            }

            this.saveState();
        }, 1000);
    },

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.widget.classList.remove('running');
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.saveState();
    },

    reset() {
        this.pause();
        this.timeRemaining = this.mode === 'work' ? this.workDuration : this.breakDuration;
        this.updateDisplay();
        this.saveState();
    },

    complete() {
        this.pause();

        // Play notification sound (optional - browser notification)
        this.notify();

        if (this.mode === 'work') {
            // Work session completed
            this.sessionsCompleted++;
            this.sessionsDisplay.textContent = this.sessionsCompleted;

            // Track time on linked task
            if (this.linkedTaskId && typeof Store !== 'undefined') {
                const task = Store.tasks.find(t => t.id === this.linkedTaskId);
                if (task) {
                    task.pomodoroSessions = (task.pomodoroSessions || 0) + 1;
                    task.timeSpent = (task.timeSpent || 0) + 25; // 25 minutes
                    Store.save();
                }
            }

            // Switch to break
            this.mode = 'break';
            this.timeRemaining = this.breakDuration;
            this.widget.classList.remove('work');
            this.widget.classList.add('break');
            this.modeDisplay.textContent = 'Break';
        } else {
            // Break completed, back to work
            this.mode = 'work';
            this.timeRemaining = this.workDuration;
            this.widget.classList.remove('break');
            this.widget.classList.add('work');
            this.modeDisplay.textContent = 'Work';
        }

        this.updateDisplay();
        this.saveState();
    },

    notify() {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = this.mode === 'work' ? 'Work Session Complete!' : 'Break Time Over!';
            const body = this.mode === 'work' ? 'Time for a break!' : 'Back to work!';
            new Notification(title, { body, icon: '/favicon.ico' });
        }

        // Visual notification
        document.title = this.mode === 'work' ? '✓ Break Time!' : '✓ Back to Work!';
        setTimeout(() => {
            document.title = 'GPlanner';
        }, 3000);
    },

    toggleMinimize() {
        this.widget.classList.toggle('minimized');
        this.minimizeBtn.textContent = this.widget.classList.contains('minimized') ? '+' : '−';
        localStorage.setItem('pomodoro_minimized', this.widget.classList.contains('minimized'));
    },

    linkTask(taskId) {
        this.linkedTaskId = taskId || null;
        this.saveState();
    },

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    updateTaskList() {
        if (!this.taskSelect || typeof Store === 'undefined') return;

        // Get active tasks
        const activeTasks = Store.tasks.filter(t =>
            t.createdByUserId === Store.currentUser.id &&
            !t.completed
        );

        // Clear and rebuild options
        this.taskSelect.innerHTML = '<option value="">None</option>';
        activeTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            if (task.id === this.linkedTaskId) {
                option.selected = true;
            }
            this.taskSelect.appendChild(option);
        });
    },

    saveState() {
        const state = {
            timeRemaining: this.timeRemaining,
            mode: this.mode,
            sessionsCompleted: this.sessionsCompleted,
            linkedTaskId: this.linkedTaskId,
            isRunning: this.isRunning
        };
        localStorage.setItem('pomodoro_state', JSON.stringify(state));
    },

    loadState() {
        const saved = localStorage.getItem('pomodoro_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.timeRemaining = state.timeRemaining || this.workDuration;
                this.mode = state.mode || 'work';
                this.sessionsCompleted = state.sessionsCompleted || 0;
                this.linkedTaskId = state.linkedTaskId || null;

                // Don't auto-resume running state
                this.isRunning = false;

                // Update UI
                this.widget.classList.remove('work', 'break');
                this.widget.classList.add(this.mode);
                this.modeDisplay.textContent = this.mode === 'work' ? 'Work' : 'Break';
                this.sessionsDisplay.textContent = this.sessionsCompleted;
            } catch (e) {
                console.error('Failed to load pomodoro state:', e);
            }
        }

        // Load minimized state
        const minimized = localStorage.getItem('pomodoro_minimized') === 'true';
        if (minimized) {
            this.widget.classList.add('minimized');
            this.minimizeBtn.textContent = '+';
        }
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof Store !== 'undefined' && Store.currentUser) {
            PomodoroTimer.init();
            PomodoroTimer.requestNotificationPermission();
        }
    });
} else {
    if (typeof Store !== 'undefined' && Store.currentUser) {
        PomodoroTimer.init();
        PomodoroTimer.requestNotificationPermission();
    }
}

// Export for use in other modules
window.PomodoroTimer = PomodoroTimer;
