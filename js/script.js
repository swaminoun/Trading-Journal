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

let currentUser = null;

function goToAuth() {
    window.location.href = 'auth.html';
}

function safeStyleToggle(id, displayValue) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = displayValue;
    }
}

function showLogin() {
    safeStyleToggle('auth', 'none');
    safeStyleToggle('loginForm', 'block');
    safeStyleToggle('signupForm', 'none');
}

function hideLogin() {
    safeStyleToggle('auth', 'flex');
    safeStyleToggle('loginForm', 'none');
}

function showSignup() {
    safeStyleToggle('auth', 'none');
    safeStyleToggle('signupForm', 'block');
    safeStyleToggle('loginForm', 'none');
}

function hideSignup() {
    safeStyleToggle('auth', 'flex');
    safeStyleToggle('signupForm', 'none');
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
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[user]) {
        alert('User already exists. Try a different username.');
        return;
    }
    users[user] = { password: pass, trades: [] };
    localStorage.setItem('users', JSON.stringify(users));
    alert('Account created! Please login with your credentials.');
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
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[user] && users[user].password === pass) {
        currentUser = user;
        localStorage.setItem('currentUser', currentUser);
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
        if (window.location.pathname.endsWith('auth.html')) {
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('auth')?.style && (document.getElementById('auth').style.display = 'none');
        document.getElementById('loginForm')?.style && (document.getElementById('loginForm').style.display = 'none');
        document.getElementById('userInfo')?.style && (document.getElementById('userInfo').style.display = 'block');
        document.getElementById('currentUser')?.textContent && (document.getElementById('currentUser').textContent = 'Logged in as ' + user);
        loadTrades();
    } else {
        alert('Invalid username or password.');
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
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[email]) {
        users[email] = { password: null, name: name, google: true, trades: [] };
        localStorage.setItem('users', JSON.stringify(users));
    }
    currentUser = email;
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('currentAuthProvider', 'google');
    if (window.location.pathname.endsWith('auth.html')) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('currentUser').textContent = 'Logged in as ' + name;
    document.getElementById('auth').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    loadTrades();
}

function initializeGoogleSignIn() {
    const buttonContainer = document.getElementById('googleSignInButton');
    if (!buttonContainer) {
        return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) {
        setTimeout(initializeGoogleSignIn, 200);
        return;
    }
    google.accounts.id.initialize({
        client_id: '35954821232-gshj89ir8i795pjojkkgc59g17qdgaf1.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
        ux_mode: 'popup',
    });
    google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular'
    });
    google.accounts.id.prompt();
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
    initializeGoogleSignIn();
});