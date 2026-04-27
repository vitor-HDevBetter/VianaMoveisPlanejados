/* ================================================================
   VIANA MÓVEIS PLANEJADOS — script.js
   Pure vanilla JS: navbar, carousel, scroll reveal, form, year
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. HELPERS
---------------------------------------------------------------- */
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ----------------------------------------------------------------
   2. STICKY NAVBAR — adds .scrolled class on scroll
---------------------------------------------------------------- */
(function initNavbar() {
  const navbar = qs('#navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run immediately
})();

/* ----------------------------------------------------------------
   3. HAMBURGER MENU — toggle mobile nav
---------------------------------------------------------------- */
(function initHamburger() {
  const btn  = qs('#hamburger');
  const menu = qs('#mobile-menu');
  if (!btn || !menu) return;

  const open  = () => {
    btn.classList.add('active');
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    btn.classList.remove('active');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', () => {
    btn.classList.contains('active') ? close() : open();
  });

  // Close on link click
  qsa('a', menu).forEach(a => a.addEventListener('click', close));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) close();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();

/* ----------------------------------------------------------------
   4. SMOOTH SCROLL for anchor links
---------------------------------------------------------------- */
(function initSmoothScroll() {
  const NAVBAR_H = 72; // matches --navbar-h in CSS

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_H;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* ----------------------------------------------------------------
   5. SCROLL REVEAL — fade/slide in elements as they enter viewport
---------------------------------------------------------------- */
(function initScrollReveal() {
  const items = qsa('.reveal');
  if (!items.length) return;

  // Stagger delay for groups of siblings
  const applyStagger = (entries) => {
    // Group siblings under same parent
    const groups = new Map();
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      const key  = target.parentElement;
      const list = groups.get(key) || [];
      list.push(target);
      groups.set(key, list);
    });

    groups.forEach((siblings) => {
      siblings.forEach((el, i) => {
        el.style.transitionDelay = `${i * 80}ms`;
        el.classList.add('visible');
        observer.unobserve(el);
      });
    });
  };

  const observer = new IntersectionObserver(applyStagger, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  items.forEach(el => observer.observe(el));
})();

/* ----------------------------------------------------------------
   6. TESTIMONIALS CAROUSEL
---------------------------------------------------------------- */
(function initCarousel() {
  const track    = qs('#carouselTrack');
  const btnPrev  = qs('#carouselPrev');
  const btnNext  = qs('#carouselNext');
  const dotsWrap = qs('#carouselDots');

  if (!track || !btnPrev || !btnNext) return;

  const cards = qsa('.testimonial-card', track);
  if (!cards.length) return;

  let current     = 0;
  let autoTimer   = null;
  let startX      = 0;
  let isDragging  = false;

  // --- Determine cards per view ---
  const getPerView = () => {
    if (window.innerWidth >= 1200) return 3;
    if (window.innerWidth >= 768)  return 2;
    return 1;
  };

  const getMax = () => Math.max(0, cards.length - getPerView());

  // --- Render dots ---
  const renderDots = () => {
    dotsWrap.innerHTML = '';
    const max = getMax();
    for (let i = 0; i <= max; i++) {
      const dot = document.createElement('button');
      dot.className = `carousel__dot${i === current ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  };

  // --- Move to slide ---
  const goTo = (idx) => {
    const max = getMax();
    current = Math.max(0, Math.min(idx, max));

    // Calculate card width + gap
    const cardW = cards[0].offsetWidth;
    const gap   = 24; // var(--space-6) in px
    track.style.transform = `translateX(-${current * (cardW + gap)}px)`;

    // Update dots
    qsa('.carousel__dot', dotsWrap).forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });

    // Update buttons accessibility
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === max;
  };

  // --- Navigation ---
  btnPrev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  btnNext.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  // --- Auto-play ---
  const startAuto = () => {
    autoTimer = setInterval(() => {
      goTo(current >= getMax() ? 0 : current + 1);
    }, 5000);
  };

  const resetAuto = () => {
    clearInterval(autoTimer);
    startAuto();
  };

  // --- Touch/drag support ---
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
      resetAuto();
    }
    isDragging = false;
  });

  // Mouse drag support
  track.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
    track.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 60) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
      resetAuto();
    }
    isDragging = false;
    track.style.cursor = '';
  });

  // --- Keyboard support ---
  document.addEventListener('keydown', (e) => {
    if (!track.closest('.testimonials')) return;
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  });

  // --- Pause on hover ---
  track.closest('.carousel').addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.closest('.carousel').addEventListener('mouseleave', startAuto);

  // --- Responsive ---
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderDots();
      goTo(Math.min(current, getMax()));
    }, 200);
  });

  // --- Init ---
  renderDots();
  goTo(0);
  startAuto();

})();

/* ----------------------------------------------------------------
   7. CONTACT FORM — validation + submit feedback
---------------------------------------------------------------- */
(function initContactForm() {
  const form    = qs('#contactForm');
  const success = qs('#formSuccess');
  if (!form) return;

  // Simple field validator
  const validate = () => {
    let ok = true;

    qsa('[required]', form).forEach(field => {
      const valid = field.value.trim().length > 0;
      field.style.borderColor = valid ? '' : 'var(--color-primary)';
      if (!valid) ok = false;
    });

    // Email format check
    const emailField = qs('#email', form);
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      emailField.style.borderColor = 'var(--color-primary)';
      ok = false;
    }

    return ok;
  };

  // Clear error styling on input
  qsa('input, select, textarea', form).forEach(field => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
    });
  });

  // Phone mask (BR format)
  const phoneField = qs('#phone', form);
  if (phoneField) {
    phoneField.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (val.length > 6) {
        val = `(${val.slice(0,2)}) ${val.slice(2,7)}-${val.slice(7)}`;
      } else if (val.length > 2) {
        val = `(${val.slice(0,2)}) ${val.slice(2)}`;
      }
      e.target.value = val;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const btn = qs('button[type="submit"]', form);
    const originalHTML = btn.innerHTML;

    // Loading state
    btn.disabled = true;
    btn.innerHTML = `
      <svg style="width:20px;height:20px;animation:spin 0.8s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" opacity="0.25"/>
        <path d="M12 2a10 10 0 019.8 8" stroke-linecap="round"/>
      </svg>
      Enviando...
    `;

    // Add CSS for spin animation if not exists
    if (!document.getElementById('spin-style')) {
      const s = document.createElement('style');
      s.id = 'spin-style';
      s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(s);
    }

    // Simulate async submission (replace with actual fetch to your backend/formspree/etc.)
    await new Promise(r => setTimeout(r, 1500));

    // Show success
    btn.style.display = 'none';
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Reset form after delay
    setTimeout(() => {
      form.reset();
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      btn.style.display = '';
      if (success) success.hidden = true;
    }, 6000);
  });
})();

/* ----------------------------------------------------------------
   8. CURRENT YEAR in footer
---------------------------------------------------------------- */
(function setYear() {
  const el = qs('#currentYear');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ----------------------------------------------------------------
   9. ACTIVE NAV LINK — highlight based on scroll position
---------------------------------------------------------------- */
(function initActiveNav() {
  const sections = qsa('main section[id]');
  const navLinks = qsa('.navbar__nav a, .mobile-menu a');
  if (!sections.length || !navLinks.length) return;

  const NAVBAR_H = 72 + 20;

  const onScroll = () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - NAVBAR_H) {
        current = sec.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${current}`);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ----------------------------------------------------------------
   10. WHATSAPP FLOAT — show after a small delay
---------------------------------------------------------------- */
(function initWhatsappFloat() {
  const btn = qs('.whatsapp-float');
  if (!btn) return;

  btn.style.opacity = '0';
  btn.style.transform = 'translateY(20px)';
  btn.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

  setTimeout(() => {
    btn.style.opacity = '1';
    btn.style.transform = '';
  }, 2000);
})();
