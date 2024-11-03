document.addEventListener("DOMContentLoaded", function () {
  const locationInput = document.getElementById("locationInput");
  const inspectionItems = document.querySelectorAll(".inspection-item");
  const resetButton = document.getElementById("resetButton");
  const exportWordButton = document.getElementById("exportWordButton");

  // Handle photo uploads
  inspectionItems.forEach((item) => {
    const fileInput = item.querySelector(".file-input");
    const photoPreview = item.querySelector(".photo-preview");

    fileInput.addEventListener("change", function (e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          photoPreview.style.backgroundImage = `url(${e.target.result})`;
          photoPreview.innerHTML = "";
          // Store the image data for Word export
          photoPreview.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // Reset functionality
  resetButton.addEventListener("click", function () {
    if (confirm("Are you sure you want to reset all forms?")) {
      locationInput.value = "";
      inspectionItems.forEach((item) => {
        const textarea = item.querySelector("textarea");
        const preview = item.querySelector(".photo-preview");
        const fileInput = item.querySelector(".file-input");

        textarea.value = "";
        preview.style.backgroundImage = "";
        preview.innerHTML = "<span>Click to add photo</span>";
        delete preview.dataset.imageData;
        fileInput.value = "";
      });
    }
  });
  // Add this optimized compression function
  function compressImage(imgData) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        // Calculate dimensions for A4 quarter page (with margins)
        const targetWidth = 520; // pixels (roughly 7.5cm at 96dpi)
        const targetHeight = 390; // pixels (roughly 5.5cm at 96dpi)

        // Calculate scaled dimensions
        let [width, height] = calculateAspectRatio(
          img.width,
          img.height,
          targetWidth,
          targetHeight
        );

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Use better quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // More aggressive compression for smaller file size
        resolve(canvas.toDataURL("image/jpeg", 0.45));
      };
      img.src = imgData;
    });
  }

  // Helper function to maintain aspect ratio
  function calculateAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return [srcWidth * ratio, srcHeight * ratio];
  }

  // Export to Word

  // Updated export function with optimized styling
  exportWordButton.addEventListener("click", async function () {
    try {
      const locationValue = locationInput.value || "Workshop";
      const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
                <meta charset="utf-8">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0.8cm;
                        mso-page-orientation: portrait;
                    }
                    body {
                        width: 21cm;
                        height: 29.7cm;
                        margin: 0;
                        padding: 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                    }
                    td {
                        width: 50%;
                        vertical-align: top;
                        padding: 0.1cm;
                    }
                    .item {
                        //border: 0.3pt solid #000;
                        padding: 0.2cm;
                        margin: 0;
                        page-break-inside: avoid;
                    }
                    .photo-container {
                        width: 6cm;
                        height: 4.5cm;
                        overflow: hidden;
                        margin: 0.1cm 0;
                    }
                    .photo-container img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    p {
                        margin: 0.1cm 0;
                        font-size: 10pt;
                    }
                </style>
            </head>
            <body>
                <table>
        `;

      // Process and compress all photos first
      const processedPhotos = await Promise.all(
        Array.from(inspectionItems).map(async (item) => {
          const photoPreview = item.querySelector(".photo-preview");
          const imageData = photoPreview.dataset.imageData;
          return imageData ? await compressImage(imageData) : null;
        })
      );

      // Create table content with compressed photos
      let tableContent = "";
      for (let i = 0; i < inspectionItems.length; i += 2) {
        tableContent += "<tr>";
        for (let j = i; j < Math.min(i + 2, inspectionItems.length); j++) {
          const item = inspectionItems[j];
          const serialNo = item.querySelector(".info-row h4").textContent;
          const location = item.querySelectorAll(".info-row h4")[1].textContent;
          const comments =
            item.querySelector("textarea").value || "No comments";
          const processedImage = processedPhotos[j];

          tableContent += `
                    <td>
                        <div class="item">
                            <p><strong>${serialNo}</strong></p>
                            <p><strong>${location}</strong></p>
                            ${
                              processedImage
                                ? `
                                <div class="photo-container">
                                    <img src="${processedImage}" alt="Photo">
                                </div>
                            `
                                : ""
                            }
                            <p><strong>Comments:</strong><br>${comments.replace(
                              /\n/g,
                              "<br>"
                            )}</p>
                        </div>
                    </td>
                `;
        }
        tableContent += "</tr>";
      }

      const fullContent = content + tableContent + "</table></body></html>";

      // Create and download file
      const blob = new Blob([fullContent], { type: "application/msword" });
      const fileName = `Pre-Termination_Report_${locationValue}_${
        new Date().toISOString().split("T")[0]
      }.doc`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    } catch (error) {
      console.error("Export error:", error);
      alert("Error creating document. Please try again.");
    }
  });
});
