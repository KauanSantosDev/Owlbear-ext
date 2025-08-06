import OBR from "@owlbear-rodeo/sdk";

export async function tryRoll(text) {
    const normalized = text.replace(/\s*([+-])\s*(\d+)/g, "$1$2");
    const parts = normalized.trim().split(/\s+/);
    let total = 0;
    const details = [];

    // 🔄 Lê flags da cena
    const meta = await OBR.scene.getMetadata();
    const forcarCriticoAtivado = meta["__forcarCritico__"] === true;
    const forcarErroAtivado = meta["__forcarErro__"] === true;
    let modAplicado = false;

    // Aplica forçar crítico ou erro a 1 dado aleatório
    function sortearMod(grupos, tipo) {
        if (modAplicado || grupos.length === 0) return;

        const todos = grupos.flatMap((g, i) => g.rolls.map((_, j) => ({ grupo: i, index: j })));
        if (todos.length === 0) return;

        const alvo = todos[Math.floor(Math.random() * todos.length)];
        const grupo = grupos[alvo.grupo];

        grupo.rolls[alvo.index] = tipo === "critico" ? "__CRITICO__" : "__ERRO__";
        modAplicado = true;
    }

    const grupos = [];

    for (const part of parts) {
        // --- N#dM±B (separadas)
        const mHash = part.match(/^(\d+)#d(\d+)([+-]\d+)?$/i);
        if (mHash) {
            const count = Math.min(parseInt(mHash[1], 10), 100);
            const faces = Math.min(parseInt(mHash[2], 10), 100);
            const bonus = mHash[3] ? parseInt(mHash[3], 10) : 0;

            for (let i = 0; i < count; i++) {
                const roll = 1 + Math.floor(Math.random() * faces);
                grupos.push({ notation: `1d${faces}`, rolls: [roll], bonus, faces });
            }

            continue;
        }

        // --- NdM±B (somadas)
        const m = part.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
        if (m) {
            const qty = Math.min(parseInt(m[1] || "1", 10), 100);
            const faces = Math.min(parseInt(m[2], 10), 100);
            const bonus = m[3] ? parseInt(m[3], 10) : 0;

            const rolls = [];
            for (let i = 0; i < qty; i++) {
                rolls.push(1 + Math.floor(Math.random() * faces));
            }

            grupos.push({
                notation: `${qty}d${faces}${bonus ? (bonus > 0 ? "+" : "") + bonus : ""}`,
                rolls,
                bonus,
                faces
            });

            continue;
        }

        // --- bônus puro
        const mb = part.match(/^([+-]\d+)$/);
        if (mb) {
            const bonus = parseInt(mb[1], 10);
            grupos.push({ notation: `${bonus > 0 ? "+" : ""}${bonus}`, rolls: [], bonus, faces: 0 });
        }
    }

    // Aplica modificação se alguma das flags estiver ativa
    if (forcarCriticoAtivado) sortearMod(grupos, "critico");
    else if (forcarErroAtivado) sortearMod(grupos, "erro");

    for (const g of grupos) {
        const valores = g.rolls.map(r =>
            r === "__CRITICO__" ? g.faces :
                r === "__ERRO__" ? 1 : r
        );

        const soma = valores.reduce((a, b) => a + b, 0) + g.bonus;
        total += soma;

        details.push({
            notation: g.notation,
            rolls: valores,
            bonus: g.bonus,
            faces: g.faces
        });
    }

    // 🔁 Desativa flag após uso
    if (modAplicado) {
        await OBR.scene.setMetadata({
            "__forcarCritico__": false,
            "__forcarErro__": false
        });
    }

    return details.length ? { total, details } : null;
}
