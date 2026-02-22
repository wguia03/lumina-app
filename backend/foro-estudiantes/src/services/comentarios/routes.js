const express = require("express");
const { store, nextId } = require("../../data/store");

const router = express.Router();

router.get("/", (req, res) => {
  const { temaId } = req.query;
  let resultado = store.comentarios;

  if (temaId) resultado = resultado.filter((c) => c.temaId === Number(temaId));

  const enriquecidos = resultado.map((c) => enriquecerComentario(c));
  return res.json(enriquecidos);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const comentario = store.comentarios.find((c) => c.id === id);
  if (!comentario) return res.status(404).json({ error: "Comentario no encontrado" });
  return res.json(enriquecerComentario(comentario));
});

router.post("/", (req, res) => {
  const { contenido, temaId, usuarioId, parentId } = req.body;
  if (!contenido || !temaId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "contenido, temaId y usuarioId son obligatorios" });
  }

  const tema = store.temas.find((t) => t.id === Number(temaId));
  const usuario = store.usuarios.find((u) => u.id === Number(usuarioId));
  if (!tema) return res.status(404).json({ error: "Tema no existe" });
  if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

  if (parentId) {
    const padre = store.comentarios.find((c) => c.id === Number(parentId));
    if (!padre) return res.status(404).json({ error: "Comentario padre no existe" });
  }

  const nuevo = {
    id: nextId("comentarios"),
    contenido,
    temaId: Number(temaId),
    usuarioId: Number(usuarioId),
    parentId: parentId ? Number(parentId) : null,
    esSolucion: false,
    createdAt: new Date().toISOString()
  };

  store.comentarios.push(nuevo);
  return res.status(201).json(enriquecerComentario(nuevo));
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.comentarios.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Comentario no encontrado" });

  const { contenido } = req.body;
  if (!contenido) return res.status(400).json({ error: "contenido es obligatorio" });

  store.comentarios[idx].contenido = contenido;
  return res.json(enriquecerComentario(store.comentarios[idx]));
});

router.patch("/:id/solucion", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.comentarios.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Comentario no encontrado" });

  const temaId = store.comentarios[idx].temaId;
  store.comentarios.forEach((c) => {
    if (c.temaId === temaId) c.esSolucion = false;
  });

  store.comentarios[idx].esSolucion = true;

  const temaIdx = store.temas.findIndex((t) => t.id === temaId);
  if (temaIdx >= 0) store.temas[temaIdx].estado = "resuelto";

  return res.json({
    message: "Comentario marcado como solucion",
    comentario: enriquecerComentario(store.comentarios[idx])
  });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.comentarios.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Comentario no encontrado" });
  store.comentarios.splice(idx, 1);
  return res.status(204).send();
});

function enriquecerComentario(comentario) {
  const autor = store.usuarios.find((u) => u.id === comentario.usuarioId);
  const respuestas = store.comentarios.filter(
    (c) => c.parentId === comentario.id
  ).length;
  const reacciones = store.reacciones.filter(
    (r) => r.targetTipo === "comentario" && r.targetId === comentario.id
  );

  const resumenReacciones = {};
  reacciones.forEach((r) => {
    resumenReacciones[r.tipo] = (resumenReacciones[r.tipo] || 0) + 1;
  });

  return {
    ...comentario,
    autor: autor ? { id: autor.id, nombre: autor.nombre } : null,
    totalRespuestas: respuestas,
    totalReacciones: reacciones.length,
    reacciones: resumenReacciones
  };
}

module.exports = router;
