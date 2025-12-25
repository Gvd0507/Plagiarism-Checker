// Plagiarism Detection Application with Similarity Matrix
// Supports .txt, .pdf, and .docx files

class PlagiarismDetector {
    constructor() {
        this.documentFiles = [];
        this.initTheme();
        this.init();
        this.initPdfJs();
    }

    initPdfJs() {
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
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
        this.documentInput = document.getElementById('documentFiles');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.matrixContainer = document.getElementById('matrixContainer');
        this.documentNames = document.getElementById('documentNames');
        this.themeToggle = document.getElementById('themeToggle');

        // Event listeners
        this.documentInput.addEventListener('change', (e) => this.handleDocumentUpload(e));
        this.analyzeBtn.addEventListener('click', () => this.analyzePlagiarism());
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
    }

    // Extract text from different file types
    async extractText(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'txt':
                return await this.readTextFile(file);
            case 'pdf':
                return await this.readPdfFile(file);
            case 'docx':
                return await this.readDocxFile(file);
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    // Read plain text file
    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Read PDF file
    async readPdfFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + ' ';
            }
            
            return fullText;
        } catch (error) {
            console.error('Error reading PDF:', error);
            throw new Error('Failed to read PDF file');
        }
    }

    // Read DOCX file
    async readDocxFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Error reading DOCX:', error);
            throw new Error('Failed to read DOCX file');
        }
    }

    // Process text: lowercase and remove punctuation
    processText(text) {
        const cleanedText = text.toLowerCase().replace(/[^a-z ]/g, '');
        const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
        return words;
    }

    // Calculate similarity using Jaccard Index
    calculateSimilarity(set1, set2) {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        if (union.size === 0) return 0;
        
        return (intersection.size / union.size) * 100;
    }

    handleDocumentUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length >= 2) {
            this.documentFiles = files;
            const fileNames = files.map(f => f.name).join(', ');
            this.documentNames.textContent = `✓ ${files.length} files selected`;
            this.analyzeBtn.disabled = false;
        } else {
            this.documentNames.textContent = 'Please select at least 2 files';
            this.analyzeBtn.disabled = true;
        }
    }

    async analyzePlagiarism() {
        if (this.documentFiles.length < 2) {
            alert('Please upload at least 2 files');
            return;
        }

        // Show loading state
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.innerHTML = 'Analyzing<span class="loading"></span>';

        try {
            // Extract and process all files
            const processedFiles = [];
            
            for (const file of this.documentFiles) {
                try {
                    const text = await this.extractText(file);
                    const words = this.processText(text);
                    const wordSet = new Set(words);
                    
                    processedFiles.push({
                        name: file.name,
                        words: words,
                        wordSet: wordSet,
                        wordCount: words.length,
                        uniqueWords: wordSet.size
                    });
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    alert(`Error processing ${file.name}: ${error.message}`);
                }
            }

            if (processedFiles.length < 2) {
                alert('Could not process enough files. Please check file formats.');
                return;
            }

            // Create similarity matrix
            const matrix = this.createSimilarityMatrix(processedFiles);
            
            // Calculate average similarity for each file
            const results = this.calculateAverageSimilarities(processedFiles, matrix);

            // Display results
            this.displayMatrix(matrix, processedFiles);
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

    createSimilarityMatrix(files) {
        const n = files.length;
        const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 100;
                } else {
                    matrix[i][j] = this.calculateSimilarity(files[i].wordSet, files[j].wordSet);
                }
            }
        }
        
        return matrix;
    }

    calculateAverageSimilarities(files, matrix) {
        return files.map((file, index) => {
            let totalSimilarity = 0;
            let count = 0;
            
            for (let j = 0; j < matrix.length; j++) {
                if (index !== j) {
                    totalSimilarity += matrix[index][j];
                    count++;
                }
            }
            
            const avgSimilarity = count > 0 ? totalSimilarity / count : 0;
            
            return {
                fileName: file.name,
                avgSimilarity: avgSimilarity,
                wordCount: file.wordCount,
                uniqueWords: file.uniqueWords
            };
        });
    }

    displayMatrix(matrix, files) {
        let html = '<table class="similarity-matrix">';
        
        // Header row
        html += '<tr><th>Files</th>';
        files.forEach(file => {
            html += `<th title="${file.name}">${this.truncateFileName(file.name)}</th>`;
        });
        html += '</tr>';
        
        // Data rows
        files.forEach((file, i) => {
            html += '<tr>';
            html += `<td class="file-header" title="${file.name}">${this.truncateFileName(file.name)}</td>`;
            
            matrix[i].forEach((similarity, j) => {
                const cellClass = this.getSimilarityClass(similarity, i === j);
                html += `<td class="similarity-cell ${cellClass}">${similarity.toFixed(1)}%</td>`;
            });
            
            html += '</tr>';
        });
        
        html += '</table>';
        
        this.matrixContainer.innerHTML = html;
    }

    displayResults(results) {
        this.resultsContainer.innerHTML = '';
        
        // Sort by average similarity (highest first)
        results.sort((a, b) => b.avgSimilarity - a.avgSimilarity);
        
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

        const similarity = result.avgSimilarity;
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
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="result-percentage">
                <div class="percentage-value ${percentageClass}">${similarity.toFixed(1)}%</div>
                <div class="percentage-label">Avg Similarity</div>
            </div>
        `;

        return card;
    }

    getSimilarityClass(similarity, isSelf) {
        if (isSelf) return 'similarity-self';
        if (similarity >= 60) return 'similarity-high';
        if (similarity >= 30) return 'similarity-medium';
        return 'similarity-low';
    }

    truncateFileName(name, maxLength = 15) {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncated = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
        return truncated + '.' + extension;
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
