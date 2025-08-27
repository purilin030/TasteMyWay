document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.side-nav ul li a');


    window.addEventListener('scroll', () => {
        let current = '';


        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop - sectionHeight / 3) {
                current = section.getAttribute('id');
            }
        });


        navLinks.forEach(link => {
            link.classList.remove('active');
        });


        navLinks.forEach(link => {
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });


    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            //remove all the active first

            navLinks.forEach(l => l.classList.remove('active'));
            // add active
            link.classList.add('active');

            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
        });
    });
});