// ================== Firebase Imports ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================== Firebase Config ==================
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
const db = getFirestore(app);

// ================== Helpers ==================
async function getEmailFromUsername(username) {
  const docRef = doc(db, "usernames", username.toLowerCase());
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data().email : null;
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}
function showSuccess(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
  el.classList.remove("text-red-600");
  el.classList.add("text-green-600");
}
function clearMessages(...els) {
  els.forEach(el => {
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
    el.classList.remove("text-green-600");
    el.classList.add("text-red-600");
  });
}

// ================== Signup ==================
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const signupError = document.getElementById("signupError");
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages(signupError);

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    if (password !== confirmPassword) {
      showError(signupError, "❌ Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "usernames", username.toLowerCase()), { email });
      window.location.href = "/dashboard.html";
    } catch (error) {
      showError(signupError, error.message);
    }
  });
}

// ================== Login ==================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages(emailError, passwordError);

    let emailOrUsername = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      if (!emailOrUsername.includes("@")) {
        const resolvedEmail = await getEmailFromUsername(emailOrUsername);
        if (!resolvedEmail) {
          showError(emailError, "❌ Username not found.");
          return;
        }
        emailOrUsername = resolvedEmail;
      }

      await signInWithEmailAndPassword(auth, emailOrUsername, password);
      window.location.href = "/dashboard.html"; // ✅ redirect only
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        showError(passwordError, "❌ Incorrect password.");
      } else if (error.code === "auth/user-not-found") {
        showError(emailError, "❌ No account found with this email.");
      } else {
        showError(emailError, "❌ " + error.message);
      }
    }
  });
}

// ================== Google Sign-In ==================
const googleBtn = document.getElementById("googleSignIn");
if (googleBtn) {
  const googleError = document.getElementById("googleError");
  const provider = new GoogleAuthProvider();
  googleBtn.addEventListener("click", async () => {
    clearMessages(googleError);
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "/dashboard.html"; // ✅ no alert
    } catch (error) {
      showError(googleError, error.message);
    }
  });
}

// ================== Password Reset ==================
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  const resetMessage = document.getElementById("resetMessage");
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages(resetMessage);

    let email = document.getElementById("resetEmail").value.trim();
    try {
      if (!email.includes("@")) {
        email = await getEmailFromUsername(email);
      }
      await sendPasswordResetEmail(auth, email);
      showSuccess(resetMessage, "✅ Password reset email sent! Check your inbox.");
    } catch (error) {
      showError(resetMessage, error.message);
    }
  });
}

// ================== Logout ==================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  const logoutError = document.getElementById("logoutError");
  logoutBtn.addEventListener("click", async () => {
    clearMessages(logoutError);
    try {
      await signOut(auth);
      window.location.href = "/login.html";
    } catch (error) {
      showError(logoutError, error.message);
    }
  });
}

// ================== Auth State Redirects ==================
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  if (user) {
    if (path.includes("login.html") || path.includes("signup.html")) {
      window.location.href = "/dashboard.html";
    }
  } else {
    if (path.includes("dashboard.html")) {
      window.location.href = "/login.html";
    }
  }
});
