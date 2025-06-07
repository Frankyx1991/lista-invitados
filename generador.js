const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fallbackIA(prompt) {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    return res.choices[0].message.content;
  } catch {
    try {
      const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] });
      return res.data.candidates[0].content.parts[0].text;
    } catch {
      const res = await axios.post("https://api.deepseek.com/v1/chat/completions", {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
      }, {
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }
      });
      return res.data.choices[0].message.content;
    }
  }
}

async function obtenerEstudioMercado() {
  const prompt = "Dame un análisis de estudio de mercado con un producto rentable, nicho, nombre de tienda, colores y estilo visual sugerido.";
  return await fallbackIA(prompt);
}

async function generarTiendaHTML() {
  const prompt = "Genera un sitio HTML de tienda simple con estilo moderno y 2 productos.";
  const respuesta = await fallbackIA(prompt);
  if (!respuesta) return null;

  const dir = "/tmp/tienda-ia";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "index.html"), `<html><head><title>Tienda IA</title><link rel="stylesheet" href="style.css"></head><body><h1>Tienda IA</h1><p>${respuesta}</p></body></html>`);
  fs.writeFileSync(path.join(dir, "style.css"), `body { font-family: sans-serif; background: #f4f4f4; } h1 { color: #4CAF50; }`);

  const zipPath = "/mnt/data/tienda.zip";
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    archive.pipe(output);
    archive.directory(dir, false);
    archive.finalize();
    output.on("close", () => resolve(zipPath));
    archive.on("error", err => reject(err));
  });
}

async function publicarEnGitHub() {
  const repo = "tienda-ia";
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${username}/${repo}/contents/index.html`;
  const content = fs.readFileSync("/tmp/tienda-ia/index.html", "utf8");
  const encoded = Buffer.from(content).toString("base64");

  try {
    await axios.put(url, {
      message: "Actualizar tienda",
      content: encoded
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return `https://${username}.github.io/${repo}/`;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return null;
  }
}

module.exports = { generarTiendaHTML, publicarEnGitHub, obtenerEstudioMercado };