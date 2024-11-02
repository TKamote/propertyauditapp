document.addEventListener('DOMContentLoaded', function() {
    const locationInput = document.getElementById('locationInput');
    const inspectionItems = document.querySelectorAll('.inspection-item');
    const resetButton = document.getElementById('resetButton');
    const exportWordButton = document.getElementById('exportWordButton');
    const printButton = document.getElementById('printButton');

    // Handle photo uploads
    inspectionItems.forEach(item => {
        const photoPreview = item.querySelector('.photo-preview');
        const fileInput = item.querySelector('input[type="file"]');

        photoPreview.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.style.backgroundImage = `url(${e.target.result})`;
                    photoPreview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Save data to localStorage
    function saveToLocalStorage() {
        const data = {
            location: locationInput.value,
            items: Array.from(inspectionItems).map(item => ({
                comments: item.querySelector('textarea').value
            }))
        };
        localStorage.setItem('reportData', JSON.stringify(data));
    }

    // Load data from localStorage
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('reportData');
        if (savedData) {
            const data = JSON.parse(savedData);
            locationInput.value = data.location || '';
            data.items.forEach((item, index) => {
                if (index < inspectionItems.length) {
                    inspectionItems[index].querySelector('textarea').value = item.comments || '';
                }
            });
        }
    }

    // Auto-save on input
    locationInput.addEventListener('input', saveToLocalStorage);
    inspectionItems.forEach(item => {
        item.querySelector('textarea').addEventListener('input', saveToLocalStorage);
    });

    // Reset functionality
    resetButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all forms?')) {
            locationInput.value = '';
            inspectionItems.forEach(item => {
                const textarea = item.querySelector('textarea');
                const preview = item.querySelector('.photo-preview');
                const fileInput = item.querySelector('input[type="file"]');
                
                textarea.value = '';
                preview.style.backgroundImage = '';
                preview.innerHTML = '<span>Click to add photo</span>';
                fileInput.value = '';
            });
            localStorage.removeItem('reportData');
        }
    });

   
 // Export to Word
 exportWordButton.addEventListener('click', async function() {
    exportWordButton.disabled = true;
    exportWordButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
        // Create document content
        const content = [];
        const title = `Pre-Termination Report @ ${locationInput.value || 'Untitled'}`;
        
        content.push(title + '\n\n');

        inspectionItems.forEach((item, index) => {
            const serialNo = item.querySelector('.info-row h4').textContent.trim();
            const location = item.querySelectorAll('.info-row h4')[1].textContent.trim();
            const comments = item.querySelector('textarea').value.trim();

            content.push(`${serialNo}\n`);
            content.push(`${location}\n`);
            content.push(`Comments: ${comments || 'No comments'}\n\n`);
        });

        // Create blob
        const blob = new Blob([content.join('')], { type: 'application/msword' });
        
        // Create filename
        const date = new Date().toISOString().split('T')[0];
        const location = locationInput.value || 'Untitled';
        const fileName = `Pre-Termination_Report_${location}_${date}.doc`;

        // Try to save using different methods
        if (window.saveAs) {
            window.saveAs(blob, fileName);
        } else {
            // Fallback download method
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to generate document. Please try again.');
    } finally {
        exportWordButton.disabled = false;
        exportWordButton.innerHTML = '<i class="fas fa-file-word"></i> Export to Word';
    }
});
    // Print functionality
    printButton.addEventListener('click', function() {
        window.print();
    });

    // Load saved data on page load
    loadFromLocalStorage();
});