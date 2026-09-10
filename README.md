# Lumina Store

Aplicativo web (SPA) com carteira digital, loja e sistema de afiliados,
usando **Supabase** como backend (banco de dados + autenticação) para
persistência real na nuvem. Front-end 100% estático — pronto para
GitHub Pages.

## ⚠️ Aviso importante antes de usar com dinheiro real

Este projeto contém, propositadamente, uma **simulação** de depósito
e saque via M-Pesa/e-Mola (não há integração real com esses operadores —
isso exige acordo comercial direto com a Vodacom/e-Mola e não pode ser
feito só com código de front-end).

Além disso, o modelo descrito — pagar comissão a quem indica sempre
que o indicado compra algo, financiado pelo saldo que entra no sistema —
é estruturalmente semelhante a esquemas de pirâmide financeira, que são
**ilegais em Moçambique e na maioria dos países** quando o retorno de
quem já está dentro depende de recrutar novas pessoas, em vez de vender
produtos/serviços de valor real para fora do sistema. Antes de operar
isto com dinheiro real, recomenda-se:

- Garantir que os produtos vendidos têm valor de mercado real e
  independente do sistema de indicações;
- Consultar um advogado sobre regulamentação financeira e de
  intermediação de pagamentos em Moçambique (Banco de Moçambique);
- Nunca prometer retorno financeiro garantido a quem se registar.

## 1. Configurar o Supabase

1. Crie conta em https://supabase.com e um novo projeto.
2. Em **Project Settings → API**, copie a **Project URL** e a chave
   **anon public**.
3. Cole ambas em `js/supabaseClient.js` (`SUPABASE_URL` e
   `SUPABASE_ANON_KEY`) — instruções detalhadas também estão comentadas
   nesse ficheiro.
4. Em **Authentication → Providers**, confirme que "Email" está ativo.
   Em **Authentication → Settings**, desative "Confirm email" para
   permitir login imediato após registo (ou configure um provedor de
   e-mail se preferir manter a confirmação).

## 2. Esquema da Base de Dados

Vá em **SQL Editor** no Supabase e execute o script abaixo:

```sql
-- Perfis de utilizador (ligados ao auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  balance numeric(12,2) not null default 0,
  invite_code text unique not null,
  referred_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

-- Produtos da loja
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Compras realizadas
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id),
  price_paid numeric(12,2) not null,
  purchased_at timestamp with time zone default now()
);

-- Histórico de transações (recargas, saques, compras, comissões)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- deposit | withdraw | purchase | commission
  amount numeric(12,2) not null,
  method text,
  note text,
  created_at timestamp with time zone default now()
);

-- Row Level Security: cada utilizador só acede aos seus próprios dados
alter table profiles enable row level security;
alter table purchases enable row level security;
alter table transactions enable row level security;
alter table products enable row level security;

create policy "Utilizador vê o próprio perfil"
  on profiles for select using (auth.uid() = id);
create policy "Utilizador atualiza o próprio perfil"
  on profiles for update using (auth.uid() = id);
create policy "Utilizador cria o próprio perfil"
  on profiles for insert with check (auth.uid() = id);
-- Necessário para o indicador consultar o perfil do indicado (lista de equipa)
create policy "Perfis públicos para leitura básica"
  on profiles for select using (true);

create policy "Utilizador vê as próprias compras"
  on purchases for select using (auth.uid() = user_id);
create policy "Utilizador regista as próprias compras"
  on purchases for insert with check (auth.uid() = user_id);

create policy "Utilizador vê as próprias transações"
  on transactions for select using (auth.uid() = user_id);
create policy "Sistema regista transações do utilizador"
  on transactions for insert with check (true);

create policy "Todos veem produtos ativos"
  on products for select using (active = true);
```

Depois, insira alguns produtos de exemplo:

```sql
insert into products (name, description, price) values
('Pack Básico', 'Acesso a conteúdos digitais essenciais', 500),
('Pack Premium', 'Acesso completo + suporte prioritário', 1500),
('Pack VIP', 'Todos os benefícios + conteúdos exclusivos', 3000);
```

> **Nota sobre segurança:** as políticas acima são um ponto de partida
> funcional para demonstração. Numa versão em produção, mover a lógica
> de pagar comissões e atualizar saldo para **Supabase Edge Functions**
> (executadas no servidor) é fortemente recomendado, para impedir que
> um utilizador manipule o próprio saldo diretamente pelo navegador.

## 3. Publicar no GitHub Pages

1. Crie um repositório novo no GitHub e envie todos os ficheiros deste
   projeto (`index.html`, pasta `css/`, pasta `js/`, este `README.md`).
2. Vá em **Settings → Pages** do repositório.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Guarde. O site ficará disponível em
   `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

## 4. Estrutura de ficheiros

```
lumina-store/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── supabaseClient.js   (configuração + chaves da API)
    ├── auth.js             (login/registo/sessão)
    ├── wallet.js           (saldo, depósito, saque)
    ├── products.js         (loja e compras)
    ├── referral.js         (indicações e comissões)
    └── app.js              (navegação e eventos gerais)
```
