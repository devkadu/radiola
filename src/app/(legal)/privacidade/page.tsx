import type { Metadata } from "next";
import Link from "next/link";
import { DATA_CONTROLLER, PRIVACY_CONTACT, PRIVACY_UPDATED_AT, privacyRequestUrl } from "@/features/privacy/constants/privacy";

export const metadata: Metadata = {
  title: "Política de privacidade",
  alternates: { canonical: "/privacidade" },
};

const PrivacyPage = () => (
  <>
    <div><h1>Política de privacidade</h1><p className="mt-2">Atualizada em {PRIVACY_UPDATED_AT}.</p></div>
    <section><h2>Quem cuida dos dados</h2><p>
      O Segunda Temporada é um site de catálogo e conversas sobre séries. O responsável pelo tratamento
      dos dados (controlador) é {DATA_CONTROLLER}, pessoa física. Para assuntos de privacidade,
      fale com <a href={privacyRequestUrl()}>{PRIVACY_CONTACT}</a>.
    </p></section>
    <section><h2>O que coletamos e para quê</h2><ul>
      <li><strong>Conta:</strong> e-mail, nome de usuário e dados de autenticação, para criar a conta, permitir acesso e protegê-la. A senha é processada pelo Supabase Auth e não é disponibilizada à administração do site.</li>
      <li><strong>Login Google:</strong> identificador da conta, e-mail e informações de perfil disponibilizadas pelo provedor, como nome e foto. Não solicitamos acesso ao Gmail ou aos seus contatos.</li>
      <li><strong>Atividade:</strong> comentários, respostas, notas, favoritos, listas, episódios assistidos e relações de seguidores, para oferecer as funcionalidades escolhidas.</li>
      <li><strong>Preferências e foto:</strong> visibilidade do perfil, opções de e-mail e avatar enviado por você.</li>
      <li><strong>Atendimento:</strong> mensagens de feedback, pedidos sobre dados e denúncias, para responder e moderar a comunidade.</li>
      <li><strong>Dados técnicos:</strong> informações de conexão, como IP, navegador, horários e registros de erro, tratadas pela infraestrutura para entregar o site, prevenir abuso e investigar falhas.</li>
    </ul><p>Evite publicar documentos, endereço, telefone, informações sensíveis ou dados de outras pessoas em comentários e no perfil.</p></section>
    <section><h2>Fundamentos do tratamento</h2><p>
      Usamos os dados necessários à conta e às funções solicitadas para executar a relação de prestação
      do serviço; registros estritamente necessários à segurança e à prevenção de abuso podem ser
      tratados com base no legítimo interesse, com avaliação de necessidade e impacto. Obrigações
      legais e exercício regular de direitos podem justificar conservação específica. Quando uma
      finalidade depender de consentimento, a escolha será específica, opcional e revogável.
      A leitura desta política não é uma autorização genérica para qualquer uso dos dados.
    </p></section>
    <section><h2>O que outras pessoas conseguem ver</h2><p>
      Comentários e respostas publicados são públicos, junto do nome de usuário, avatar e data.
      Notas e relações de seguidores também são acessíveis pelas funções públicas da comunidade.
      Fotos de perfil têm endereço público. Seu e-mail não é exibido como contato público pelo site.
    </p><p>
      O perfil começa privado quando você ainda não escolheu torná-lo público. Ativar o perfil público
      permite que outras pessoas vejam a página que reúne seus favoritos e atividade recente,
      incluindo episódios assistidos. Desativar essa opção oculta a página de atividade; comentários,
      notas e relações já públicos continuam acessíveis. Listas e histórico na área da conta são
      restritos ao titular, ressalvadas as informações exibidas na página de perfil quando pública.
      Para remover publicações ou solicitar exclusão, use os controles disponíveis ou entre em contato.
    </p></section>
    <section><h2>E-mails e escolhas</h2><p>
      Preferências opcionais de notificações começam desligadas quando não há uma escolha registrada.
      Você pode alterá-las no perfil. Mensagens necessárias ao acesso e à segurança da conta, como
      confirmação de cadastro, são distintas de comunicações promocionais. Não habilitamos
      publicidade comportamental neste site.
    </p></section>
    <section><h2>Serviços que ajudam a operar o site</h2><ul>
      <li><strong>Supabase:</strong> autenticação, banco de dados e armazenamento de avatares.</li>
      <li><strong>Vercel:</strong> hospedagem, entrega de páginas e registros técnicos de operação.</li>
      <li><strong>Resend:</strong> entrega de e-mails e encaminhamento de feedback.</li>
      <li><strong>Google:</strong> autenticação, se você escolher esse login; YouTube, se decidir carregar um trailer.</li>
      <li><strong>TMDB:</strong> catálogo e imagens de séries. Requisições externas podem transmitir dados técnicos necessários ao carregamento.</li>
    </ul><p>
      Esses serviços podem processar dados fora do Brasil, conforme sua infraestrutura e
      subcontratados. A região do banco não define o local de todo processamento. Você pode pedir
      informações sobre compartilhamento e transferências pelo nosso contato de privacidade.
      Google Analytics e outros coletores opcionais de audiência não são carregados nesta versão.
    </p></section>
    <section><h2>Por quanto tempo guardamos</h2><p>
      Mantemos o cadastro e a atividade enquanto necessários à conta e às funcionalidades utilizadas,
      até que você exclua o conteúdo ou solicite o encerramento, ressalvadas hipóteses legais de
      conservação. Pedidos e registros de moderação são revistos para conservar somente o necessário
      ao atendimento, à segurança e ao exercício de direitos. Dados técnicos e eventuais backups
      seguem os ciclos de retenção dos serviços contratados; a remoção dos dados ativos não implica
      apagamento instantâneo dessas cópias. Ao atender seu pedido, informaremos eventual retenção
      remanescente e sua justificativa.
    </p></section>
    <section><h2>Seus direitos e como pedir</h2><p>
      Você pode pedir confirmação e acesso, correção, cópia dos seus dados, informações sobre
      compartilhamento, revisão de tratamentos e, nas hipóteses aplicáveis, portabilidade,
      oposição, revogação do consentimento, anonimização, bloqueio ou eliminação.
      O atendimento é gratuito por <a href={privacyRequestUrl()}>{PRIVACY_CONTACT}</a>.
      Escreva preferencialmente pelo e-mail da conta, indique o pedido e nunca envie sua senha.
      Podemos solicitar uma confirmação proporcional de identidade para evitar acesso por terceiros.
      Responderemos nos prazos aplicáveis à solicitação; explicaremos eventual impossibilidade ou
      conservação obrigatória. Você também pode procurar a ANPD.
    </p></section>
    <section><h2>Crianças, adolescentes e responsáveis</h2><p>
      Responsáveis podem usar o mesmo canal para pedir esclarecimentos, análise de exposição e
      remoção de dados de crianças ou adolescentes. Não coletamos documentos ou biometria para
      aferir idade nesta versão. Não envie esses dados espontaneamente por e-mail.
      A proteção desse público é considerada na avaliação das funcionalidades e no atendimento
      de denúncias; a ausência de verificação automática não deve ser entendida como prova de idade.
    </p></section>
    <section><h2>Segurança, cookies e atualizações</h2><p>
      Aplicamos controles de acesso e tratamos falhas e denúncias para reduzir riscos. Se suspeitar de
      exposição indevida, informe o contato de privacidade. A <Link href="/cookies">política de cookies</Link>
      explica autenticação e conteúdo externo. Mudanças relevantes neste tratamento serão informadas
      nesta página e, quando necessário, por aviso no site ou contato com o titular.
    </p></section>
  </>
);

export default PrivacyPage;
