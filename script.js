document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const clearAllBtn = document.getElementById('clearAll');
    const totalTasksEl = document.getElementById('totalTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const completedTasksEl = document.getElementById('completedTasks');

    // Load tasks from localStorage or initialize empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize the app
    initApp();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addTask();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active filter button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter tasks
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    clearAllBtn.addEventListener('click', clearAllTasks);

    // Functions
    function initApp() {
        renderTasks();
        updateStats();
    }

    function addTask() {
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            showNotification('Please enter a task!', 'error');
            taskInput.focus();
            return;
        }

        // Create new task object
        const newTask = {
            id: Date.now(), // Simple unique ID
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Add to tasks array
        tasks.push(newTask);

        // Save to localStorage
        saveTasks();

        // Clear input
        taskInput.value = '';
        taskInput.focus();

        // Update UI
        renderTasks();
        updateStats();

        // Show success notification
        showNotification('Task added successfully!', 'success');
    }

    function toggleTask(id) {
        // Find and toggle task completion
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });

        saveTasks();
        renderTasks();
        updateStats();
    }

    function deleteTask(id) {
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        // Remove task from array
        tasks = tasks.filter(task => task.id !== id);

        saveTasks();
        renderTasks();
        updateStats();

        showNotification('Task deleted!', 'info');
    }

    function clearCompletedTasks() {
        if (!tasks.some(task => task.completed)) {
            showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('Completed tasks cleared!', 'success');
        }
    }

    function clearAllTasks() {
        if (tasks.length === 0) {
            showNotification('No tasks to clear!', 'info');
            return;
        }

        if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone!')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateStats();
            showNotification('All tasks cleared!', 'success');
        }
    }

    function renderTasks() {
        // Clear current list
        taskList.innerHTML = '';

        // Filter tasks based on current filter
        let filteredTasks = tasks;

        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        // If no tasks, show message
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #888;">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p style="font-size: 1.2rem;">
                        ${currentFilter === 'all' ? 'No tasks yet!' :
                    currentFilter === 'pending' ? 'No pending tasks!' :
                        'No completed tasks!'}
                    </p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">
                        ${currentFilter === 'all' ? 'Add your first task above!' :
                    currentFilter === 'pending' ? 'All tasks are completed!' :
                        'Complete some tasks to see them here!'}
                    </p>
                </div>
            `;
            taskList.appendChild(emptyMessage);
            return;
        }

        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <button class="delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Add event listeners to the task
            const checkbox = taskItem.querySelector('.task-checkbox');
            const deleteBtn = taskItem.querySelector('.delete-btn');

            checkbox.addEventListener('click', () => toggleTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(taskItem);
        });
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        totalTasksEl.textContent = total;
        pendingTasksEl.textContent = pending;
        completedTasksEl.textContent = completed;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function showNotification(message, type) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

        // Set background color based on type
        const bgColors = {
            success: '#2ed573',
            error: '#ff4757',
            info: '#3742fa',
            warning: '#ffa502'
        };

        notification.style.backgroundColor = bgColors[type] || '#3742fa';

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Helper function to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add CSS for notification animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});