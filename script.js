document.addEventListener('DOMContentLoaded', () => {
  // ---- Prices & data ----
  const PRICES = {
    pizzas: {
      S: { label: 'Small 10"', base: 9.99, topping: 1.50 },
      M: { label: 'Medium 12"', base: 12.99, topping: 2.00 },
      L: { label: 'Large 14"', base: 15.99, topping: 2.25 },
      XL:{ label: 'X-Large 16"', base: 18.99, topping: 2.50 },
    },
    subs: { 'Italian': 10.99, 'Meatball Parm': 10.49, 'Chicken Parm': 10.99, 'Veggie': 9.99 },
    wings:{ '6': 8.99, '12': 15.99, '24': 29.99 },
    sides:{ 'Garlic Bread': 4.99, 'Cheesy Bread': 6.99, 'Meatballs (3)': 6.99, 'Side Salad': 4.99 },
    taxRate: 0.06,
  };

  const TOPPINGS = [
  // Meats
  'Pepperoni',
  'Sausage',
  'Bacon',

  // Veggies
  'Mushrooms',
  'Onions',
  'Green Peppers',
  'Banana Peppers',
  'Black Olives',

  // Cheese
  'Extra Cheese'
];

  const SAUCES = ['Mild','Medium','Hot','Garlic Parm','BBQ','Honey BBQ','Sweet Chili','Teriyaki','Lemon Pepper (dry)','Cajun (dry)','Buffalo','Mango Habanero','Carolina Gold','Nashville Hot (dry)'];

  // ---- Helpers ----
  const $ = s => document.querySelector(s);
  const fmt = n => `$${n.toFixed(2)}`;

  const sizeSel   = $('#size');
  const toppingsEl= $('#toppings');
  const saucesEl  = $('#sauces');

  const toppingPrice = () => PRICES.pizzas[(sizeSel?.value)||'M'].topping;

  function buildToppings() {
    if (!toppingsEl) return;
    toppingsEl.innerHTML = '';
    TOPPINGS.forEach(name => {
      const el = document.createElement('label');
      el.className = 'pill';
      el.innerHTML = `
        <input type="checkbox" value="${name}">
        <span>${name}</span>
        <small class="t-price">(${fmt(toppingPrice())})</small>
      `;
      toppingsEl.appendChild(el);
    });
  }

  function buildSauces() {
    if (!saucesEl) return;
    saucesEl.innerHTML = '';
    SAUCES.forEach(name => {
      const el = document.createElement('label');
      el.className = 'pill';
      el.innerHTML = `<input type="checkbox" value="${name}"><span>${name}</span>`;
      saucesEl.appendChild(el);
    });
  }

  function updateToppingPrices() {
    document.querySelectorAll('.t-price').forEach(s => (s.textContent = `(${fmt(toppingPrice())})`));
  }

  // Event delegation for pills (works even on rebuilt lists)
  document.addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill || !pill.querySelector('input')) return;

    const cb = pill.querySelector('input');

    // Limit sauces to 3
    if (saucesEl && saucesEl.contains(pill)) {
      const already = saucesEl.querySelectorAll('input:checked').length;
      if (!cb.checked && already >= 3) return; // clicking to check a 4th: ignore
    }

    cb.checked = !cb.checked;
    pill.classList.toggle('active', cb.checked);
  });

  // Clear buttons
  $('#clear-toppings')?.addEventListener('click', () => {
    toppingsEl?.querySelectorAll('input').forEach(i => { i.checked = false; i.closest('.pill')?.classList.remove('active'); });
  });
  $('#clear-sauces')?.addEventListener('click', () => {
    saucesEl?.querySelectorAll('input').forEach(i => { i.checked = false; i.closest('.pill')?.classList.remove('active'); });
  });

  // ---- Cart ----
  const CART_KEY = 'pps_cart';
  let cart = [];
  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const loadCart = () => { try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { cart = []; } };

  function renderCart() {
    const itemsWrap = $('#cart-items');
    const empty = $('#cart-empty');
    if (!itemsWrap || !empty) return;

    itemsWrap.innerHTML = '';
    if (!cart.length) {
      itemsWrap.hidden = true; empty.style.display = 'block';
    } else {
      itemsWrap.hidden = false; empty.style.display = 'none';
      cart.forEach((it, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <div>
            <div><strong>${it.name}</strong> × ${it.qty} — ${fmt(it.line)}</div>
            <div class="meta">${it.details || ''}</div>
          </div>
          <button class="remove" data-idx="${idx}">Remove</button>`;
        itemsWrap.appendChild(div);
      });
      itemsWrap.querySelectorAll('.remove').forEach(b => b.addEventListener('click', () => {
        cart.splice(Number(b.dataset.idx), 1); saveCart(); renderCart();
      }));
    }

    const subtotal = cart.reduce((s, it) => s + it.line, 0);
    const tax = subtotal * PRICES.taxRate;
    const total = subtotal + tax;
    $('#subtotal').textContent = fmt(subtotal);
    $('#tax').textContent = fmt(tax);
    $('#total').textContent = fmt(total);
    $('#checkout').setAttribute('aria-disabled', cart.length ? 'false' : 'true');
  }

  loadCart(); renderCart();

  // Adders
  $('#add-pizza')?.addEventListener('click', () => {
    const size = sizeSel.value;
    const qty = Math.max(1, Number($('#qty-pizza').value || 1));
    const selected = [...document.querySelectorAll('#toppings input:checked')].map(i => i.value);
    const unit = PRICES.pizzas[size].base + PRICES.pizzas[size].topping * selected.length;
    const line = unit * qty;
    cart.push({ type:'pizza', name:`${PRICES.pizzas[size].label} Pizza`, qty, unit, line, details: selected.length ? `Toppings: ${selected.join(', ')}` : 'Cheese only' });
    saveCart(); renderCart();
  });

  $('#add-sub')?.addEventListener('click', () => {
    const sub = $('#sub-type').value;
    const qty = Math.max(1, Number($('#qty-sub').value || 1));
    const unit = PRICES.subs[sub], line = unit * qty;
    cart.push({ type:'sub', name:`${sub} Sub`, qty, unit, line, details:'' }); saveCart(); renderCart();
  });

  $('#add-wings')?.addEventListener('click', () => {
    const size = $('#wings-size').value;
    const qty = Math.max(1, Number($('#qty-wings').value || 1));
    const sauces = [...document.querySelectorAll('#sauces input:checked')].map(i => i.value);
    const unit = PRICES.wings[size], line = unit * qty;
    cart.push({ type:'wings', name:`${size} Wings`, qty, unit, line, details: sauces.length ? `Sauces: ${sauces.join(', ')}` : 'No sauce selected' });
    saveCart(); renderCart();
  });

  $('#add-side')?.addEventListener('click', () => {
    const side = $('#side-type').value;
    const qty = Math.max(1, Number($('#qty-side').value || 1));
    const unit = PRICES.sides[side], line = unit * qty;
    cart.push({ type:'side', name:side, qty, unit, line, details:'' }); saveCart(); renderCart();
  });

  // Notes persist
  $('#notes-text')?.addEventListener('input', e => localStorage.setItem('pps_notes', e.target.value));
  const savedNotes = localStorage.getItem('pps_notes'); if (savedNotes) $('#notes-text').value = savedNotes;

  // Build lists & react to size changes
  buildToppings(); buildSauces();
  sizeSel?.addEventListener('change', updateToppingPrices);
  updateToppingPrices();
});
