document.addEventListener('DOMContentLoaded', function() {
    // Store references to important elements
    const locationInput = document.getElementById('locationInput');
    const forms = document.querySelectorAll('.inspection-form');
    const submitButton = document.getElementById('submitButton');
    const resetButton = document.getElementById('resetButton');
    const exportWordButton = document.getElementById('exportWordButton');
    const printButton = document.getElementById('printButton');

    // Handle photo inputs and previews
    forms.forEach(form => {
        const photoInput = form.querySelector('.photo-input');
        const photoPreview = form.querySelector('.photo-preview');

        photoInput.addEventListener('change', function(e) {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.style.backgroundImage = `url(${e.target.result})`;
                    photoPreview.textContent = '';
                };
                reader.readAsDataURL(file);
            } else {
                photoPreview.style.backgroundImage = '';
                photoPreview.textContent = 'No image selected';
            }
        });

        // Make preview clickable to trigger file input
        photoPreview.addEventListener('click', () => {
            photoInput.click();
        });
    });

    // Validate Photo Number format (S01, S02, etc.)
    function validatePhotoNo(value) {
        const pattern = /^S[0-9]{2}$/;
        return pattern.test(value);
    }

    // Collect all form data
    function collectFormData() {
        const reportData = {
            location: locationInput.value,
            timestamp: new Date().toLocaleString(),
            inspections: []
        };

        forms.forEach((form, index) => {
            const photoNo = form.querySelector('[name="photoNo"]').value;
            const location = form.querySelector('[name="location"]').value;
            const comments = form.querySelector('[name="comments"]').value;
            const photoInput = form.querySelector('[name="photo"]');
            const photoFile = photoInput.files[0];

            const inspectionData = {
                photoNo: photoNo,
                location: location,
                comments: comments,
                photoUrl: photoFile ? URL.createObjectURL(photoFile) : null
            };

            reportData.inspections.push(inspectionData);
        });

        return reportData;
    }

    // Validate all forms
    function validateForms() {
        let isValid = true;
        const errors = [];

        if (!locationInput.value.trim()) {
            errors.push('Main location is required');
            isValid = false;
        }

        forms.forEach((form, index) => {
            const photoNo = form.querySelector('[name="photoNo"]').value;
            const location = form.querySelector('[name="location"]').value;
            const comments = form.querySelector('[name="comments"]').value;
            const photo = form.querySelector('[name="photo"]').files[0];

            if (!validatePhotoNo(photoNo)) {
                errors.push(`Card ${index + 1}: Invalid photo number format (should be S01, S02, etc.)`);
                isValid = false;
            }
            if (!location.trim()) {
                errors.push(`Card ${index + 1}: Location is required`);
                isValid = false;
            }
            if (!comments.trim()) {
                errors.push(`Card ${index + 1}: Comments are required`);
                isValid = false;
            }
            if (!photo) {
                errors.push(`Card ${index + 1}: Photo is required`);
                isValid = false;
            }
        });

        if (!isValid) {
            alert('Please correct the following errors:\n\n' + errors.join('\n'));
        }

        return isValid;
    }

    // Save form data to localStorage
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem('reportData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load form data from localStorage
    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('reportData');
            return savedData ? JSON.parse(savedData) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // Auto-save form data as user types
    forms.forEach(form => {
        form.addEventListener('input', () => {
            if (form.querySelector('[name="photo"]').files.length > 0) {
                const data = collectFormData();
                saveToLocalStorage(data);
            }
        });
    });

    locationInput.addEventListener('input', () => {
        const data = collectFormData();
        saveToLocalStorage(data);
    });

    // Reset all forms
    resetButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all forms? This cannot be undone.')) {
            locationInput.value = '';
            forms.forEach(form => {
                form.reset();
                const preview = form.querySelector('.photo-preview');
                if (preview) {
                    preview.style.backgroundImage = '';
                    preview.textContent = 'No image selected';
                }
            });
            localStorage.removeItem('reportData');
        }
    });

    // Export to Word
    exportWordButton.addEventListener('click', async function() {
        if (!validateForms()) {
            return;
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        try {
            const reportData = collectFormData();
            
            // Create a new Document
            const doc = new docx.Document({
                sections: [{
                    properties: {
                        page: {
                            size: {
                                orientation: docx.PageOrientation.PORTRAIT,
                                width: '210mm',
                                height: '297mm',
                            },
                            margin: {
                                top: '10mm',
                                right: '10mm',
                                bottom: '10mm',
                                left: '10mm',
                            },
                        },
                    },
                    children: [
                        new docx.Paragraph({
                            text: `Pre-Termination Report @ ${reportData.location}`,
                            heading: docx.HeadingLevel.HEADING_1,
                        }),
                        ...reportData.inspections.map((item, index) => ([
                            new docx.Paragraph({
                                text: `Photo No: ${item.photoNo}`,
                                spacing: { before: 400, after: 200 },
                            }),
                            new docx.Paragraph({
                                text: `Location: ${item.location}`,
                                spacing: { after: 200 },
                            }),
                            new docx.Paragraph({
                                text: `Comments: ${item.comments}`,
                                spacing: { after: 400 },
                            }),
                            // Add page break after every 4 items except the last
                            ...(index > 0 && (index + 1) % 4 === 0 && index !== reportData.inspections.length - 1
                                ? [new docx.Paragraph({ pageBreakBefore: true })]
                                : [])
                        ])).flat(),
                    ],
                }],
            });

            // Generate and save the document
            const buffer = await docx.Packer.toBlob(doc);
            const fileName = `Pre-Termination_Report_${reportData.location}_${new Date().toISOString().split('T')[0]}.docx`;
            saveAs(buffer, fileName);

        } catch (error) {
            console.error('Error generating document:', error);
            alert('Error generating document. Please try again.');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });

    // Print functionality
    printButton.addEventListener('click', function() {
        if (!validateForms()) {
            return;
        }
        window.print();
    });

    // Initialize form with saved data if any
    const savedData = loadFromLocalStorage();
    if (savedData) {
        locationInput.value = savedData.location;
        savedData.inspections.forEach((inspection, index) => {
            if (index < forms.length) {
                const form = forms[index];
                form.querySelector('[name="photoNo"]').value = inspection.photoNo;
                form.querySelector('[name="location"]').value = inspection.location;
                form.querySelector('[name="comments"]').value = inspection.comments;
                // Note: We can't restore file inputs due to security restrictions
            }
        });
    }
});