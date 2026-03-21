import csv
import os


class DataLogger:
    def __init__(self, path=None):
        if path is None:
            dir_path = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(dir_path, "terrain_log.csv")
        self.path = path
        self.file = open(path, "w", newline="")
        self.writer = None
        self.step = 0
        print(f"[logger] Guardando datos en: {path}")

    def log(self, data, safety_status="ok", action=""):
        row = {
            "step": self.step,
            "ps0": data["proximidad"].get("ps0", 0),
            "ps1": data["proximidad"].get("ps1", 0),
            "ps2": data["proximidad"].get("ps2", 0),
            "ps3": data["proximidad"].get("ps3", 0),
            "ps4": data["proximidad"].get("ps4", 0),
            "ps5": data["proximidad"].get("ps5", 0),
            "ps6": data["proximidad"].get("ps6", 0),
            "ps7": data["proximidad"].get("ps7", 0),
            "accel_x": data["accel"]["x"],
            "accel_y": data["accel"]["y"],
            "accel_z": data["accel"]["z"],
            "gyro_x": data["gyro"]["x"],
            "gyro_y": data["gyro"]["y"],
            "gyro_z": data["gyro"]["z"],
            "vibracion": data["vibracion"],
            "avance_real": data["avance_real"],
            "odo_izq": data["odometria"]["izq"],
            "odo_der": data["odometria"]["der"],
            "terreno": data.get("terreno_detectado", ""),
            "slip": data.get("slip_ratio", ""),
            "inclinacion": data.get("inclinacion", ""),
            "front_min": data.get("front_min", ""),
            "side_min": data.get("side_min", ""),
            "x": data.get("pose", {}).get("x", 0),
            "y": data.get("pose", {}).get("y", 0),
            "theta": data.get("pose", {}).get("theta", 0),
            "safety": safety_status,
            "action": action,
        }

        if not self.writer:
            self.writer = csv.DictWriter(self.file, fieldnames=row.keys())
            self.writer.writeheader()

        self.writer.writerow(row)
        self.step += 1

        # Flush cada 100 pasos
        if self.step % 100 == 0:
            self.file.flush()

    def close(self):
        self.file.flush()
        self.file.close()
        print(f"[logger] Log cerrado. {self.step} registros guardados.")
