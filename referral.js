/* ============ EQUIPA / AFILIADOS ============ */

function renderReferralInfo() {
  document.getElementById("referral-code").textContent = currentProfile.invite_code;
  const link = `${window.location.origin}${window.location.pathname}?ref=${currentProfile.invite_code}`;
  document.getElementById("referral-link").value = link;
}

function copyReferralLink() {
  const input = document.getElementById("referral-link");
  input.select();
  navigator.clipboard?.writeText(input.value);
  showToast("Link copiado!");
}

async function loadTeam() {
  const { data: referred } = await supabaseClient
    .from("profiles")
    .select("id, phone, created_at")
    .eq("referred_by", currentUser.id)
    .order("created_at", { ascending: false });

  document.getElementById("team-count").textContent = referred ? referred.length : 0;

  const { data: commissions } = await supabaseClient
    .from("transactions")
    .select("amount")
    .eq("user_id", currentUser.id)
    .eq("type", "commission");

  const totalCommission = (commissions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
  document.getElementById("team-earnings").textContent = formatMoney(totalCommission);

  const list = document.getElementById("team-list");
  list.innerHTML = "";

  if (!referred || referred.length === 0) {
    list.innerHTML = `<li class="empty-state">Ainda não tem indicados.</li>`;
    return;
  }

  referred.forEach((r) => {
    const maskedPhone = r.phone.slice(0, 2) + "***" + r.phone.slice(-2);
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${maskedPhone}</span>
      <span style="color:var(--text-muted); font-size:0.8rem;">${new Date(r.created_at).toLocaleDateString("pt-PT")}</span>
    `;
    list.appendChild(li);
  });
}

/* Paga 20% de comissão ao indicador quando o utilizador atual compra
   um produto — chamado a partir de products.js após uma compra. */
async function payReferralCommissionIfApplicable(purchasePrice) {
  if (!currentProfile.referred_by) return;

  const commission = Number(purchasePrice) * (APP_CONFIG.referralCommissionPercent / 100);

  const { data: referrer } = await supabaseClient
    .from("profiles")
    .select("id, balance")
    .eq("id", currentProfile.referred_by)
    .single();

  if (!referrer) return;

  const newReferrerBalance = Number(referrer.balance) + commission;

  await supabaseClient
    .from("profiles")
    .update({ balance: newReferrerBalance })
    .eq("id", referrer.id);

  await supabaseClient.from("transactions").insert({
    user_id: referrer.id,
    type: "commission",
    amount: commission,
    note: `Comissão de ${APP_CONFIG.referralCommissionPercent}% sobre compra de indicado`,
  });
}
