# Backend – Projeto Vida / AXIS

Módulos do servidor Node.js.

| Arquivo   | Função |
|-----------|--------|
| `config.js` | Porta (env), pastas, MIME, headers |
| `data.js`   | Leitura/escrita de JSON |
| `routes.js` | Rotas da API (backup, config, health, axis-seed) |
| `static.js` | Servir arquivos estáticos + fallback para `pages/` |

A entrada do servidor é `server.js` na raiz do projeto.
