import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";

export default function BackgroundMusic() {
    const { bgmVolume, isMuted } = useGameStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const userInteractedRef = useRef<boolean>(false);

    // =========================================================================
    // 🎵 คำแนะนำสำหรับการใส่ไฟล์เพลง (Audio Files Setup Instructions) 🎵
    // =========================================================================
    // 1. สร้างโฟลเดอร์ชื่อ "audio" ไว้ในโฟลเดอร์ "public" (ทางผ่านจะเป็น: public/audio/)
    // 2. นำไฟล์เพลงของคุณมาใส่และตั้งชื่อตามด้านล่างนี้:
    //    - ใช้เพลงเดียวทุกฉาก: "sound-game.mp3" (จะโหลดจาก public/audio/sound-game.mp3)
    // =========================================================================
    const getMusicSrc = (): string => "/audio/sound-game.mp3";

    useEffect(() => {
        const src = getMusicSrc();

        // สร้าง หรือ เปลี่ยนไฟล์เสียงเมื่อ Game State มีการเปลี่ยนแปลง
        if (!audioRef.current) {
            audioRef.current = new Audio(src);
            audioRef.current.loop = true;
        } else {
            const currentSrc = audioRef.current.src;
            if (currentSrc && !currentSrc.endsWith(src)) {
                audioRef.current.pause();
                audioRef.current.src = src;
                audioRef.current.load();
            }
        }

        // ปรับระดับความดังเสียง (ถ้ากด Muted จะปรับเป็น 0 ทันที)
        audioRef.current.volume = isMuted ? 0 : bgmVolume;

        const playAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().catch((err) => {
                    // เบราว์เซอร์ส่วนใหญ่จะบล็อก Autoplay จนกว่าผู้เล่นจะสัมผัสหน้าจอ
                    console.warn("Autoplay blocked by browser. Music will start playing after user clicks on the screen.", err);
                });
            }
        };

        playAudio();

        // ฟังเหตุการณ์การคลิกหรือกดแป้นพิมพ์เพื่อเริ่มเล่นเพลง (ปลดบล็อกข้อจำกัด Autoplay ของเบราว์เซอร์)
        const handleInteraction = () => {
            if (!userInteractedRef.current) {
                userInteractedRef.current = true;
                playAudio();
            }
        };

        window.addEventListener("click", handleInteraction, { once: true, capture: true });
        window.addEventListener("keydown", handleInteraction, { once: true, capture: true });

        return () => {
            window.removeEventListener("click", handleInteraction, { capture: true });
            window.removeEventListener("keydown", handleInteraction, { capture: true });
        };
    }, []);

    // ปรับระดับความดังเสียงแบบเรียลไทม์เมื่อมีการเลื่อน Setting Slider หรือปรับ Mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : bgmVolume;
        }
    }, [bgmVolume, isMuted]);

    return null;
}
