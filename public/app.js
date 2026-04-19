// Configuration
const API_BASE_URL = '';

// PKCE helper functions
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

function base64URLEncode(array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', initializeApp);

// JWT Decode function (simple implementation)
function jwtDecode(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// UI Elements
const authContainer = document.getElementById('authContainer');
const dashboardContainer = document.getElementById('dashboardContainer');
const loadingSpinner = document.getElementById('loadingSpinner');

const tabBtns = document.querySelectorAll('.tab-btn');
const formSections = document.querySelectorAll('.form-section');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const fetchUserInfoBtn = document.getElementById('fetchUserInfoBtn');

// Tab switching
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');

    // Update active tab button
    tabBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Update active form
    formSections.forEach((section) => section.classList.remove('active'));
    document
      .getElementById(tabName + 'Form')
      .classList.add('active');

    // Clear error messages
    document.getElementById('loginError').innerHTML = '';
    document.getElementById('registerError').innerHTML = '';
  });
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // For demo purposes, we'll use the authorization code flow
  // Generate PKCE challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store code verifier in session storage for later use
  sessionStorage.setItem('code_verifier', codeVerifier);

  // Redirect to authorization endpoint
  const authUrl = new URL(`${window.location.origin}/auth/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', 'demo-client');
  authUrl.searchParams.set('redirect_uri', window.location.origin + '/callback');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', generateState());

  window.location.href = authUrl.toString();
});

// Register Form Handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullname = document.getElementById('registerFullname').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const username = document.getElementById('registerUsername').value;
  const errorDiv = document.getElementById('registerError');

  showSpinner(true);
  errorDiv.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullname,
        email,
        password,
        username: username || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Store tokens
    sessionStorage.setItem('access_token', data.data.access_token);
    sessionStorage.setItem('id_token', data.data.id_token);

    // Decode and display user info
    const decoded = jwtDecode(data.data.id_token);
    displayDashboard(decoded, data.data.access_token, data.data.id_token);

    // Clear form
    registerForm.reset();
  } catch (error) {
    errorDiv.textContent = error.message || 'Registration failed';
    errorDiv.classList.add('show');
  } finally {
    showSpinner(false);
  }
});

// Display Dashboard
function displayDashboard(userInfo, accessToken, idToken) {
  // Display user info
  document.getElementById('userName').textContent = userInfo.name || '-';
  document.getElementById('userEmail').textContent = userInfo.email || '-';
  document.getElementById('userId').textContent = userInfo.sub || '-';
  document.getElementById('userEmailVerified').textContent =
    userInfo.email_verified === true ? 'Verified' : 'Not verified';

  // Show dashboard, hide auth
  authContainer.style.display = 'none';
  dashboardContainer.style.display = 'block';
}

// Logout
logoutBtn.addEventListener('click', () => {
  // Clear tokens
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('id_token');

  // Clear forms
  loginForm.reset();
  registerForm.reset();
  document.getElementById('apiResponse').innerHTML = '';

  // Clear error messages
  document.getElementById('loginError').innerHTML = '';
  document.getElementById('registerError').innerHTML = '';

  // Show auth, hide dashboard
  authContainer.style.display = 'block';
  dashboardContainer.style.display = 'none';
});

// Fetch User Info from API
fetchUserInfoBtn.addEventListener('click', async () => {
  const accessToken = sessionStorage.getItem('access_token');
  const apiResponseDiv = document.getElementById('apiResponse');

  if (!accessToken) {
    apiResponseDiv.textContent = 'No access token found';
    return;
  }

  showSpinner(true);
  apiResponseDiv.textContent = 'Loading...';

  try {
    const response = await fetch(`${API_BASE_URL}/auth/userinfo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to fetch user info');
    }

    // Display response with formatting
    apiResponseDiv.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    apiResponseDiv.textContent = 'Error: ' + (error.message || 'Failed to fetch user info');
  } finally {
    showSpinner(false);
  }
});

// Helper Functions
function showSpinner(show) {
  loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Check if user is already logged in (on page load)
function initializeApp() {
  const accessToken = sessionStorage.getItem('access_token');
  const idToken = sessionStorage.getItem('id_token');

  if (accessToken && idToken) {
    const decoded = jwtDecode(idToken);
    displayDashboard(decoded, accessToken, idToken);
  }
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', initializeApp);
