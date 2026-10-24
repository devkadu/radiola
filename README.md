# Segunda Temporada

Aplicação para acompanhar séries, episódios, avaliações e discussões. Next.js App Router, React, TypeScript, Tailwind, Supabase e TanStack Query.

Use Node 24 (versão em `.nvmrc`) e Yarn 1.22.22. Habilite com `corepack enable` e `corepack prepare yarn@1.22.22 --activate`; instale com `yarn install --frozen-lockfile`. O único lockfile do projeto é `yarn.lock`.

## Desenvolvimento

Copie `.env.example` para `.env.local` e configure um projeto próprio de desenvolvimento. `yarn dev` inicia o aplicativo. As variáveis públicas do Supabase são incorporadas ao bundle durante o build; trocar essas variáveis exige novo build. A chave privada fica exclusivamente no servidor.

O repositório ainda não contém uma cópia completa do esquema, funções e políticas RLS do banco existente. As migrations em `supabase/` são parciais. Não as trate como um bootstrap completo e não as aplique às cegas em produção. A execução atual usa fixtures para validação, sem alterar o banco existente.

`supabase/audits/prelaunch-security.sql` é uma consulta manual, em transação somente de leitura, para o SQL Editor do Supabase. Retorna metadados de tabelas, políticas, permissões, índices, funções e configuração do bucket de avatares. Não retorna registros de usuários e não é uma migration. Essa inspeção não substitui testar o isolamento entre duas contas em um ambiente separado.

`supabase/migrations/20261023_query_indexes_and_rpc_access.sql` foi preparada a partir da auditoria do banco existente. Cria índices para consultas recorrentes, remove políticas de reações equivalentes e restringe cinco RPCs de ranking ao backend. Revise e teste antes de aplicar; ela não foi executada automaticamente no banco remoto. As chamadas dessas RPCs no repositório usam `supabaseAdmin`; consumidores externos que as chamem diretamente precisarão passar pelas APIs da aplicação.

`supabase/migrations/20261023000100_avatar_upload_limits.sql` configura o bucket `avatars` para novos uploads WebP de até 1 MiB e restringe gravações ao caminho `<user-id>/avatar.webp`. A leitura pública e os arquivos existentes são preservados. A aplicação converte a imagem selecionada para até 400 px e confere formato/tamanho antes do upload. Configurações e políticas do Storage precisam ser aplicadas no Supabase para também valerem para chamadas diretas à API.

`supabase/migrations/20261023000200_profile_directory.sql` precisa ser aplicada antes de publicar a busca de perfis. Cria um diretório privado indexado, preenche as contas existentes e sincroniza cadastros/alterações por trigger no Auth. O servidor consulta um ID e lê a privacidade atual dessa conta; nomes inexistentes não enumeram o cadastro. As funções internas ficam em `radiola_private`, sem acesso dos clientes. Nomes duplicados existentes são preservados, com escolha determinística da conta mais antiga; a saída da migration informa a contagem de duplicidades para revisão.

## Formatação

O projeto usa Prettier com configuração em `.prettierrc.json`. Prefira arrow functions em código novo e nos trechos modificados, sem conversão geral por estilo. Execute `yarn format` para formatar os arquivos ou `yarn format:check` para verificar a formatação. Arquivos gerados, credenciais e lockfiles são ignorados por `.prettierignore`.

## Estrutura

`src/app` contém entradas de rotas, layouts, composição da navegação e configurações do Next. Cada `page.tsx` aponta para uma view nomeada; `route.ts` delega para o handler da feature.

`src/features/<feature>` concentra a funcionalidade:

- `views/<view>/<view>.tsx`: composição da tela, inclusive leitura inicial no servidor quando necessária.
- `components/<component>/<component>.tsx`: componente da feature em sua própria pasta.
- `hooks`: estado e coordenação de consultas/mutações dependentes do React.
- `functions`: regras e transformações de domínio sem dependência do React.
- `utils`: adaptações técnicas locais, como compressão da imagem do avatar.
- `schemas` e `types`: contratos de entrada e tipos de transporte.
- `api`: acesso do navegador às APIs/SDK público.
- `server/handlers`, `server/queries` e `server/metadata`: operações exclusivas do servidor.

