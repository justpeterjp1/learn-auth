// ================== DocuConvert: Home Page Script ==================

// Elements
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progress");
const conversionCount = document.getElementById("conversionCount");
const downloadLink = document.getElementById("downloadLink");
const downloadAnchor = document.getElementById("downloadAnchor");

// Track conversions with localStorage (3 free limit)
let freeConversions = parseInt(localStorage.getItem("freeConversions") || "0");

function updateCounter() {
  conversionCount.innerText = `Conversions used: ${freeConversions}/3`;
}
updateCounter();

function canConvert() {
  return freeConversions < 3;
}

// Selected file
let selectedFile = null;

// ================== Handle File Selection ==================
function handleFile(file) {
  selectedFile = file;
  if (selectedFile) {
    dropZone.innerHTML = `<p class="text-gray-700">Selected: ${selectedFile.name}</p>`;
  }
}

// ================== Start Conversion ==================
async function startConversion() {
  if (!selectedFile) {
    alert("Please select a file first!");
    return;
  }

  if (!canConvert()) {
    document.getElementById("upgradeModal").classList.remove("hidden");
    return;
  }

  // Show progress bar
  progressContainer.classList.remove("hidden");
  progressBar.style.width = "0%";

  // Prepare request
  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("format", document.getElementById("format").value);

  try {
    // Simulate progress while waiting for backend
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 90) progress = 90; // cap until fetch resolves
      progressBar.style.width = progress + "%";
    }, 400);

    // Call backend
    const response = await fetch("https://learn-auth.onrender.com", {
      method: "POST",
      body: formData
    });

    clearInterval(interval);

    if (!response.ok) throw new Error("Conversion failed");

    // Conversion success
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    downloadAnchor.href = url;
    downloadAnchor.download = "converted." + document.getElementById("format").value;
    downloadAnchor.textContent = "⬇ Download Converted File";
    downloadLink.classList.remove("hidden");

    progressBar.style.width = "100%";

    // Count this as one free conversion
    freeConversions++;
    localStorage.setItem("freeConversions", freeConversions);
    updateCounter();

  } catch (err) {
    alert("❌ " + err.message);
    progressBar.style.width = "0%";
  }
}

// ================== Event Listeners ==================

// Convert button
convertBtn.addEventListener("click", startConversion);

// File input
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

// Drag and drop
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("bg-gray-100");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("bg-gray-100");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("bg-gray-100");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// Close modal
function showSigninModal() {
  const signinModal = document.getElementById("signinModal");
  if (signinModal) {
    signinModal.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const signinModal = document.getElementById("signinModal");
  const closeSigninModal = document.getElementById("closeSigninModal");

  if (signinModal) {
    signinModal.addEventListener("click", (e) => {
      if (e.target.id === "signinModal") {
        signinModal.classList.add("hidden");
      }
    });
  }

  if (closeSigninModal) {
    closeSigninModal.addEventListener("click", () => {
      signinModal.classList.add("hidden");
    });
  }
});

// Example trigger: when free conversions are done
if (freeConversions >= 3) {
  showSigninModal();
}

