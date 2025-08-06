import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@1.5.2/+esm";
import { saveChat, updateSecureMetadata } from "https://kauansantosdev.github.io/Owlbear-ext/05storage.js";

export async function initGM({ gmBtn, gmModal, gmClose }) {
    const role = await OBR.player.getRole();
    if (role !== "GM") return;

    gmBtn.style.display = "block";

    gmBtn.addEventListener("click", () => {
        gmModal.style.display = gmModal.style.display === "block" ? "none" : "block";
    });

    gmClose.addEventListener("click", () => {
        gmModal.style.display = "none";
    });

    const avisoBtn = document.createElement("button");
    avisoBtn.textContent = "💬 Enviar Aviso";
    avisoBtn.addEventListener("click", async () => {
        const msg = prompt("Digite o aviso:");
        if (!msg) return;

        const chat = await OBR.scene.getMetadata();
        const history = Array.isArray(chat["chat-historia-medieval"]) ? chat["chat-historia-medieval"] : [];

        history.push({
            nome: "",
            role: "GM",
            texto: `
                <div style="
                    font-family: 'MedievalSharp', cursive;
                    color: #f39c12;
                    font-size: 1.1em;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 10px 12px;
                    margin: 8px 0;
                    border-left: 4px solid #f39c12;
                ">
                    ⚜️ <b>${msg}</b>
                </div>
            `,
            critical: null,
        });

        await saveChat(history);
    });

    const limparBtn = document.createElement("button");
    limparBtn.textContent = "🧹 Limpar Chat";
    limparBtn.addEventListener("click", async () => {
        if (confirm("Tem certeza que deseja apagar TODO o chat para todos?")) {
            await saveChat([]);
        }
    });

    const criticoBtn = document.createElement("button");
    criticoBtn.textContent = "🎯 Forçar Crítico";
    criticoBtn.style.border = "2px solid #fff8dc";

    const erroBtn = document.createElement("button");
    erroBtn.textContent = "💢 Forçar Erro";
    erroBtn.style.border = "2px solid #fff8dc";

    async function atualizarVisualCritico() {
        const meta = await OBR.scene.getMetadata();
        const ativo = meta["__forcarCritico__"] === true;
        criticoBtn.style.background = ativo ? "#66ff66" : "#c0a060";
        criticoBtn.style.color = ativo ? "#000" : "#3b2f0b";
    }

    async function atualizarVisualErro() {
        const meta = await OBR.scene.getMetadata();
        const ativo = meta["__forcarErro__"] === true;
        erroBtn.style.background = ativo ? "#ff6666" : "#c0a060";
        erroBtn.style.color = ativo ? "#000" : "#3b2f0b";
    }

    criticoBtn.addEventListener("click", async () => {
        const meta = await OBR.scene.getMetadata();
        const atual = meta["__forcarCritico__"] === true;

        await updateSecureMetadata("__forcarCritico__", !atual);
        await updateSecureMetadata("__forcarErro__", false);

        atualizarVisualCritico();
        atualizarVisualErro();
    });

    erroBtn.addEventListener("click", async () => {
        const meta = await OBR.scene.getMetadata();
        const atual = meta["__forcarErro__"] === true;

        await updateSecureMetadata("__forcarErro__", !atual);
        await updateSecureMetadata("__forcarCritico__", false);

        atualizarVisualErro();
        atualizarVisualCritico();
    });

    OBR.scene.onMetadataChange(() => {
        atualizarVisualCritico();
        atualizarVisualErro();
    });

    atualizarVisualCritico();
    atualizarVisualErro();

    const content = gmModal.querySelector(".gm-modal-content");
    content.appendChild(avisoBtn);
    content.appendChild(criticoBtn);
    content.appendChild(erroBtn);
    content.appendChild(limparBtn);
}
