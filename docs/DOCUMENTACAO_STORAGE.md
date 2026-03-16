# Armazenamento de Documentação AXIS

A documentação (manuais, firmware, passo a passo) é armazenada **dentro do servidor**, sem links externos. O sistema suporta grande volume de documentos (até 2TB+).

## Estrutura

- **Metadados:** `config/data/axis-documentacao.json` (título, categoria, etc.)
- **Arquivos:** pasta configurável (padrão: `docs-storage/` na raiz do projeto)

## Configuração para 2TB+

Para usar um disco ou NAS com 2TB ou mais:

1. **Variável de ambiente `DOCS_STORAGE_DIR`**

   No `.env` ou ao iniciar o servidor:
   ```
   DOCS_STORAGE_DIR=D:\axis-documentacao
   ```
   ou no Linux:
   ```
   DOCS_STORAGE_DIR=/mnt/2tb-storage/docs
   ```

2. **Criar a pasta e garantir permissões**
   - O usuário que executa o Node.js precisa de leitura/escrita na pasta
   - Exemplo Windows: `mkdir D:\axis-documentacao`
   - Exemplo Linux: `mkdir -p /mnt/2tb-storage/docs && chown node:node /mnt/2tb-storage/docs`

3. **Reiniciar o servidor** após alterar `DOCS_STORAGE_DIR`

## Formatos aceitos

- **Arquivo:** PDF, ZIP, TXT, DOC, DOCX, XLS, XLSX, binários (firmware)
- **Texto:** conteúdo em texto direto (passo a passo, instruções)

## API

- `GET /api/docs` – lista documentos
- `POST /api/docs` – adiciona documento (multipart/form-data para arquivo ou JSON para texto)
- `GET /api/docs/:id/file` – serve o arquivo
- `PUT /api/docs/:id` – atualiza metadados
- `DELETE /api/docs/:id` – remove documento e arquivo
