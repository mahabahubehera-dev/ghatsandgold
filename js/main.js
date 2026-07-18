/* Ghats & Gold — shared site behaviour */
(function () {
  'use strict';

  /* ---------- lucide icons ---------- */
  if (window.lucide) window.lucide.createIcons();

  /* ---------- header ---------- */
  var header = document.querySelector('.site-header');
  if (header && header.classList.contains('site-header--overlay')) {
    var announce = document.querySelector('.announce');
    var setAnnounceH = function () {
      if (announce) document.documentElement.style.setProperty('--announce-h', announce.offsetHeight + 'px');
    };
    setAnnounceH();
    window.addEventListener('resize', setAnnounceH);
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      document.querySelector('.main-nav').classList.toggle('open');
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* ---------- animated counters ---------- */
  var statObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting || e.target._done) return;
      e.target._done = true;
      var el = e.target;
      var target = parseFloat(el.getAttribute('data-target'));
      var suffix = el.getAttribute('data-suffix') || '';
      var t0 = performance.now(), dur = 1600;
      var tick = function (now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target % 1 !== 0
          ? (target * eased).toFixed(1)
          : Math.round(target * eased).toLocaleString('en-IN');
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.stat-num[data-target]').forEach(function (el) { statObs.observe(el); });

  /* ---------- cart (localStorage) ---------- */
  var CART_KEY = 'gg-cart';
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCart();
  }
  window.ggAddToCart = function (item) {
    var cart = getCart();
    var found = cart.find(function (c) { return c.id === item.id && c.size === item.size; });
    if (found) found.qty += 1;
    else cart.push({ id: item.id, name: item.name, size: item.size, price: item.price, img: item.img, qty: 1 });
    saveCart(cart);
    openCart();
    toast('Added to cart — ' + item.name + ' (' + item.size + ')');
  };

  var overlay = document.getElementById('cart-overlay');
  function openCart() { if (overlay) { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; } }
  function closeCart() { if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; } }
  document.querySelectorAll('[data-open-cart]').forEach(function (el) {
    el.addEventListener('click', openCart);
  });
  if (overlay) {
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCart(); });
    overlay.querySelector('.cart-close').addEventListener('click', closeCart);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  function renderCart() {
    var cart = getCart();
    var count = cart.reduce(function (n, c) { return n + c.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = count; });
    var body = document.getElementById('cart-items');
    var foot = document.getElementById('cart-foot');
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty">Your cart is empty.<br><br>The harvest is waiting — explore the collection.</div>';
      if (foot) foot.style.display = 'none';
      return;
    }
    if (foot) foot.style.display = '';
    var total = 0;
    body.innerHTML = cart.map(function (c, i) {
      total += c.price * c.qty;
      return '<div class="cart-item">' +
        '<img src="' + c.img + '" alt="' + c.name + '">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + c.name + '</div>' +
          '<div class="cart-item-size">' + c.size + '</div>' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" data-qty="-1" data-i="' + i + '">−</button>' +
            '<span>' + c.qty + '</span>' +
            '<button class="qty-btn" data-qty="1" data-i="' + i + '">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item-price">₹' + (c.price * c.qty).toLocaleString('en-IN') + '</div>' +
      '</div>';
    }).join('');
    var totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
    body.querySelectorAll('.qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cart = getCart();
        var i = +btn.getAttribute('data-i');
        cart[i].qty += +btn.getAttribute('data-qty');
        if (cart[i].qty <= 0) cart.splice(i, 1);
        saveCart(cart);
      });
    });
  }
  renderCart();

  /* ---------- toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }
  window.ggToast = toast;

  /* ---------- newsletter / contact fake submit ---------- */
  document.querySelectorAll('[data-fake-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.parentElement.querySelector('.form-note');
      if (note) note.textContent = form.getAttribute('data-success') || 'Thank you — we’ll be in touch.';
      else toast(form.getAttribute('data-success') || 'Thank you!');
      form.reset();
    });
  });

  /* ---------- origin map (home) ---------- */
  var REGIONS = {
    kandhamal: { name: 'Kandhamal', product: 'GI-Tagged Golden Turmeric', status: 'Available Now', live: true,
      altitude: '2,300 ft', climate: 'Cloud forest', farmer: 'Kondh smallholders', img: 'assets/crop-hills.jpg',
      story: 'Mist-wrapped valleys of red lateritic soil, farmed without chemicals for generations. Home of the only GI-tagged turmeric in eastern India — curcumin above 4%, colour like late-evening sun.' },
    koraput: { name: 'Koraput', product: 'Shade-Grown Arabica Coffee', status: 'Coming 2026', live: false,
      altitude: '3,000 ft', climate: 'High plateau', farmer: 'Tribal coffee growers', img: 'assets/origin-coffee.jpg',
      story: 'On the high Koraput plateau, arabica ripens slowly under ancient forest canopy — planted decades ago, now revived estate by estate with the tribal growers who kept it alive.' },
    similipal: { name: 'Similipal', product: 'Wild Forest Honey', status: 'Coming Soon', live: false,
      altitude: '2,600 ft', climate: 'Biosphere reserve', farmer: 'Honey-gatherer collectives', img: 'assets/origin-honey.jpg',
      story: 'Inside the Similipal biosphere reserve, honey is still gathered the old way — raw, unheated, unfiltered, from hives the forest builds itself. Each season tastes of different blossoms.' },
    malkangiri: { name: 'Malkangiri', product: 'Cold-Dried Moringa', status: 'Coming Soon', live: false,
      altitude: '1,200 ft', climate: 'River valleys', farmer: 'Women-led farm groups', img: 'assets/origin-moringa.jpg',
      story: 'In the river valleys of Malkangiri, moringa grows almost effortlessly. Ours is shade-dried at low temperature by women-led farm groups, keeping its deep green colour and nutrients intact.' },
    rayagada: { name: 'Rayagada', product: 'Heritage Hill Millets', status: 'In Exploration', live: false,
      altitude: '1,800 ft', climate: 'Dry hill slopes', farmer: 'Millet-farming villages', img: 'assets/crop-bowl.png',
      story: 'Rayagada’s slopes have grown drought-hardy heritage millets for centuries. We are walking these hills now, meeting farming villages before we put a name on a pack.' },
    keonjhar: { name: 'Keonjhar', product: 'Forest Spices', status: 'In Exploration', live: false,
      altitude: '2,000 ft', climate: 'Sal forests', farmer: 'Forest-edge villages', img: 'assets/crop-spoon.png',
      story: 'The sal forests of Keonjhar hide wild bay leaf, long pepper and hill ginger. Sourcing conversations have begun — a name we hope to print soon.' }
  };
  var mapSection = document.getElementById('origin-map');
  if (mapSection) {
    var setRegion = function (key) {
      var r = REGIONS[key];
      if (!r) return;
      mapSection.querySelectorAll('.gg-pin').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-region') === key);
      });
      mapSection.querySelectorAll('.region-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-region') === key);
      });
      document.getElementById('region-img').src = r.img;
      document.getElementById('region-img').alt = r.name;
      document.getElementById('region-name').textContent = r.name;
      var st = document.getElementById('region-status');
      st.textContent = r.status;
      st.classList.toggle('region-status--live', r.live);
      document.getElementById('region-product').textContent = r.product;
      document.getElementById('region-story').textContent = r.story;
      document.getElementById('region-altitude').textContent = r.altitude;
      document.getElementById('region-climate').textContent = r.climate;
      document.getElementById('region-farmer').textContent = r.farmer;
    };
    mapSection.querySelectorAll('.gg-pin,.region-btn').forEach(function (el) {
      el.addEventListener('click', function () { setRegion(el.getAttribute('data-region')); });
    });
    setRegion('kandhamal');
  }

  /* ---------- shop page ---------- */
  var pdp = document.getElementById('pdp');
  if (pdp) {
    var selectedSize = '250g';
    var PRICES = { '250g': 349, '500g': 649, '1kg': 1199 };
    var priceEl = document.getElementById('pdp-price');
    var updatePrice = function () {
      priceEl.innerHTML = '₹' + PRICES[selectedSize].toLocaleString('en-IN') +
        ' <small>· ' + selectedSize + ' pouch</small>';
      document.querySelectorAll('.buy-bar-size').forEach(function (el) { el.textContent = selectedSize; });
      var bp = document.querySelector('.buy-bar-price');
      if (bp) bp.textContent = '₹' + PRICES[selectedSize].toLocaleString('en-IN') + ' · Free shipping over ₹599';
    };
    document.querySelectorAll('.size-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.size-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        selectedSize = chip.getAttribute('data-size');
        updatePrice();
      });
    });
    updatePrice();

    var addFn = function () {
      window.ggAddToCart({
        id: 'kandhamal-turmeric', name: 'Kandhamal Turmeric', size: selectedSize,
        price: PRICES[selectedSize], img: 'assets/product-front.jpg'
      });
    };
    document.querySelectorAll('[data-add-to-cart]').forEach(function (b) { b.addEventListener('click', addFn); });
    var buyNow = document.querySelector('[data-buy-now]');
    if (buyNow) buyNow.addEventListener('click', addFn);

    /* tabs */
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('panel-' + tab.getAttribute('data-tab')).classList.add('active');
      });
    });

    /* gallery */
    document.querySelectorAll('.pdp-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.pdp-thumb').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        document.querySelector('.pdp-main-img img').src = t.getAttribute('data-img');
      });
    });

    /* sticky buy bar after scrolling past gallery */
    var buyBar = document.querySelector('.buy-bar');
    if (buyBar) {
      window.addEventListener('scroll', function () {
        buyBar.classList.toggle('visible', window.scrollY > 520);
      }, { passive: true });
    }
  }

  /* ---------- hero video: respect reduced motion ---------- */
  var heroVideo = document.querySelector('.hero video');
  if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }
})();
