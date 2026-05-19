/**
 * Modal management for FitPulse Fitness Tracker
 */

export const modalManager = {
    modal: document.getElementById('addLogModal'),
    form: document.getElementById('addLogForm'),
    title: document.getElementById('modalTitle'),
    editIdField: document.getElementById('editingId'),
    stepsField: document.getElementById('stepsField'),
    activityTypeSelect: document.getElementById('activityType'),

    init() {
        if (this.activityTypeSelect) {
            this.activityTypeSelect.addEventListener('change', () => {
                this.toggleStepsField(this.activityTypeSelect.value);
            });
        }
    },

    open(data = null) {
        if (!this.modal || !this.form) return;

        if (data) {
            this.title.textContent = 'Edit Activity';
            this.editIdField.value = data.id;
            document.getElementById('activityName').value = data.activityName || '';
            document.getElementById('activityType').value = data.category || 'Workout';
            document.getElementById('duration').value = data.duration || '';
            document.getElementById('steps').value = data.steps || '';
            document.getElementById('date').value = data.date || '';
            document.getElementById('time').value = data.time || '';
            document.getElementById('notes').value = data.notes || '';
            this.toggleStepsField(data.category);
        } else {
            this.title.textContent = 'Log Activity';
            this.form.reset();
            this.editIdField.value = '';
            this.toggleStepsField('Workout');
        }

        this.modal.style.display = 'flex';
        this.modal.classList.add('fade-in');
    },

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        this.form.reset();
    },

    toggleStepsField(category) {
        if (this.stepsField) {
            this.stepsField.style.display = category === 'Steps' ? 'block' : 'none';
        }
    }
};
