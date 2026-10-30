import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_UPDATED_AT } from "@/features/privacy/constants/privacy";

export const metadata: Metadata = { title: "Cookies e conteúdo externo", alternates: { canonical: "/cookies" } };

const CookiesPage = () => (
  <>
    <div><h1>Cookies e conteúdo externo</h1><p className="mt-2">Atualizada em {PRIVACY_UPDATED_AT}.</p></div>
    <section><h2>Autenticação e funcionamento</h2><p>
      O Supabase Auth usa cookies necessários à sessão, geralmente com nomes iniciados por
      <code> sb-</code>, que podem ser divididos em partes. Eles permitem manter e renovar o acesso
      autenticado. Sair da conta remove a sessão deste navegador. Você também pode apagar os
      dados do site nas configurações do navegador; isso pode exigir novo login.
      A infraestrutura pode utilizar mecanismos estritamente necessários à segurança e entrega das páginas.
    </p></section>
    <section><h2>Medição de audiência</h2><p>
      Nesta versão não carregamos Google Analytics nem scripts opcionais de medição de audiência
      ou publicidade. Se introduzirmos essas tecnologias, informaremos finalidades, duração e escolhas
      antes da ativação, obtendo consentimento quando exigido.
    </p></section>
    <section><h2>Trailers do YouTube</h2><p>
      O player externo só é carregado depois de você escolher carregar o vídeo no aviso do trailer.
      Usamos o modo de privacidade aprimorada do YouTube; ainda assim, o carregamento e a reprodução
      estabelecem conexão com o Google e podem envolver dados técnicos e armazenamento pelo provedor.
      Você pode fechar o aviso e continuar navegando sem carregar o player.
    </p></section>
    <section><h2>Outros serviços</h2><p>
      Login Google, imagens de catálogo e fotos externas podem estabelecer conexões com os respectivos
      serviços quando utilizados. Informações sobre fornecedores e seus direitos estão na
      <Link href="/privacidade"> política de privacidade</Link>.
    </p></section>
  </>
);

export default CookiesPage;
