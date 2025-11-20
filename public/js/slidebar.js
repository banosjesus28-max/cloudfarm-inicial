// Interfaz
document.getElementById('toggle-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('content').classList.toggle('active');
});

setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('es-MX', { hour12: false });
}, 1000);