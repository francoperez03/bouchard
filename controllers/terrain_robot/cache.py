"""
Cache de respuestas de Claude para evitar llamadas repetidas
con el mismo estado de sensores (cuantizado).
"""


class ResponseCache:
    def __init__(self, ttl_steps=500):
        self._cache = {}
        self._ttl = ttl_steps
        self.hits = 0
        self.misses = 0

    def _quantize(self, compact_data):
        """Cuantiza datos compactos para generar cache key."""
        q = {}
        ps = compact_data.get("ps", {})
        for k, v in ps.items():
            q[f"ps_{k}"] = round(v / 50) * 50

        q["terreno"] = compact_data.get("terreno", "")
        q["slip"] = round(compact_data.get("slip", 0), 1)
        q["incl"] = round(compact_data.get("incl", 0) / 5) * 5
        q["front"] = round(compact_data.get("front", 0) / 50) * 50
        q["side"] = round(compact_data.get("side", 0) / 50) * 50
        q["vib"] = round(compact_data.get("vib", 0), 1)

        return frozenset(sorted(q.items()))

    def get(self, compact_data, current_step):
        """Busca respuesta en cache. Retorna plan o None."""
        key = self._quantize(compact_data)
        entry = self._cache.get(key)

        if entry and (current_step - entry["step"]) < self._ttl:
            self.hits += 1
            return entry["plan"]

        self.misses += 1
        return None

    def put(self, compact_data, plan, current_step):
        """Almacena respuesta en cache."""
        key = self._quantize(compact_data)
        self._cache[key] = {"plan": plan, "step": current_step}

    def stats(self):
        """Retorna estadísticas del cache."""
        total = self.hits + self.misses
        ratio = self.hits / total if total > 0 else 0.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total": total,
            "hit_ratio": round(ratio, 3),
            "entries": len(self._cache),
        }

    def print_stats(self):
        """Imprime estadísticas del cache."""
        s = self.stats()
        print(f"[cache] {s['hits']} hits / {s['misses']} misses "
              f"({s['hit_ratio']:.1%} hit rate) | {s['entries']} entries")
