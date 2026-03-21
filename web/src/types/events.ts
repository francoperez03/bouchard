export interface EventEntry {
  id: number;
  timestamp: number;
  type: "reflex" | "strategy" | "emergency" | "terrain";
  message: string;
}

export interface CommandHistoryEntry {
  id: number;
  timestamp: number;
  command: string;
  result: string;
  color: string;
}
