// Scroll-reveal for the .story sections on the home page. Kept as an external file
// (not inline) because the site's Content-Security-Policy is script-src 'self' — any
// inline <script> block is silently blocked by the browser, which is what caused the
// whole page to render blank (every section stayed at opacity:0 forever).
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('.story section, .story-hero');
  if (!targets.length) return;
  const storyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('story-visible');
    });
  }, { threshold: 0.1 });
  targets.forEach((el) => storyObserver.observe(el));
});
