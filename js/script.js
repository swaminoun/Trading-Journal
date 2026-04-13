async function addTrade() {
    if (!currentUser) {
        alert('Please login to add trades.');
        return;
    }
    const currency = document.getElementById('currency').value.trim();
    const strategy = document.getElementById('strategy').value.trim();
    const riskReward = document.getElementById('riskReward').value.trim();
    let profit = document.getElementById('profit').value.trim();
    let loss = document.getElementById('loss').value.trim();
    const duration = document.getElementById('duration').value.trim();
    const remarks = document.getElementById('remarksInput').value.trim();
    const date = new Date().toLocaleDateString();

    if (!currency || !strategy) {
        alert('Please fill in Currency Traded and Strategy Used.');
        return;
    }

    if (profit && loss) {
        alert('Please fill in either Profit Taken or Loss Taken, not both.');
        return;
    }

    if (!profit && !loss) {
        alert('Please fill in either Profit Taken or Loss Taken.');
        return;
    }

    if (profit) {
        loss = 'N/A';
        if (!isNaN(profit)) profit = '$' + parseFloat(profit).toFixed(2);
    } else if (loss) {
        profit = 'N/A';
        if (!isNaN(loss)) loss = '$' + parseFloat(loss).toFixed(2);
    }

    let screenshot = 'N/A';
    const screenshotInput = document.getElementById('screenshot');
    if (screenshotInput.files[0]) {
        screenshot = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(screenshotInput.files[0]);
        });
    }

    const tableBody = document.getElementById('tradeTableBody');
    const newRow = tableBody.insertRow();

    newRow.insertCell(0).textContent = date;
    newRow.insertCell(1).textContent = currency;
    newRow.insertCell(2).textContent = strategy;
    newRow.insertCell(3).textContent = riskReward || 'N/A';
    newRow.insertCell(4).textContent = profit;
    newRow.insertCell(5).textContent = loss;
    newRow.insertCell(6).textContent = duration || 'N/A';
    newRow.insertCell(7).textContent = remarks || 'N/A';
    newRow.insertCell(8).innerHTML = screenshot !== 'N/A' ? '<img src="' + screenshot + '" alt="Screenshot" style="max-width:100px;">' : 'N/A';

    // Save to localStorage
    saveTrades();

    // Clear inputs
    document.getElementById('currency').value = '';
    document.getElementById('strategy').value = '';
    document.getElementById('riskReward').value = '';
    document.getElementById('profit').value = '';
    document.getElementById('loss').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('remarksInput').value = '';
    document.getElementById('screenshot').value = '';
}

function saveTrades() {
    const tableBody = document.getElementById('tradeTableBody');
    const trades = [];
    for (let i = 0; i < tableBody.rows.length; i++) {
        const row = tableBody.rows[i];
        const trade = {
            date: row.cells[0].textContent,
            currency: row.cells[1].textContent,
            strategy: row.cells[2].textContent,
            riskReward: row.cells[3].textContent,
            profit: row.cells[4].textContent,
            loss: row.cells[5].textContent,
            duration: row.cells[6].textContent,
            remarks: row.cells[7].textContent,
            screenshot: row.cells[8].innerHTML
        };
        trades.push(trade);
    }
    const storageKey = currentUser ? currentUser + '_trades' : 'trades';
    localStorage.setItem(storageKey, JSON.stringify(trades));
}

function loadTrades() {
    const storageKey = currentUser ? currentUser + '_trades' : 'trades';
    const trades = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const tableBody = document.getElementById('tradeTableBody');
    tableBody.innerHTML = '';
    trades.forEach(trade => {
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).textContent = trade.date;
        newRow.insertCell(1).textContent = trade.currency;
        newRow.insertCell(2).textContent = trade.strategy;
        newRow.insertCell(3).textContent = trade.riskReward;
        newRow.insertCell(4).textContent = trade.profit;
        newRow.insertCell(5).textContent = trade.loss;
        newRow.insertCell(6).textContent = trade.duration;
        newRow.insertCell(7).textContent = trade.remarks;
        newRow.insertCell(8).innerHTML = trade.screenshot;
    });
}

const GOOGLE_CLIENT_ID = '35954821232-gshj89ir8i795pjojkkgc59g17qdgaf1.apps.googleusercontent.com';
const GOOGLE_INIT_RETRY_LIMIT = 25;
const GOOGLE_SCRIPT_SELECTOR = 'script[src="https://accounts.google.com/gsi/client"]';

let googleInitialized = false;
let googleInitAttempts = 0;
let currentUser = null;

