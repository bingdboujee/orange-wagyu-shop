const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwGW4XtELp5p8PPG_qQq8KCI2HwawgVWpNcX7wMfWS18QkfBuTsnW8Huv0huWlS0-_rUg/exec";

const productCards = [...document.querySelectorAll("[data-product-card]")];
const form = document.querySelector("#checkout-form");
const feedback = document.querySelector("#form-feedback");
const cartItems = document.querySelector("#cart-items");
const clearCartButton = document.querySelector("#clear-cart");

const summaryCount = document.querySelector("#summary-count");
const summarySubtotal = document.querySelector("#summary-subtotal");
const summaryDiscount = document.querySelector("#summary-discount");
const summaryTotal = document.querySelector("#summary-total");
const heroCartCount = document.querySelector("#hero-cart-count");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const products = productCards.map((card) => ({
  id: card.dataset.name,
  name: card.dataset.name,
  unit: card.dataset.unit,
  price: Number(card.dataset.price),
  card,
  qtyEl: card.querySelector("[data-qty]"),
}));

const cart = Object.fromEntries(products.map((product) => [product.id, 0]));

function getCartItems() {
  return products
    .map((product) => ({
      ...product,
      quantity: cart[product.id],
      subtotal: cart[product.id] * product.price,
    }))
    .filter((item) => item.quantity > 0);
}

function getDiscount(count, subtotal) {
  return 0;
}

function renderCart() {
  const items = getCartItems();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = getDiscount(count, subtotal);
  const total = Math.max(subtotal - discount, 0);

  products.forEach((product) => {
    product.qtyEl.textContent = String(cart[product.id]);
    product.card.classList.toggle("selected", cart[product.id] > 0);
  });

  if (items.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">还没选商品，先去上面加几份试试。</p>';
  } else {
    cartItems.innerHTML = items
      .map(
        (item) => `
          <div class="cart-item">
            <div>
              <strong>${item.name}</strong>
              <span>${item.unit} x ${item.quantity}</span>
            </div>
            <div class="cart-item-meta">
              <span>${currency.format(item.price)} / 份</span>
              <strong>${currency.format(item.subtotal)}</strong>
            </div>
          </div>
        `
      )
      .join("");
  }

  summaryCount.textContent = `${count} 件`;
  summarySubtotal.textContent = currency.format(subtotal);
  summaryDiscount.textContent = `-${currency.format(discount)}`;
  summaryTotal.textContent = currency.format(total);
  heroCartCount.textContent = `${count} 件`;
}

function buildOrderPayload(formData) {
  const items = getCartItems();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = getDiscount(itemCount, subtotal);
  const total = Math.max(subtotal - discount, 0);

  return {
    orderId: `WG${Date.now()}`,
    createdAt: new Date().toISOString(),
    nickname: String(formData.get("nickname") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    itemCount,
    subtotal,
    discount,
    total,
    items: items.map((item) => ({
      name: item.name,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };
}

productCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    const button = event.target.closest(".qty-btn");
    if (!button) {
      return;
    }

    const id = card.dataset.name;
    const action = button.dataset.action;
    const nextValue = action === "increase" ? cart[id] + 1 : Math.max(cart[id] - 1, 0);
    cart[id] = nextValue;
    renderCart();
  });
});

clearCartButton.addEventListener("click", () => {
  Object.keys(cart).forEach((key) => {
    cart[key] = 0;
  });
  renderCart();
  feedback.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.textContent = "";

  const formData = new FormData(form);
  const payload = buildOrderPayload(formData);

  if (payload.itemCount === 0) {
    feedback.textContent = "购物车还是空的，先选几份商品再提交。";
    return;
  }

  if (GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    feedback.textContent =
      "还没配置 Google Apps Script 地址。把 script.js 里的 GOOGLE_SCRIPT_URL 换成你的 Web App 地址后，就能真实写入 Google Sheets。";
    return;
  }

  const submitButton = document.querySelector("#submit-order");
  submitButton.disabled = true;
  submitButton.textContent = "订单提交中...";

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    feedback.textContent = `订单已提交，订单号 ${payload.orderId}。如果网络正常，数据会写入 Google Sheets。`;
    form.reset();
    Object.keys(cart).forEach((key) => {
      cart[key] = 0;
    });
    renderCart();
  } catch (error) {
    feedback.textContent = `提交失败：${error.message}`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交订单";
  }
});

renderCart();
