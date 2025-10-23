// ######
// Importação de pacotes de dependências
// ######
import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

// ######
// Configuração inicial do servidor
// ######
const app = express();
const port = 3000;
dotenv.config();

const { Pool } = pkg;
let pool = null;

// ######
// Funções auxiliares
// ######
function conectarBD() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.URL_BD,
    });
  }
  return pool;
}

// ######
// Middlewares
// ######
app.use(express.json()); // Permite interpretar JSON no corpo das requisições

// ######
// Rotas (endpoints)
// ######

// --- Rota raiz ---
app.get("/", async (req, res) => {
  console.log("Rota GET / solicitada");

  const db = conectarBD();
  let dbStatus = "ok";

  try {
    await db.query("SELECT 1");
  } catch (e) {
    dbStatus = e.message;
  }

  res.json({
    mensagem: "API para Questões e Usuários",
    autor: "Arthur Porto",
    dbStatus: dbStatus,
  });
});


// ======================================================================
// ROTAS DE QUESTÕES
// ======================================================================

app.get("/questoes", async (req, res) => {
  console.log("Rota GET /questoes solicitada");
  const db = conectarBD();

  try {
    const resultado = await db.query("SELECT * FROM questoes");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar questões:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.get("/questoes/:id", async (req, res) => {
  console.log("Rota GET /questoes/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" });
    }

    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.post("/questoes", async (req, res) => {
  console.log("Rota POST /questoes solicitada");

  try {
    const data = req.body;

    if (!data.enunciado || !data.disciplina || !data.tema || !data.nivel) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem:
          "Todos os campos (enunciado, disciplina, tema, nivel) são obrigatórios.",
      });
    }

    const db = conectarBD();
    await db.query(
      "INSERT INTO questoes (enunciado, disciplina, tema, nivel) VALUES ($1, $2, $3, $4)",
      [data.enunciado, data.disciplina, data.tema, data.nivel]
    );

    res.status(201).json({ mensagem: "Questão criada com sucesso!" });
  } catch (e) {
    console.error("Erro ao inserir questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.put("/questoes/:id", async (req, res) => {
  console.log("Rota PUT /questoes solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" });
    }

    const atual = resultado.rows[0];
    const data = req.body;

    const enunciado = data.enunciado || atual.enunciado;
    const disciplina = data.disciplina || atual.disciplina;
    const tema = data.tema || atual.tema;
    const nivel = data.nivel || atual.nivel;

    await db.query(
      "UPDATE questoes SET enunciado = $1, disciplina = $2, tema = $3, nivel = $4 WHERE id = $5",
      [enunciado, disciplina, tema, nivel, id]
    );

    res.status(200).json({ mensagem: "Questão atualizada com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.delete("/questoes/:id", async (req, res) => {
  console.log("Rota DELETE /questoes/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" });
    }

    await db.query("DELETE FROM questoes WHERE id = $1", [id]);
    res.status(200).json({ mensagem: "Questão excluída com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir questão:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});


// ======================================================================
// ROTAS DE USUÁRIOS (ajustadas para campos: nome, idade, curso)
// ======================================================================

// --- [GET] /usuarios ---
app.get("/usuarios", async (req, res) => {
  console.log("Rota GET /usuarios solicitada");

  const db = conectarBD();
  try {
    const resultado = await db.query("SELECT * FROM usuarios");
    res.json(resultado.rows);
  } catch (e) {
    console.error("Erro ao buscar usuários:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// --- [GET] /usuarios/:id ---
app.get("/usuarios/:id", async (req, res) => {
  console.log("Rota GET /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(resultado.rows[0]);
  } catch (e) {
    console.error("Erro ao buscar usuário:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// --- [POST] /usuarios ---
app.post("/usuarios", async (req, res) => {
  console.log("Rota POST /usuarios solicitada");

  try {
    const data = req.body;

    // Validação simples
    if (!data.nome || !data.idade || !data.curso) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Os campos (nome, idade, curso) são obrigatórios.",
      });
    }

    const db = conectarBD();
    await db.query(
      "INSERT INTO usuarios (nome, idade, curso) VALUES ($1, $2, $3)",
      [data.nome, data.idade, data.curso]
    );

    res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
  } catch (e) {
    console.error("Erro ao inserir usuário:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// --- [PUT] /usuarios/:id ---
app.put("/usuarios/:id", async (req, res) => {
  console.log("Rota PUT /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    const atual = resultado.rows[0];
    const data = req.body;

    // Mantém valores antigos se o novo não for informado
    const nome = data.nome || atual.nome;
    const idade = data.idade || atual.idade;
    const curso = data.curso || atual.curso;

    await db.query(
      "UPDATE usuarios SET nome = $1, idade = $2, curso = $3 WHERE id = $4",
      [nome, idade, curso, id]
    );

    res.status(200).json({ mensagem: "Usuário atualizado com sucesso!" });
  } catch (e) {
    console.error("Erro ao atualizar usuário:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// --- [DELETE] /usuarios/:id ---
app.delete("/usuarios/:id", async (req, res) => {
  console.log("Rota DELETE /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    const db = conectarBD();
    const resultado = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    await db.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.status(200).json({ mensagem: "Usuário excluído com sucesso!" });
  } catch (e) {
    console.error("Erro ao excluir usuário:", e);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});


// ######
// Inicialização do servidor
// ######
app.listen(port, () => {
  console.log(`Serviço rodando na porta: ${port}`);
});
