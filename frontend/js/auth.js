document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("username-error");
  const passwordError = document.getElementById("password-error");
  const loginBtn = document.getElementById("login-btn");
  const statusBox = document.getElementById("form-status");

  function setFieldError(el, message) {
    if (message) {
      el.textContent = message;
      el.classList.add("visible");
    } else {
      el.textContent = "";
      el.classList.remove("visible");
    }
  }

  function showStatus(type, message) {
    statusBox.textContent = message;
    statusBox.className = `form-status visible ${type}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusBox.className = "form-status";

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    if (!username) {
      setFieldError(usernameError, "Username is required.");
      hasError = true;
    } else {
      setFieldError(usernameError, "");
    }
    if (!password) {
      setFieldError(passwordError, "Password is required.");
      hasError = true;
    } else {
      setFieldError(passwordError, "");
    }
    if (hasError) return;

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSession(data.data.token, {
          username: data.data.username,
          fullName: data.data.fullName,
        });
        window.location.href = "dashboard.html";
        return;
      }

      showStatus("error", data.message || "Invalid username or password.");
    } catch (err) {
      showStatus(
        "error",
        "Couldn't reach the server. Make sure the backend is running, or try again later."
      );
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  });
});
