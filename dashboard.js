// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC12AAO8ppGvp8YxKeuUsz_coJEsPJzGGI",
  authDomain: "learn-auth-9ca72.firebaseapp.com",
  projectId: "learn-auth-9ca72",
  storageBucket: "learn-auth-9ca72.firebasestorage.app",
  messagingSenderId: "827076262824",
  appId: "1:827076262824:web:2786488c8fe24a97463b9d",
  measurementId: "G-XV4W3CMWEV"
};
// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const db = getFirestore(app);
// ---------------- Dashboard Logic ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Redirect to login if not authenticated
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    }
  });

  // Sign out logic
  const signoutBtn = document.getElementById("signoutBtn");
  signoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        localStorage.clear();
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Sign-out error:", error);
      });
  });

  // Sidebar controls
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const filesBtn = document.getElementById("filesBtn");
  const closeSidebarBtn = document.getElementById("closeSidebar");
  const fileList = document.getElementById("fileList");
  const clearHistoryBtn = document.getElementById("clearHistory");

  function openSidebar() {
    sidebar.classList.remove("-translate-x-full");
    sidebarBackdrop.classList.remove("hidden");
  }

  function closeSidebar() {
    sidebar.classList.add("-translate-x-full");
    sidebarBackdrop.classList.add("hidden");
  }

  filesBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("-translate-x-full")) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  closeSidebarBtn.addEventListener("click", closeSidebar);
  sidebarBackdrop.addEventListener("click", closeSidebar);

  // ---------------- File History ----------------
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem(`history_${auth.currentUser?.uid || "guest"}`)) || [];
    fileList.innerHTML = "";
    history.forEach((file) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${file.url}" target="_blank" class="text-blue-600 hover:underline">${file.name}</a>`;
      fileList.appendChild(li);
    });
  }

  function addFileToHistory(name, url) {
    const key = `history_${auth.currentUser?.uid || "guest"}`;
    let history = JSON.parse(localStorage.getItem(key)) || [];
    history.push({ name, url });

    // Keep only last 10
    if (history.length > 10) {
      history = history.slice(history.length - 10);
    }

    localStorage.setItem(key, JSON.stringify(history));
    loadHistory();
  }

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(`history_${auth.currentUser?.uid || "guest"}`);
    loadHistory();
  });

  // ---------------- Conversion Logic ----------------
  const fileInput = document.getElementById("fileInput");
  const dropZone = document.getElementById("dropZone");
  const formatSelect = document.getElementById("format");
  const progressBar = document.getElementById("progress");
  const convertBtn = document.getElementById("convertBtn");
  const downloadLink = document.getElementById("downloadLink");
  const downloadAnchor = document.getElementById("downloadAnchor");

  let selectedFile = null;

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
      dropZone.querySelector("p").textContent = `Selected: ${selectedFile.name}`;
    }
  });

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
    selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      dropZone.querySelector("p").textContent = `Selected: ${selectedFile.name}`;
    }
  });

  convertBtn.addEventListener("click", () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const format = formatSelect.value;
    progressBar.style.width = "0%";
    downloadLink.classList.add("hidden");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      progressBar.style.width = progress + "%";
      if (progress >= 100) {
        clearInterval(interval);

        // Simulated converted file
        const convertedName = selectedFile.name.replace(/\.[^/.]+$/, "") + "." + format;
        const fakeUrl = "#"; // Replace with backend URL later
        downloadAnchor.href = fakeUrl;
        downloadAnchor.download = convertedName;
        downloadAnchor.textContent = `Download ${convertedName}`;
        downloadLink.classList.remove("hidden");

        // Save to history
        addFileToHistory(convertedName, fakeUrl);
      }
    }, 300);
  });

  // Init history
  loadHistory();
});
