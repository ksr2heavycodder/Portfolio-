/* app.js — Portfolio main logic */

// ── Toast helper ──
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Navbar scroll ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNav();
});

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
  });
}

// ── Hamburger menu ──
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});
document.querySelectorAll('.nav-link').forEach(l => {
  l.addEventListener('click', () => document.getElementById('nav-links').classList.remove('open'));
});

// ── Typing animation ──
const ROLES = [];
let roleIdx = 0, charIdx = 0, deleting = false;
function typeRole() {
  if (!ROLES.length) return;
  const el = document.getElementById('typing-text');
  const role = ROLES[roleIdx];
  if (!deleting) {
    el.textContent = role.slice(0, ++charIdx);
    if (charIdx === role.length) { deleting = true; return setTimeout(typeRole, 1800); }
  } else {
    el.textContent = role.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % ROLES.length; }
  }
  setTimeout(typeRole, deleting ? 60 : 100);
}

// ── Counter animation ──
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = +el.dataset.target;
    let current = 0;
    const inc = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      if (e.target.closest('#about')) animateCounters();
    }
  });
}, { threshold: 0.15 });

function attachReveal() {
  document.querySelectorAll('.section-header,.about-text,.about-cards,.info-card,.skill-card,.project-card,.contact-info,.contact-form').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

// ── Skill bars animation ──
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    }
  });
}, { threshold: 0.2 });

// ── Load Profile ──
async function loadProfile() {
  const p = await DB.get(DB.STORES.profile, 'main');
  if (!p) return;

  document.getElementById('hero-name').textContent = p.name;
  document.getElementById('avatar-initials').textContent = p.initials || p.name.split(' ').map(w => w[0]).join('');
  document.getElementById('about-text').querySelector('p').textContent = p.bio;
  document.getElementById('about-text').querySelectorAll('p')[1].textContent = p.bio2 || '';
  document.getElementById('education-text').textContent = p.education;
  document.getElementById('experience-text').textContent = p.experience;
  document.getElementById('location-text').textContent = p.location;
  document.getElementById('contact-email').textContent = p.email;
  document.getElementById('contact-phone').textContent = p.phone;
  document.getElementById('contact-location').textContent = p.location;

  if (p.stats) {
    const nums = document.querySelectorAll('.stat-number');
    if (nums[0]) nums[0].dataset.target = p.stats.projects;
    if (nums[1]) nums[1].dataset.target = p.stats.years;
    if (nums[2]) nums[2].dataset.target = p.stats.clients;
  }

  // Typing roles
  if (p.title && p.title.length) {
    ROLES.push(...p.title);
    typeRole();
  }
}

// ── Load Skills ──
async function loadSkills() {
  const skills = await DB.getAll(DB.STORES.skills);
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';
  skills.forEach(s => {
    const card = document.createElement('div');
    card.className = 'skill-card reveal';
    card.innerHTML = `
      <div class="skill-header">
        <div class="skill-name"><span class="skill-icon">${s.icon}</span>${s.name}</div>
        <span class="skill-pct">${s.pct}%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-fill" data-pct="${s.pct}" style="width:0"></div>
      </div>
      <div class="skill-category">${s.category}</div>`;
    grid.appendChild(card);
    revealObserver.observe(card);
  });
  skillObserver.observe(grid);
}

// ── Load Projects ──
let allProjects = [];
async function loadProjects(filter = 'all') {
  allProjects = await DB.getAll(DB.STORES.projects);
  renderProjects(filter);
}

function renderProjects(filter) {
  const grid = document.getElementById('projects-grid');
  const filtered = filter === 'all' ? allProjects : allProjects.filter(p => p.category === filter);
  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;width:100%;padding:40px">No projects found.</p>';
    return;
  }
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card reveal';
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="project-image" style="background:${p.color || 'var(--gradient)'}">
        <span style="position:relative;z-index:1;font-size:4rem">${p.emoji || '🚀'}</span>
      </div>
      <div class="project-body">
        <div class="project-tags">${(p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.description}</p>
        <div class="project-footer">
          ${p.liveUrl ? `<a href="${p.liveUrl}" class="project-link" target="_blank" onclick="event.stopPropagation()">🔗 Live Demo</a>` : ''}
          ${p.githubUrl ? `<a href="${p.githubUrl}" class="project-link" target="_blank" onclick="event.stopPropagation()">💻 Code</a>` : ''}
        </div>
      </div>`;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
    revealObserver.observe(card);
  });
}

// ── Filter buttons ──
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});

// ── Modal ──
function openModal(p) {
  document.getElementById('modal-body').innerHTML = `
    <div style="background:${p.color || 'var(--gradient)'};height:160px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:5rem;margin-bottom:24px">${p.emoji || '🚀'}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${(p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
    <h2 style="font-size:1.6rem;font-weight:800;margin-bottom:12px">${p.title}</h2>
    <p style="color:var(--text-secondary);margin-bottom:24px">${p.description}</p>
    <div style="display:flex;gap:16px">
      ${p.liveUrl ? `<a href="${p.liveUrl}" class="btn btn-primary" target="_blank">🔗 Live Demo</a>` : ''}
      ${p.githubUrl ? `<a href="${p.githubUrl}" class="btn btn-outline" target="_blank">💻 View Code</a>` : ''}
    </div>`;
  document.getElementById('project-modal').classList.add('open');
}
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('project-modal').classList.remove('open');
});
document.getElementById('project-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ── Contact Form ──
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('send-btn');
  const status = document.getElementById('form-status');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending…';

  const msg = {
    name: document.getElementById('msg-name').value,
    email: document.getElementById('msg-email').value,
    subject: document.getElementById('msg-subject').value,
    body: document.getElementById('msg-body').value,
    date: new Date().toISOString(),
  };

  try {
    await DB.add(DB.STORES.messages, msg);
    status.textContent = '✅ Message sent! I\'ll get back to you soon.';
    status.className = 'form-status success';
    e.target.reset();
    showToast('Message sent successfully!', 'success');
  } catch {
    status.textContent = '❌ Something went wrong. Please try again.';
    status.className = 'form-status error';
  }
  btn.disabled = false;
  btn.querySelector('span').textContent = 'Send Message';
  setTimeout(() => status.textContent = '', 5000);
});

// ── Footer year ──
document.getElementById('year').textContent = new Date().getFullYear();

// ── INIT ──
async function init() {
  await DB.seed();
  await loadProfile();
  await loadSkills();
  await loadProjects();
  attachReveal();
}

init();
