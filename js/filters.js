/**
 * Filter logic for FitPulse Fitness Tracker
 */

export const filterManager = {
    getFilters() {
        return {
            from: document.getElementById('filterFrom')?.value || null,
            to: document.getElementById('filterTo')?.value || null,
            type: document.getElementById('filterType')?.value || 'All'
        };
    },

    apply(data, filters) {
        return data.filter(item => {
            const dateMatch = (!filters.from || item.date >= filters.from) && 
                              (!filters.to || item.date <= filters.to);
            const typeMatch = (filters.type === 'All' || item.category === filters.type);
            return dateMatch && typeMatch;
        });
    }
};
