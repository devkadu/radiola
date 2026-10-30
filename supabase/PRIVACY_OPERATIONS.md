# Operação de privacidade — Segunda Temporada

Responsável: Carlos Eduardo Batista dos Santos.
Canal: contato@segundatemporada.com.br.

Este procedimento acompanha os controles técnicos; não certifica conformidade
integral. A avaliação sobre menores, aferição de idade e enquadramento no ECA
Digital continua pendente. Não há bloqueio 18+ ou prova de maioridade nesta entrega.

## Receber e verificar pedidos

1. Monitorar o e-mail de contato, identificar o direito solicitado e registrar
   somente data, categoria, estado do pedido e referência interna necessária.
2. Confirmar a titularidade pelo e-mail já cadastrado ou outro método proporcional.
   Não pedir senha, token de sessão nem documento completo por rotina. Pedidos de
   responsáveis exigem análise apropriada, inclusive da representação.
3. Relacionar a conta ao UUID por meio administrativo confiável. Não escolher a
   conta apenas pelo nome público, que pode ter homônimos.
4. Confirmar ao titular o recebimento e dar seguimento conforme os prazos legais
   aplicáveis. A declaração completa de confirmação/acesso tem como regra geral
   até 15 dias; avaliar regras específicas e enquadramento antes de adotar exceções.
5. Se houver retenção necessária, explicar finalidade, fundamento, escopo e prazo.
   Não usar o encerramento como promessa de apagar imediatamente backups ou cópias
   sob controle de terceiros.

Referência: [perguntas frequentes da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes).

## Ferramenta interna

Use Yarn 1.22.22. As credenciais administrativas devem existir apenas no ambiente
local seguro. O script carrega `.env.local`/`.env` sem imprimir seus valores.
Ele não é uma rota pública, não envia e-mails nem executa migrações.

Substitua `UUID` e `REFERENCIA_DO_PROJETO` pelos valores conferidos no pedido.
O alvo é validado contra a URL HTTPS configurada, para evitar confusão de ambientes.

```sh
yarn privacy:account --user-id UUID --project-ref REFERENCIA_DO_PROJETO --request-verified
```

Sem ação explícita, apenas confirma a existência da conta. A opção
`--request-verified` é a declaração do operador de que verificou o pedido; ela não
substitui a verificação de identidade e não é uma autorização dada pelo usuário
via navegador.

### Acesso e cópia de dados

```sh
yarn privacy:account --action export --user-id UUID --project-ref REFERENCIA_DO_PROJETO --request-verified
```

A exportação inclui dados da conta, preferências, publicações e relações do
próprio titular, listas e referências dos arquivos. Não inclui senhas, tokens,
claims administrativos ou conteúdo privado de outra conta. Arquivos binários
solicitados devem ser obtidos e entregues por procedimento seguro complementar.

O JSON é salvo com permissão `0600` em `docs/private/`, diretório ignorado pelo
Git e pela Vercel. Revise o conteúdo, entregue apenas ao destinatário confirmado
por canal seguro e descarte a cópia de trabalho após concluir a entrega. Não
cole a exportação em issues, PRs, logs ou ferramentas de analytics.

### Encerramento e eliminação

Antes de executar: verificar eventuais obrigações de conservação, conteúdo
editorial e informações pessoais em textos livres. A ferramenta elimina dados
ativos e desvincula autoria editorial e denúncias próprias; ela não detecta
automaticamente menções pessoais escritas por outras pessoas ou dados dentro
de textos livres. Esses casos exigem revisão e decisão documentada.

```sh
yarn privacy:account --action delete --user-id UUID --project-ref REFERENCIA_DO_PROJETO --request-verified --execute --confirm-user-id UUID
```

O script exige a migração `privacy_security_baseline` e confirmação do mesmo UUID.
Ele marca a conta administrativamente para exclusão e bloqueia o login. As
políticas RLS consultam esse estado, impedindo acesso autenticado e novos uploads
mesmo com um JWT emitido antes do bloqueio. Depois remove os avatares, desvincula
relatos e autoria editorial e apaga a conta no Auth. As FKs removem seus dados
dependentes; respostas de terceiros são preservadas sem o vínculo ao comentário
apagado. Relatos mínimos de moderação podem permanecer sem os identificadores
removidos. Não confundir isso com invalidar criptograficamente o JWT já emitido:
o bloqueio imediato do acesso aos dados decorre das políticas e do estado da conta.

Em caso de falha a conta fica bloqueada. Corrija a causa e repita o mesmo comando
para retomar; não desbloqueie a conta durante uma exclusão pendente. Confira o
resultado antes de comunicar conclusão. Auth inexistente e pasta vazia são
verificados; investigue resíduos em fornecedores, caches, mensagens de atendimento
e eventuais backups separadamente.

## Retenção e incidentes

- Conservar dados de conta/atividade enquanto necessários ao serviço ou até
  pedido de remoção, observadas exceções legais. Revisar mensalmente contas
  bloqueadas para exclusão, pedidos encerrados e relatos sem vínculo, evitando
  acumular dados sem finalidade. Não executar limpeza generalizada sem escopo.
- Confirmar os prazos reais de logs, backups, cache e e-mails nos planos de
  Supabase, Vercel e Resend; registrar mudanças na política quando relevantes.
  Rever contratos/DPA, subprocessadores e mecanismos de transferência internacional.
- Acesso administrativo deve ser individual, com MFA nos painéis, e restrito a
  quem precisa operar. Nunca colocar chaves secretas em variáveis públicas.
- Ao receber notícia de exposição: registrar o fato com acesso restrito, conter
  o incidente, avaliar dados e pessoas afetadas e preservar evidências mínimas.
  Verificar necessidade de comunicar ANPD e titulares; a regra geral para
  incidentes com risco/dano relevante é três dias úteis, com particularidades
  conforme o enquadramento. Não interpretar erros 522 como prova de vazamento.

Referências: [incidentes](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis),
[transferências internacionais](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados).

## Validar e aplicar mudanças

`yarn run check` e `yarn build:check` usam integrações simuladas. Os testes de
privacidade SQL executam Postgres em memória com dados sintéticos, sem credenciais
ou acesso ao projeto remoto. Eles nunca executam manutenção/migrações em produção.

O projeto remoto não tinha histórico de migrações registrado no início da tarefa.
Não executar `db push` indiscriminadamente: isso pode reaplicar arquivos históricos.
Aplicar somente a migração revisada deste pacote, após os testes, e verificar os
advisors e o catálogo. Publicar o aplicativo com o código correspondente.

A migração deste pacote foi aplicada no projeto `radiola` com autorização
explícita do responsável e registrada como `20261030023039_privacy_security_baseline`.
O arquivo local corresponde a essa versão retornada pelo Supabase. As migrações
anteriores continuam sem registro no histórico remoto; não reaplicá-las por isso.

A migração de banco é compatível com os clientes antigos: campos de identidade
enviados são substituídos no servidor e nomes de reações antigas são preservados.
A API nova de moderação precisa da função criada pela migração. As funções de
rankings continuam limitadas ao backend.
