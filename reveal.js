if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("motion");
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        reveal.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -24px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(element => reveal.observe(element));
}
