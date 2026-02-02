#!/usr/bin/env node
/**
 * Organiza arquivos de manutenções preventivas em subpastas ano/mês.
 * Padrão de nome: AXIS_PV_SERIAL_ANO_MES_DATA.pdf (ex.: AXIS_PV_18J194501111_2026_Janeiro_08-01-2026.pdf)
 * Cria estrutura: <pasta>/<ano>/<mes>/<arquivo>
 * Ex.: manutencoes-pdfs/2026/01/AXIS_PV_18J194501111_2026_Janeiro_08-01-2026.pdf
 *
 * Uso: node scripts/organizar-manutencoes-por-pasta.js [pasta]
 *      pasta = diretório com os PDFs (default: ./manutencoes-pdfs)
 */

const fs = require('fs');
const path = require('path');

const MES_POR_NOME = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03',
    'abril': '04', 'maio': '05', 'junho': '06', 'julho': '07',
    'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
};

function extrairAnoMes(nomeArquivo) {
    // AXIS_PV_SERIAL_ANO_MES_DATA.pdf
    const base = path.basename(nomeArquivo, '.pdf');
    const partes = base.split('_');
    if (partes.length < 5) return null;
    const ano = partes[partes.length - 4]; // ano
    const mesNome = (partes[partes.length - 3] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mes = MES_POR_NOME[mesNome] || null;
    if (!/^\d{4}$/.test(ano) || !mes) return null;
    return { ano, mes };
}

function organizar(pasta) {
    const dir = path.resolve(pasta);
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            console.log('Pasta criada:', dir);
        } catch (e) {
            console.error('Pasta não encontrada e não foi possível criar:', dir, e.message);
            process.exit(1);
        }
    }
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        console.error('Não é um diretório:', dir);
        process.exit(1);
    }

    const arquivos = fs.readdirSync(dir).filter(f => {
        const full = path.join(dir, f);
        return fs.statSync(full).isFile() && /^AXIS_PV_.*\.pdf$/i.test(f);
    });

    if (arquivos.length === 0) {
        console.log('Nenhum arquivo AXIS_PV_*.pdf encontrado em', dir);
        return;
    }

    let movidos = 0;
    let erros = 0;

    arquivos.forEach(arquivo => {
        const info = extrairAnoMes(arquivo);
        if (!info) {
            console.warn('Ignorado (nome inválido):', arquivo);
            return;
        }
        const subdir = path.join(dir, info.ano, info.mes);
        const dest = path.join(subdir, arquivo);
        const src = path.join(dir, arquivo);

        try {
            if (!fs.existsSync(subdir)) fs.mkdirSync(subdir, { recursive: true });
            if (fs.existsSync(dest)) {
                console.warn('Já existe:', path.relative(dir, dest));
                return;
            }
            fs.renameSync(src, dest);
            console.log('OK', path.relative(dir, dest));
            movidos++;
        } catch (e) {
            console.error('Erro ao mover', arquivo, ':', e.message);
            erros++;
        }
    });

    console.log('\nResumo:', movidos, 'movidos,', erros, 'erros.');
}

const pasta = process.argv[2] || path.join(__dirname, '..', 'manutencoes-pdfs');
organizar(pasta);
