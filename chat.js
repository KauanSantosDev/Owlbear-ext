import OBR from "@owlbear-rodeo/sdk";
import { CHAT_KEY, loadChat, saveChat } from "./storage.js";
import { tryRoll } from "./dice.js";

export async function initChat({ mensagensDiv, entradaInput, enviarBtn }) {
    let chat = await loadChat();
    renderAll(chat);

    OBR.scene.onMetadataChange(meta => {
        const novo = meta[CHAT_KEY];
        if (!Array.isArray(novo)) return;
        const oldLen = chat.length;
        chat = novo;
        if (chat.length > oldLen) {
            for (const msg of chat.slice(oldLen)) append(msg, true);
        } else if (chat.length < oldLen) {
            animateClear(() => renderAll(chat));
        }
    });

    enviarBtn.addEventListener("click", onSend);
    entradaInput.addEventListener("keydown", e => {
        if (e.key === "Enter") onSend();
    });

    function glow(text, color) {
        const styles = {
            gold: { fg: "#ffd966", sh1: "rgba(255,255,224,0.4)", sh2: "rgba(255,215,0,0.4)", anim: false },
            green: { fg: "#66ff66", sh1: "rgba(0,255,0,0.8)", sh2: "rgba(0,255,0,0.6)", anim: true, key: "pulseGreen" },
            red: { fg: "#ff6666", sh1: "rgba(255,0,0,0.8)", sh2: "rgba(255,0,0,0.6)", anim: true, key: "pulseRedLow" },
            blue: { fg: "#66ccff", sh1: "rgba(0,200,255,0.8)", sh2: "rgba(0,200,255,0.6)", anim: true, key: "pulseBlue" }
        };
        const cfg = styles[color] || styles.gold;
        const anim = cfg.anim ? `animation: ${cfg.key} 1s ease-in-out infinite both;` : "";
        return `<span style="
            font-weight: bold;
            color: ${cfg.fg};
            text-shadow: 0 0 2px ${cfg.sh1}, 0 0 4px ${cfg.sh2};
            ${anim}
        ">${text}</span>`;
    }

    function sanitize(input) {
        const div = document.createElement("div");
        div.textContent = input;
        return div.innerHTML;
    }

    async function onSend() {
        const raw = entradaInput.value.trim();
        if (!raw) return;
        entradaInput.value = "";

        const norm = raw.replace(/\s*([+-])\s*(\d+)/g, "$1$2");

        // Validar limites
        for (const tok of norm.split(/\s+/)) {
            const mh = tok.match(/^(\d+)#d(\d+)/i);
            if (mh) {
                const c = +mh[1], f = +mh[2];
                if (c > 100) { appendLocal("❌ Máximo 100 conjuntos."); return; }
                if (f > 100) { appendLocal("❌ Máximo 100 faces."); return; }
            }
            const m = tok.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
            if (m) {
                const q = +m[1] || 1, f = +m[2];
                if (q > 100) { appendLocal("❌ Máximo 100 dados."); return; }
                if (f > 100) { appendLocal("❌ Máximo 100 faces."); return; }
            }
        }

        const roll = await tryRoll(norm);
        if (roll) {
            const hasHigh = roll.details.some(d => d.rolls.includes(d.faces));
            const hasLow = roll.details.some(d => d.rolls.includes(1));
            const color = hasHigh && hasLow ? "blue"
                : hasHigh ? "green"
                    : hasLow ? "red"
                        : "gold";

            const lines = roll.details.map(d => {
                const nota = glow(d.notation, color);
                const rolls = glow(`[${d.rolls.join(",")}]`, color);
                const bonus = d.bonus !== 0
                    ? glow(d.bonus > 0 ? `+${d.bonus}` : `${d.bonus}`, color)
                    : "";
                const indiv = d.rolls.length === 1
                    ? ` ⇒ ${glow(d.rolls[0] + d.bonus, color)}`
                    : "";
                return `> ${nota} → ${rolls}${bonus}${indiv}`;
            });

            if (!/#d/i.test(norm)) {
                lines.push(`> ${glow("★ Total final: " + roll.total, color)}`);
            }

            return send(lines.join("<br>"), { high: hasHigh, low: hasLow });
        }

        const role = await OBR.player.getRole();
        if (raw.toLowerCase() === "/clear" && role === "GM") {
            await saveChat([]);
            animateClear(() => renderAll([]));
            return;
        }

        send(sanitize(raw), { high: false, low: false });
    }

    async function send(text, { high, low }) {
        const role = await OBR.player.getRole();
        const name = await OBR.player.getName();
        const msg = { nome: name, role, texto: text, critical: high ? "high" : low ? "low" : null };
        chat.push(msg);
        append(msg, true);
        await saveChat(chat);
    }

    function renderAll(arr) {
        mensagensDiv.innerHTML = "";
        for (const msg of arr) append(msg, false);
        mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    }

    function append(msg, animate) {
        const el = document.createElement("div");
        el.className = "mensagem";
        if (msg.critical === "high") el.classList.add("critical-high");
        if (msg.critical === "low") el.classList.add("critical-low");

        const isMulti = msg.texto.includes("<br>");
        el.innerHTML = `
            ${msg.nome ? `
            <strong style="color:${msg.role === "GM" ? "#e74c3c" : "#f1c40f"}">
            ${msg.nome}:
            </strong> ${isMulti ? "<br>" : " "}
            ` : ""}
         ${msg.texto}
        `;

        mensagensDiv.appendChild(el);

        if (animate) {
            void el.offsetWidth;
            el.classList.add("slide-in");
            el.addEventListener("animationend", ev => {
                if (ev.animationName === "slideInLeft") {
                    el.classList.remove("slide-in");
                }
            });
        }
        mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    }

    function appendLocal(text) {
        const el = document.createElement("div");
        el.className = "mensagem system";
        el.textContent = text;
        mensagensDiv.appendChild(el);
        mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
    }

    function animateClear(onDone) {
        const els = Array.from(mensagensDiv.children);
        els.forEach((el, i) => {
            el.classList.remove("critical-high", "critical-low", "system");
            setTimeout(() => el.classList.add("wipe-out"), i * 80);
        });
        setTimeout(() => {
            mensagensDiv.innerHTML = "";
            onDone();
        }, els.length * 80 + 400);
    }
}
