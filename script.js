// ===== Navigation =====
const pages = ['home', 'menu', 'order', 'reviews', 'admin'];

function showPage(pageId) {
  pages.forEach(id => {
    const el = document.getElementById('page-' + id);
    if (el) el.classList.toggle('active', id === pageId);
  });
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pageId === 'reviews') renderReviews();
  if (pageId === 'admin' && isAdminLoggedIn()) showAdminDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => showPage(el.dataset.page));
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger) hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Close nav on link click (mobile)
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  // Start on home page
  showPage('home');

  // Init all forms
  initOrderForm();
  initReviewForm();
  initAdminLogin();
  initAdminTabs();
});

// ===== Order Form =====
function initOrderForm() {
  const cakeSelect = document.getElementById('orderCake');
  const weightSelect = document.getElementById('orderWeight');
  const customWrap = document.getElementById('customWeightWrap');
  const summary = document.getElementById('orderSummary');
  const summaryName = document.getElementById('summaryName');
  const summaryWeight = document.getElementById('summaryWeight');
  const customInput = document.getElementById('customWeight');
  const form = document.getElementById('orderForm');
  const successEl = document.getElementById('orderSuccess');

  function updateSummary() {
    const cake = cakeSelect.value;
    const weight = weightSelect.value;
    const isCustom = weight === 'custom';
    if (customWrap) customWrap.style.display = isCustom ? 'block' : 'none';
    if (cake && weight) {
      const weightLabel = isCustom
        ? (customInput.value || 'custom amount')
        : weightSelect.options[weightSelect.selectedIndex].text;
      if (summaryName) summaryName.textContent = cakeSelect.options[cakeSelect.selectedIndex].text;
      if (summaryWeight) summaryWeight.textContent = weightLabel;
      if (summary) summary.style.display = 'flex';
    } else {
      if (summary) summary.style.display = 'none';
    }
  }

  if (cakeSelect) cakeSelect.addEventListener('change', updateSummary);
  if (weightSelect) weightSelect.addEventListener('change', updateSummary);
  if (customInput) customInput.addEventListener('input', updateSummary);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const fields = [
        { id: 'orderCake', errId: 'errCake', msg: 'Please select a cake' },
        { id: 'orderWeight', errId: 'errWeight', msg: 'Please select a weight' },
        { id: 'customerName', errId: 'errName', msg: 'Name must be at least 2 characters', minLen: 2 },
        { id: 'contactNo', errId: 'errContact', msg: 'Valid phone number required', minLen: 10 },
        { id: 'address', errId: 'errAddress', msg: 'Full address is required', minLen: 10 },
      ];

      fields.forEach(f => {
        const el = document.getElementById(f.id);
        const err = document.getElementById(f.errId);
        if (!el || !err) return;
        const val = el.value.trim();
        const bad = !val || (f.minLen && val.length < f.minLen);
        err.style.display = bad ? 'block' : 'none';
        if (bad) valid = false;
      });

      if (!valid) return;

      // Store order in localStorage
      const orders = JSON.parse(localStorage.getItem('smcOrders') || '[]');
      const cakeName = cakeSelect.options[cakeSelect.selectedIndex].text;
      const weightVal = document.getElementById('orderWeight').value;
      const finalWeight = weightVal === 'custom'
        ? (document.getElementById('customWeight').value || 'custom')
        : document.getElementById('orderWeight').options[document.getElementById('orderWeight').selectedIndex].text;

      orders.push({
        id: Date.now(),
        customerName: document.getElementById('customerName').value,
        contact: document.getElementById('contactNo').value,
        address: document.getElementById('address').value,
        cake: cakeName,
        weight: finalWeight,
        instructions: document.getElementById('specialInstructions').value,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
      localStorage.setItem('smcOrders', JSON.stringify(orders));

      form.style.display = 'none';
      if (successEl) successEl.style.display = 'block';
    });
  }

  const backToMenuBtn = document.getElementById('backToMenu');
  const backToHomeBtn = document.getElementById('backToHome');
  if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => { resetOrderForm(); showPage('menu'); });
  if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => { resetOrderForm(); showPage('home'); });
}

function resetOrderForm() {
  const form = document.getElementById('orderForm');
  const successEl = document.getElementById('orderSuccess');
  if (form) { form.reset(); form.style.display = 'block'; }
  if (successEl) successEl.style.display = 'none';
  const summary = document.getElementById('orderSummary');
  if (summary) summary.style.display = 'none';
  const customWrap = document.getElementById('customWeightWrap');
  if (customWrap) customWrap.style.display = 'none';
  document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
}

