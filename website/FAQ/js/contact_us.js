// contact_us.js (clean vanilla version)

(function () {
  "use strict";

  // ---------- Elements ----------
  const form = document.getElementById("contactForm");
  const alertBox = document.getElementById("formAlert");
  const btn = document.getElementById("submitBtn");
  const btnText = btn?.querySelector(".btn-text");
  const btnSpin = btn?.querySelector(".spinner-border");

  const f = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    topic: document.getElementById("topic"),
    message: document.getElementById("message"),
    consent: document.getElementById("consent"),
  };

  // ---------- Helpers ----------
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  // Phone optional: allow +, digits, spaces, dashes; ≥7 chars if provided
  const isPhone = (v) => !v || /^\+?\d[\d\s-]{6,}$/.test((v || "").trim());

  function setAlert(type, text) {
    if (!alertBox) return;
    const cls = ["alert", "d-block", "alert-success", "alert-danger", "alert-info", "alert-warning"];
    alertBox.className = "alert d-block";
    alertBox.classList.add(`alert-${type}`);
    alertBox.textContent = text || "";
  }
  function clearAlert() {
    if (!alertBox) return;
    alertBox.className = "alert d-none";
    alertBox.textContent = "";
  }

  function markInvalid(input, on, msg) {
    if (!input) return;
    const fb = input.parentElement?.querySelector(".invalid-feedback");
    if (on) {
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
      if (fb && msg) fb.textContent = msg;
    } else {
      input.classList.remove("is-invalid");
      input.classList.add("is-valid");
    }
  }

  function validateAll() {
    let ok = true;

    // Name
    const nameOk = !!f.name.value.trim();
    markInvalid(f.name, !nameOk, "Please enter your name.");
    ok &&= nameOk;

    // Email
    const emailOk = isEmail(f.email.value);
    markInvalid(f.email, !emailOk, "Please enter a valid email.");
    ok &&= emailOk;

    // Phone (optional)
    const phoneOk = isPhone(f.phone.value);
    markInvalid(f.phone, !phoneOk, "Please enter a valid phone (e.g., +60 12-345 6789).");
    ok &&= phoneOk;

    // Topic
    const topicOk = !!f.topic.value;
    markInvalid(f.topic, !topicOk, "Please choose a topic.");
    ok &&= topicOk;

    // Message
    const msgOk = !!f.message.value.trim();
    markInvalid(f.message, !msgOk, "Please write a message.");
    ok &&= msgOk;

    // Consent
    const consentOk = f.consent.checked;
    if (!consentOk) {
      f.consent.classList.add("is-invalid");
      f.consent.classList.remove("is-valid");
      // Bootstrap shows invalid-feedback set in HTML
    } else {
      f.consent.classList.remove("is-invalid");
      f.consent.classList.add("is-valid");
    }
    ok &&= consentOk;

    return ok;
  }

  function hookLiveValidation() {
    f.name.addEventListener("input", () => markInvalid(f.name, !f.name.value.trim()));
    f.email.addEventListener("input", () => markInvalid(f.email, !isEmail(f.email.value)));
    f.phone.addEventListener("input", () => markInvalid(f.phone, !isPhone(f.phone.value)));
    f.topic.addEventListener("change", () => markInvalid(f.topic, !f.topic.value));
    f.message.addEventListener("input", () => markInvalid(f.message, !f.message.value.trim()));
    f.consent.addEventListener("change", () => {
      if (f.consent.checked) {
        f.consent.classList.remove("is-invalid");
        f.consent.classList.add("is-valid");
      }
    });
  }

  function setSubmitting(on) {
    if (!btn) return;
    btn.disabled = on;
    if (btnText) btnText.textContent = on ? "Sending…" : "Send Message";
    if (btnSpin) btnSpin.classList.toggle("d-none", !on);
  }

  // ---------- Submit ----------
  function submitHandler(e) {
    e.preventDefault();
    clearAlert();

    // Validate
    const ok = validateAll();
    if (!ok) {
      setAlert("danger", "Please fix the highlighted fields and try again.");
      return;
    }

    setSubmitting(true);

    // Replace with your backend endpoint
    const API_URL = "https://jsonplaceholder.typicode.com/posts";

    const payload = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      topic: f.topic.value,
      message: f.message.value.trim(),
      consent: f.consent.checked,
      source: "contact_page",
    };

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(payload),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Network error");
        return r.json();
      })
      .then(() => {
        setAlert("success", "Thanks! Your message was sent successfully.");
        form.reset();
        // clear validity classes
        form.querySelectorAll(".is-valid, .is-invalid").forEach((el) => {
          el.classList.remove("is-valid", "is-invalid");
        });
      })
      .catch(() => {
        setAlert("danger", "Sorry, something went wrong. Please try again later.");
      })
      .finally(() => setSubmitting(false));
  }

  // ---------- Video: quiet autoplay with gesture fallback ----------
  function bootVideo() {
    const v = document.getElementById("streetVideo");
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("canplay", tryPlay, { once: true });
    ["click", "touchstart"].forEach((evt) =>
      window.addEventListener(evt, tryPlay, { once: true })
    );
  }

  // ---------- Boot ----------
  window.addEventListener("DOMContentLoaded", () => {
    bootVideo();
    hookLiveValidation();
    form?.addEventListener("submit", submitHandler);
  });
})();
