# Como abrir o AXIS (porta 3006)

## Opção 1: Script automático (recomendado)
- **Windows:** dê duplo clique em `start.bat`  
  OU no terminal: `.\start.bat`  
  Isso inicia o servidor e abre o **Chrome** em http://localhost:3006.

## Opção 2: PowerShell
```powershell
cd "C:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor"
.\start.ps1
```

## Opção 3: Manual
1. Abra o terminal na pasta do projeto.
2. Rode: `node server.js`
3. Abra o **Chrome** (não o Browser do Cursor) e acesse: **http://localhost:3006**

## Login
Use as credenciais fornecidas pela equipe. Não há link de demonstração na tela de login.

---

## Erros comuns e o que fazer

### "Connection Failed" / ERR_CONNECTION_REFUSED no **Browser Tab** do Cursor
- O **Browser Tab** (aba "Browser Tab" dentro do Cursor) costuma falhar em localhost.
- **Solução:** use o **Chrome externo**. O `start.bat` já abre o Chrome; ou abra o Chrome manualmente e acesse http://localhost:3006.
- Não use o navegador integrado do Cursor para o AXIS.

### "chrome.exe - Erro de Aplicativo" (exceção 0x80000003)
- Pode acontecer quando o **Browser Tab** do Cursor tenta acessar localhost.
- **Solução:** feche o Browser Tab, clique em OK no pop-up de erro e use apenas o **Chrome** (janela separada). Não abra http://localhost:3006 no navegador do Cursor.

### Servidor está rodando?
- Acesse **http://localhost:3006/health** no Chrome. Se retornar `{"ok":true,"port":3006}`, o servidor está ok.
- Se der erro, inicie de novo: duplo clique em `start.bat` ou rode `node server.js` no terminal.

---

## API / Banco de dados (JSON)
- **GET** `/health` ou `/ping` – verifica se o servidor está no ar  
- **GET** `/data/axis-seed.json` – dados de demonstração  
- **GET** `/api/backup` – backup armazenado no servidor  
- **POST** `/api/backup` – envia JSON no body para salvar backup  

Os backups são gravados em `config/data/axis-backup.json`.

## Reiniciar o servidor
Se alterar `server.js` ou os arquivos em `config/data`, feche a janela onde o Node está rodando e execute `start.bat` de novo (ou `node server.js`).

## Atualizações (HTML, CSS, JS)
Sempre que mudar algo no projeto, **recarregar a página** (F5 ou Ctrl+R) já mostra as alterações. O servidor envia os arquivos sem cache agressivo. Não precisa reiniciar o servidor para ver mudanças em páginas, estilos ou scripts.
