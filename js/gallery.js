import { TEMPLATES } from './templates.js';
import { applyTheme } from './theme.js';
import { VERSION, THEME_KEY } from './constants.js';

function renderGallery(filterCat = 'all') {
  const grid = document.getElementById('gallery-grid');
  const emptyMsg = document.getElementById('gallery-empty');

  // Remove existing cards (leave the empty message node)
  grid.querySelectorAll('.gallery-card').forEach(el => el.remove());

  const visible = filterCat === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.appCategory === filterCat);

  if (visible.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  [...visible].sort((a, b) => a.name.localeCompare(b.name)).forEach(template => {
    const count = template.tabs
      ? template.tabs.reduce((sum, t) => sum + Object.keys(t.hotkeys).length, 0)
      : Object.keys(template.hotkeys).length;

    const card = document.createElement('a');
    card.className = 'gallery-card';
    card.href = `${template.id}.html`;
    card.dataset.category = template.appCategory;

    const iconEl = document.createElement('div');
    iconEl.className = 'gallery-card-icon';
    const img = document.createElement('img');
    img.src = template.iconSrc;
    img.alt = template.name;
    img.className = template.iconClass || (template.iconWide ? 'template-logo template-logo--wide' : 'template-logo');
    iconEl.appendChild(img);

    const nameEl = document.createElement('span');
    nameEl.className = 'gallery-card-name';
    nameEl.textContent = template.name;

    const badgeEl = document.createElement('span');
    badgeEl.className = 'template-badge';
    badgeEl.textContent = template.appCategory;

    const countEl = document.createElement('span');
    countEl.className = 'template-count';
    countEl.textContent = template.tabs
      ? `${template.tabs.length} tabs · ${count} keys`
      : `${count} keys`;

    const metaEl = document.createElement('div');
    metaEl.className = 'gallery-card-meta';
    metaEl.append(badgeEl, countEl);

    card.append(iconEl, nameEl, metaEl);
    grid.appendChild(card);
  });
}

function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  renderGallery();

  document.querySelectorAll('.gallery-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderGallery(tab.dataset.cat);
    });
  });

  document.getElementById('footer-version').textContent = `v${VERSION}`;
}

init();
