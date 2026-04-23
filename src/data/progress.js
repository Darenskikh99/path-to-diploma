export const GameProgress = {
    courses: { 1: false, 2: false, 3: false, 4: false },
    
    load() {
        const saved = localStorage.getItem('diplomaProgress');
        if (saved) {
            try {
                this.courses = JSON.parse(saved);
            } catch (e) {
                console.warn('Failed to load progress');
            }
        }
    },
    
    save() {
        localStorage.setItem('diplomaProgress', JSON.stringify(this.courses));
    },
    
    complete(course) {
        this.courses[course] = true;
        this.save();
    },
    
    allCompleted() {
        return this.courses[1] && this.courses[2] && this.courses[3] && this.courses[4];
    },
    
    getCompletedCount() {
        return Object.values(this.courses).filter(v => v).length;
    },
    
    reset() {
        this.courses = { 1: false, 2: false, 3: false, 4: false };
        this.save();
    }
};