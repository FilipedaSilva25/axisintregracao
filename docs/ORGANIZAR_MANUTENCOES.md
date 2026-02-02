# Organizar manutenções em ano/mês

O script **`scripts/organizar-manutencoes-por-pasta.js`** organiza PDFs de manutenções preventivas em subpastas **`ano/mês`**.

## Uso

```bash
# Usar pasta padrão (./manutencoes-pdfs)
npm run organizar-manutencoes

# Ou com Node diretamente
node scripts/organizar-manutencoes-por-pasta.js

# Especificar outra pasta
node scripts/organizar-manutencoes-por-pasta.js "C:\Downloads\PDFs"
```

## Formato do nome do arquivo

Os arquivos devem seguir o padrão:

`AXIS_PV_<SERIAL>_<ANO>_<MÊS>_<DATA>.pdf`

Exemplos:
- `AXIS_PV_18J194501111_2026_Janeiro_08-01-2026.pdf`
- `AXIS_PV_21D194504444_2024_Fevereiro_10-02-2024.pdf`

O script extrai **ano** e **mês** do nome e move o arquivo para `pasta/ano/mes/`.

## Estrutura resultante

```
manutencoes-pdfs/
├── 2024/
│   ├── 01/
│   │   ├── AXIS_PV_..._2024_Janeiro_15-01-2024.pdf
│   │   └── ...
│   └── 02/
│       └── ...
├── 2025/
│   └── ...
└── 2026/
    ├── 01/
    └── 02/
```

## Observações

- Se a pasta não existir, ela será criada.
- Apenas arquivos `AXIS_PV_*.pdf` são processados.
- Meses em português (Janeiro, Fevereiro, ..., Dezembro) são reconhecidos.
