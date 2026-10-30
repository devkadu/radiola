import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_CONTACT, PRIVACY_UPDATED_AT, privacyRequestUrl } from "@/features/privacy/constants/privacy";

export const metadata: Metadata = { title: "Termos de uso", alternates: { canonical: "/termos" } };

const TermsPage = () => (
  <>
    <div><h1>Termos de uso</h1><p className="mt-2">Atualizados em {PRIVACY_UPDATED_AT}.</p></div>
    <section><h2>Sobre o serviço</h2><p>
      O Segunda Temporada oferece informações sobre séries, organização do que você acompanha e
      espaços de discussão. Dados de catálogo vêm de terceiros e podem mudar ou estar incompletos.
      O site não é um serviço de streaming nem representa as produtoras ou plataformas mencionadas.
    </p></section>
    <section><h2>Sua conta</h2><p>
      Use um e-mail ao qual você tenha acesso, proteja sua senha e escolha um nome de usuário que não
      exponha informações pessoais desnecessárias nem se passe por outra pessoa. Não compartilhe
      credenciais. Se houver uso indevido da conta, avise a administração.
    </p></section>
    <section><h2>Regras da comunidade</h2><ul>
      <li>Respeite outras pessoas. Não publique ameaças, assédio, discriminação ou exploração sexual.</li>
      <li>Não divulgue dados pessoais de terceiros, documentos, imagens íntimas ou conteúdo ilegal.</li>
      <li>Não publique spam nem tente manipular notas, curtidas, identidades ou controles do site.</li>
      <li>Publique apenas conteúdo que você possa compartilhar e respeite direitos autorais.</li>
      <li>Considere o contexto do episódio ao comentar. Controles de spoiler ajudam a navegação, mas não garantem ausência de spoilers.</li>
    </ul></section>
    <section><h2>Publicações e moderação</h2><p>
      Ao publicar um comentário, você permite sua exibição no contexto do serviço. Comentários e notas
      são públicos conforme explicado na <Link href="/privacidade">política de privacidade</Link>.
      Podemos analisar denúncias, remover conteúdo que viole estas regras e restringir contas por
      segurança, com avaliação do contexto. Para denunciar conteúdo ou contestar uma medida,
      escreva para <a href={privacyRequestUrl("Comunidade: denúncia ou revisão")}>{PRIVACY_CONTACT}</a>,
      informando o endereço da página e o motivo. Evite reenviar material ilegal ou dados sensíveis.
    </p></section>
    <section><h2>Dados, encerramento e contato</h2><p>
      Você pode solicitar encerramento da conta e exercer seus direitos pelo contato de privacidade.
      Estes termos não afastam direitos previstos na legislação. Alterações relevantes serão
      informadas no site. As práticas sobre dados e cookies estão nas páginas de
      <Link href="/privacidade"> privacidade</Link> e <Link href="/cookies">cookies</Link>.
    </p></section>
  </>
);

export default TermsPage;
