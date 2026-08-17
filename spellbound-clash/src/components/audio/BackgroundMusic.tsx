import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/useGameStore";

export default function BackgroundMusic() {
    const { gameState, bgmVolume, isMuted } = useGameStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const userInteractedRef = useRef<boolean>(false);

    // =========================================================================
    // 🎵 คำแนะนำสำหรับการใส่ไฟล์เพลง (Audio Files Setup Instructions) 🎵
    // =========================================================================
    // 1. สร้างโฟลเดอร์ชื่อ "audio" ไว้ในโฟลเดอร์ "public" (ทางผ่านจะเป็น: public/audio/)
    // 2. นำไฟล์เพลงของคุณมาใส่และตั้งชื่อตามด้านล่างนี้:
    //    - เพลงหน้าเมนูหลัก: "menu.mp3"         (จะโหลดจาก public/audio/menu.mp3)
    //    - เพลงตอนเดินแผนที่: "explore.mp3"     (จะโหลดจาก public/audio/explore.mp3)
    //    - เพลงฉากต่อสู้: "battle.mp3"        (จะโหลดจาก public/audio/battle.mp3)
    //    - เพลงตอนเกมโอเวอร์: "gameover.mp3"     (จะโหลดจาก public/audio/gameover.mp3)
    // =========================================================================
    const getMusicSrc = (state: string): string => {
        switch (state) {
            case "MENU":
                return "/audio/menu.mp3"; // ◄◄ ใส่ไฟล์เพลงเมนูที่นี่
            case "EXPLORE":
            case "BATTLE_TRANSITION":
            case "BATTLE":
                return "/audio/explore.mp3"; // เล่นเพลงสำรวจต่อเนี่องระหว่างฉากและฉากต่อสู้
            case "GAMEOVER":
                return "/audio/gameover.mp3"; // ◄◄ ใส่ไฟล์เพลงตอนตาย/จบเกมที่นี่
            default:
                return "/audio/menu.mp3";
        }
    };

    useEffect(() => {
        const src = getMusicSrc(gameState);

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
    }, [gameState]);

    // ปรับระดับความดังเสียงแบบเรียลไทม์เมื่อมีการเลื่อน Setting Slider หรือปรับ Mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : bgmVolume;
        }
    }, [bgmVolume, isMuted]);

    return null;
}
