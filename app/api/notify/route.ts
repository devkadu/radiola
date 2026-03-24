import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Segunda Temporada <notificacoes@mail.segundatemporada.com.br>";
const SITE_URL = "https://segundatemporada.com.br";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailHtml(replierUsername: string, episodeTitle: string, episodeFullUrl: string, profileUrl: string) {
  const safeUsername = escapeHtml(replierUsername);
  const safeTitle = escapeHtml(episodeTitle);
  // URLs: apenas caminhos internos chegam aqui (validados antes)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F0E0C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0F0E0C">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:44px;height:44px;background:#F5C518;border-radius:10px;text-align:center;vertical-align:middle">
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none" style="display:block;margin:11px auto 0">
                  <path d="M8 7l10 8-10 8V7z" fill="#0F0E0C"/>
                  <path d="M18 7l10 8-10 8V7z" fill="rgba(15,14,12,0.4)"/>
                </svg>
              </td>
              <td style="width:10px"></td>
              <td style="vertical-align:middle">
                <div style="font-size:15px;font-weight:800;color:#F5C518;letter-spacing:-0.3px;line-height:1.2">Segunda</div>
                <div style="font-size:15px;font-weight:800;color:#F5C518;letter-spacing:-0.3px;line-height:1.2">Temporada</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card principal -->
        <tr><td style="background:#1a1916;border:1px solid #2a2820;border-radius:16px;padding:32px">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666">Nova resposta</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3">
            ${safeUsername} respondeu<br>seu comentário
          </h1>
          <p style="margin:0 0 28px;font-size:14px;color:#999;line-height:1.7">
            Alguém interagiu com você em<br>
            <strong style="color:#fff">${safeTitle}</strong>
          </p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#F5C518;border-radius:10px">
                <a href="${episodeFullUrl}"
                  style="display:block;color:#000;font-weight:700;font-size:14px;
                         padding:14px 28px;text-decoration:none;letter-spacing:0.2px">
                  Ver resposta &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding-top:28px;text-align:center">
          <p style="margin:0 0 16px;font-size:12px;color:#555;line-height:1.6">
            Você recebeu este email porque alguém respondeu<br>seu comentário na Segunda Temporada.
          </p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
            <tr>
              <td style="border:1px solid #333;border-radius:8px">
                <a href="${profileUrl}"
                  style="display:block;font-size:12px;color:#aaa;text-decoration:none;
                         padding:10px 20px;font-weight:500">
                  Desativar notificações
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar o usuário que está fazendo a requisição
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "não autorizado" }, { status: 401 });
    }

    // 2. Validar body
    const body = await request.json();
    const { type, parentCommentId, episodeTitle, episodeUrl } = body;

    if (type !== "reply") {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    if (typeof parentCommentId !== "string" || !parentCommentId) {
      return NextResponse.json({ error: "parentCommentId inválido" }, { status: 400 });
    }
    // episodeUrl deve ser caminho relativo
    if (episodeUrl && (typeof episodeUrl !== "string" || !episodeUrl.startsWith("/"))) {
      return NextResponse.json({ error: "episodeUrl inválido" }, { status: 400 });
    }

    // 3. Username vem da sessão autenticada, não do body
    const replierUsername = user.user_metadata?.username || user.email?.split("@")[0] || "alguém";

    // 4. Busca o comentário pai
    const { data: parent } = await supabaseAdmin
      .from("comments")
      .select("user_id, username")
      .eq("id", parentCommentId)
      .single();

    if (!parent) {
      return NextResponse.json({ error: "comentário não encontrado" }, { status: 404 });
    }

    // Não notifica quem respondeu a si mesmo
    if (parent.user_id === user.id) {
      return NextResponse.json({ ok: false, reason: "auto-resposta" });
    }

    // 5. Busca email e preferências do dono do comentário pai
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(parent.user_id);
    const targetUser = authUser?.user;
    const email = targetUser?.email;

    if (!email) {
      return NextResponse.json({ ok: false, reason: "sem email" });
    }

    if (targetUser?.user_metadata?.notify_replies === false) {
      return NextResponse.json({ ok: false, reason: "notificações desativadas" });
    }

    const episodeFullUrl = episodeUrl ? `${SITE_URL}${episodeUrl}` : SITE_URL;
    const profileUrl = `${SITE_URL}/perfil`;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${escapeHtml(replierUsername)} respondeu seu comentário`,
      html: emailHtml(replierUsername, episodeTitle ?? "um episódio", episodeFullUrl, profileUrl),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ error: "falha ao enviar" }, { status: 500 });
  }
}