`src/server` contém autenticação, clientes do banco, integrações privadas e infraestrutura HTTP. `src/shared` contém código neutro reutilizável. Não crie pastas vazias nem mova regras de negócio para um `utils` global. Use hooks quando houver dependência de estado/ciclo de vida React; funções puras continuam sendo funções.

No `shared`, as responsabilidades ficam organizadas assim:

- `components`: interface reutilizável. Ícones React próprios ficam em `components/icons`, como o `AppMark` usado na navegação e nas telas de autenticação.
- `hooks`: comportamento React genérico.
- `utils`: funções utilitárias compartilhadas; regras específicas continuam em `features/<feature>/functions`.
- `lib`: adaptação e configuração de bibliotecas, como o cliente público do Supabase.
- `http`: transporte HTTP e seus contratos de erro.
- `constants`: valores fixos compartilhados, como as rotas de navegação em `routes.ts`. Limites de negócio pertencem às respectivas features.
- `assets/fonts` e `assets/icons`: arquivos importados pelo código. O logotipo do TMDB é importado dessa pasta pelo componente de atribuição.
- `styles`: estilos globais. `globals.css` é a entrada importada uma vez pelo layout raiz; `tokens.css` define as cores e variáveis, `base.css` contém as regras globais e `animations.css` reúne as animações compartilhadas. Estilos de componentes continuam próximos deles, via Tailwind ou CSS Modules.

Arquivos com URLs públicas próprias continuam em `public`, incluindo `/icon-192.svg` e `/icon-512.svg` referenciados pelo manifesto. `src/app/icon.svg` e `src/app/favicon.ico` seguem as convenções de metadata do Next. Ícones de `react-icons` continuam sendo importados da biblioteca.

Módulos privados importam `server-only`. Importe DTOs como `import type`. Queries pessoais usam uma chave com o ID do usuário e o cache é descartado ao trocar de conta ou sair.

## Configuração, endpoints e operações HTTP

`settings.ts`, na raiz, faz a ponte com as variáveis de ambiente da integração TMDB. É exclusivo do servidor, acessível pelo alias `@settings`, e valida os valores quando a integração é utilizada. Erros de configuração identificam os campos, sem imprimir seus valores. Configurações privadas não são importadas pelos hooks do navegador.

`src/shared/constants/endpoint.ts` contém os caminhos das APIs, agrupados em `TMDB` e `INTERNAL`. Seus parâmetros de caminho são escapados; parâmetros de busca usam `URLSearchParams`. O arquivo não lê variáveis de ambiente e pode ser utilizado tanto no servidor quanto no navegador. Os caminhos de navegação das páginas continuam em `routes.ts`.

`src/server/integrations/tmdb/client.ts` concentra o transporte com `fetch`: combina a URL base de `settings` com o endpoint, aplica autenticação, timeout, cache do Next e validação Zod da resposta. As operações estão em arquivos individuais de `requests/`, como `get-series-details.ts` e `get-season-details.ts`. Cada uma declara endpoint, parâmetros, schema e prazo de revalidação. Views e consultas do servidor importam essas operações diretamente.

No navegador, `features/<feature>/api` encapsula a chamada à API interna. Os hooks da feature coordenam o TanStack Query, incluindo chave de cache, estado e cancelamento. Por exemplo, `useSeason` usa `api/get-season.ts`, e `useDiscoverSeries` concentra a paginação e os filtros do catálogo. `useSearchResults` compõe `useCatalogSearch` e `useSmartSearch`, preservando caches independentes. Hooks genéricos permanecem em `shared/hooks`.

Falhas de HTTP, rede, timeout e resposta inválida rejeitam a Promise com um erro padronizado. Operações não convertem falhas em listas vazias; a composição de uma tela pode escolher um fallback explícito para conteúdo opcional. A API interna devolve uma mensagem segura, código e identificador da requisição. Falhas de credenciais do provedor viram indisponibilidade do catálogo, sem confundir com a sessão do usuário.

