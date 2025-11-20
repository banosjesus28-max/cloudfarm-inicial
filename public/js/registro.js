document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita el envío tradicional del formulario

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const messageBox = document.getElementById('messageBox');
    messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        console.log(data); // Para depuración

        if (res.ok) {
            messageBox.classList.add('alert-success');
            messageBox.textContent = data.message;

            // Redirigir después de 1.5 segundos
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            messageBox.classList.add('alert-danger');
            messageBox.textContent = data.message || 'Error al registrar usuario';
        }

    } catch (error) {
        console.error('Error en fetch:', error);
        messageBox.classList.add('alert-danger');
        messageBox.textContent = 'Error de conexión con el servidor';
    }
});