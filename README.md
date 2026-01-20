# 📅 ProPlanner

A modern, responsive web-based planner application with calendar view, task management, and Pomodoro timer functionality.

## ✨ Features

- **📅 Weekly Calendar View** - Visual weekly planning with drag-and-drop navigation
- **📝 Task Management** - Create, edit, complete, and delete tasks with tags and categories
- **🏷️ Smart Tag Filtering** - Filter tasks by tags, status, and completion state
- **⏱️ Pomodoro Timer** - Built-in focus timer with task linking and session tracking
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **💾 Local Storage** - All data persists locally in your browser
- **🎨 Modern UI** - Clean, intuitive interface with smooth animations

## 🚀 Live Demo

[View Live Demo](https://yourusername.github.io/proplanner/)

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No frameworks, pure JS
- **Local Storage API** - Data persistence
- **CSS Variables** - Theme management

## 📱 Features Overview

### Calendar View
- Interactive weekly calendar with time slots
- Task cards with color coding and status indicators
- Drag navigation between weeks
- Multi-day task support

### Task Management
- Create tasks with title, description, dates, and times
- Assign tags and color categories
- Mark tasks as complete/incomplete
- Comment system for task updates
- Task history tracking

### Filtering & Organization
- Filter by status (Active, Completed, Overdue)
- Tag-based filtering with smart suggestions
- Separate filters for calendar and history views
- Quick filter clearing

### Pomodoro Timer
- 25-minute work sessions with 5-minute breaks
- Task linking for productivity tracking
- Visual progress indicators
- Session count tracking
- Draggable widget interface

## 🎯 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- No server required - runs entirely in the browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/proplanner.git
   cd proplanner
   ```

2. **Open in browser**
   - Open `index.html` in your web browser
   - No build process required!

### Development

The app is built with vanilla JavaScript, so you can:
- Edit files directly in any code editor
- Open `index.html` to see changes instantly
- No build tools or dependencies needed

## 📂 Project Structure

```
proplanner/
├── index.html          # Main HTML file
├── style.css           # All styling
├── app.js             # Main application logic
├── pomodoro.js        # Pomodoro timer functionality
├── tags-filters.js    # Tag filtering system
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🎨 Customization

### Colors
Edit CSS variables in `style.css`:
```css
:root {
    --primary: #4ade80;        /* Main green color */
    --secondary: #6366f1;      /* Purple accent */
    --bg-main: #f9fafb;        /* Background */
    --text-main: #1f2937;      /* Text color */
}
```

### Timer Settings
Modify in `pomodoro.js`:
```javascript
workDuration: 25 * 60,    // Work session length
breakDuration: 5 * 60,    // Break length
```

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

Feel free to open an issue or submit a pull request!

---

**Built with ❤️ using vanilla JavaScript**