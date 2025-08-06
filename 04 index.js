import OBR from "@owlbear-rodeo/sdk";
import { initChat } from "./01 chat.js";
import { initGM } from "./03 gmMenu.js";

OBR.onReady(async () => {
    const mensagensDiv = document.getElementById("mensagens");
    const entradaInput = document.getElementById("entrada");
    const enviarBtn = document.getElementById("enviar");
    const gmBtn = document.getElementById("gm-btn");
    const gmModal = document.getElementById("gm-modal");
    const gmClose = document.getElementById("gm-modal-close");

    // 💥 ADICIONADO await AQUI!
    await initChat({ mensagensDiv, entradaInput, enviarBtn });
    initGM({ gmBtn, gmModal, gmClose });
});
