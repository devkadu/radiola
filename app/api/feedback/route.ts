import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Segunda Temporada <notificacoes@mail.segundatemporada.com.br>";
const TO = "contato@segundatemporada.com.br";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length < 10) {
      return NextResponse.json({ error: "mensagem muito curta" }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "mensagem muito longa" }, { status: 400 });
    }

    // Tenta pegar dados do usuário logado
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

    const { data: { user } } = await supabase.auth.getUser();
    const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Anônimo";
    const email = user?.email ?? "—";

    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `💡 Nova sugestão de ${username}`,
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0F0E0C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0F0E0C">
    <tr><td align="center" style="padding:40px 16px">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%">

        <tr><td style="padding-bottom:24px">
          <div style="font-size:15px;font-weight:800;color:#F5C518;letter-spacing:-0.3px">Segunda Temporada</div>
        </td></tr>

        <tr><td style="background:#1a1916;border:1px solid #2a2820;border-radius:16px;padding:32px">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666">Nova sugestão</p>
          <h1 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#ffffff">💡 ${username}</h1>

          <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:24px">
            <p style="margin:0;font-size:15px;color:#ddd;line-height:1.7;white-space:pre-wrap">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          </div>

          <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
            <tr>
              <td style="font-size:12px;color:#555">
                <strong style="color:#888">Usuário:</strong> ${username}<br>
                <strong style="color:#888">Email:</strong> ${email}
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ error: "falha ao enviar" }, { status: 500 });
  }
}
