/* =====================================================================
   CONFIGURAÇÃO DO SUPABASE — LEIA COM ATENÇÃO
   =====================================================================
   Este ficheiro conecta o site ao seu banco de dados na nuvem (Supabase).
   É graças a isto que o saldo, os utilizadores e as compras ficam
   guardados permanentemente, mesmo depois de fechar o site.

   COMO OBTER A SUA API KEY E PROJECT URL (passo a passo):

   1. Aceda a https://supabase.com e crie uma conta gratuita.
   2. Clique em "New Project" e dê um nome (ex: "lumina-store").
      Escolha uma password para o banco de dados e a região mais
      próxima (ex: South Africa / Europe).
   3. Aguarde ~2 minutos até o projeto ficar pronto.
   4. No menu lateral, clique em "Project Settings" (ícone de engrenagem)
      → "API".
   5. Vai encontrar duas informações importantes:
        - "Project URL"        → cole abaixo em SUPABASE_URL
        - "anon public" key    → cole abaixo em SUPABASE_ANON_KEY
      (NUNCA use a "service_role" key no front-end — essa é secreta
      e só deve ser usada em servidores privados.)
   6. Depois de colar as chaves, vá ao "SQL Editor" no Supabase e
      execute o script que está no ficheiro README.md (secção
      "Esquema da Base de Dados") deste projeto. Isso cria as tabelas
      necessárias (profiles, transactions, products, purchases).
   7. Em "Authentication" → "Providers", confirme que "Email" está
      ativado (usamos e-mail internamente como identificador técnico
      do login por telefone — o utilizador nunca vê isso).
   8. Pronto! Publique este site no GitHub Pages e tudo vai funcionar
      guardando os dados na nuvem automaticamente.
   ===================================================================== */

const SUPABASE_URL = "COLE_AQUI_A_SUA_PROJECT_URL";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_SUA_ANON_PUBLIC_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Taxas e regras de negócio centralizadas aqui para fácil ajuste */
const APP_CONFIG = {
  withdrawFeePercent: 5,      // taxa de processamento sobre saques
  referralCommissionPercent: 20, // comissão sobre compra do indicado
  currencySuffix: "MT",
};

/* Converte número de telefone num "e-mail técnico" interno,
   já que o Supabase Auth funciona nativamente com e-mail/password.
   O utilizador nunca vê nem digita este e-mail. */
function phoneToInternalEmail(phone) {
  const clean = phone.replace(/\D/g, "");
  return `${clean}@lumina.app`;
}

/* Gera um código de convite único (letras+números) */
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LUM";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatMoney(value) {
  return `${Number(value).toFixed(2)} ${APP_CONFIG.currencySuffix}`;
}
