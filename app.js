/* ============ CONTROLADOR PRINCIPAL ============ */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  document.querySelector(`.nav-btn[data-tab="${tabId}"]`).classList.add("active");
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

/* Carrega todos os dados do utilizador ao entrar na app */
async function initAppData() {
  renderBalance();
  renderReferralInfo();
  await Promise.all([loadTransactions(), loadProducts(), loadMyProducts(), loadTeam()]);
}

document.addEventListener("DOMContentLoaded", () => {
  // Navegação entre login/registo
  document.getElementById("go-to-register").addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("screen-register");
  });
  document.getElementById("go-to-login").addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("screen-login");
  });

  // Formulários
  document.getElementById("form-login").addEventListener("submit", handleLogin);
  document.getElementById("form-register").addEventListener("submit", handleRegister);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  // Mostrar/ocultar palavra-passe
  document.querySelectorAll(".toggle-eye").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      target.type = target.type === "password" ? "text" : "password";
    });
  });

  // Navegação inferior
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Modais: abrir
  document.getElementById("btn-open-deposit").addEventListener("click", () => openModal("modal-deposit"));
  document.getElementById("btn-open-withdraw").addEventListener("click", () => openModal("modal-withdraw"));

  // Modais: fechar
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });

  // Ações confirmar
  document.getElementById("btn-confirm-deposit").addEventListener("click", confirmDeposit);
  document.getElementById("btn-confirm-withdraw").addEventListener("click", confirmWithdraw);
  document.getElementById("btn-confirm-buy").addEventListener("click", confirmBuy);

  // Cálculo dinâmico da taxa de saque
  document.getElementById("withdraw-amount").addEventListener("input", updateWithdrawSummary);

  // Copiar link de convite
  document.getElementById("btn-copy-link").addEventListener("click", copyReferralLink);

  // Restaura sessão / aplica código de convite da URL
  restoreSession();
});