// ===== Reviews =====
let currentRating = 5;

function initReviewForm() {
  const form = document.getElementById('reviewForm');
  const stars = document.querySelectorAll('.star-btn');
  const successMsg = document.getElementById('reviewSuccess');

  stars.forEach((btn, idx) => {
    btn.addEventListener('mouseenter', () => highlightStars(idx + 1));
    btn.addEventListener('mouseleave', () => highlightStars(currentRating));
    btn.addEventListener('click', () => { currentRating = idx + 1; highlightStars(currentRating); });
  });
  highlightStars(currentRating);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reviewName').value.trim();
      const comment = document.getElementById('reviewComment').value.trim();
      if (!name || name.length < 2 || !comment || comment.length < 5) return;

      const reviews = JSON.parse(localStorage.getItem('smcReviews') || '[]');
      reviews.unshift({
        id: Date.now(),
        name,
        rating: currentRating,
        comment,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });
      localStorage.setItem('smcReviews', JSON.stringify(reviews));

      form.reset();
      currentRating = 5;
      highlightStars(5);
      if (successMsg) { successMsg.style.display = 'block'; setTimeout(() => successMsg.style.display = 'none', 3000); }
      renderReviews();
    });
  }
}

function highlightStars(count) {
  document.querySelectorAll('.star-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx < count);
    btn.textContent = idx < count ? '★' : '☆';
  });
}

function renderReviews() {
  const container = document.getElementById('reviewsList');
  if (!container) return;

  const defaultReviews = [
    { id: 1, name: 'Priya Shah', rating: 5, comment: 'Absolutely delicious! The chocolate cake was moist and perfectly sweet. Will order again!', date: 'Mar 15, 2026' },
    { id: 2, name: 'Rajesh Patel', rating: 5, comment: 'Ordered a doll cake for my daughter\'s birthday — she was so happy! Beautiful and tasty.', date: 'Mar 10, 2026' },
    { id: 3, name: 'Meera Desai', rating: 5, comment: 'Best homemade cakes in Gandhinagar. Fresh, pure and made with love. Highly recommend!', date: 'Mar 5, 2026' },
  ];

  const stored = JSON.parse(localStorage.getItem('smcReviews') || '[]');
  const all = [...stored, ...defaultReviews];

  if (all.length === 0) {
    container.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to share!</div>';
    return;
  }

  container.innerHTML = '<div class="reviews-grid">' + all.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p class="review-text">"${r.comment}"</p>
      <div class="review-meta">
        <span class="review-name">${r.name}</span>
        <span class="review-date">${r.date}</span>
      </div>
    </div>
  `).join('') + '</div>';
}

// ===== Admin =====
const ADMIN_ID = '@shreematangi.com';
const ADMIN_PASS = '1980';

function isAdminLoggedIn() {
  return sessionStorage.getItem('admin_auth') === 'true';
}

function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  const pwInput = document.getElementById('adminPassword');
  const toggleBtn = document.getElementById('togglePw');
  const errorEl = document.getElementById('loginError');

  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', () => {
      pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = pwInput.type === 'password' ? '👁' : '🙈';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('adminId').value.trim();
      const pw = pwInput.value;
      if (id === ADMIN_ID && pw === ADMIN_PASS) {
        sessionStorage.setItem('admin_auth', 'true');
        showAdminDashboard();
      } else {
        if (errorEl) errorEl.style.display = 'block';
        pwInput.value = '';
      }
    });
  }
}

function showAdminDashboard() {
  const loginWrap = document.getElementById('adminLoginWrap');
  const dashboard = document.getElementById('adminDashboard');
  if (loginWrap) loginWrap.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';
  renderAdminOrders();
}

function adminLogout() {
  sessionStorage.removeItem('admin_auth');
  const loginWrap = document.getElementById('adminLoginWrap');
  const dashboard = document.getElementById('adminDashboard');
  if (loginWrap) loginWrap.style.display = 'flex';
  if (dashboard) dashboard.style.display = 'none';
  document.getElementById('adminId').value = '';
  document.getElementById('adminPassword').value = '';
}

function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
      if (tab.dataset.tab === 'orders') renderAdminOrders();
    });
  });
}

function renderAdminOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  const orders = JSON.parse(localStorage.getItem('smcOrders') || '[]').reverse();
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map((o, i) => `
    <tr>
      <td><strong>#${i + 1}</strong></td>
      <td>${o.customerName}</td>
      <td>${o.cake}</td>
      <td>${o.weight}</td>
      <td>${o.contact}</td>
      <td>${o.date}</td>
    </tr>
  `).join('');
}
