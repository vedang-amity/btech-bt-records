// Replace only this value with the deployed Apps Script web app URL.
const API_URL = "https://script.google.com/macros/s/AKfycbzbdOYF0q5Z97Z9E8D6NhiUWzAsw7PXB8TazyRORIBwIQwhSccGCg5r-muHq01zk-Mn/exec";

const searchForm = document.querySelector('#search-form');
const enrollmentInput = document.querySelector('#enrollment');
const searchButton = document.querySelector('#search-button');
const result = document.querySelector('#result');
const statusBox = document.querySelector('#status');

const showStatus = (message, type = 'error') => {
  statusBox.textContent = message;
  statusBox.className = `status status-${type}`;
  statusBox.hidden = false;
};

const clearStatus = () => {
  statusBox.hidden = true;
  statusBox.textContent = '';
};

const setResult = (html) => {
  result.innerHTML = html;
  result.hidden = false;
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

const setSearchBusy = (busy) => {
  searchButton.disabled = busy;
  searchButton.textContent = busy ? 'Searching...' : 'Search Student';
};

const submitDetails = async (event, enrollment) => {
  event.preventDefault();
  const form = event.currentTarget;
  const gender = form.gender.value;
  const dob = form.dob.value;
  const category = form.category.value;
  const submitButton = form.querySelector('button[type="submit"]');

  if (!gender) return showStatus('Please select your Gender.');
  if (!dob) return showStatus('Please select your Date of Birth.');
  if (!category) return showStatus('Please select your Category.');

  clearStatus();
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    // Apps Script web apps redirect requests; a simple GET avoids browser CORS failures after that redirect.
    const query = new URLSearchParams({ action: 'submit', enrollment, gender, dob, category });
    const response = await fetch(`${API_URL}?${query}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();
    if (!data.success) {
      if (data.code === 'ALREADY_SUBMITTED') return renderLocked();
      throw new Error(data.message || 'Request failed');
    }
    setResult(`<div class="success-box"><h2>Details Submitted Successfully</h2><p>Your registration details have been recorded successfully.</p><p>You can submit these details only once.</p></div>`);
    showStatus('Your details have been submitted successfully.', 'success');
  } catch (error) {
    showStatus('Something went wrong while processing your request. Please try again.');
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Details';
  }
};

const renderLocked = () => {
  setResult(`<div class="locked"><!-- Duplicate Entry Funny Message -->
<div id="duplicateMessage" class="duplicate-box">
    <div class="emoji">🚨😂</div>

    <h2>BHAI RUK JAA! 🚨</h2>

    <p>
        Ye form tum <strong>already ek baar bhar chuke ho!</strong> 😂
    </p>

    <p>
        Dobara bharne ki koshish karke tum kya prove karna chahte ho? 💀<br>
        <strong>Ki tumhara pehla answer galat tha ya tumhari memory?</strong> 😭
    </p>

    <div class="system-message">
        📋 System bol raha hai:<br>
        <strong>“Bhai, ek baar hi kaafi tha… itna bhi serious mat ho.”</strong> 😂
    </div>

    <p class="status">
        ❌ Duplicate Entry Detected<br>
        🧠 Common Sense Not Detected
    </p>

    <p class="bottom-text">
        Please go back before the form gets personally offended. 😂
    </p>
</div>

<style>
    .duplicate-box {
        max-width: 500px;
        margin: 50px auto;
        padding: 30px;
        text-align: center;
        font-family: Arial, sans-serif;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border: 2px solid #ff4444;
    }

    .emoji {
        font-size: 50px;
        margin-bottom: 10px;
    }

    .duplicate-box h2 {
        color: #e53935;
        margin-bottom: 20px;
    }

    .duplicate-box p {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
    }

    .system-message {
        margin: 20px 0;
        padding: 15px;
        background: #fff3cd;
        border-radius: 12px;
        color: #664d03;
    }

    .status {
        font-weight: bold;
        color: #d32f2f !important;
    }

    .bottom-text {
        font-weight: bold;
        font-size: 14px !important;
    }
</style></div>`);
};

const renderStudent = (data, enrollment) => {
  const student = data.student;
  setResult(`<div class="result-panel">
    <h2>Student Details</h2>
    <div class="detail-list">
      <div class="detail"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(student.name)}</span></div>
      <div class="detail"><span class="detail-label">Father's Name</span><span class="detail-value">${escapeHtml(student.fatherName)}</span></div>
      <div class="detail"><span class="detail-label">Enrollment Number</span><span class="detail-value">${escapeHtml(student.enrollment)}</span></div>
    </div>
    <form id="details-form" novalidate>
      <div class="form-grid">
        <div><label for="gender">Gender *</label><select id="gender" name="gender" required><option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><label for="dob">Date of Birth *</label><input id="dob" name="dob" type="date" max="${new Date().toISOString().slice(0, 10)}" required></div>
        <div><label for="category">Category *</label><select id="category" name="category" required><option value="">Select Category</option><option>GEN</option><option>OBC-CL</option><option>OBC-NCL</option><option>SC</option><option>ST</option></select></div>
      </div>
      <div class="submit-row"><button class="button button-primary" type="submit">Submit Details</button></div>
    </form>
  </div>`);
  const detailsForm = document.querySelector('#details-form');
  const submitButton = detailsForm.querySelector('button[type="submit"]');
  const updateSubmitState = () => {
    submitButton.disabled = !(detailsForm.gender.value && detailsForm.dob.value && detailsForm.category.value);
  };
  detailsForm.addEventListener('input', updateSubmitState);
  detailsForm.addEventListener('change', updateSubmitState);
  detailsForm.addEventListener('submit', (event) => submitDetails(event, enrollment));
  updateSubmitState();
};

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const enrollment = enrollmentInput.value.trim();
  clearStatus();
  result.hidden = true;
  result.innerHTML = '';
  if (!enrollment) return showStatus('Please enter your Enrollment Number.');
  if (API_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') return showStatus('Please configure the Apps Script URL before searching.');

  setSearchBusy(true);
  try {
    const query = new URLSearchParams({ action: 'search', enrollment });
    const response = await fetch(`${API_URL}?${query}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    if (!data.found) {
      setResult(`<div class="not-found"><h2>Student Not Found</h2><p>No student record was found for this Enrollment Number.</p><p>Please check the Enrollment Number and try again.</p></div>`);
    } else if (data.submitted) {
      renderLocked();
    } else {
      renderStudent(data, enrollment);
    }
  } catch (error) {
    showStatus('Something went wrong while processing your request. Please try again.');
  } finally {
    setSearchBusy(false);
  }
});
