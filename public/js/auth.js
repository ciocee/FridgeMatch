function switchForm(type) { //type è 'login' o 'register'
    const bar = document.getElementById('switchBar');
    const tabs = bar.querySelectorAll('.tab');
    const isReg = type === 'register';

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
function handleSubmit(event) {
    event.preventDefault();//impedisce al browser di ricaricare la pagina

    const isRegister = document.getElementById('switchBar').classList.contains('register');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isRegister) {
        const username = document.getElementById('username').value;
        const confirmPwd = document.getElementById('confirmPwd').value;

        if (password !== confirmPwd) {
            alert('Passwords do not match!');
            return;
        }
    // bisogna aggiungere la chiamata verso il database/server per le registrazioni
        //aggiungere la logica di registrazione
        console.log('Register:', { username, email, password });

    } else {
        //aggiungere la logica di login
        console.log('Login:', { email, password });
    }
}
