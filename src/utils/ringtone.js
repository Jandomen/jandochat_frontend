import { Howl } from "howler";

const RINGTONES = {
  classic: {
    name: "Clásico",
    url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
  },
  pop: {
    name: "Pop",
    url: "https://assets.mixkit.co/active_storage/sfx/2871/2871-preview.mp3"
  },
  funny: {
    name: "Divertido",
    url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3"
  },
  nature: {
    name: "Naturaleza",
    url: "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3"
  },
  soft: {
    name: "Suave",
    url: "https://assets.mixkit.co/active_storage/sfx/2873/2873-preview.mp3"
  },
  electronic: {
    name: "Electrónico",
    url: "https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3"
  }
};

class RingtonePlayer {
  constructor() {
    this.currentSound = null;
    this.selectedRingtone = "classic";
    this.volume = 0.7;
  }

  setRingtone(key) {
    if (RINGTONES[key]) {
      this.selectedRingtone = key;
      localStorage.setItem("callRingtone", key);
    }
  }

  loadSavedRingtone() {
    const saved = localStorage.getItem("callRingtone");
    if (saved && RINGTONES[saved]) {
      this.selectedRingtone = saved;
    }
    return this.selectedRingtone;
  }

  play() {
    console.log(`🎶 [Ringtone] Intentando reproducir: ${this.selectedRingtone}`);
    this.stop();

    const ringtone = RINGTONES[this.selectedRingtone];
    if (!ringtone) {
      console.warn("🎶 [Ringtone] No se encontró el ringtone seleccionado");
      return;
    }

    try {
      this.currentSound = new Howl({
        src: [ringtone.url],
        loop: true,
        volume: this.volume,
        html5: false, // Usar Web Audio para evitar el pool de HTML5
        onload: () => console.log("🎶 [Ringtone] Cargado con éxito"),
        onloaderror: (id, err) => console.error("🎶 [Ringtone] Error de carga:", err),
        onplayerror: (id, err) => {
          console.error("🎶 [Ringtone] Error de reproducción:", err);
          this.currentSound.once('unlock', () => {
            console.log("🎶 [Ringtone] Iniciando después del desbloqueo");
            this.currentSound.play();
          });
        }
      });

      this.currentSound.play();
    } catch (e) {
      console.error("🎶 [Ringtone] Error excepcional al crear Howl:", e);
    }
  }

  stop() {
    if (this.currentSound) {
      console.log("🎶 [Ringtone] Deteniendo sonido");
      this.currentSound.stop();
      this.currentSound.unload();
      this.currentSound = null;
    }
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.currentSound) {
      this.currentSound.volume(vol);
    }
  }

  getRingtones() {
    return RINGTONES;
  }

  getCurrentRingtone() {
    return RINGTONES[this.selectedRingtone];
  }
}

export const ringtonePlayer = new RingtonePlayer();
export { RINGTONES };
