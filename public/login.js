// Login form handler for authorization code flow
const loginForm = document.getElementById('loginForm');
const loadingSpinner = document.getElementById('loadingSpinner');
const loginContainer = document.getElementById('loginContainer');

function showSpinner(show) {
  loadingSpinner.style.display = show ? 'block' : 'none';
  loginContainer.style.display = show ? 'none' : 'block';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error');

  showSpinner(true);
  errorDiv.innerHTML = '';

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // On successful login, redirect back to the authorization flow
    // The server will handle the redirect with the authorization code
    window.location.href = data.redirect_uri;

  } catch (error) {
    errorDiv.textContent = error.message || 'Login failed';
    errorDiv.classList.add('show');
    showSpinner(false);
  }
});