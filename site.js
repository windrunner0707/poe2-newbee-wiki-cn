(() => {
  const article = document.querySelector('article[data-page]');
  if (!article) return;
  const key = 'poe2-guide-checks:' + article.dataset.page;
  const checks = [...article.querySelectorAll('input[type="checkbox"]')];
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  checks.forEach((box, i) => {
    box.disabled = false;
    box.checked = saved.includes(i);
    box.setAttribute('aria-label', `完成第 ${i + 1} 项`);
    box.addEventListener('change', () => {
      try { localStorage.setItem(key, JSON.stringify(checks.flatMap((item, index) => item.checked ? [index] : []))); } catch {}
    });
  });
  const links = [...document.querySelectorAll('.toc a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + visible.target.id));
    }, {rootMargin:'-100px 0px -65% 0px'});
    sections.forEach(s => observer.observe(s));
  }
})();
