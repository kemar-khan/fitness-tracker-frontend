document.addEventListener('DOMContentLoaded', function () {
    const logsTableBody = document.getElementById('logsTableBody');
    const addLogForm = document.getElementById('addLogForm');
    const activityTypeSelect = document.getElementById('activityType');
    const stepsField = document.getElementById('stepsField');

    // Initial dummy data if storage is empty
    const dummyLogs = [
        { id: 1, date: '2024-03-12', time: '18:30', name: 'Evening Run', type: 'Workout', duration: 45, steps: 8240 },
        { id: 2, date: '2024-03-10', time: '10:00', name: 'Strength Training', type: 'Workout', duration: 60, steps: 1200 },
        { id: 3, date: '2024-03-09', time: '07:15', name: 'Morning Walk', type: 'Steps', duration: 30, steps: 4500 },
        { id: 4, date: '2024-03-07', time: '16:45', name: 'Cycling', type: 'Workout', duration: 75, steps: '--' },
        { id: 5, date: '2024-03-05', time: '09:00', name: 'Yoga Session', type: 'Other', duration: 35, steps: 300 }
    ];

    // Initialize logs from localStorage
    let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || dummyLogs;

    // Show/Hide steps field based on activity type
    if (activityTypeSelect) {
        activityTypeSelect.addEventListener('change', function () {
            if (this.value === 'Steps') {
                stepsField.style.display = 'block';
            } else {
                stepsField.style.display = 'none';
            }
        });
    }

    // Render logs to table (if table exists)
    function renderLogs() {
        if (!logsTableBody) return;

        const isDashboard = logsTableBody.classList.contains('small');
        logsTableBody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');
            if (isDashboard) {
                // Condensed version for Dashboard
                tr.innerHTML = `
                    <td>${formatDateShort(log.date)}</td>
                    <td>${log.name}</td>
                    <td>${log.duration}m</td>
                    <td>${log.steps}</td>
                    <td>
                        <a href="#" class="action-btn btn-delete py-0" onclick="deleteLog(${log.id})"><i class="bi bi-trash"></i></a>
                    </td>
                `;
            } else {
                // Full version for Fitness Logs page
                tr.innerHTML = `
                    <td>${formatDate(log.date)}</td>
                    <td>${log.time}</td>
                    <td>${log.name}</td>
                    <td><span class="badge ${getBadgeClass(log.type)}">${log.type}</span></td>
                    <td>${log.duration} min</td>
                    <td>${log.steps}</td>
                    <td>
                        <a href="#" class="action-btn btn-edit" onclick="editLog(${log.id})"><i class="bi bi-pencil"></i></a>
                        <a href="#" class="action-btn btn-delete" onclick="deleteLog(${log.id})"><i class="bi bi-trash"></i></a>
                    </td>
                `;
            }
            logsTableBody.appendChild(tr);
        });
    }

    function formatDate(dateStr) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    function formatDateShort(dateStr) {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    function getBadgeClass(type) {
        switch (type) {
            case 'Workout': return 'bg-primary';
            case 'Steps': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    // Handle form submission
    if (addLogForm) {
        addLogForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const newLog = {
                id: Date.now(),
                name: document.getElementById('activityName').value,
                type: document.getElementById('activityType').value,
                duration: parseInt(document.getElementById('duration').value),
                steps: document.getElementById('steps').value || '--',
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                notes: document.getElementById('notes').value
            };

            logs.unshift(newLog); // Add to beginning
            localStorage.setItem('fitnessLogs', JSON.stringify(logs));

            renderLogs();

            // Close modal
            const modalElement = document.getElementById('addLogModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            // Reset form
            addLogForm.reset();
            if (stepsField) stepsField.style.display = 'none';

            // Trigger custom event for other scripts (like charts) to update
            window.dispatchEvent(new Event('logsUpdated'));
        });
    }

    // Global action functions (prototypes)
    window.editLog = function (id) {
        alert('Edit functionality triggered for log ID: ' + id);
    };

    window.deleteLog = function (id) {
        if (confirm('Are you sure you want to delete this log?')) {
            logs = logs.filter(l => l.id !== id);
            localStorage.setItem('fitnessLogs', JSON.stringify(logs));
            renderLogs();
            window.dispatchEvent(new Event('logsUpdated'));
        }
    };

    // Initial render
    renderLogs();
});