function goToAuth(mode = 'login') {
    const authMode = mode === 'signup' ? 'signup' : 'login';
    window.location.href = authMode === 'signup' ? 'auth.html?mode=signup' : 'auth.html';
}

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function updateCurrentUserDisplay(displayName) {
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = 'Logged in as ' + displayName;
    }
}

function finalizeAuth(userKey, displayName, provider) {
    currentUser = userKey;
    localStorage.setItem('currentUser', currentUser);
    if (provider) {
        localStorage.setItem('currentAuthProvider', provider);
    } else {
        localStorage.removeItem('currentAuthProvider');
    }

    if (window.location.pathname.endsWith('auth.html')) {
        window.location.href = 'index.html';
        return;
    }

    safeStyleToggle('auth', 'none');
    safeStyleToggle('loginForm', 'none');
    safeStyleToggle('signupForm', 'none');
    safeStyleToggle('userInfo', 'block');
    updateCurrentUserDisplay(displayName);
    loadTrades();
}

function setAuthMode(mode) {
    const authMode = mode === 'signup' ? 'signup' : 'login';
    safeStyleToggle('loginForm', authMode === 'signup' ? 'none' : 'block');
    safeStyleToggle('signupForm', authMode === 'signup' ? 'block' : 'none');

    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    if (loginToggle) {
        loginToggle.classList.toggle('is-active', authMode === 'login');
        loginToggle.setAttribute('aria-pressed', String(authMode === 'login'));
    }
    if (signupToggle) {
        signupToggle.classList.toggle('is-active', authMode === 'signup');
        signupToggle.setAttribute('aria-pressed', String(authMode === 'signup'));
    }

    const heading = document.getElementById('authHeading');
    const subheading = document.getElementById('authSubheading');
    if (heading) {
        heading.textContent = authMode === 'signup' ? 'Create your account' : 'Welcome back';
    }
    if (subheading) {
        subheading.textContent = authMode === 'signup'
            ? 'Sign up with a username and password on this browser, or use Google for cross-browser access.'
            : 'Log in with a browser-saved account, or continue with Google from any browser or device.';
    }

    if (googleInitialized) {
        renderGoogleButton(authMode);
    }

    if (window.location.pathname.endsWith('auth.html')) {
        const url = new URL(window.location.href);
        if (authMode === 'signup') {
            url.searchParams.set('mode', 'signup');
        } else {
            url.searchParams.delete('mode');
        }
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
}

function setGoogleSigninNote(message) {
    const note = document.getElementById('googleSigninNote');
    if (note) {
        note.textContent = message;
    }
}

function getActiveAuthMode() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm && signupForm.style.display !== 'none') {
        return 'signup';
    }
    return 'login';
}

function getGoogleOriginMessage() {
    if (window.location.protocol === 'file:') {
        return 'Google sign-in does not work from file://. Start a local server such as http://localhost:8000 or use your HTTPS Vercel URL.';
    }
    return 'Add ' + window.location.origin + ' to Authorized JavaScript origins in Google Cloud.';
}

function updateGoogleOriginValue() {
    const originValue = document.getElementById('googleOriginValue');
    if (originValue) {
        originValue.textContent = window.location.protocol === 'file:'
            ? 'file:// is not supported for Google sign-in'
            : window.location.origin;
    }
}

function renderGoogleButton(mode) {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (!buttonContainer || !window.google || !google.accounts || !google.accounts.id) {
        return;
    }

    buttonContainer.innerHTML = '';
    google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        width: '320'
    });
}

function bindGoogleScriptEvents() {
    const googleScript = document.querySelector(GOOGLE_SCRIPT_SELECTOR);
    if (!googleScript || googleScript.dataset.bound === 'true') {
        return;
    }

    googleScript.dataset.bound = 'true';
    googleScript.addEventListener('load', () => {
        googleInitAttempts = 0;
        initializeGoogleSignIn();
    });
    googleScript.addEventListener('error', () => {
        setGoogleSigninNote('Google sign-in script failed to load. Check your browser blockers or network, then reload the page.');
    });
}

function getMissingLocalAccountMessage(identifier) {
    if (identifier.includes('@')) {
        return 'That account is not saved in this browser. If you use this app on different browsers or devices, continue with Google above.';
    }
    return 'That username was not found in this browser. Local username accounts do not sync between browsers yet. Use Google above for cross-browser sign-in.';
}

function safeStyleToggle(id, displayValue) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = displayValue;
    }
}

function showLogin() {
    setAuthMode('login');
}

