export interface CommandRequest {
  fn: "avanzar" | "retroceder" | "girar" | "frenar" | "set_velocidad" | "set_mode";
  args: Record<string, number | string>;
}

export interface CommandResponse {
  status: "queued" | "ignored" | "error";
  queue_size?: number;
  message?: string;
  reason?: string;
}
