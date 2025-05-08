// Store reports in localStorage
let reports = JSON.parse(localStorage.getItem('autovuln_reports')) || [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up navigation
    document.getElementById('scanLink').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('scan');
    });

    document.getElementById('reportsLink').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('reports');
        renderReportsList();
    });

    // About section
    document.getElementById('aboutLink').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('aboutModal').style.display = 'flex';
    });

    // Close about modal
    document.getElementById('aboutClose').addEventListener('click', function() {
        document.getElementById('aboutModal').style.display = 'none';
    });

    // Close modal when clicking outside content
    document.getElementById('aboutModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // Show scan section by default
    showSection('scan');
});

function showSection(section) {
    // Hide all sections
    document.getElementById('scanSection').style.display = 'none';
    document.getElementById('reportsSection').style.display = 'none';
    
    // Remove active class from all links
    document.getElementById('scanLink').classList.remove('active');
    document.getElementById('reportsLink').classList.remove('active');
    document.getElementById('aboutLink').classList.remove('active');
    
    // Show selected section
    if (section === 'scan') {
        document.getElementById('scanSection').style.display = 'block';
        document.getElementById('scanLink').classList.add('active');
    } else if (section === 'reports') {
        document.getElementById('reportsSection').style.display = 'block';
        document.getElementById('reportsLink').classList.add('active');
        // Scroll to top of reports section (below navbar)
        setTimeout(() => {
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 70;
            const reportsSection = document.getElementById('reportsSection');
            window.scrollTo({
                top: reportsSection.offsetTop - navbarHeight,
                behavior: 'auto'
            });
        }, 0);
    }
}

function startScan() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const loader = document.getElementById('loader');
    const scanButton = document.querySelector('.scan-button');

    if (!urlInput) {
        alert("Please enter a URL first!");
        return;
    }

    // Show loading state
    loader.style.display = "block";
    scanButton.disabled = true;
    scanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';

    fetch('/scan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlInput })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Scan failed') });
        }
        return response.json();
    })
    .then(data => {
        if (data.report) {
            // Create new report
            const newReport = {
                id: Date.now(),
                url: urlInput,
                date: new Date().toLocaleString(),
                content: data.report,
                preview: "Security scan completed - " + countVulnerabilities(data.report) + " vulnerabilities found",
                vulnCount: countVulnerabilities(data.report)
            };
            
            // Add to beginning of array and save to localStorage
            reports.unshift(newReport);
            saveReports();
            
            // Show reports section automatically
            showSection('reports');
            renderReportsList();
        }
    })
    .catch(error => {
        alert(error.message);
    })
    .finally(() => {
        loader.style.display = "none";
        scanButton.disabled = false;
        scanButton.innerHTML = '<i class="fas fa-search"></i> Start Scan';
        document.getElementById('urlInput').value = '';
    });
}

function renderReportsList() {
    const reportsList = document.getElementById('reportsList');
    reportsList.innerHTML = '';
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<p class="no-reports">No reports yet. Run a scan to see results here.</p>';
        return;
    }
    
    reports.forEach(report => {
        const reportItem = document.createElement('div');
        reportItem.className = 'report-item';
        reportItem.innerHTML = `
            <button class="delete-report" data-id="${report.id}" title="Delete report">
                <i class="fas fa-trash-alt"></i>
            </button>
            <h3>${report.url}</h3>
            <div class="report-meta">
                <span><i class="far fa-calendar-alt"></i> ${report.date}</span>
                <span class="${report.vulnCount > 0 ? 'high-vuln' : 'no-vuln'}">
                    <i class="fas fa-bug"></i> ${report.vulnCount} ${report.vulnCount === 1 ? 'vulnerability' : 'vulnerabilities'}
                </span>
            </div>
            <div class="report-preview">${report.preview}</div>
        `;
        reportItem.addEventListener('click', (e) => {
            // Don't navigate if delete button was clicked
            if (!e.target.closest('.delete-report')) {
                viewReport(report.id);
            }
        });
        reportsList.appendChild(reportItem);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-report').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(btn.dataset.id);
        });
    });
}

function viewReport(reportId) {
    const report = reports.find(r => r.id === parseInt(reportId));
    if (report) {
        // Show the report in the reports section
        document.getElementById('reportsList').innerHTML = `
            <div class="report-view-wrapper">
                <button class="back-button" onclick="renderReportsList()">
                    <i class="fas fa-arrow-left"></i> Back to Reports
                </button>
                <div class="report-content-container">
                    ${report.content}
                </div>
            </div>
        `;
        
        // Calculate proper scroll position to account for navbar
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        const scrollPosition = document.getElementById('reportsSection').offsetTop - navbarHeight + 1;
        
        // Smooth scroll to the content
        window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
    }
}

function countVulnerabilities(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return tempDiv.querySelectorAll('.vuln-title').length;
}

function saveReports() {
    localStorage.setItem('autovuln_reports', JSON.stringify(reports));
}

function showDeleteConfirmation(reportId) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Delete Report?</h3>
            <p>Are you sure you want to delete this security report? This action cannot be undone.</p>
            <div class="modal-buttons">
                <button class="modal-btn cancel">Cancel</button>
                <button class="modal-btn confirm">Delete</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.confirm').addEventListener('click', () => {
        deleteReport(reportId);
        document.body.removeChild(modal);
    });
}

function deleteReport(reportId) {
    reports = reports.filter(report => report.id !== parseInt(reportId));
    saveReports();
    renderReportsList();
}