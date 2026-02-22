const express = require("express");
const jwt = require("jsonwebtoken");
const { store } = require("../../data/store");
const microservicios = require("../../clients/microservicios");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-dev";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

router.use(authMiddleware);

const conversaciones = new Map();
let convId = 1;

router.post("/conversations", (req, res) => {
  const id = convId++;
  conversaciones.set(id, []);
  return res.status(201).json({ id });
});

router.get("/conversations/:id", (req, res) => {
  const id = Number(req.params.id);
  const messages = conversaciones.get(id) || [];
  return res.json({ id, messages });
});

router.post("/message", async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ message: "Mensaje requerido" });

  if (microservicios.isEnabled()) {
    const curso = context?.curso || "actual";
    const tema = context?.tema || "tu tema";
    const result = await microservicios.chatbot.message(message, curso, tema);
    if (result && result.reply) {
      return res.json({ message: result.reply });
    }
  }

  const reply = `Soy el asistente académico de Lumina. Recibí tu pregunta: "${message}". En una versión completa, aquí aparecería una respuesta generada por IA. Por ahora, te sugiero revisar los temas del foro y los comentarios de otros estudiantes.`;
  return res.json({ message: reply });
});

router.post("/summarize", (req, res) => {
  const { noteId } = req.body;
  return res.json({
    noteId: noteId || 0,
    title: "Resumen",
    summary: "Resumen generado por IA (modo demo). En producción se conectaría con OpenAI."
  });
});

router.post("/recommendations", async (req, res) => {
  const { type } = req.body || {};
  const { getTemas } = require("../../data/dataLayer");
  const temas = await getTemas();
  const titulos = temas.slice(0, 3).map((t) => t.titulo);
  return res.json({
    type: type || "general",
    recommendations: `Recomendaciones (modo demo): 1) Revisa los temas: ${titulos.join(", ") || "ninguno aún"}. 2) Participa en debates activos. 3) Marca soluciones que te ayuden.`
  });
});

module.exports = router;