## Verificações sem produção

`yarn run check` executa scanner de credenciais do código atual, análise Knip de arquivos/dependências/exports sem uso, conferência da regra de bots, lint sem avisos, verificação de tipos e testes unitários/contratos. Use `yarn run check` para evitar o comando interno `yarn check` do Yarn Classic. Os testes unitários bloqueiam requisições não simuladas.

`yarn build:check` cria um build de produção em `.next-check` com credenciais fictícias e integrações locais. A integração simulada recusa gravações de banco. As fontes usadas pelo app estão versionadas com suas licenças, permitindo compilar sem Google Fonts.

`yarn playwright install chromium` prepara o navegador. Depois de `build:check`, execute `yarn test:e2e`. Os testes iniciam a aplicação e os serviços simulados nas portas 3030 e 15432. As fixtures não comprovam compatibilidade com as políticas, schema ou autenticação do projeto real.

`yarn build` e `yarn start` usam as configurações reais fornecidas pelo ambiente. O fluxo de CI em `.github/workflows/checks.yml` usa apenas fixtures e não recebe credenciais de produção.

## Proteção contra rastreamento

`config/bots.json` é a lista explícita de agentes bloqueados. O `robots.txt` e o proxy usam a mesma política. O primeiro item de `routes` em `vercel.json` é gerado por `yarn bots:sync`; `yarn bots:check` detecta divergências sem modificar arquivos. As demais configurações do arquivo são preservadas.

A regra declarativa usa a ação de mitigação `deny` da Vercel e inclui páginas, imagens e arquivos estáticos. `/robots.txt` fica acessível para que o crawler possa ler a política. Ela só entra em vigor quando uma versão com o arquivo for publicada na Vercel; `next start` não emula o WAF. Os testes locais verificam a declaração e a defesa adicional do proxy, não certificam o firewall remoto.

A lista por User-Agent não identifica robôs disfarçados. Antes de retomar produção, configurar e validar AI Bots Ruleset em Deny, Bot Protection em Challenge, limites por operação e orçamento com pausa automática na Vercel. Evitar bypass genérico por nomes de robôs. Confirmar cobertura do domínio principal, aliases e previews.

As buscas aceitam até 200 caracteres. O feed por séries valida e deduplica até mil IDs positivos por requisição, enriquece no máximo 20 episódios e limita a quatro chamadas simultâneas ao catálogo. Esses limites controlam o trabalho de cada requisição; os limites de frequência continuam a cargo da plataforma. Restrinja também o acesso direto às RPCs para que as APIs da aplicação concentrem cache e controle de tráfego.

`yarn check:unused` usa as entradas de rotas, metadata, testes e configurações dos plugins do Knip. Os três scripts operacionais abaixo são entradas explícitas: não são código morto só por não terem imports na aplicação. Assets públicos, arquivos SQL e configuração remota exigem revisão adicional.

## Scripts operacionais

`node scripts/cleanup-db.mjs` e o entrypoint legado `cleanup-series.mjs` apenas simulam por padrão. `--run` habilita exclusões após leitura das referências conhecidas. Esse script não substitui uma auditoria de todas as FKs do esquema real.

`node --experimental-strip-types scripts/populate-series-context.ts` apenas descreve a simulação por padrão. `--run` consome a API paga e grava no banco configurado; o script valida a resposta antes de gravar. Não faz parte dos checks.

Uma chave administrativa foi anteriormente versionada. A substituição e revogação da chave exposta foram verificadas no projeto existente; essa verificação não remove cópias do histórico. Qualquer nova exposição exige substituir a credencial nos consumidores e revogá-la no provedor; removê-la do código não a invalida.

## Relatórios locais

Auditorias, planos e relatórios ficam em `docs/`, uma pasta local ignorada pelo Git e pela CLI da Vercel. Esses arquivos não acompanham um clone do repositório.
