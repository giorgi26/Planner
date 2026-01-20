/**
 * Tags & Filters Module
 */

// --- TAG INPUT HANDLING ---
function initTagInput() {
    if (!DOM.tagInput) return;

    // Handle Enter key to add tags
    DOM.tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = DOM.tagInput.value.trim().toLowerCase();
            if (tag && !Store.currentTaskTags.includes(tag)) {
                Store.currentTaskTags.push(tag);
                Store.addTag(tag);
                renderTaskTags();
                renderTagSuggestions();
            }
            DOM.tagInput.value = '';
        }
    });

    // Show suggestions as user types
    DOM.tagInput.addEventListener('input', () => {
        renderTagSuggestions();
    });
}

function renderTaskTags() {
    if (!DOM.tagsDisplay) return;

    DOM.tagsDisplay.innerHTML = '';
    Store.currentTaskTags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `
            <span>${tag}</span>
            <span class="remove-tag" onclick="removeTaskTag('${tag}')">×</span>
        `;
        DOM.tagsDisplay.appendChild(chip);
    });
}

function removeTaskTag(tag) {
    Store.currentTaskTags = Store.currentTaskTags.filter(t => t !== tag);
    renderTaskTags();
    renderTagSuggestions();
}

function renderTagSuggestions() {
    if (!DOM.tagSuggestions) return;

    const input = DOM.tagInput.value.trim().toLowerCase();
    const suggestions = Store.availableTags
        .filter(tag => !Store.currentTaskTags.includes(tag))
        .filter(tag => !input || tag.includes(input))
        .slice(0, 5);

    DOM.tagSuggestions.innerHTML = '';
    if (suggestions.length > 0) {
        suggestions.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-suggestion';
            btn.textContent = tag;
            btn.type = 'button';
            btn.onclick = () => {
                if (!Store.currentTaskTags.includes(tag)) {
                    Store.currentTaskTags.push(tag);
                    renderTaskTags();
                    renderTagSuggestions();
                }
                DOM.tagInput.value = '';
            };
            DOM.tagSuggestions.appendChild(btn);
        });
    }
}

// --- FILTER HANDLING ---
function initFilters() {
    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Store.activeFilters.status = btn.dataset.status;
            updateFilterDisplay();
            renderCalendar();
            renderSidebar();
        });
    });

    // Clear filters button
    if (DOM.clearFilters) {
        DOM.clearFilters.addEventListener('click', () => {
            Store.activeFilters.status = 'all';
            Store.activeFilters.tags = [];
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-status="all"]').classList.add('active');
            renderTagFilters(false);
            updateFilterDisplay();
            renderCalendar();
            renderSidebar();
        });
    }

    // Clear history filters button
    if (DOM.clearHistoryFilters) {
        DOM.clearHistoryFilters.addEventListener('click', () => {
            Store.historyFilters.tags = [];
            renderTagFilters(true, DOM.historyTagFilterList);
            updateHistoryFilterDisplay();
            renderHistory();
        });
    }
}

function renderTagFilters(filterCompleted = null, targetContainer = null) {
    const container = targetContainer || DOM.tagFilterList;
    const activeFilters = targetContainer === DOM.historyTagFilterList ? Store.historyFilters : Store.activeFilters;

    if (!container) return;

    // Get tags from tasks based on completion status
    // filterCompleted: null = all tasks, false = active only, true = completed only
    const tagCounts = {};
    Store.tasks
        .filter(t => t.createdByUserId === Store.currentUser.id)
        .filter(t => filterCompleted === null || t.completed === filterCompleted)
        .forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

    container.innerHTML = '';

    if (Object.keys(tagCounts).length === 0) {
        container.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted); margin:0">No tags yet</p>';
        return;
    }

    Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .forEach(([tag, count]) => {
            const filter = document.createElement('div');
            filter.className = `tag-filter ${activeFilters.tags.includes(tag) ? 'active' : ''}`;
            filter.innerHTML = `
                <span>${tag}</span>
                <span class="tag-filter-count">(${count})</span>
            `;
            filter.onclick = () => toggleTagFilter(tag, targetContainer === DOM.historyTagFilterList);
            container.appendChild(filter);
        });
}

function toggleTagFilter(tag, isHistoryFilter = false) {
    const targetFilters = isHistoryFilter ? Store.historyFilters : Store.activeFilters;

    if (targetFilters.tags.includes(tag)) {
        targetFilters.tags = targetFilters.tags.filter(t => t !== tag);
    } else {
        targetFilters.tags.push(tag);
    }

    if (isHistoryFilter) {
        renderTagFilters(true, DOM.historyTagFilterList);
        updateHistoryFilterDisplay();
        renderHistory();
    } else {
        renderTagFilters(false);
        updateFilterDisplay();
        renderCalendar();
        renderSidebar();
    }
}

function updateFilterDisplay() {
    const hasActiveFilters = Store.activeFilters.status !== 'all' || Store.activeFilters.tags.length > 0;
    if (DOM.clearFilters) {
        DOM.clearFilters.style.display = hasActiveFilters ? 'block' : 'none';
    }
}

function updateHistoryFilterDisplay() {
    const hasActiveFilters = Store.historyFilters.tags.length > 0;
    if (DOM.clearHistoryFilters) {
        DOM.clearHistoryFilters.style.display = hasActiveFilters ? 'block' : 'none';
    }
}

// --- TASK FILTERING ---
function applyFilters(tasks) {
    let filtered = tasks;

    // Status filter
    if (Store.activeFilters.status !== 'all') {
        filtered = filtered.filter(task => {
            const status = getTaskStatus(task);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskStartDate = new Date(task.date);
            taskStartDate.setHours(0, 0, 0, 0);

            switch (Store.activeFilters.status) {
                case 'active':
                    // Only show tasks that have started (today or past) and are not completed or overdue
                    return !task.completed && status !== 'overdue' && taskStartDate <= today;
                case 'completed':
                    return task.completed;
                case 'overdue':
                    return status === 'overdue';
                default:
                    return true;
            }
        });
    }

    // Tag filter (AND logic - task must have ALL selected tags)
    if (Store.activeFilters.tags.length > 0) {
        filtered = filtered.filter(task => {
            if (!task.tags || !Array.isArray(task.tags)) return false;
            return Store.activeFilters.tags.every(filterTag => task.tags.includes(filterTag));
        });
    }

    return filtered;
}

// Make functions globally available
window.removeTaskTag = removeTaskTag;
window.initTagInput = initTagInput;
window.initFilters = initFilters;
window.renderTagFilters = renderTagFilters;
window.renderTaskTags = renderTaskTags;
window.renderTagSuggestions = renderTagSuggestions;
window.applyFilters = applyFilters;
