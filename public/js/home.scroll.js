// Simple efecto AOS (animaciones al hacer scroll)
const elements = document.querySelectorAll('[data-aos]');
function reveal() {
    elements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 50) {
        el.classList.add('aos-animate');
    }
    });
}
window.addEventListener('scroll', reveal);
reveal();