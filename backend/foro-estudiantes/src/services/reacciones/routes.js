const express = require("express");
const { store, nextId } = require("../../data/store");

const router = express.Router();

const TIPOS_VALIDOS = ["like", "love", "apoyo", "genial", "interesante"];

router.post("/", (req, res) => {
  const { tipo, targetTipo, targetId, usuarioId } = req.body;

  if (!tipo || !targetTipo || !targetId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "tipo, targetTipo, targetId y usuarioId son obligatorios" });
  }

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res
      .status(400)
      .json({ error: `tipo invalido. Permitidos: ${TIPOS_VALIDOS.join(", ")}` });
  }

  if (!["tema", "comentario"].includes(targetTipo)) {
    return res.status(400).json({ error: "targetTipo debe ser 'tema' o 'comentario'" });
  }

  const usuario = store.usuarios.find((u) => u.id === Number(usuarioId));
  if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

  if (targetTipo === "tema") {
    const tema = store.temas.find((t) => t.id === Number(targetId));
    if (!tema) return res.status(404).json({ error: "Tema no existe" });
  } else {
    const comentario = store.comentarios.find((c) => c.id === Number(targetId));
    if (!comentario) return res.status(404).json({ error: "Comentario no existe" });
  }

  const existente = store.reacciones.findIndex(
    (r) =>
      r.usuarioId === Number(usuarioId) &&
      r.targetTipo === targetTipo &&
      r.targetId === Number(targetId)
  );

  if (existente >= 0) {
    if (store.reacciones[existente].tipo === tipo) {
      store.reacciones.splice(existente, 1);
      return res.json({ message: "Reaccion eliminada", accion: "eliminada" });
    }

    store.reacciones[existente].tipo = tipo;
    return res.json({
      message: "Reaccion actualizada",
      accion: "actualizada",
      reaccion: store.reacciones[existente]
    });
  }

  const nueva = {
    id: nextId("reacciones"),
    tipo,
    targetTipo,
    targetId: Number(targetId),
    usuarioId: Number(usuarioId),
    createdAt: new Date().toISOString()
  };

  store.reacciones.push(nueva);
  return res.status(201).json({ message: "Reaccion agregada", accion: "creada", reaccion: nueva });
});

router.get("/:targetTipo/:targetId", (req, res) => {
  const { targetTipo, targetId } = req.params;

  const reacciones = store.reacciones.filter(
    (r) => r.targetTipo === targetTipo && r.targetId === Number(targetId)
  );

  const resumen = {};
  TIPOS_VALIDOS.forEach((t) => (resumen[t] = 0));
  reacciones.forEach((r) => {
    resumen[r.tipo] = (resumen[r.tipo] || 0) + 1;
  });

  const usuarios = reacciones.map((r) => {
    const u = store.usuarios.find((us) => us.id === r.usuarioId);
    return { usuarioId: r.usuarioId, nombre: u?.nombre, tipo: r.tipo };
  });

  return res.json({ total: reacciones.length, resumen, usuarios });
});

module.exports = router;
