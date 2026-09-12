/* ==========================================================================
   auth.js: lógica de autenticação compartilhada por login.html e painel.html
   O cliente Supabase é criado UMA ÚNICA VEZ aqui e reutilizado em todo lugar
   (o painel acessa o mesmo cliente via window.Auth.client para ler as
   tabelas de eventos e leads).
   ========================================================================== */

// ---- Configuração do Supabase (projeto do portfólio) ----
const SUPABASE_URL = 'https://qdxsydfrbirjoamqbodb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHN5ZGZyYmlyam9hbXFib2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDEyNTMsImV4cCI6MjEwNDgxNzI1M30.zoHorj5O27aWzkzFvHoIAhIlFgLIpJecWXvKF-NxfBU';

// Cria o cliente uma única vez. Depende do script da CDN do Supabase já
// ter sido carregado antes deste arquivo (ele expõe window.supabase).
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Faz login com e-mail e senha usando o Supabase Auth.
 * Lança um erro com mensagem amigável em português quando as credenciais
 * estão erradas.
 */
async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('E-mail ou senha incorretos.');
    }
    throw new Error(error.message);
  }

  return data.user;
}

/**
 * Verifica se existe uma sessão ativa (o "guarda" das páginas protegidas).
 * Se não houver sessão, redireciona para login.html e retorna null.
 * Se houver, retorna o usuário logado.
 */
async function checkAuth() {
  const { data, error } = await sb.auth.getSession();

  if (error || !data.session) {
    window.location.href = 'login.html';
    return null;
  }

  return data.session.user;
}

/**
 * Encerra a sessão atual e volta para a tela de login.
 */
async function logout() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

/**
 * Dispara o e-mail de recuperação de senha do Supabase Auth.
 */
async function recuperarSenha(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email);

  if (error) {
    throw new Error(error.message);
  }
}

// Expõe tudo em window.Auth. O "client" é exposto de propósito para que
// painel.html reutilize a MESMA instância do Supabase ao consultar as
// tabelas de eventos e leads, em vez de criar um segundo cliente.
window.Auth = {
  login,
  checkAuth,
  logout,
  recuperarSenha,
  client: sb,
};
