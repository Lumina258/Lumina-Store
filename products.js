/* ============ PRODUTOS / LOJA ============ */

let selectedProduct = null;

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true });

  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  if (error || !data || data.length === 0) {
    grid.innerHTML = `<p class="empty-state">Nenhum produto disponível no momento.</p>`;
    return;
  }

  data.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <h4>${product.name}</h4>
      <p>${product.description || ""}</p>
      <div class="product-price">${formatMoney(product.price)}</div>
      <button data-product-id="${product.id}">Comprar</button>
    `;
    card.querySelector("button").addEventListener("click", () => openBuyModal(product));
    grid.appendChild(card);
  });
}

function openBuyModal(product) {
  selectedProduct = product;
  document.getElementById("buy-product-name").textContent = product.name;
  document.getElementById("buy-product-desc").textContent = product.description || "";
  document.getElementById("buy-product-price").textContent = `Preço: ${formatMoney(product.price)}`;
  document.getElementById("buy-error").textContent = "";
  openModal("modal-buy");
}

async function confirmBuy() {
  const errorBox = document.getElementById("buy-error");
  errorBox.textContent = "";

  if (!selectedProduct) return;

  if (Number(currentProfile.balance) < Number(selectedProduct.price)) {
    errorBox.textContent = "Saldo insuficiente para esta compra.";
    return;
  }

  const newBalance = Number(currentProfile.balance) - Number(selectedProduct.price);

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", currentUser.id);

  if (updateError) {
    errorBox.textContent = "Erro ao processar compra: " + updateError.message;
    return;
  }

  await supabaseClient.from("purchases").insert({
    user_id: currentUser.id,
    product_id: selectedProduct.id,
    price_paid: selectedProduct.price,
  });

  await supabaseClient.from("transactions").insert({
    user_id: currentUser.id,
    type: "purchase",
    amount: -selectedProduct.price,
  });

  currentProfile.balance = newBalance;
  renderBalance();

  // Se este utilizador foi indicado por alguém, paga a comissão
  await payReferralCommissionIfApplicable(selectedProduct.price);

  await loadTransactions();
  await loadMyProducts();
  closeModal("modal-buy");
  showToast("Compra realizada com sucesso!");
}

async function loadMyProducts() {
  const { data, error } = await supabaseClient
    .from("purchases")
    .select("id, price_paid, purchased_at, products(name, description)")
    .eq("user_id", currentUser.id)
    .order("purchased_at", { ascending: false });

  const grid = document.getElementById("my-products-grid");
  grid.innerHTML = "";

  if (error || !data || data.length === 0) {
    grid.innerHTML = `<p class="empty-state">Ainda não comprou nenhum produto.</p>`;
    return;
  }

  data.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <h4>${p.products?.name || "Produto"}</h4>
      <p>${p.products?.description || ""}</p>
      <div class="product-price">Pago: ${formatMoney(p.price_paid)}</div>
    `;
    grid.appendChild(card);
  });
}
