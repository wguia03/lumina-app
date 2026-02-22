const express = require("express");
const { store } = require("../../data/store");

const router = express.Router();

router.get("/temas-populares", (req, res) => {
  const temasConScore = store.temas.map((t) => {
    const comentarios = store.comentarios.filter((c) => c.temaId === t.id).length;
    const reacciones = store.reacciones.filter(
      (r) => r.targetTipo === "tema" && r.targetId === t.id
    ).length;
    const autor = store.usuarios.find((u) => u.id === t.usuarioId);
    const curso = store.cursos.find((c) => c.id === t.cursoId);

    return {
      id: t.id,
      titulo: t.titulo,
      estado: t.estado,
      vistas: t.vistas,
      tags: t.tags,
      autor: autor ? { id: autor.id, nombre: autor.nombre } : null,
      curso: curso ? { id: curso.id, nombre: curso.nombre } : null,
      totalComentarios: comentarios,
      totalReacciones: reacciones,
      score: reacciones * 3 + comentarios * 2 + t.vistas
    };
  });

  temasConScore.sort((a, b) => b.score - a.score);
  return res.json(temasConScore.slice(0, 10));
});

router.get("/cursos-activos", (req, res) => {
  const cursosConActividad = store.cursos.map((c) => {
    const temas = store.temas.filter((t) => t.cursoId === c.id).length;
    const inscritos = store.inscripciones.filter((i) => i.cursoId === c.id).length;

    return {
      id: c.id,
      nombre: c.nombre,
      codigo: c.codigo,
      docente: c.docente,
      totalTemas: temas,
      totalInscritos: inscritos,
      score: temas * 2 + inscritos
    };
  });

  cursosConActividad.sort((a, b) => b.score - a.score);
  return res.json(cursosConActividad.slice(0, 10));
});

router.get("/usuarios-destacados", (req, res) => {
  const usuariosConScore = store.usuarios.map((u) => {
    const temasCreados = store.temas.filter((t) => t.usuarioId === u.id).length;
    const comentariosHechos = store.comentarios.filter((c) => c.usuarioId === u.id).length;
    const soluciones = store.comentarios.filter(
      (c) => c.usuarioId === u.id && c.esSolucion
    ).length;
    const seguidores = store.seguidores.filter((s) => s.seguidoId === u.id).length;
    const reaccionesRecibidas = store.reacciones.filter((r) => {
      if (r.targetTipo === "tema") {
        const tema = store.temas.find((t) => t.id === r.targetId);
        return tema && tema.usuarioId === u.id;
      }
      if (r.targetTipo === "comentario") {
        const com = store.comentarios.find((c) => c.id === r.targetId);
        return com && com.usuarioId === u.id;
      }
      return false;
    }).length;

    return {
      id: u.id,
      nombre: u.nombre,
      carrera: u.carrera,
      universidad: u.universidad,
      temasCreados,
      comentariosHechos,
      soluciones,
      seguidores,
      reaccionesRecibidas,
      score: soluciones * 5 + reaccionesRecibidas * 3 + temasCreados * 2 + comentariosHechos + seguidores * 2
    };
  });

  usuariosConScore.sort((a, b) => b.score - a.score);
  return res.json(usuariosConScore.slice(0, 10));
});

router.get("/para-ti/:usuarioId", (req, res) => {
  const usuarioId = Number(req.params.usuarioId);
  const usuario = store.usuarios.find((u) => u.id === usuarioId);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  const misCursos = store.inscripciones
    .filter((i) => i.usuarioId === usuarioId)
    .map((i) => i.cursoId);

  const temasRecomendados = store.temas
    .filter((t) => misCursos.includes(t.cursoId) && t.usuarioId !== usuarioId)
    .map((t) => {
      const comentarios = store.comentarios.filter((c) => c.temaId === t.id).length;
      const reacciones = store.reacciones.filter(
        (r) => r.targetTipo === "tema" && r.targetId === t.id
      ).length;
      const autor = store.usuarios.find((u) => u.id === t.usuarioId);
      const curso = store.cursos.find((c) => c.id === t.cursoId);

      return {
        id: t.id,
        titulo: t.titulo,
        estado: t.estado,
        tags: t.tags,
        autor: autor ? { id: autor.id, nombre: autor.nombre } : null,
        curso: curso ? { id: curso.id, nombre: curso.nombre } : null,
        totalComentarios: comentarios,
        totalReacciones: reacciones,
        score: reacciones * 3 + comentarios * 2 + t.vistas
      };
    });

  temasRecomendados.sort((a, b) => b.score - a.score);

  const seguidos = store.seguidores
    .filter((s) => s.seguidorId === usuarioId)
    .map((s) => s.seguidoId);
  const quienSeguir = store.usuarios
    .filter((u) => u.id !== usuarioId && !seguidos.includes(u.id))
    .map((u) => {
      const seguidores = store.seguidores.filter((s) => s.seguidoId === u.id).length;
      const temas = store.temas.filter((t) => t.usuarioId === u.id).length;
      return { id: u.id, nombre: u.nombre, carrera: u.carrera, seguidores, temas };
    })
    .sort((a, b) => b.seguidores + b.temas - (a.seguidores + a.temas))
    .slice(0, 5);

  return res.json({
    temasRecomendados: temasRecomendados.slice(0, 10),
    quienSeguir
  });
});

module.exports = router;
