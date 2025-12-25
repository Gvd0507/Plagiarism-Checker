// Plagiarism Detection Application
// Based on Jaccard Similarity Algorithm from plag.java

class PlagiarismDetector {
    constructor() {
        this.referenceFile = null;
        this.studentFiles = [];
        this.initTheme();
        this.init();
    }

    initTheme() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.checked = savedTheme === 'dark';
        }
    }

    init() {
        // Get DOM elements
        this.referenceInput = document.getElementById('referenceFile');
        this.studentInput = document.getElementById('studentFiles');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.referenceName = document.getElementById('referenceName');
        this.studentNames = document.getElementById('studentNames');
        this.themeToggle = document.getElementById('themeToggle');

        // Event listeners
        this.referenceInput.addEventListener('change', (e) => this.handleReferenceUpload(e));
        this.studentInput.addEventListener('change', (e) => this.handleStudentUpload(e));
        this.analyzeBtn.addEventListener('click', () => this.analyzePlagiarism());
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
    }

    // Read file and extract words (mimics readFile from plag.java)
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                // Convert to lowercase and remove non-alphabetic characters
                const cleanedText = text.toLowerCase().replace(/[^a-z ]/g, '');
                // Split into words and filter empty strings
                const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
                resolve(words);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Calculate similarity using Jaccard Index (mimics calculateSimilarity from plag.java)
    calculateSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        if (union.size === 0) return 0;
        
        return (intersection.size / union.size) * 100;
    }

    handleReferenceUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.referenceFile = file;
            this.referenceName.textContent = `✓ ${file.name}`;
            this.updateAnalyzeButton();
        }
    }

    handleStudentUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            this.studentFiles = files;
            const fileNames = files.map(f => f.name).join(', ');
            this.studentNames.textContent = `✓ ${files.length} file${files.length > 1 ? 's' : ''} selected: ${fileNames}`;
            this.updateAnalyzeButton();
        }
    }

    updateAnalyzeButton() {
        this.analyzeBtn.disabled = !(this.referenceFile && this.studentFiles.length > 0);
    }

    async analyzePlagiarism() {
        if (!this.referenceFile || this.studentFiles.length === 0) {
            alert('Please upload both reference and student files');
            return;
        }

        // Show loading state
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.innerHTML = 'Analyzing<span class="loading"></span>';

        try {
            // Read reference file
            const referenceWords = await this.readFile(this.referenceFile);
            const referenceSet = new Set(referenceWords);

            // Analyze each student file
            const results = [];
            for (const file of this.studentFiles) {
                const studentWords = await this.readFile(file);
                const studentSet = new Set(studentWords);
                
                const similarity = this.calculateSimilarity(referenceSet, studentSet);
                
                results.push({
                    fileName: file.name,
                    similarity: similarity,
                    wordCount: studentWords.length,
                    uniqueWords: studentSet.size,
                    commonWords: new Set([...referenceSet].filter(x => studentSet.has(x))).size
                });
            }

            // Sort by similarity (highest first)
            results.sort((a, b) => b.similarity - a.similarity);

            // Display results
            this.displayResults(results);

        } catch (error) {
            alert('Error analyzing files: ' + error.message);
            console.error(error);
        } finally {
            // Reset button
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = 'Analyze Plagiarism';
        }
    }

    displayResults(results) {
        this.resultsContainer.innerHTML = '';
        
        results.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            this.resultsContainer.appendChild(card);
        });

        this.resultsSection.classList.add('show');
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const similarity = result.similarity;
        let statusClass, statusText, percentageClass;

        if (similarity < 30) {
            statusClass = 'status-low';
            statusText = 'Low Similarity';
            percentageClass = 'percentage-low';
        } else if (similarity < 60) {
            statusClass = 'status-medium';
            statusText = 'Medium Similarity';
            percentageClass = 'percentage-medium';
        } else {
            statusClass = 'status-high';
            statusText = 'High Similarity';
            percentageClass = 'percentage-high';
        }

        card.innerHTML = `
            <div class="result-info">
                <h3>${result.fileName}</h3>
                <div class="result-details">
                    <span>📝 ${result.wordCount} words</span>
                    <span>🔤 ${result.uniqueWords} unique</span>
                    <span>🔗 ${result.commonWords} common</span>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="result-percentage">
                <div class="percentage-value ${percentageClass}">${similarity.toFixed(1)}%</div>
                <div class="percentage-label">Similarity</div>
            </div>
        `;

        return card;
    }

    toggleTheme() {
        const isChecked = this.themeToggle.checked;
        const newTheme = isChecked ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PlagiarismDetector();
});
