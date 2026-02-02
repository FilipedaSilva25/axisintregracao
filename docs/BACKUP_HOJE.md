# Backup – Fim do dia (Projeto Vida / AXIS)

**Já feito hoje:** backup em `backups/Projeto-Vida-BACKUP-*`, commit + tag `backup-fim-do-dia`.  
Para nova cópia, use o script abaixo.

---

## Como salvar tudo e não perder nada

### 1. Script de backup (recomendado)

Execute **uma** das opções:

- **PowerShell (pasta do projeto):**
  ```powershell
  .\scripts\backup-hoje.ps1
  ```
- **Ou use o atalho:**
  ```text
  .\backup-agora.bat
  ```

O script:

- Cria a pasta `backups\Projeto-Vida-BACKUP-AAAA-MM-DD_HH-mm` no projeto.
- Faz uma **cópia extra** em `Downloads\Projeto-Vida-BACKUP-AAAA-MM-DD_HH-mm`.

Ou seja: você tem backup **dentro do projeto** e **em Downloads**. Exclui `node_modules`, `.git`, `backups` e `.cursor`.

---

### 2. Git (ponto de restauração)

Se o projeto usa Git, faça um commit e uma tag para marcar “fim do dia de hoje”:

```bash
git add .
git commit -m "Backup fim do dia - blindagem completa"
git tag backup-fim-do-dia
```

Para voltar a este ponto no futuro:

```bash
git checkout backup-fim-do-dia
# ou
git checkout -b recuperar-fim-do-dia backup-fim-do-dia
```

---

### 3. O que foi feito hoje (resumo)

- **Inventário – Setores**
  - Lista completa de setores no filtro e no cadastro (INTERNAL SYSTEMS, LIDERANÇA, MHW, P2M, CHECK-IN, RECIVING, MZ1–MZ3, INVENTÁRIO, CX, RETURNS, PACKING MONO/PTW, SAURON, INSUMOS, DOCAS DE EXPEDIÇÃO, LINHA DE PEIXE 1/2, SORTER, RK, NT RK, QUALIDADE, AQUÁRIO OUTBOUND, ADM, GATE, AMBULATÓRIO INTERNO/EXTERNO, SALA DE EPI, ER, RR, DEPÓSITO DE TREINAMENTO, HV).
- **Inventário – Modelo ZQ630 PLUS**
  - "ZQ630" alterado para "ZQ630 PLUS" em todo o projeto.
- **Inventário – Seletores customizados**
  - Filtro Modelo e Setor: trigger + lista rolável com destaque azul; apenas um dropdown aberto por vez. Setor no cadastro: mesmo componente.
- **Blindagem**
  - `docs/BLINDAGEM_INVENTARIO_FILTROS.md` criado para não perder alterações.
- **Cadastro de impressora**
  - Avisos removidos (ex.: “Selecione um modelo”).
  - Ao clicar no modelo (ZT411 / ZD421 / ZQ630 PLUS), o prefixo do serial (99J / D6J / XXV) já aparece no campo.
  - Botão X modernizado e funcional; Próximo avança corretamente.
- **IP**
  - Prefixo fixo `10.201.`; máscara com pontos; sufixo até 7 caracteres (ex.: `131.25`).
- **SELB**
  - 4 caracteres fixos, alfanuméricos (ex.: `6O25`).
- **Rondas**
  - Erros no F12 corrigidos; funções (Criar Ronda, Pendentes, Histórico, etc.) acessíveis.
  - Módulo completo (ronda.html) com CSS/JS; botão “Voltar para Rondas” sem sair do site.
  - Cores alinhadas ao site; Responsável = usuário logado; Turnos T1–T5.
  - Card “Módulo Completo” removido (redundante com “Nova Ronda”).
  - Avisos ao acessar Pendentes / Histórico removidos.
- **Notas fiscais**
  - Filtros de período e tipo funcionando; menu Exportar na frente dos cards; selects “Este Mês” / “Financeiro” em azul.
  - Relatório gerado ao abrir e ao alterar dados; exportar em PDF, Excel, Google Doc, Planilhas, TXT.

---

### 4. Como restaurar a partir de um backup

1. Abra a pasta do backup (em `backups\` ou em `Downloads\`).
2. Copie **todo o conteúdo** dessa pasta.
3. Cole **por cima** da pasta do projeto atual (substituindo quando pedir).
4. Na pasta do projeto: `npm install` e depois `npm start` (ou `.\start.bat`).

Se quiser manter o projeto atual intacto, copie a pasta do backup para outro lugar e use essa nova pasta como projeto.

---

### 5. Rodar o projeto

```bash
npm start
# ou
.\start.bat
```

Servidor em `http://localhost:3006`.

---

**Última atualização:** 2026-01-29 – backup fim do dia; blindagem inventário/filtros em `docs/BLINDAGEM_INVENTARIO_FILTROS.md`.
