export const PRIVACY_CONTACT = "contato@segundatemporada.com.br";
export const DATA_CONTROLLER = "Carlos Eduardo Batista dos Santos";
export const PRIVACY_UPDATED_AT = "29 de outubro de 2026";

export const privacyRequestUrl = (subject = "Privacidade e dados pessoais") =>
  `mailto:${PRIVACY_CONTACT}?subject=${encodeURIComponent(subject)}`;
