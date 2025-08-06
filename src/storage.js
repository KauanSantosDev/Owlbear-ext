import OBR from "@owlbear-rodeo/sdk";

export const CHAT_KEY = "chat-historia-medieval";

// Lê o chat da cena
export async function loadChat() {
    try {
        const sceneReady = await OBR.scene.isReady();
        if (!sceneReady) throw new Error("Cena não está pronta");

        const meta = await OBR.scene.getMetadata();
        return Array.isArray(meta[CHAT_KEY]) ? meta[CHAT_KEY] : [];
    } catch (err) {
        console.warn("🔍 loadChat: cena indisponível ou erro ao carregar:", err.message);
        return [];
    }
}

// Salva o chat na cena
export async function saveChat(chat) {
    try {
        const sceneReady = await OBR.scene.isReady();
        if (!sceneReady) throw new Error("Cena não está pronta");

        const meta = await OBR.scene.getMetadata();
        await OBR.scene.setMetadata({ ...meta, [CHAT_KEY]: chat });
    } catch (err) {
        console.warn("💾 saveChat: cena indisponível ou erro ao salvar:", err.message);
    }
}

// Define metadado com segurança (somente GM)
export async function updateSecureMetadata(key, value) {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

    const meta = await OBR.scene.getMetadata();
    const updated = { ...meta, [key]: value };
    await OBR.scene.setMetadata(updated);
}
