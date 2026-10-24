export function verificationEnvironment() {
  return {
    ...process.env,
    NEXT_BUILD_CHECK: "1", NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:15432",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_fixture",
    // Exercise the new key format without permitting a legacy fallback.
    SUPABASE_SECRET_KEY: "sb_secret_fixture", SUPABASE_SERVICE_ROLE_KEY: "",
    TMDB_API_BASE_URL: "http://127.0.0.1:15432/3", TMDB_ACCESS_TOKEN: "fixture-token",
    RESEND_API_KEY: "fixture-email-key", ANTHROPIC_API_KEY: "fixture-ai-key",
    ADMIN_USER_ID: "22222222-2222-4222-8222-222222222222",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3030", PORT: "3030",
  };
}
