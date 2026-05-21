const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwgO_quSJi572HXizDgLMFPdHlVA64BmtfTVg9YXFpZ0129y7gA3SUkpBRi6gKgier6/exec";

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
  priceUnit: card.dataset.priceUnit || "份",
  minQuantity: Number(card.dataset.minQuantity || 1),
  minWeight: Number(card.dataset.minWeight || 0),
  maxWeight: Number(card.dataset.maxWeight || 0),
  card,
  qtyEl: card.querySelector("[data-qty]"),
}));

const cart = Object.fromEntries(products.map((product) => [product.id, 0]));
let lastTouchEnd = 0;

document.addEventListener(
  "touchend",
  (event) => {
    const activeInput = event.target.closest("input, textarea, select");
    const now = Date.now();

    if (!activeInput && now - lastTouchEnd <= 300) {
      event.preventDefault();
    }

    lastTouchEnd = now;
  },
  { passive: false }
);

function getCartItems() {
  return products
    .map((product) => {
      const quantity = cart[product.id];
      const variableWeight = product.minWeight > 0 && product.maxWeight > 0;
      const subtotalMin = variableWeight
        ? quantity * product.price * product.minWeight
        : quantity * product.price;
      const subtotalMax = variableWeight
        ? quantity * product.price * product.maxWeight
        : subtotalMin;

      return {
        ...product,
        quantity,
        variableWeight,
        subtotal: subtotalMin,
        subtotalMin,
        subtotalMax,
      };
    })
    .filter((item) => item.quantity > 0);
}

function getDiscount(count, subtotal) {
  return 0;
}

function hasAmountRange(min, max) {
  return Math.abs(max - min) >= 0.01;
}

function formatAmountRange(min, max) {
  return hasAmountRange(min, max)
    ? `${currency.format(min)}-${currency.format(max)}`
    : currency.format(min);
}

function renderCart() {
  const items = getCartItems();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalMin = items.reduce((sum, item) => sum + item.subtotalMin, 0);
  const subtotalMax = items.reduce((sum, item) => sum + item.subtotalMax, 0);
  const discount = getDiscount(count, subtotalMin);
  const totalMin = Math.max(subtotalMin - discount, 0);
  const totalMax = Math.max(subtotalMax - discount, 0);

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
              <span>${currency.format(item.price)} / ${item.priceUnit}</span>
              <strong>${formatAmountRange(item.subtotalMin, item.subtotalMax)}</strong>
            </div>
          </div>
        `
      )
      .join("");
  }

  summaryCount.textContent = `${count} 件`;
  summarySubtotal.textContent = formatAmountRange(subtotalMin, subtotalMax);
  summaryDiscount.textContent = `-${currency.format(discount)}`;
  summaryTotal.textContent = formatAmountRange(totalMin, totalMax);
  heroCartCount.textContent = `${count} 件`;
}

function buildOrderPayload(formData) {
  const items = getCartItems();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalMin = items.reduce((sum, item) => sum + item.subtotalMin, 0);
  const subtotalMax = items.reduce((sum, item) => sum + item.subtotalMax, 0);
  const discount = getDiscount(totalQuantity, subtotalMin);
  const totalMin = Math.max(subtotalMin - discount, 0);
  const totalMax = Math.max(subtotalMax - discount, 0);

  return {
    orderId: `WG${Date.now()}`,
    createdAt: new Date().toISOString(),
    nickname: String(formData.get("nickname") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    subtotal: formatAmountRange(subtotalMin, subtotalMax),
    subtotalMin,
    subtotalMax,
    discount,
    total: formatAmountRange(totalMin, totalMax),
    totalMin,
    totalMax,
    items: items.map((item) => ({
      name: item.name,
      unit: item.unit,
      price: item.price,
      priceUnit: item.priceUnit,
      quantity: item.quantity,
      variableWeight: item.variableWeight,
      minWeight: item.minWeight,
      maxWeight: item.maxWeight,
      subtotal: formatAmountRange(item.subtotalMin, item.subtotalMax),
      subtotalMin: item.subtotalMin,
      subtotalMax: item.subtotalMax,
    })),
  };
}

productCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    const button = event.target.closest(".qty-btn");
    if (!button) {
      return;
    }

    const product = products.find((item) => item.card === card);
    const id = product.id;
    const action = button.dataset.action;
    const currentValue = cart[id];
    const nextValue =
      action === "increase"
        ? currentValue === 0
          ? product.minQuantity
          : currentValue + 1
        : currentValue <= product.minQuantity
          ? 0
          : currentValue - 1;

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

  if (payload.items.length === 0) {
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

    feedback.textContent = `订单提交请求已发出，订单号 ${payload.orderId}。`;
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
