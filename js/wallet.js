/* ============ CARTEIRA ============ */

function renderBalance() {
  document.getElementById("balance-value").textContent = formatMoney(currentProfile.balance);
}

async function loadTransactions() {
  const { data, error } = await supabaseClient
    .from("transactions")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = document.getElementById("transactions-list");
  list.innerHTML = "";

  if (error || !data || data.length === 0) {
    list.innerHTML = `<li class="empty-state">Ainda não há transações.</li>`;
    return;
  }

  const labels = {
    deposit: "Recarga",
    withdraw: "Saque",
    purchase: "Compra",
    commission: "Comissão de indicação",
  };

  data.forEach((tx) => {
    const isPositive = tx.amount >= 0;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${labels[tx.type] || tx.type}<br><small style="color:var(--text-muted)">${new Date(tx.created_at).toLocaleString("pt-PT")}</small></span>
      <span class="${isPositive ? "tx-amount-positive" : "tx-amount-negative"}">${isPositive ? "+" : ""}${formatMoney(tx.amount)}</span>
    `;
    list.appendChild(li);
  });
}

/* ---------- DEPÓSITO (simulado) ---------- */
async function confirmDeposit() {
  const errorBox = document.getElementById("deposit-error");
  errorBox.textContent = "";

  const method = document.getElementById("deposit-method").value;
  const phone = document.getElementById("deposit-phone").value.trim();
  const amount = parseFloat(document.getElementById("deposit-amount").value);

  if (!phone || phone.length < 9) {
    errorBox.textContent = "Introduza um número válido.";
    return;
  }
  if (!amount || amount <= 0) {
    errorBox.textContent = "Introduza um valor válido.";
    return;
  }

  // NOTA: isto é uma SIMULAÇÃO. Numa versão real, aqui entraria a
  // integração com a API oficial da Vodacom M-Pesa ou e-Mola, que
  // exige acordo comercial direto com o operador. Por enquanto o
  // depósito é creditado diretamente para fins de demonstração.

  const newBalance = Number(currentProfile.balance) + amount;

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", currentUser.id);

  if (updateError) {
    errorBox.textContent = "Erro ao processar: " + updateError.message;
    return;
  }

  await supabaseClient.from("transactions").insert({
    user_id: currentUser.id,
    type: "deposit",
    amount: amount,
    method,
  });

  currentProfile.balance = newBalance;
  renderBalance();
  await loadTransactions();
  closeModal("modal-deposit");
  showToast(`Recarga de ${formatMoney(amount)} confirmada!`);
}

/* ---------- SAQUE ---------- */
function updateWithdrawSummary() {
  const amount = parseFloat(document.getElementById("withdraw-amount").value) || 0;
  const fee = amount * (APP_CONFIG.withdrawFeePercent / 100);
  const net = amount - fee;
  document.getElementById("withdraw-summary").textContent =
    amount > 0
      ? `Taxa (${APP_CONFIG.withdrawFeePercent}%): ${formatMoney(fee)} — Vai receber: ${formatMoney(net)}`
      : "";
}

async function confirmWithdraw() {
  const errorBox = document.getElementById("withdraw-error");
  errorBox.textContent = "";

  const method = document.getElementById("withdraw-method").value;
  const phone = document.getElementById("withdraw-phone").value.trim();
  const amount = parseFloat(document.getElementById("withdraw-amount").value);

  if (!phone || phone.length < 9) {
    errorBox.textContent = "Introduza um número válido.";
    return;
  }
  if (!amount || amount <= 0) {
    errorBox.textContent = "Introduza um valor válido.";
    return;
  }
  if (amount > currentProfile.balance) {
    errorBox.textContent = "Saldo insuficiente.";
    return;
  }

  const fee = amount * (APP_CONFIG.withdrawFeePercent / 100);
  const net = amount - fee;
  const newBalance = Number(currentProfile.balance) - amount;

  const { error: updateError } = await supabaseClient
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", currentUser.id);

  if (updateError) {
    errorBox.textContent = "Erro ao processar: " + updateError.message;
    return;
  }

  await supabaseClient.from("transactions").insert({
    user_id: currentUser.id,
    type: "withdraw",
    amount: -amount,
    method,
    note: `Taxa de ${APP_CONFIG.withdrawFeePercent}% (${formatMoney(fee)}) — líquido ${formatMoney(net)}`,
  });

  currentProfile.balance = newBalance;
  renderBalance();
  await loadTransactions();
  closeModal("modal-withdraw");
  showToast(`Saque solicitado! Vai receber ${formatMoney(net)}.`);
}
