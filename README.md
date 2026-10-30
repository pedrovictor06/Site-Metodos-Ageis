# Prompt Ágil – Guia do jogo e Aplicativo Validador

App offline (HTML, CSS e JavaScript, sem servidor) que serve de guia para o professor e de **Aplicativo Validador** oficial do jogo de tabuleiro **Prompt Ágil**.

## Estrutura
```
index.html     -> as 4 abas: Resumo, Exemplos, Regras, Validador (com o placar)
style.css      -> visual (preto e dourado; cores dos quadrantes do tabuleiro)
cartas.js      -> dados oficiais: 72 cartas de estrutura, 16 de Sorte/Azar, objetivos e combos
validador.js   -> motor da nota (regras fixas, sem IA e sem internet)
script.js      -> navegação, exemplos, montagem com cartas e placar
manifest.json  -> dados para instalar como app (PWA)
sw.js          -> service worker (cache para uso offline)
imagens/       -> ícones do app
```
Se uma carta impressa mudar, altere só `cartas.js`.

## Como usar
Abra o `index.html` no navegador. Funciona sem internet (mantenha os arquivos na mesma pasta). Para instalar como app, publique no GitHub Pages e use "Instalar app" no navegador.

## Validador (nota de 0 a 100)
Os oito critérios da regra 17:

| Critério | Pontos |
|---|---|
| Clareza das instruções | 13 |
| Organização e estrutura | 8 |
| Completude das informações | 13 |
| Coerência entre as partes | 9 |
| Adequação ao objetivo secreto | 30 |
| Qualidade da resposta esperada | 9 |
| Criatividade | 9 |
| Eficiência no uso das cartas | 9 |

- **Reconhece as cartas do jogo** pelo texto delas no prompt. Carta adaptada conta se for marcada em "Montar o prompt com as suas cartas".
- **Adequação ao objetivo**: cartas do combo recomendado na carta de objetivo (12), tema do objetivo escrito no prompt (12) e ação pedida (6). A aderência ao objetivo (0 a 100%) é o 1º critério de desempate.
- **Calibragem**: prompt montado com o combo do objetivo fica em *Muito bom* ou *Excelente*; com uma frase do tema e do público, chega a *Excelente*. Cartas fora do combo ficam em *Bom*. Prompts vagos ficam em *Fraco*.
- Sem objetivo (avaliação livre), a adequação não é medida e os outros sete critérios são reescalados para 100.
- Tetos: menos de 5 palavras = máx. 15; sem tarefa = máx. 40; texto sem sentido = máx. 20; duas ou mais contradições = máx. 59.
- Carta **Gênio dos Prompts (SOR-08)**: +15 na nota final do placar.
- **Gabaritos** (`PROMPT_AGIL.gabaritos` em `cartas.js`): o prompt-modelo de cada objetivo, com as cartas do combo e uma frase do tema. Com objetivo escolhido, a nota é medida em relação ao gabarito: os pontos dele valem 100 e os outros prompts são proporcionais (máximo 100). Aparecem no validador em "Gabarito do professor" (depois de "Mostrar").

## Placar e desempate (regras 18 e 19)
1. Maior nota
2. Maior aderência ao objetivo secreto
3. Menor quantidade de cartas utilizadas
4. Maior diversidade de categorias utilizadas
5. Maior número de cartas restantes no tabuleiro do quadrante inicial
6. Persistindo o empate, vitória compartilhada

O placar fica salvo no aparelho (localStorage). Registre todos os jogadores no mesmo aparelho.

## Limitações
- É um validador de regras (estrutura e vocabulário), não entende o sentido profundo do texto. Em dúvida, o professor decide.
- Feito para prompts em português.

## Atualizando o app instalado
Ao alterar qualquer arquivo, troque a versão do cache em `sw.js` (`bons-prompts-v10` para `v11`). Com internet, o app já busca a versão nova sozinho e recarrega uma vez.
