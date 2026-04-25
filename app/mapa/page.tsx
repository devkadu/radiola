export const metadata = { title: "Mapa do Site — Radiola" };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

type Route = {
  path: string;
  label: string;
  description?: string;
  type: "public" | "auth" | "utility" | "dynamic";
  children?: Route[];
  example?: string;
  inSitemap?: boolean;
};

const routes: Route[] = [
  {
    path: "/",
    label: "Início",
    description: "Home personalizada ou padrão",
    type: "public",
    inSitemap: true,
  },
  {
    path: "/series",
    label: "Séries",
    description: "Catálogo completo de séries",
    type: "public",
    inSitemap: true,
    children: [
      {
        path: "/series/[slug]",
        label: "Página da Série",
        description: "Detalhes, temporadas e elenco",
        type: "dynamic",
        example: "/series/breaking-bad-1396",
        inSitemap: true,
        children: [
          {
            path: "/series/[slug]/[season]",
            label: "Temporada",
            description: "Episódios da temporada",
            type: "dynamic",
            example: "/series/breaking-bad-1396/temporada-1",
            children: [
              {
                path: "/series/[slug]/[season]/[episode]",
                label: "Episódio",
                description: "Detalhes + comentários do episódio",
                type: "dynamic",
                example: "/series/breaking-bad-1396/temporada-1/episodio-1-piloto",
                inSitemap: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/debates",
    label: "Em Debate",
    description: "Episódios mais comentados agora",
    type: "public",
    inSitemap: true,
  },
  {
    path: "/em-breve",
    label: "Em Breve",
    description: "Próximas estreias",
    type: "public",
    inSitemap: true,
  },
  {
    path: "/sugestoes",
    label: "Sugestões",
    description: "Sugestões da comunidade",
    type: "public",
    inSitemap: false,
  },
  {
    path: "/pessoa/[id]",
    label: "Pessoa / Ator",
    description: "Perfil de ator ou diretor",
    type: "dynamic",
    example: "/pessoa/83160",
    inSitemap: false,
  },
  {
    path: "/busca",
    label: "Busca",
    description: "Resultado de buscas",
    type: "utility",
    inSitemap: false,
  },
  {
    path: "/u/[username]",
    label: "Perfil Público",
    description: "Perfil público de um usuário",
    type: "dynamic",
    example: "/u/kadu",
    inSitemap: false,
  },
  {
    path: "/perfil",
    label: "Meu Perfil",
    description: "Painel do usuário logado",
    type: "auth",
    inSitemap: false,
  },
  {
    path: "/login",
    label: "Login",
    description: "Autenticação",
    type: "auth",
    inSitemap: false,
  },
  {
    path: "/criar-conta",
    label: "Criar Conta",
    description: "Cadastro",
    type: "auth",
    inSitemap: false,
  },
  {
    path: "/links",
    label: "Links",
    description: "Página de links externos",
    type: "utility",
    inSitemap: false,
  },
];

const typeConfig = {
  public:  { label: "Público",   dot: "#22c55e", bg: "#052e16", border: "#166534" },
  auth:    { label: "Requer login", dot: "#f59e0b", bg: "#1c1009", border: "#92400e" },
  utility: { label: "Utilitário", dot: "#6b7280", bg: "#111", border: "#374151" },
  dynamic: { label: "Dinâmico",  dot: "#3b82f6", bg: "#0c1a2e", border: "#1e3a5f" },
};

function RouteNode({ route, depth = 0, isLast = false }: { route: Route; depth?: number; isLast?: boolean }) {
  const cfg = typeConfig[route.type];
  const hasChildren = route.children && route.children.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0, position: "relative" }}>
      {depth > 0 && (
        <div style={{
          position: "absolute", left: -16, top: 20,
          width: 12, height: 1, background: "#374151",
        }} />
      )}
      {depth > 0 && !isLast && (
        <div style={{
          position: "absolute", left: -16, top: 0,
          width: 1, height: "100%", background: "#374151",
        }} />
      )}
      {depth > 0 && isLast && (
        <div style={{
          position: "absolute", left: -16, top: 0,
          width: 1, height: 21, background: "#374151",
        }} />
      )}

      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "10px 14px", marginBottom: 6,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 8, position: "relative",
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dot, flexShrink: 0, marginTop: 6,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <code style={{
              fontSize: 13, fontWeight: 600, color: "#e5e7eb",
              background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4,
            }}>
              {route.path}
            </code>
            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.dot }}>
              {route.label}
            </span>
            {route.inSitemap && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 10,
                background: "#064e3b", color: "#34d399", border: "1px solid #065f46",
              }}>
                sitemap
              </span>
            )}
          </div>
          {route.description && (
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0" }}>
              {route.description}
            </p>
          )}
          {route.example && (
            <a
              href={`${siteUrl}${route.example}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#60a5fa", marginTop: 3, display: "block", textDecoration: "none" }}
            >
              ex: {route.example} ↗
            </a>
          )}
        </div>
      </div>

      {hasChildren && (
        <div style={{ marginLeft: 16 }}>
          {route.children!.map((child, i) => (
            <RouteNode
              key={child.path}
              route={child}
              depth={depth + 1}
              isLast={i === route.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapaPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", padding: "32px 24px",
      fontFamily: "system-ui, sans-serif", color: "#e5e7eb",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#f9fafb" }}>
            Mapa do Site
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
            {siteUrl}
          </p>
        </div>

        {/* Legenda */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28,
          padding: "12px 16px", background: "#111", borderRadius: 8, border: "1px solid #1f2937",
        }}>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{cfg.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 10, padding: "1px 6px", borderRadius: 10,
              background: "#064e3b", color: "#34d399", border: "1px solid #065f46",
            }}>sitemap</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Incluído no sitemap.xml</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10, marginBottom: 28,
        }}>
          {[
            { label: "Total de rotas", value: countRoutes(routes) },
            { label: "No sitemap", value: countSitemap(routes) },
            { label: "Públicas", value: countByType(routes, "public") },
            { label: "Dinâmicas", value: countByType(routes, "dynamic") },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "12px 16px", background: "#111", borderRadius: 8,
              border: "1px solid #1f2937", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#f9fafb" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Árvore */}
        <div>
          {routes.map((route, i) => (
            <RouteNode key={route.path} route={route} isLast={i === routes.length - 1} />
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#4b5563", marginTop: 32, textAlign: "center" }}>
          /mapa — apenas para uso interno
        </p>
      </div>
    </div>
  );
}

function countRoutes(routes: Route[]): number {
  return routes.reduce((acc, r) => acc + 1 + (r.children ? countRoutes(r.children) : 0), 0);
}

function countSitemap(routes: Route[]): number {
  return routes.reduce((acc, r) =>
    acc + (r.inSitemap ? 1 : 0) + (r.children ? countSitemap(r.children) : 0), 0);
}

function countByType(routes: Route[], type: Route["type"]): number {
  return routes.reduce((acc, r) =>
    acc + (r.type === type ? 1 : 0) + (r.children ? countByType(r.children, type) : 0), 0);
}
