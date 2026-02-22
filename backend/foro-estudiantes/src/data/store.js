const store = {
  usuarios: [],
  cursos: [],
  inscripciones: [],
  temas: [],
  comentarios: [],
  reacciones: [],
  seguidores: [],
  recursos: []
};

const counters = {
  usuarios: 1,
  cursos: 1,
  temas: 1,
  comentarios: 1,
  reacciones: 1,
  recursos: 1
};

function nextId(collection) {
  const id = counters[collection] ?? 1;
  counters[collection] = id + 1;
  return id;
}

function ensureDefaultCourse() {
  if (store.cursos.length === 0) {
    store.cursos.push({
      id: 1,
      nombre: "General",
      codigo: "GEN001",
      descripcion: "Curso general para publicaciones",
      docente: null,
      createdAt: new Date().toISOString()
    });
    counters.cursos = 2;
  }
}

module.exports = { store, nextId, ensureDefaultCourse };
