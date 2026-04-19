//Comandi per i messaggi di errore
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
}

function clearError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
}

function switchForm(type) { //type è 'login' o 'register'
    const bar = document.getElementById('switchBar');
    const tabs = bar.querySelectorAll('.tab');
    const isReg = type === 'register';

    //reset errorMsg
    clearError();

    // sposta la pill
    bar.classList.toggle('register', isReg);

    // aggiorna tab attivo
    tabs[0].classList.toggle('active', !isReg);
    tabs[1].classList.toggle('active', isReg);

    // aggiorna testi dopo lo switch
    document.getElementById('formTitle').textContent = isReg ? 'Create account' : 'Welcome back!';
    document.getElementById('formDesc').textContent = isReg ? 'Join FridgeMatch today' : 'Login to start';
    document.getElementById('submitBtn').textContent = isReg ? 'Sign Up' : 'Login';

    // mostra o nasconde campi
    document.getElementById('usernameField').style.display = isReg ? 'block' : 'none';
    document.getElementById('confirmField').classList.toggle('hidden', !isReg);
    document.getElementById('rememberRow').style.display = isReg ? 'none' : 'flex';

    //aggiorna placeholder
    document.getElementById('email').placeholder = isReg ? 'Email' : 'Email or Username';

    //aggiorna type del campo email
    document.getElementById('email').type = isReg ? 'email' : 'text';

    //aggiorna required di username
    document.getElementById('username').required = isReg;

    // aggiorna link in fondo tra login e register
    const footerLink = document.getElementById('footerLink');
    if (isReg) {
        footerLink.innerHTML = 'Already have an account? <span onclick="switchForm(\'login\')">Login</span>';
    } else {
        footerLink.innerHTML = "Don't have an account? <span onclick=\"switchForm('register')\">Sign up</span>";
    }

    // reset campi al cambio
    document.getElementById('mainForm').reset();
}
//gestisce la visibilità delle password
function togglePwd(fieldId, btn) {
    const input = document.getElementById(fieldId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.style.opacity = isHidden ? '1' : '0.4';
}//cambia l'opacità del tasto occhio a seconda se la password è nascosta o visibile

//gestisce l'invio dei dati
async function handleSubmit(event) {
    event.preventDefault();//impedisce al browser di ricaricare la pagina

    // reset ErrorMsg
    clearError();

    const isRegister = document.getElementById('switchBar').classList.contains('register');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (isRegister) {
            const username = document.getElementById('username').value;
            const confirmPwd = document.getElementById('confirmPwd').value;

            if (!email.includes('@')) {
                showError('Insert a valid email address!');
                return;
            }

            if (password !== confirmPwd) {
                showError('Passwords do not match!');
                return;
            }
        
            //logica register
            const res = await fetch("http://127.0.0.1:3000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });


            if (!res.ok) {
                const msg = await res.text();
                showError(msg);
                return;
            }

        } else {
            const res = await fetch("http://127.0.0.1:3000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
        
            if (!res.ok) {
                const msg = await res.text();
                showError(msg);
                return;
            }
        }
        window.location.href = "/public/pages/dashboard";
    } catch (err) {
        showError("Server error. Please try again later.");
    }
}

// funzione per l'accesso da ospite
function continueAsGuest() {
    sessionStorage.setItem('userMode', 'guest'); // sessionstorage per ricordare l'utente solo durante questa sessione di navigazione
    sessionStorage.setItem('username', 'Guest User');    
    window.location.href = "../dashboard/index.html";
}
