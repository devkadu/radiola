export class ConfigurationError extends Error {
  constructor(fields: string[]) {
    super(`Configuração ausente ou inválida: ${[...new Set(fields)].join(", ")}`);
    this.name = "ConfigurationError";
  }
}
