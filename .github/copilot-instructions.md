# AI Coding Instructions - GPlanner

## Project Overview

**GPlanner** is a vanilla JavaScript weekly task planner with a built-in Pomodoro timer. It's a single-page application (SPA) with client-side state management using localStorage and modular JavaScript files for different features.

### Key Architecture

- **No build system**: Pure vanilla JS/HTML/CSS - changes are immediately reflected
- **Modular files**: `app.js` (core), `pomodoro.js` (timer), `tags-filters.js` (filtering)
- **State management**: Global `Store` object in `app.js` persists to localStorage
- **UI patterns**: Modal forms, sidebar filters, draggable widgets, tabbed views (Calendar/History)

## Essential Patterns & Conventions

### State & Data Flow

**The Store object** (in [app.js](app.js)) is the single source of truth:
- `currentUser`, `tasks`, `availableTags`, `activeFilters` stored here
- Always call `Store.save()` after mutations to persist to localStorage
- `Store.currentTaskTags` is a temporary array for the task form being edited

**Key fields in task objects**:
```javascript
{
  id, title, description, date, endDate, startTime, endTime,
  color, tags: [], completed, completedAt,
  createdByUserId, assignedUserIds, comments: [],
  pomodoroSessions, timeSpent  // Added by Pomodoro module
}
```

### Critical Functions & Responsibilities

| File | Key Functions | Responsibilities |
|------|---------------|------------------|
| [app.js](app.js) | `getTaskStatus()`, `renderCalendar()`, `createTaskCard()` | Calendar rendering, task modal, auth, week navigation |
| [pomodoro.js](pomodoro.js) | `PomodoroTimer.start()`, `complete()`, `linkTask()` | Timer logic, task linking, state persistence, dragging |
| [tags-filters.js](tags-filters.js) | `applyFilters()`, `renderTagFilters()`, `initTagInput()` | All filtering/tagging UI and logic |

### Multi-day Task Rendering

Tasks can span multiple days using `date` (start) and `endDate` (end). The calendar calculates position/height based on:
- Single-day: position from `startTime`, height from duration
- First day: position from `startTime`, height to end of day (1440 minutes)
- Middle days: full height (1440px)
- Last day: height from start of day to `endTime`

See [app.js](app.js#L339-L365) for positioning logic in `createTaskCard()`.

### Tag Filtering Logic

**AND logic** - tasks must have ALL selected filter tags:
```javascript
// In applyFilters() - tags-filters.js
return Store.activeFilters.tags.every(filterTag => task.tags.includes(filterTag));
```

### Date Handling (CRITICAL Bug Fix)

Use `getLocalDateString(date)` helper to avoid timezone issues:
```javascript
// ALWAYS use this format: YYYY-MM-DD
const dateStr = getLocalDateString(date); // Returns "2025-01-20"
// NOT new Date().toISOString() which adds timezone offset
```

## Common Workflows

### Adding Features Across Files

1. **New task field** → Add to task object in `renderCalendar()` and `taskForm.onsubmit()` (app.js)
2. **New filter type** → Add to `Store.activeFilters` + update `applyFilters()` (tags-filters.js) + UI in HTML
3. **Pomodoro tracking** → Use `linkedTaskId` to find task, update `task.pomodoroSessions` and `task.timeSpent`

### DOM Element Caching

All DOM refs cached in `DOM` object (app.js) - update when adding new elements:
```javascript
DOM.newElement = document.getElementById('new-element-id');
```

### Modal & Panel Management

- Task Modal: `DOM.taskModal.classList.add('active')` to show
- Detail Panel: `openDetailPanel(taskId)` and `closeDetailPanel()` (functions at end of app.js)
- Form reset: `DOM.taskForm.reset()` + `Store.currentTaskTags = []` + `renderTaskTags()`

## Important Edge Cases

1. **Validation order** (in task form):
   - Check date is not in past (new tasks only)
   - Check endDate/Time >= startDate/Time
   - Use `new Date(dateString)` with local date strings (YYYY-MM-DD format)

2. **Multi-day visual**: When rendering, check `isStartDay`, `isEndDay`, `isMiddleDay` to apply correct styling/height

3. **Task status**: `getTaskStatus()` returns `'active'`, `'overdue'`, `'completed_on_time'`, `'completed_late'` - determines styling

4. **Pomodoro persistence**: State saved on every tick + position saved on drag end (localStorage keys: `pomodoro_state`, `pomodoro_position`, `pomodoro_minimized`)

## Module Communication

- **app.js** → **pomodoro.js**: Via `Store.tasks` and `Store.currentUser` (reads linked task)
- **app.js** → **tags-filters.js**: Via `Store.activeFilters` (reads filter state); imports `applyFilters()`
- **tags-filters.js** → **app.js**: Calls `renderCalendar()` and `renderSidebar()` to update UI

All cross-module functions exposed to `window` at end of `tags-filters.js`.

## Testing/Debugging

- **Admin access**: Login with email=`admin`, password=`admin` (auto-creates user)
- **LocalStorage inspection**: Open DevTools → Application → LocalStorage for `planner_*` keys
- **Debug task rendering**: Check `Store.tasks` for correct date format and status calculation
