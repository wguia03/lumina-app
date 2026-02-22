const express = require("express");
const { store, nextId } = require("../../data/store");

const router = express.Router();

router.get("/", (req, res) => res.json(store.usuarios));

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const usuario = store.usuarios.find((u) => u.id === id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  const seguidores = store.seguidores.filter((s) => s.seguidoId === id).length;
  const seguidos = store.seguidores.filter((s) => s.seguidorId === id).length;
  const temasCreados = store.temas.filter((t) => t.usuarioId === id).length;
  const comentariosHechos = store.comentarios.filter((c) => c.usuarioId === id).length;

  return res.json({
    ...usuario,
    stats: { seguidores, seguidos, temasCreados, comentariosHechos }
  });
});

router.post("/", (req, res) => {
  const { nombre, email, carrera, universidad, bio } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: "nombre y email son obligatorios" });
  }

  const duplicado = store.usuarios.some((u) => u.email === email);
  if (duplicado) return res.status(409).json({ error: "email ya existe" });

  const nuevo = {
    id: nextId("usuarios"),
    nombre,
    email,
    carrera: carrera || null,
    universidad: universidad || null,
    bio: bio || null,
    createdAt: new Date().toISOString()
  };

  store.usuarios.push(nuevo);
  return res.status(201).json(nuevo);
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.usuarios.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: "Usuario no encontrado" });

  const { nombre, email, carrera, universidad, bio } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: "nombre y email son obligatorios" });
  }

  store.usuarios[idx] = {
    ...store.usuarios[idx],
    nombre,
    email,
    carrera: carrera || store.usuarios[idx].carrera,
    universidad: universidad || store.usuarios[idx].universidad,
    bio: bio !== undefined ? bio : store.usuarios[idx].bio
  };

  return res.json(store.usuarios[idx]);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = store.usuarios.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: "Usuario no encontrado" });
  store.usuarios.splice(idx, 1);
  return res.status(204).send();
});

// --- SEGUIR / DEJAR DE SEGUIR ---

router.post("/:id/seguir", (req, res) => {
  const seguidoId = Number(req.params.id);
  const { seguidorId } = req.body;
  if (!seguidorId) return res.status(400).json({ error: "seguidorId es obligatorio" });
  if (Number(seguidorId) === seguidoId) {
    return res.status(400).json({ error: "No puedes seguirte a ti mismo" });
  }

  const seguido = store.usuarios.find((u) => u.id === seguidoId);
  const seguidor = store.usuarios.find((u) => u.id === Number(seguidorId));
  if (!seguido || !seguidor) return res.status(404).json({ error: "Usuario no existe" });

  const yaExiste = store.seguidores.some(
    (s) => s.seguidorId === Number(seguidorId) && s.seguidoId === seguidoId
  );
  if (yaExiste) return res.status(409).json({ error: "Ya sigues a este usuario" });

  store.seguidores.push({
    seguidorId: Number(seguidorId),
    seguidoId,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ message: `Ahora sigues a ${seguido.nombre}` });
});

router.delete("/:id/seguir", (req, res) => {
  const seguidoId = Number(req.params.id);
  const { seguidorId } = req.body;
  if (!seguidorId) return res.status(400).json({ error: "seguidorId es obligatorio" });

  const idx = store.seguidores.findIndex(
    (s) => s.seguidorId === Number(seguidorId) && s.seguidoId === seguidoId
  );
  if (idx < 0) return res.status(404).json({ error: "No sigues a este usuario" });

  store.seguidores.splice(idx, 1);
  return res.json({ message: "Dejaste de seguir" });
});

router.get("/:id/seguidores", (req, res) => {
  const id = Number(req.params.id);
  const ids = store.seguidores.filter((s) => s.seguidoId === id).map((s) => s.seguidorId);
  const usuarios = store.usuarios.filter((u) => ids.includes(u.id));
  return res.json(usuarios);
});

router.get("/:id/seguidos", (req, res) => {
  const id = Number(req.params.id);
  const ids = store.seguidores.filter((s) => s.seguidorId === id).map((s) => s.seguidoId);
  const usuarios = store.usuarios.filter((u) => ids.includes(u.id));
  return res.json(usuarios);
});

module.exports = router;
