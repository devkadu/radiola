# Convenções do projeto

- Prefira arrow functions em código novo e nas funções que estiver modificando.
- A conversão é gradual: não reescreva funções de todo o projeto apenas por estilo.
- Preserve function declarations quando houver necessidade de hoisting ou outra exigência técnica.
- Use Yarn 1.22.22, conforme `packageManager` no `package.json`. Mantenha apenas `yarn.lock` como lockfile.
- Preserve a separação entre `src/app`, funcionalidades em `src/features`, infraestrutura em `src/server` e código reutilizável em `src/shared`.
- Valide mudanças com as integrações simuladas; os testes não devem executar manutenção ou migrações no banco de produção.
- `docs/` guarda relatórios locais e está ignorada pelo Git e pela CLI da Vercel.
