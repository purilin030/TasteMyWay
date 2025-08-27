// Year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

// Simple form validation + fake submit
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

function setError(name, msg){
  const err = form.querySelector(`.error[data-for="${name}"]`);
  if (err) err.textContent = msg || '';
}

function clearErrors(){
  form.querySelectorAll('.error').forEach(el => el.textContent = '');
}

function validateEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function validatePhone(v){
  if (!v) return true; // optional
  // Basic MY/international tolerance
  return /^[+]?[\d\s-]{7,20}$/.test(v);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const data = {
    name:    form.name.value.trim(),
    email:   form.email.value.trim(),
    phone:   form.phone.value.trim(),
    topic:   form.topic.value,
    message: form.message.value.trim(),
    consent: form.querySelector('#consent').checked
  };

  // Validate
  let ok = true;
  if (!data.name){ ok = false; setError('name','Please enter your name.'); }
  if (!data.email || !validateEmail(data.email)){ ok = false; setError('email','Enter a valid email.'); }
  if (!validatePhone(data.phone)){ ok = false; setError('phone','Enter a valid phone number.'); }
  if (!data.topic){ ok = false; setError('topic','Please select a topic.'); }
  if (!data.message){ ok = false; setError('message','Please enter a message.'); }
  if (!data.consent){ ok = false; setError('consent','Please consent so we can contact you.'); }

  if (!ok){
    statusEl.textContent = 'Please fix the highlighted fields.';
    statusEl.style.color = '#b00020';
    return;
  }

  // Simulated submit — replace with fetch to your backend if needed
  try {
    // Example POST if you wire a backend:
    // const res = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    // if (!res.ok) throw new Error('Network error');
    await new Promise(r => setTimeout(r, 600));

    statusEl.textContent = 'Thanks! Your message has been sent.';
    statusEl.style.color = '#2d7a2f';
    form.reset();
  } catch (err){
    statusEl.textContent = 'Oops, something went wrong. Please try again later.';
    statusEl.style.color = '#b00020';
  }
});
