// Mobile menu
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Nav border on scroll + active section link
const nav = document.querySelector('.nav');
const links = [...menu.querySelectorAll('a[href^="#"]')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
  let current = null;
  for (const s of sections) if (s.getBoundingClientRect().top < 140) current = s.id;
  links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Lightbox for galleries
const lb = document.querySelector('.lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('.lightbox__caption');
let group = [];
let index = 0;

const show = (i) => {
  index = (i + group.length) % group.length;
  lbImg.src = group[index].src;
  lbImg.alt = group[index].alt;
  lbCap.textContent = `${group[index].alt} — ${index + 1} / ${group.length}`;
};
const close = () => { lb.hidden = true; document.body.style.overflow = ''; };

document.querySelectorAll('.gallery').forEach((gallery) => {
  const imgs = [...gallery.querySelectorAll('img')];
  imgs.forEach((img, i) => img.addEventListener('click', () => {
    group = imgs;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }));
});
lb.querySelector('.lightbox__close').addEventListener('click', close);
lb.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
lb.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') show(index - 1);
  if (e.key === 'ArrowRight') show(index + 1);
});

document.getElementById('year').textContent = new Date().getFullYear();
