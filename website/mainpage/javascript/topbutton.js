document.getElementById("backToTopBtn").addEventListener("click", (e) => {
    e.preventDefault(); // 阻止默认跳转
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});
