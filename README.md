# Prompt Ágil – App de ensino e validador de prompts

App offline (HTML, CSS e JavaScript, sem servidor) para ensinar bons prompts e servir de **Aplicativo Validador** do jogo analógico **Prompt Ágil**.

## Estrutura
```
index.html      -> estrutura e conteúdo das telas
style.css       -> visual (tema preto e dourado, alto contraste, responsivo)
script.js       -> navegação por abas, motor de avaliação, modo jogo e placar
manifest.json   -> dados para instalar como app (PWA)
sw.js           -> service worker (cache para uso offline)
imagens/        -> ícones do app
```

## Como usar
Abra o `index.html` no navegador. Funciona sem internet (mantenha os arquivos na mesma pasta). Para instalar como app (PWA), publique no GitHub Pages (repositório público) e use "Instalar app" no navegador.

## Navegação
- Barra de abas em uma linha, com ícones; no celular ela rola para o lado e mostra setas ‹ › quando há mais abas.
- Ao abrir uma aba, a barra centraliza a aba ativa.
- Botões "Anterior" e "Próximo" no fim de cada aba, com a posição ("Aba 3 de 7").
- Botão Voltar do navegador volta para a aba anterior; um link com `#regras`, `#validador` ou `#placar` abre direto na aba.
- Teclado: setas ← → trocam de aba; Home e End vão para a primeira e a última.

## Telas
Início · O que é um prompt? · Exemplos (partes coloridas) · Bons x Ruins · Regras do jogo · Validador · Placar

## Validador (nota de 0 a 100)
Seis critérios, conforme a regra 12 do jogo:

| Critério | Pontos |
|---|---|
| Clareza das instruções | 20 |
| Completude das informações | 20 |
| Coerência e organização | 15 |
| Adequação ao objetivo secreto | 20 |
| Potencial de resposta útil, precisa e relevante | 15 |
| Criatividade na combinação | 10 |

- Cada critério é dividido em verificações menores, com dicas do que falta.
- **Aderência ao objetivo secreto** (0 a 100%): cobertura dos temas do objetivo, ação pedida e foco do prompt. É o primeiro critério de desempate.
- Tetos: menos de 5 palavras = máx. 15; sem tarefa identificável = máx. 40; texto sem sentido = máx. 20; duas ou mais contradições = máx. 59.
- Considerado "claro": nota ≥ 60, pelo menos 60% dos pontos de clareza e nenhuma contradição.
- Sem objetivo informado (modo livre), os outros cinco critérios são reescalados para 100.
- O mesmo prompt sempre recebe a mesma nota (regras fixas, sem IA e sem internet).

## Modo jogo
Marque "Modo jogo" e informe: nome do jogador, cartas utilizadas (1 a 8), movimentos restantes sem coleta (0 a 16) e o objetivo secreto (campo oculto por padrão). Depois de avaliar, clique em "Registrar no placar".

## Placar e desempate (regra 14)
1. Maior nota
2. Maior aderência ao objetivo secreto
3. Menor número de cartas utilizadas
4. Maior número de movimentos restantes sem coleta
5. Persistindo o empate, vitória compartilhada

O placar fica salvo no aparelho (localStorage). O texto do prompt e o objetivo secreto não são guardados.

## Limitações
- É um validador de regras (estrutura e vocabulário), não entende o sentido profundo do texto. Casos incomuns podem receber nota imprecisa; em dúvida, quem organiza o jogo decide.
- Feito para prompts em português.
- O placar é por aparelho: registre todos os jogadores no mesmo dispositivo.

## Atualizando o app instalado
Ao alterar qualquer arquivo, troque a versão do cache em `sw.js` (`bons-prompts-v4` para `v5`), senão o celular continua mostrando a versão antiga.
