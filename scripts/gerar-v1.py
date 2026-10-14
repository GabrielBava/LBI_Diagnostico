#!/usr/bin/env python3
"""
Gera as páginas do V1 · Institucional a partir do PDF da apresentação.

Uso:
    python3 scripts/gerar-v1.py caminho/da/apresentacao.pdf

O que faz:
  1. Converte cada página do PDF em imagem WebP de 1920 px de largura
     (src/assets/v1/pagina-01.webp, pagina-02.webp, ...). As páginas antigas são apagadas.
  2. Guarda os links clicáveis do PDF (ex.: "Clique aqui") com a posição de cada um
     em src/assets/v1/paginas.json, para virarem áreas clicáveis sobre a imagem.
Depois rode `npm run html` para gerar o HTML com a apresentação nova.

Precisa de: pdftoppm (poppler-utils), Pillow e pypdf.
"""

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

LARGURA = 1920
QUALIDADE = 80
RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "src" / "assets" / "v1"


def links_da_pagina(pagina):
    """Links (URI) da página, com a posição em % da largura/altura (origem no canto superior esquerdo)."""
    caixa = pagina.mediabox
    x0, y0 = float(caixa.left), float(caixa.bottom)
    largura, altura = float(caixa.width), float(caixa.height)
    saida = []
    for ref in pagina.get("/Annots") or []:
        anot = ref.get_object()
        if anot.get("/Subtype") != "/Link":
            continue
        acao = anot.get("/A")
        acao = acao.get_object() if acao is not None else None
        url = acao.get("/URI") if acao is not None else None
        if not url:
            continue
        r = [float(v) for v in anot["/Rect"]]
        esq, dir_ = sorted((r[0], r[2]))
        baixo, cima = sorted((r[1], r[3]))
        saida.append(
            {
                "url": str(url),
                "x": round((esq - x0) / largura * 100, 3),
                "y": round((altura - (cima - y0)) / altura * 100, 3),
                "w": round((dir_ - esq) / largura * 100, 3),
                "h": round((cima - baixo) / altura * 100, 3),
            }
        )
    return saida


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    pdf = Path(sys.argv[1]).resolve()
    leitor = PdfReader(str(pdf))
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir(parents=True)

    paginas = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-png", "-scale-to-x", str(LARGURA), "-scale-to-y", "-1", str(pdf), f"{tmp}/p"], check=True)
        pngs = sorted(Path(tmp).glob("p-*.png"))
        for i, (png, pagina) in enumerate(zip(pngs, leitor.pages), start=1):
            nome = f"pagina-{i:02d}.webp"
            img = Image.open(png).convert("RGB")
            img.save(DESTINO / nome, "WEBP", quality=QUALIDADE, method=6)
            paginas.append({"arquivo": nome, "largura": img.width, "altura": img.height, "links": links_da_pagina(pagina)})

    titulo = (leitor.metadata.title if leitor.metadata else None) or pdf.stem
    (DESTINO / "paginas.json").write_text(
        json.dumps({"titulo": titulo, "origem": pdf.name, "paginas": paginas}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    total = sum(f.stat().st_size for f in DESTINO.glob("*.webp"))
    print(f"{len(paginas)} páginas em {DESTINO} ({round(total / 1024)} KB)")


if __name__ == "__main__":
    main()
