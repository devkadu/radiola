import { requireUser } from "@/server/auth/auth";
import { supabaseAdmin } from "@/server/database/admin";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { escapeHtml } from "@/shared/utils/escape-html";
import { NextRequest,NextResponse } from "next/server";
import { Resend } from "resend";
import "server-only";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Segunda Temporada <notificacoes@mail.segundatemporada.com.br>";
const SITE_URL = "https://segundatemporada.com.br";

function emailHtml(replierUsername: string, episodeTitle: string, episodeFullUrl: string, profileUrl: string) {
  const safeUsername = escapeHtml(replierUsername);
  const safeTitle = escapeHtml(episodeTitle);
  // URLs: apenas caminhos internos chegam aqui (validados antes)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width:44px;height:44px;background:#c8f565;border-radius:10px;text-align:center;vertical-align:middle">
                <svg width="22" height="22" viewBox="0 0 30 30" fill="none" style="display:block;margin:11px auto 0">
                  <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
                  <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
                </svg>
              </td>
              <td style="width:10px"></td>
              <td style="vertical-align:middle">
                <div style="font-size:15px;font-weight:800;color:#c8f565;letter-spacing:-0.3px;line-height:1.2">Segunda</div>
                <div style="font-size:15px;font-weight:800;color:#c8f565;letter-spacing:-0.3px;line-height:1.2">Temporada</div>
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
              <td style="background:#c8f565;border-radius:10px">
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
    const { user, supabase } = await requireUser();
    const { replyCommentId, episodeTitle, episodeUrl } = z.object({
      type: z.literal("reply"),
      replyCommentId: z.uuid(),
      episodeTitle: z.string().trim().max(200).optional(),
      episodeUrl: z.string().max(500).regex(/^\/(?![\/\\])[^\s"<>]*$/).optional(),
    }).strict().parse(await readJson(request));
    // Only the author of a persisted reply may notify its parent.
    const { data: reply, error: replyError } = await supabase.from("comments")
      .select("parent_id, episode_id").eq("id", replyCommentId).eq("user_id", user.id).maybeSingle();
    if (replyError) throw replyError;
    if (!reply?.parent_id) return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });

    // 3. Username vem da sessão autenticada, não do body
    const replierUsername = user.user_metadata?.username || user.email?.split("@")[0] || "alguém";

    // 4. Busca o comentário pai
    const { data: parent, error: parentError } = await supabaseAdmin
      .from("comments")
      .select("user_id, username, episode_id")
      .eq("id", reply.parent_id)
      .single();

    if (parentError) throw parentError;
    if (!parent || parent.episode_id !== reply.episode_id) {
      return NextResponse.json({ error: "comentário não encontrado" }, { status: 404 });
    }

    // Não notifica quem respondeu a si mesmo
    if (parent.user_id === user.id) {
      return NextResponse.json({ ok: false, reason: "auto-resposta" });
    }

    // 5. Busca email e preferências do dono do comentário pai
    const { data: authUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(parent.user_id);
    if (targetError) throw targetError;
    const targetUser = authUser?.user;
    const email = targetUser?.email;

    if (!email) {
      return NextResponse.json({ ok: false, reason: "sem email" });
    }

    if (targetUser?.user_metadata?.notify_replies === false) {
      return NextResponse.json({ ok: false, reason: "notificações desativadas" });
    }

    const episodeFullUrl = escapeHtml(new URL(episodeUrl ?? "/", SITE_URL).href);
    const profileUrl = `${SITE_URL}/perfil`;

    const { error: sendError } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `${escapeHtml(replierUsername)} respondeu seu comentário`,
      html: emailHtml(replierUsername, episodeTitle ?? "um episódio", episodeFullUrl, profileUrl),
    }, { idempotencyKey: `reply/${replyCommentId}` });
    if (sendError) throw new Error("Email provider rejected notification");

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err, "notify");
  }
}
