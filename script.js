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
        try {
            const doc = new docx.Document({
                sections: [{
                    properties: {
                        page: {
                            size: {
                                orientation: docx.PageOrientation.LANDSCAPE,
                                width: '297mm',
                                height: '210mm',
                            },
                            margin: {
                                top: '20mm',
                                right: '20mm',
                                bottom: '20mm',
                                left: '20mm',
                            },
                        },
                    },
                    children: [
                        new docx.Paragraph({
                            text: `Pre-Termination Report @ ${locationInput.value}`,
                            heading: docx.HeadingLevel.HEADING_1,
                            spacing: { after: 400 }
                        }),
                        ...Array.from(inspectionItems).flatMap((item, index) => {
                            const serialNo = item.querySelector('.info-row h4').textContent;
                            const location = item.querySelectorAll('.info-row h4')[1].textContent;
                            const comments = item.querySelector('textarea').value;
                            const preview = item.querySelector('.photo-preview');
                            const hasPhoto = preview.style.backgroundImage !== '';

                            return [
                                new docx.Paragraph({
                                    text: serialNo,
                                    spacing: { before: 400, after: 200 }
                                }),
                                new docx.Paragraph({
                                    text: location,
                                    spacing: { after: 200 }
                                }),
                                new docx.Paragraph({
                                    text: `Comments: ${comments}`,
                                    spacing: { after: 400 }
                                }),
                                ...(index < inspectionItems.length - 1 ? [
                                    new docx.Paragraph({
                                        text: '',
                                        pageBreakBefore: true
                                    })
                                ] : [])
                            ];
                        })
                    ],
                }],
            });

            const buffer = await docx.Packer.toBlob(doc);
            const fileName = `Pre-Termination_Report_${locationInput.value || 'Untitled'}_${new Date().toISOString().split('T')[0]}.docx`;
            saveAs(buffer, fileName);

        } catch (error) {
            console.error('Error generating document:', error);
            alert('Error generating document. Please try again.');
        }
    });

    // Print functionality
    printButton.addEventListener('click', function() {
        window.print();
    });

    // Load saved data on page load
    loadFromLocalStorage();
});