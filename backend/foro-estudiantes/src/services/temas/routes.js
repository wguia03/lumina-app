const express = require("express");
const { store, nextId } = require("../../data/store");

const router = express.Router();

router.get("/", (req, res) => {
  const { cursoId, usuarioId, estado, q } = req.query;

  let resultado = store.temas.map((t) => enriquecerTema(t));

  if (cursoId) resultado = resultado.filter((t) => t.cursoId === Number(cursoId));
  if (usuarioId) resultado = resultado.filter((t) => t.usuarioId === Number(usuarioId));
  if (estado) resultado = resultado.filter((t) => t.estado === estado);
  if (q) {
    const term = q.toLowerCase();
    resultado = resultado.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        t.contenido.toLowerCase().includes(term) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(term)))
    );
  }

  return res.json(resultado);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.temas.findIndex((t) => t.id === id);
  if (idx < 0) return res.status(404).json({ error: "Tema no encontrado" });

  store.temas[idx].vistas += 1;

  return res.json(enriquecerTema(store.temas[idx]));
});

router.post("/", (req, res) => {
  const { titulo, contenido, cursoId, usuarioId, tags } = req.body;
  if (!titulo || !contenido || !cursoId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "titulo, contenido, cursoId y usuarioId son obligatorios" });
  }

  const curso = store.cursos.find((c) => c.id === Number(cursoId));
  const usuario = store.usuarios.find((u) => u.id === Number(usuarioId));
  if (!curso) return res.status(404).json({ error: "Curso no existe" });
  if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

  const nuevo = {
    id: nextId("temas"),
    titulo,
    contenido,
    cursoId: Number(cursoId),
    usuarioId: Number(usuarioId),
    tags: Array.isArray(tags) ? tags : [],
    estado: "abierto",
    vistas: 0,
    createdAt: new Date().toISOString()
  };

  store.temas.push(nuevo);
  return res.status(201).json(enriquecerTema(nuevo));
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.temas.findIndex((t) => t.id === id);
  if (idx < 0) return res.status(404).json({ error: "Tema no encontrado" });

  const { titulo, contenido, tags, estado } = req.body;

  if (titulo) store.temas[idx].titulo = titulo;
  if (contenido) store.temas[idx].contenido = contenido;
  if (tags) store.temas[idx].tags = Array.isArray(tags) ? tags : [];
  if (estado && ["abierto", "resuelto"].includes(estado)) {
    store.temas[idx].estado = estado;
  }

  return res.json(enriquecerTema(store.temas[idx]));
});

router.patch("/:id/resolver", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.temas.findIndex((t) => t.id === id);
  if (idx < 0) return res.status(404).json({ error: "Tema no encontrado" });

  store.temas[idx].estado = "resuelto";
  return res.json(enriquecerTema(store.temas[idx]));
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.temas.findIndex((t) => t.id === id);
  if (idx < 0) return res.status(404).json({ error: "Tema no encontrado" });
  store.temas.splice(idx, 1);
  return res.status(204).send();
});

function enriquecerTema(tema) {
  const autor = store.usuarios.find((u) => u.id === tema.usuarioId);
  const curso = store.cursos.find((c) => c.id === tema.cursoId);
  const comentarios = store.comentarios.filter((c) => c.temaId === tema.id).length;
  const reacciones = store.reacciones.filter(
    (r) => r.targetTipo === "tema" && r.targetId === tema.id
  );

  const resumenReacciones = {};
  reacciones.forEach((r) => {
    resumenReacciones[r.tipo] = (resumenReacciones[r.tipo] || 0) + 1;
  });

  return {
    ...tema,
    autor: autor ? { id: autor.id, nombre: autor.nombre } : null,
    curso: curso ? { id: curso.id, nombre: curso.nombre, codigo: curso.codigo } : null,
    totalComentarios: comentarios,
    totalReacciones: reacciones.length,
    reacciones: resumenReacciones
  };
}

module.exports = router;