function hideLogin() {
    setAuthMode('login');
}

function showSignup() {
    setAuthMode('signup');
}

function hideSignup() {
    setAuthMode('login');
}

function signup() {
    const user = document.getElementById('signupUser').value.trim();
    const pass = document.getElementById('signupPass').value.trim();
    if (!user || !pass) {
        alert('Please fill in username and password.');
        return;
    }
    if (pass.length < 4) {
        alert('Password must be at least 4 characters.');
        return;
    }
    const users = getUsers();
    if (users[user]) {
        if (users[user].google && !users[user].password) {
            alert('This account already uses Google. Please continue with Google to sign in.');
            return;
        }
        alert('User already exists. Try a different username.');
        return;
    }
    users[user] = { password: pass, trades: [] };
    saveUsers(users);
    alert('Account created on this browser. Please login here, or use Google if you want access on other browsers and devices.');
    document.getElementById('signupUser').value = '';
    document.getElementById('signupPass').value = '';
    hideSignup();
}

function login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (!user || !pass) {
        alert('Please enter username and password.');
        return;
    }
    const users = getUsers();
    if (!users[user]) {
        alert(getMissingLocalAccountMessage(user));
        return;
    }
    if (users[user] && users[user].google && !users[user].password) {
        alert('This account uses Google sign-in. Please continue with Google.');
        return;
    }
    if (users[user].password === pass) {
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
        finalizeAuth(user, user, 'password');
    } else {
        alert('The password is incorrect for this browser account.');
        document.getElementById('loginPass').value = '';
    }
}


function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAuthProvider');
    currentUser = null;
    document.getElementById('auth').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('tradeTableBody').innerHTML = '';
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function handleGoogleCredentialResponse(response) {
    if (!response.credential) {
        alert('Google sign-in failed.');
        return;
    }
    const payload = parseJwt(response.credential);
    const email = payload.email;
    const name = payload.name || email;
    const users = getUsers();
    const existingUser = users[email] || {};

    users[email] = {
        ...existingUser,
        password: existingUser.password || null,
        name: name,
        google: true,
        trades: existingUser.trades || []
    };

    saveUsers(users);
    finalizeAuth(email, name, 'google');
}

function initializeGoogleSignIn() {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (!buttonContainer) {
        return;
    }

    if (googleInitialized) {
        renderGoogleButton(getActiveAuthMode());
        return;
    }

    if (!GOOGLE_CLIENT_ID) {
        setGoogleSigninNote('Google sign-in is not configured yet. Add your Google client ID first.');
        return;
    }

    if (!window.google || !google.accounts || !google.accounts.id) {
        googleInitAttempts += 1;
        if (googleInitAttempts < GOOGLE_INIT_RETRY_LIMIT) {
            setTimeout(initializeGoogleSignIn, 200);
            return;
        }
        setGoogleSigninNote('Google sign-in could not load. ' + getGoogleOriginMessage());
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            ux_mode: 'popup',
            use_fedcm_for_button: true
        });
        renderGoogleButton(getActiveAuthMode());
        googleInitialized = true;
        setGoogleSigninNote('Use Google to log in or create your account instantly. ' + getGoogleOriginMessage());
    } catch (error) {
        console.error('Google sign-in initialization failed:', error);
        setGoogleSigninNote('Google sign-in could not start. ' + getGoogleOriginMessage());
    }
}

function initAuthPage() {
    if (!document.body.classList.contains('auth-page')) {
        return;
    }

    updateGoogleOriginValue();
    if (window.location.protocol === 'file:') {
        setGoogleSigninNote('Google sign-in does not work when this page is opened directly from your files. Start a local server like http://localhost:8000 or use your HTTPS Vercel URL.');
        return;
    }
    bindGoogleScriptEvents();
    const params = new URLSearchParams(window.location.search);
    setAuthMode(params.get('mode') === 'signup' ? 'signup' : 'login');
    initializeGoogleSignIn();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeEnabled);
}

function initDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    }
}

function toggleMobileMenu() {
    const menu = document.querySelector('.site-nav');
    menu.classList.toggle('is-open');
}

function initApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        document.getElementById('auth')?.style && (document.getElementById('auth').style.display = 'none');
        document.getElementById('userInfo')?.style && (document.getElementById('userInfo').style.display = 'block');
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const displayName = users[currentUser]?.name || currentUser;
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement) {
            currentUserElement.textContent = 'Logged in as ' + displayName;
        }
        loadTrades();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initApp();
    initAuthPage();
});
