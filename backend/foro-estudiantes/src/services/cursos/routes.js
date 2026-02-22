const express = require("express");
const { store, nextId } = require("../../data/store");

const router = express.Router();

router.get("/", (req, res) => res.json(store.cursos));

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const curso = store.cursos.find((c) => c.id === id);
  if (!curso) return res.status(404).json({ error: "Curso no encontrado" });

  const inscritos = store.inscripciones.filter((i) => i.cursoId === id).length;
  const temas = store.temas.filter((t) => t.cursoId === id).length;

  return res.json({ ...curso, stats: { inscritos, temas } });
});

router.post("/", (req, res) => {
  const { nombre, codigo, descripcion, docente } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }

  const duplicado = store.cursos.some((c) => c.codigo === codigo);
  if (duplicado) return res.status(409).json({ error: "codigo ya existe" });

  const nuevo = {
    id: nextId("cursos"),
    nombre,
    codigo,
    descripcion: descripcion || null,
    docente: docente || null,
    createdAt: new Date().toISOString()
  };

  store.cursos.push(nuevo);
  return res.status(201).json(nuevo);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.cursos.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Curso no encontrado" });

  const { nombre, codigo, descripcion, docente } = req.body;
  if (!nombre || !codigo) {
    return res.status(400).json({ error: "nombre y codigo son obligatorios" });
  }

  store.cursos[idx] = {
    ...store.cursos[idx],
    nombre,
    codigo,
    descripcion: descripcion || store.cursos[idx].descripcion,
    docente: docente || store.cursos[idx].docente
  };

  return res.json(store.cursos[idx]);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.cursos.findIndex((c) => c.id === id);
  if (idx < 0) return res.status(404).json({ error: "Curso no encontrado" });
  store.cursos.splice(idx, 1);
  return res.status(204).send();
});

// --- INSCRIPCIONES ---

router.post("/:id/inscribir", (req, res) => {
  const cursoId = Number(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId es obligatorio" });

  const curso = store.cursos.find((c) => c.id === cursoId);
  const usuario = store.usuarios.find((u) => u.id === Number(usuarioId));
  if (!curso) return res.status(404).json({ error: "Curso no existe" });
  if (!usuario) return res.status(404).json({ error: "Usuario no existe" });

  const yaInscrito = store.inscripciones.some(
    (i) => i.cursoId === cursoId && i.usuarioId === Number(usuarioId)
  );
  if (yaInscrito) return res.status(409).json({ error: "Ya inscrito en este curso" });

  store.inscripciones.push({
    cursoId,
    usuarioId: Number(usuarioId),
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ message: `Inscrito en ${curso.nombre}` });
});

router.delete("/:id/inscribir", (req, res) => {
  const cursoId = Number(req.params.id);
  const { usuarioId } = req.body;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId es obligatorio" });

  const idx = store.inscripciones.findIndex(
    (i) => i.cursoId === cursoId && i.usuarioId === Number(usuarioId)
  );
  if (idx < 0) return res.status(404).json({ error: "No inscrito en este curso" });

  store.inscripciones.splice(idx, 1);
  return res.json({ message: "Desinscrito del curso" });
});

router.get("/:id/inscritos", (req, res) => {
  const cursoId = Number(req.params.id);
  const ids = store.inscripciones
    .filter((i) => i.cursoId === cursoId)
    .map((i) => i.usuarioId);
  const usuarios = store.usuarios.filter((u) => ids.includes(u.id));
  return res.json(usuarios);
});

module.exports = router;
