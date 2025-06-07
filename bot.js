const { Telegraf, Markup } = require('telegraf');
const { generarTiendaHTML, publicarEnGitHub, obtenerEstudioMercado } = require('./generador');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('🧠 Bienvenido a tu Cerebro IA para tienda virtual. Selecciona una opción:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📊 Estudio de Mercado', 'estudio')],
      [Markup.button.callback('🛍️ Crear tienda automática', 'crear')],
      [Markup.button.callback('📤 Publicar tienda en GitHub Pages', 'publicar')]
    ])
  );
});

bot.action('estudio', async (ctx) => {
  ctx.reply('📊 Consultando estudio de mercado...');
  const respuesta = await obtenerEstudioMercado();
  ctx.reply(respuesta || '❌ Error obteniendo el análisis.');
});

bot.action('crear', async (ctx) => {
  ctx.reply('🎨 Generando tienda...');
  const zipPath = await generarTiendaHTML();
  if (zipPath) {
    await ctx.replyWithDocument({ source: zipPath, filename: "tienda.zip" });
  } else {
    ctx.reply('❌ Error generando la tienda.');
  }
});

bot.action('publicar', async (ctx) => {
  ctx.reply('🚀 Publicando tienda en GitHub Pages...');
  const url = await publicarEnGitHub();
  if (url) {
    ctx.reply(`✅ Tienda publicada: ${url}`);
  } else {
    ctx.reply('❌ Error al publicar en GitHub.');
  }
});

module.exports = bot;