/* ============ AUTENTICAÇÃO ============ */

let currentUser = null;   // sessão Supabase Auth
let currentProfile = null; // linha correspondente em "profiles"

/* Captura ?ref=CODIGO da URL e preenche automaticamente no registo */
function applyReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    document.getElementById("reg-invite-code").value = ref.toUpperCase();
    showScreen("screen-register");
  }
}

/* ---------- REGISTO ---------- */
async function handleRegister(e) {
  e.preventDefault();
  const errorBox = document.getElementById("register-error");
  errorBox.textContent = "";

  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-password-confirm").value;
  const inviteCodeInput = document.getElementById("reg-invite-code").value.trim().toUpperCase();

  if (!phone || phone.length < 9) {
    errorBox.textContent = "Introduza um número de telefone válido.";
    return;
  }
  if (password.length < 6) {
    errorBox.textContent = "A palavra-passe deve ter no mínimo 6 caracteres.";
    return;
  }
  if (password !== confirm) {
    errorBox.textContent = "As palavras-passe não coincidem.";
    return;
  }

  const email = phoneToInternalEmail(phone);

  // Se um código de convite foi fornecido, valida se existe
  let referrerProfile = null;
  if (inviteCodeInput) {
    const { data: refData } = await supabaseClient
      .from("profiles")
      .select("id, invite_code")
      .eq("invite_code", inviteCodeInput)
      .maybeSingle();
    if (!refData) {
      errorBox.textContent = "Código de convite inválido.";
      return;
    }
    referrerProfile = refData;
  }

  // 1) Cria utilizador no Supabase Auth
  const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    errorBox.textContent = traduzErroAuth(signUpError.message);
    return;
  }

  const newUserId = signUpData.user.id;

  // 2) Gera um código de convite único para o novo utilizador
  let myInviteCode = generateInviteCode();
  let tentativas = 0;
  while (tentativas < 5) {
    const { data: existing } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("invite_code", myInviteCode)
      .maybeSingle();
    if (!existing) break;
    myInviteCode = generateInviteCode();
    tentativas++;
  }

  // 3) Cria o perfil na tabela "profiles"
  const { error: profileError } = await supabaseClient.from("profiles").insert({
    id: newUserId,
    phone,
    balance: 0,
    invite_code: myInviteCode,
    referred_by: referrerProfile ? referrerProfile.id : null,
  });

  if (profileError) {
    errorBox.textContent = "Erro ao criar perfil: " + profileError.message;
    return;
  }

  showToast("Conta criada com sucesso!");
  await loginWithCredentials(email, password);
}

/* ---------- LOGIN ---------- */
async function handleLogin(e) {
  e.preventDefault();
  const errorBox = document.getElementById("login-error");
  errorBox.textContent = "";

  const phone = document.getElementById("login-phone").value.trim();
  const password = document.getElementById("login-password").value;
  const email = phoneToInternalEmail(phone);

  const ok = await loginWithCredentials(email, password);
  if (!ok) {
    errorBox.textContent = "Telefone ou palavra-passe incorretos.";
  }
}

async function loginWithCredentials(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return false;

  currentUser = data.user;
  await loadProfile();
  await initAppData();
  showScreen("screen-app");
  return true;
}

/* Restaura sessão existente ao recarregar a página */
async function restoreSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    await loadProfile();
    await initAppData();
    showScreen("screen-app");
  } else {
    applyReferralFromUrl();
  }
}

async function loadProfile() {
  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();
  currentProfile = data;
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showScreen("screen-login");
}

function traduzErroAuth(msg) {
  if (msg.includes("already registered")) return "Este número já está registado.";
  if (msg.includes("Password")) return "Palavra-passe inválida (mínimo 6 caracteres).";
  return "Erro: " + msg;
}
