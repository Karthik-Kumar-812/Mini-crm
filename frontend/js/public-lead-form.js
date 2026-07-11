document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lead-form-el");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const sourceInput = document.getElementById("source");
  const messageInput = document.getElementById("message");
  const nameError = document.getElementById("name-error");
  const emailError = document.getElementById("email-error");
  const messageError = document.getElementById("message-error");
  const submitBtn = document.getElementById("submit-btn");
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

  function validate() {
    const errors = {};

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      errors.name = "Please enter your name (at least 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      errors.message = "Please tell us a little more (at least 10 characters).";
    }

    setFieldError(nameError, errors.name);
    setFieldError(emailError, errors.email);
    setFieldError(messageError, errors.message);

    return Object.keys(errors).length === 0;
  }

  [nameInput, emailInput, messageInput].forEach((input) => {
    input.addEventListener("input", () => {
      const map = { name: nameError, email: emailError, message: messageError };
      setFieldError(map[input.name], "");
    });
  });

  function showStatus(type, message) {
    statusBox.textContent = message;
    statusBox.className = `form-status visible ${type}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusBox.className = "form-status";
    statusBox.textContent = "";

    if (!validate()) return;

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      source: sourceInput.value,
      message: messageInput.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showStatus("success", data.message || "Thank you! We'll be in touch soon.");
        form.reset();
      } else {
        showStatus(
          "error",
          data.message || "Something went wrong sending your message. Please try again."
        );
      }
    } catch (err) {
      showStatus(
        "error",
        "Couldn't reach the server. Make sure the backend is running, or try again later."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
});
