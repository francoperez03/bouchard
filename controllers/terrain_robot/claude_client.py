import json
import urllib.request
import urllib.error
from prompts import SYSTEM_PROMPT
from config import CLAUDE_API_KEY


def _parse_claude_response(content):
    """Parsea la respuesta de Claude, limpiando markdown si es necesario."""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)


def _compact_data(sensor_data):
    """Extrae solo los campos esenciales para reducir tokens."""
    ps = sensor_data.get("proximidad", {})
    return {
        "ps": {k: v for k, v in ps.items() if v > 10},  # solo sensores activos
        "terreno": sensor_data.get("terreno_detectado", ""),
        "slip": sensor_data.get("slip_ratio", 0),
        "incl": sensor_data.get("inclinacion", 0),
        "front": sensor_data.get("front_min", 0),
        "side": sensor_data.get("side_min", 0),
        "vib": sensor_data.get("vibracion", 0),
    }


def ask_claude(sensor_data, history=None):
    """Envía datos de sensores a Claude API y retorna el plan de navegación."""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
    }

    compact = _compact_data(sensor_data)
    user_msg = json.dumps(compact)
    if history:
        hist_compact = [_compact_data(h) for h in history[-2:]]
        user_msg = f"Hist: {json.dumps(hist_compact)}\nAhora: {user_msg}"

    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 200,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_msg}],
    }).encode()

    print(f"[claude_client] Request ({len(body)}b): {user_msg[:200]}")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode()
            result = json.loads(raw)
            content = result["content"][0]["text"]
            usage = result.get("usage", {})
            print(f"[claude_client] OK ({usage.get('input_tokens', '?')}in/{usage.get('output_tokens', '?')}out): {content[:200]}")
            return _parse_claude_response(content)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"[claude_client] HTTP {e.code}: {error_body}")
        return None
    except json.JSONDecodeError as e:
        print(f"[claude_client] JSON malformado: {e}")
        return None
    except Exception as e:
        print(f"[claude_client] Error: {e}")
        return None
