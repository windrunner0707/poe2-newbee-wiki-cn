(() => {
  const article = document.querySelector('article[data-page]');
  const updateTableHints = () => {
    document.querySelectorAll('.table-shell').forEach(shell => {
      const scroll = shell.querySelector('.table-scroll');
      shell.classList.toggle('is-overflowing', scroll.scrollWidth > scroll.clientWidth + 2);
    });
  };
  updateTableHints();
  window.addEventListener('resize', updateTableHints);
  const allGuides = document.querySelector('.all-guides');
  if (allGuides) {
    const revealGuidesFromHash = () => {
      if (location.hash === '#guide-list') allGuides.open = true;
    };
    revealGuidesFromHash();
    window.addEventListener('hashchange', revealGuidesFromHash);
  }
  if (!article) return;
  const key = 'poe2-guide-checks:' + article.dataset.page;
  const checks = [...article.querySelectorAll('input[type="checkbox"]')];
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  if (!Array.isArray(saved)) saved = [];
  checks.forEach((box, i) => {
    const label = box.closest('li, tr')?.textContent.replace(/\s+/g, ' ').trim() || `第 ${i + 1} 项`;
    box.disabled = false;
    box.checked = saved.includes(label) || saved.includes(i);
    box.setAttribute('aria-label', `完成：${label}`);
    box.addEventListener('change', () => {
      try {
        localStorage.setItem(key, JSON.stringify(checks.flatMap((item, index) => {
          const itemLabel = item.closest('li, tr')?.textContent.replace(/\s+/g, ' ').trim() || `第 ${index + 1} 项`;
          return item.checked ? [itemLabel] : [];
        })));
      } catch {}
    });
  });
  const tocPanel = document.querySelector('.toc-panel');
  const mobile = window.matchMedia('(max-width: 900px)');
  const setTocForViewport = () => { tocPanel.open = !mobile.matches; };
  setTocForViewport();
  mobile.addEventListener('change', setTocForViewport);
  tocPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    if (mobile.matches) tocPanel.open = false;
  }));
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
