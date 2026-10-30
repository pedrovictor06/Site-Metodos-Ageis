/* Prompt Ágil – motor do Aplicativo Validador.
   Regras fixas, sem IA e sem internet: o mesmo prompt sempre recebe a mesma nota.
   Depende de cartas.js (PROMPT_AGIL). Usado por script.js e pelos testes (node). */
var Validador = (function (D) {
  'use strict';

  // =====================================================================
  //  Texto: normalização, palavras e radicais
  // =====================================================================
  var STOP = {};
  ('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sobre entre ate ao aos e ou mas que se como mais menos ' +
   'muito muita muitos muitas ser estar ter ha foi sao seu sua seus suas meu minha meus minhas isso isto esse essa esses essas este esta ' +
   'estes estas ele ela eles elas eu voce voces nos me te lhe pelo pela pelos pelas num numa quando onde qual quais ja tambem so apenas ' +
   'cada todo toda todos todas outro outra outros outras deve devem pode podem seja sejam la ai').split(' ')
    .forEach(function (w) { STOP[w] = 1; });

  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function palavras(t) { return norm(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); }
  var SUF = ['coes', 'cao', 'mente', 'idades', 'idade', 'ando', 'endo', 'indo', 'ados', 'adas', 'ado', 'ada', 'idos', 'idas', 'ido', 'ida', 'ar', 'er', 'ir', 'es', 's'];
  function radical(w) {
    for (var i = 0; i < SUF.length; i++) {
      var s = SUF[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) return w.slice(0, -s.length);
    }
    return w;
  }
  function stems(t) { return palavras(t).filter(function (w) { return w.length > 2 && !STOP[w]; }).map(radical); }
  function igual(a, b) {
    if (a === b) return true;
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i >= 5 || (n >= 5 && i >= n - 1 && i >= 4);
  }
  function unicos(arr) { var o = {}, r = []; arr.forEach(function (x) { if (!o[x]) { o[x] = 1; r.push(x); } }); return r; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function tem(lista, alvo) { return alvo.some(function (p) { return igual(lista, p); }); }
  function cobertura(lista, alvo) {
    if (!lista.length) return 0;
    var n = 0; lista.forEach(function (s) { if (tem(s, alvo)) n++; });
    return n / lista.length;
  }
  function casaUnicos(re, n) { // trechos distintos que casam com uma regex global
    var m = n.match(re) || [], o = {};
    m.forEach(function (x) { o[x.trim().slice(0, 6)] = 1; });
    return Object.keys(o).length;
  }

  // =====================================================================
  //  Verbos de ação por família (formas normalizadas)
  // =====================================================================
  var FAMILIAS = {
    criar: 'crie criar elabore elaborar gere gerar monte montar desenvolva desenvolver escreva escrever redija redigir produza produzir componha compor proponha propor invente inventar construa construir desenhe desenhar projete projetar conceba conceber idealize idealizar',
    explicar: 'explique explicar ensine ensinar descreva descrever defina definir esclareca esclarecer detalhe detalhar ilustre ilustrar apresente apresentar',
    resumir: 'resuma resumir sintetize sintetizar condense condensar',
    comparar: 'compare comparar diferencie diferenciar contraste contrastar',
    analisar: 'analise analisar avalie avaliar examine examinar critique criticar identifique identificar classifique classificar',
    pesquisar: 'pesquise pesquisar descubra descobrir investigue investigar levante levantar',
    melhorar: 'melhore melhorar otimize otimizar corrija corrigir reescreva reescrever ajuste ajustar edite editar revise revisar aprimore aprimorar transforme transformar adapte adaptar reinvente reinventar',
    resolver: 'resolva resolver solucione solucionar calcule calcular estime estimar diagnostique diagnosticar',
    planejar: 'planeje planejar organize organizar estruture estruturar coordene coordenar prepare preparar agende agendar',
    convencer: 'convenca convencer persuada persuadir argumente argumentar divulgue divulgar promova promover engaje engajar',
    programar: 'programe programar automatize automatizar codifique codificar implemente implementar',
    listar: 'liste listar enumere enumerar sugira sugerir recomende recomendar indique indicar',
    simular: 'simule simular teste testar',
    traduzir: 'traduza traduzir converta converter',
    outros: 'faca fazer fale falar diga dizer conte contar mostre mostrar responda responder ajude ajudar escolha escolher ordene ordenar priorize priorizar simplifique simplificar expanda expandir amplie ampliar reduza reduzir valide validar verifique verificar execute executar'
  };
  var VERBOS = {}, FAMILIA = {};
  Object.keys(FAMILIAS).forEach(function (f) {
    FAMILIAS[f].split(' ').forEach(function (v) { VERBOS[v] = 1; FAMILIA[v] = f; });
  });
  var VERBOS_PERSONA = { atue: 1, atuar: 1, aja: 1, haja: 1, finja: 1, assuma: 1, seja: 1, imagine: 1 };
  ['atue', 'atuar', 'aja', 'haja', 'finja', 'assuma'].forEach(function (v) { VERBOS[v] = 1; });
  // verbos que costumam abrir frases de formato ("Apresente em tabela", "Use linguagem simples")
  var VERBOS_FORMATO = {};
  'apresente estruture formate use utilize inclua adapte adote mantenha evite limite responda divida destaque coloque termine comece finalize organize entregue mostre'
    .split(' ').forEach(function (v) { VERBOS_FORMATO[v] = 1; });
  'formate utilize inclua adote mantenha evite limite divida destaque coloque termine comece finalize entregue'.split(' ').forEach(function (v) { VERBOS[v] = 1; });

  // =====================================================================
  //  Detectores de partes do prompt (texto normalizado)
  // =====================================================================
  var PERSONA_RE = /\b(atue como|atuando como|aja como|haja como|voce e (um|uma|o|a)|voce sera (um|uma|o|a)|assuma o papel|no papel de|na pele de|seja (um|uma) (professor|professora|especialista|tutor|tutora|mentor|mentora|consultor|consultora)|finja ser|imagine que voce e|como se fosse (um|uma)|simultaneamente como)\b/;
  var CTX_FORTE = /\b(estou|estamos|sou|somos|o objetivo e|meu objetivo|nosso objetivo|o tema e|o foco e|minha turma|nossa turma|minha escola|nossa escola|meu projeto|nosso projeto|meu trabalho|considere|cenario|contexto|ambientad[oa]|situe|trata se|dentro de (um|uma)|imagine (um|uma)|vou (apresentar|fazer|usar|criar)|tenho (um|uma))\b/;
  var CTX_FRACO = /\b(projeto|trabalho|prova|aula|curso|disciplina|faculdade|escola|empresa|cliente|apresentacao|reuniao|site|aplicativo|app|sistema|jogo|turma|campeonato|torneio|feira|festival|evento|cidade|mundo|planeta|marte|ilha|parque|laboratorio|acampamento|colonia|missao|rede social|comunidade|bairro|porque|pois|para que|com o objetivo|objetivo)\b/g;
  var PUBLICO_RE = /\b(para (um|uma|o|a|os|as) (iniciante|leigo|leiga|crianca|adolescente|aluno|aluna|estudante|professor|professora|cliente|usuario|usuaria|jovem|leitor|leitora|turma|visitante)s?|publicos?( alvo)?|audiencia|leitor(es)?|iniciantes|leigos|criancas|adolescentes|alun[oa]s|estudantes|jovem|jovens|turmas?|\d+ anos|ensino (fundamental|medio|superior)|\d+o ano|calouros|visitantes|espectadores|usuarios)\b/;
  var FORMATO_RE = /\b(topicos?|lista|listas|tabela|paragrafos?|passo a passo|json|csv|markdown|esquema|checklist|bullets?|bullet points|numerad[oa]s?|formato|mapa mental|fluxograma|slides?|e-?mail|carta|poema|quiz|colunas|gabarito|historia|storytelling|dialogo|roteiro de video|emojis?|analogias?|noticia|cronograma|pseudocodigo|legenda|manchete)\b/g;
  var QUANT_RE = /\b((\d+|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|doze|quinze|vinte|trinta)\s+(palavras|linhas|frases|topicos|itens|paragrafos|passos|exemplos|opcoes|minutos|segundos|semanas|dias|questoes|perguntas|etapas|dicas|ideias|slides|pontos|caracteres|horas|meses|alternativas|bullets|sugestoes|titulos|colunas|equipes|times|personagens|cenas|partidas|regras|atividades|desafios)|(ate|no maximo|no minimo|maximo de|minimo de|exatamente|pelo menos)\s+\d+|passo \d+)\b/g;
  var RESTR_RE = /\b(tom|linguagem|formal|informal|simples|didatic[oa]|(seja|forma|linguagem|resposta|tom) objetiv[oa]|concis[oa]|tecnic[oa]s?|amigavel|descontraid[oa]|motivador[a]?|empatic[oa]|neutr[oa]|profissional|divertid[oa]|leve|humor|vocabulario|nivel|profundidade|evite|evitando|evitar|nao use|nao inclua|nao invente|nunca|proibido|apenas|somente|mantenha|preserve|no maximo|no minimo|limite|exatamente|obrigatoriamente|em portugues|acessivel)\b/g;
  var QUALIDADE_RE = /\b(justifi\w*|por que|com base em|fontes?|referencias?|cite|exemplos?|analogias?|passo a passo|etapas|vantagens|desvantagens|pontos fortes|pontos fracos|pros e contras|criterios|compar\w*|riscos|beneficios|viabilidade|causa raiz|diagnostic\w*|gabarito|metas|responsaveis|recursos necessarios|prazos?|cronogramas?|impacto|diferencial|funcionamento|como funciona|solucao pratica|teste pratico|prevendo|verifique|revise|confira|inicio|desfecho|detalh\w*|demonstracao|regras claras)\b/g;
  var CUIDADO_RE = /\b(evite|evitando|nao use|nao inclua|nao invente|nao assuma|se nao souber|se nao tiver certeza|nunca|proibido|apenas|somente|no maximo|limite|seguranca|segur[oa]s?|etic[oa]|privacidade|respeito|inclusiv[oa]|acessibilidade|sem (jargoes?|termos tecnicos|girias|rodeios|custos?)|cite as fontes|baseie se)\b/g;
  var CRIATIVO_RE = /\b(analogias?|metaforas?|imagine|historias?|narrativas?|storytelling|como se|personage(m|ns)|desafios?|gamifi\w*|jogos?|games?|missao|missoes|quiz|enigmas?|charadas?|rimas?|humor|divertid[oa]|inesperad[oa]|criativ\w*|original|inovador\w*|inedit[oa]s?|dialogo|roteiros?|simul\w*|futurist[ao]|interplanetari[oa]|viagem no tempo|hologram\w*|emojis?|aventuras?|misterios[oa]?|misterios|reviravoltas?|recompensas?|herois?|ficcao|imersiv[oa]s?|interativ[oa]s?|curiosidades)\b/g;
  var VAGO_RE = /\b(coisa|coisas|algo|isso|isto|aquilo|legal|massa|etc|bacana|negocio|trem|sei la|alguma coisa|qualquer coisa|mais ou menos|do jeito que|um pouco)\b/g;
  var VAGO_ADJ_RE = /\b(texto|resposta|trabalho|conteudo|ideia|post|video|resumo|coisa) (bom|boa|legal|bonit[oa]|interessante|massa)\b|\b(bom|boa|bonit[oa]|interessante) (texto|resposta|trabalho|conteudo)\b/g;
  var PERGUNTA_INI = /^\s*(como|qual|quais|quem|onde|quando|por que|porque|o que|quanto|quantos|quantas)\b/;
  var CONTRADICOES = [
    [/\b(curto|curta|curtos|curtas|breve|resumid[oa]|conciso|concisa|sucinto|sucinta)\b/, /\b(detalhad[oa]s?|extens[oa]|aprofundad[oa]|longo|longa)\b/, 'curto x detalhado'],
    [/\bformal\b/, /\b(informal|descontraid[oa]|coloquial|girias?|divertid[oa]|bem humorad[oa])\b/, 'formal x informal'],
    [/\bsem exemplos?\b/, /\b(com exemplos?|inclua\s+(\w+\s+){0,3}exemplos?|de exemplos?)\b/, 'sem exemplos x com exemplos'],
    [/\bsem codigo\b/, /\b(inclua|com|escreva|mostre) codigo\b/, 'sem código x com código']
  ];
  // expressões que usam "curto/longo" sem falar do tamanho da resposta
  var NAO_TAMANHO = /\b((curto|medio|longo) prazo|a longo prazo|videos? curtos?|curta duracao|longa duracao|longa distancia)\b/g;

  // =====================================================================
  //  Cartas do jogo: índice, radicais distintivos e combos
  // =====================================================================
  var CAT_DE = { PER: 'P', CTX: 'C', TAR: 'T', FMT: 'F' };
  var CATS = ['P', 'C', 'T', 'F'];
  var CARTAS = D.cartas.map(function (c) { return { cod: c[0], cat: CAT_DE[c[0].slice(0, 3)], titulo: c[1], pts: c[2], texto: c[3] }; });
  var POR_COD = {}; CARTAS.forEach(function (c) { POR_COD[c.cod] = c; });
  var CORINGA = {}; (D.coringas || []).forEach(function (c) { CORINGA[c] = 1; });
  var TIT_FORA = {}; 'em com de do da persona coring livre contexto tarefa formato inclua use crie destine alun ano anos maximo palavras'
    .split(' ').forEach(function (w) { TIT_FORA[w] = 1; TIT_FORA[radical(w)] = 1; });

  var DF = {};
  CARTAS.forEach(function (c) {
    c.st = unicos(stems(c.texto));
    c.st.forEach(function (s) { DF[s] = (DF[s] || 0) + 1; });
  });
  CARTAS.forEach(function (c) {
    c.tit = unicos(stems(c.titulo)).filter(function (s) { return !TIT_FORA[s]; });
    c.dist = unicos(c.st.filter(function (s) { return DF[s] <= 3; }).concat(c.tit));
    c.verbo = c.cat === 'T' ? (norm(c.titulo).split(/\s+/)[0]) : null;
    // nome da carta escrito por extenso (palavras inteiras, aceita plural): "youtuber educacional"
    var tw = palavras(c.titulo).filter(function (w) { return w.length > 2 && !STOP[w] && !TIT_FORA[w]; });
    c.titRe = tw.length ? tw.map(function (w) { return new RegExp('\\b' + w + '(e?s)?\\b'); }) : null;
  });

  var OBJ = {}; D.objetivos.forEach(function (o) { OBJ[o.cod] = o; });
  var COMPAT = {}, EM_COMBO = {};
  D.objetivos.forEach(function (o) {
    if (!o.combo) return;
    var todas = [];
    CATS.forEach(function (k) { (o.combo[k] || []).forEach(function (c) { todas.push(c); EM_COMBO[c] = 1; }); });
    todas.forEach(function (a) { todas.forEach(function (b) { if (a !== b) COMPAT[a + '|' + b] = 1; }); });
  });
  var CONFLITOS = (D.conflitos || []);

  function pareamento(a, b) {
    if (CORINGA[a] || CORINGA[b] || COMPAT[a + '|' + b]) return 1;
    if (!EM_COMBO[a] || !EM_COMBO[b]) return 0.5;
    return 0;
  }

  // ---------------------------------------------------------------------
  //  Reconhece as cartas usadas no texto.
  //  'texto'   = o texto da carta está no prompt (mesmo adaptado);
  //  'marcada' = o jogador marcou a carta e parte do texto dela aparece;
  //  'titulo'  = o nome da carta aparece (vale para o combo, não conta como carta usada).
  // ---------------------------------------------------------------------
  function detectarCartas(texto, marcadas) {
    var ps = unicos(stems(texto)), nt = norm(texto);
    marcadas = marcadas || [];
    var usadas = [], mencoes = [], naoAchadas = [];
    CARTAS.forEach(function (c) {
      var ov = cobertura(c.dist, ps);
      var marc = marcadas.indexOf(c.cod) >= 0;
      var tit = (c.cat === 'P' || c.cat === 'C') && !CORINGA[c.cod] && c.titRe &&
                c.titRe.every(function (re) { return re.test(nt); });
      // carta marcada e adaptada: basta parte do texto, o nome dela ou (Tarefa) o mesmo tipo de verbo
      var adaptada = marc && (ov >= 0.2 || (c.tit.length > 0 && cobertura(c.tit, ps) === 1) ||
                     (c.cat === 'T' && palavras(texto).some(function (w) { return FAMILIA[w] && FAMILIA[w] === FAMILIA[c.verbo]; })));
      if (ov >= 0.55) usadas.push({ carta: c, ov: ov, como: 'texto' });
      else if (adaptada) usadas.push({ carta: c, ov: ov, como: 'marcada' });
      else {
        if (tit) mencoes.push(c);
        if (marc) naoAchadas.push(c);
      }
    });
    return { usadas: usadas, mencoes: mencoes, naoAchadas: naoAchadas };
  }

  // ---------------------------------------------------------------------
  //  Frases e a parte do prompt de cada uma (P, C, T, F ou O = outra)
  // ---------------------------------------------------------------------
  function frasesDe(texto) {
    var t = String(texto || '').replace(/\.{3}/g, '…').replace(/\b(ex|etc|sr|sra|dr|dra|obs|pag)\./gi, '$1');
    return (t.match(/[^.!?\n]+[.!?]*/g) || []).map(function (s) { return s.trim(); })
      .filter(function (s) { return palavras(s).length > 0; });
  }
  function primeiroVerbo(P, ate) {
    for (var i = 0; i < Math.min(P.length, ate); i++) if (VERBOS[P[i]]) return P[i];
    return null;
  }
  function verboDeTarefa(P) {
    for (var i = 0; i < P.length; i++) if (VERBOS[P[i]] && !VERBOS_PERSONA[P[i]] && !VERBOS_FORMATO[P[i]]) return P[i];
    for (i = 0; i < P.length; i++) if (VERBOS[P[i]] && !VERBOS_PERSONA[P[i]]) return P[i];
    return null;
  }
  function classificar(frase) {
    var fs = unicos(stems(frase)), melhor = null, mOv = 0;
    CARTAS.forEach(function (c) { var ov = cobertura(c.dist, fs); if (ov > mOv) { mOv = ov; melhor = c; } });
    if (melhor && mOv >= 0.5) return { parte: melhor.cat, carta: melhor.cod };
    var n = norm(frase), P = palavras(frase);
    var v0 = primeiroVerbo(P, 4);
    var fmt = (n.match(FORMATO_RE) || []).length + (n.match(QUANT_RE) || []).length;
    var restr = (n.match(RESTR_RE) || []).length;
    if (PERSONA_RE.test(n)) return { parte: 'P' };
    if (/\b(sua tarefa|voce deve|preciso que voce|quero que voce|gostaria que voce|pode me|poderia)\b/.test(n) || PERGUNTA_INI.test(n) || /\?\s*$/.test(frase)) return { parte: 'T' };
    if (v0 && VERBOS_FORMATO[v0] && (fmt > 0 || restr > 0)) return { parte: 'F' };
    if (v0 && !VERBOS_PERSONA[v0] && !VERBOS_FORMATO[v0]) return { parte: 'T' };
    if (CTX_FORTE.test(n)) return { parte: 'C' };
    if (fmt > 0 || restr > 0) return { parte: 'F' };
    if (verboDeTarefa(P)) return { parte: 'T' };
    if ((n.match(CTX_FRACO) || []).length || PUBLICO_RE.test(n)) return { parte: 'C' };
    return { parte: 'O' };
  }

  // ---------------------------------------------------------------------
  //  Objetivo: temas (com a palavra original para as dicas) e ações
  // ---------------------------------------------------------------------
  var TEMA_FORA = {};
  'melhor prompt capaz gerar jeito missao coringa mestre combine perfeitamente persona contexto tarefa formato personalizada projetos tematicos sala torneios desafio livre professor obj m1 m2 m3 ia'
    .split(' ').forEach(function (w) { TEMA_FORA[w] = 1; });
  function tokensTema(t) {
    var vistos = {}, out = [];
    String(t || '').split(/[^A-Za-zÀ-ÿ0-9]+/).forEach(function (orig) {
      var w = norm(orig);
      if (w.length <= 2 || STOP[w] || VERBOS[w] || TEMA_FORA[w]) return;
      var s = radical(w);
      if (vistos[s]) return;
      vistos[s] = 1; out.push({ s: s, w: orig.toLowerCase(), peso: w.length >= 7 ? 2 : 1 });
    });
    return out;
  }
  function coberturaTema(tokens, ps) {
    var tot = 0, ach = 0, faltam = [];
    tokens.forEach(function (t) { tot += t.peso; if (tem(t.s, ps)) ach += t.peso; else faltam.push(t.w); });
    return { frac: tot ? ach / tot : 0, faltam: faltam };
  }
  function familiaDe(v) { return FAMILIA[v] || null; }

  function prepararObjetivo(op) {
    if (!op || !op.objetivo) return null;
    var o = OBJ[op.objetivo];
    if (!o) return null;
    var titulo = o.professor ? (op.temaProfessor || '') : o.titulo;
    var desafio = o.professor ? '' : o.desafio;
    // ações principais: verbo do título e verbos das cartas de Tarefa do combo; secundárias: verbos do desafio
    var acoes = {}, secundarias = {};
    palavras(titulo).forEach(function (w) { if (FAMILIA[w]) acoes[FAMILIA[w]] = 1; });
    if (o.combo) (o.combo.T || []).forEach(function (cod) { var f = familiaDe(POR_COD[cod].verbo); if (f) acoes[f] = 1; });
    palavras(desafio).forEach(function (w) { if (FAMILIA[w] && !acoes[FAMILIA[w]]) secundarias[FAMILIA[w]] = 1; });
    return {
      cod: o.cod, o: o, livre: !!o.livre, titulo: titulo,
      tTit: tokensTema(titulo), tDes: tokensTema(desafio), acoes: Object.keys(acoes), secundarias: Object.keys(secundarias)
    };
  }

  // =====================================================================
  //  AVALIAÇÃO
  //  opcoes: { objetivo: 'OBJ-07' | null, temaProfessor: '...', marcadas: ['PER-01', ...] }
  // =====================================================================
  var PESOS = { clareza: 13, organizacao: 8, completude: 13, coerencia: 9, objetivo: 30, qualidade: 9, criatividade: 9, eficiencia: 9 };

  function sub(nome, pts, max, dica) { return { nome: nome, pts: r1(clamp(pts, 0, max)), max: max, dica: dica || '' }; }

  function avaliar(texto, opcoes) {
    opcoes = opcoes || {};
    texto = String(texto || '');
    var n = norm(texto), P = palavras(texto), nP = P.length;
    var S = stems(texto), Dst = unicos(S), nD = Dst.length;
    var obj = prepararObjetivo(opcoes);
    var avisos = [];

    // ---------- cartas ----------
    var det = detectarCartas(texto, opcoes.marcadas);
    var usadas = det.usadas.map(function (u) { return u.carta; });
    var porCat = { P: [], C: [], T: [], F: [] };
    usadas.forEach(function (c) { porCat[c.cat].push(c); });
    var catsCartas = CATS.filter(function (k) { return porCat[k].length > 0; });
    var mencaoCat = { P: [], C: [], T: [], F: [] };
    det.mencoes.forEach(function (c) { mencaoCat[c.cat].push(c); });

    // ---------- frases ----------
    var frases = frasesDe(texto);
    var cls = frases.map(classificar);
    var temClasseT = cls.some(function (c) { return c.parte === 'T'; });
    if (!temClasseT) { // "Organize em tabela..." sozinho: a frase de formato é a tarefa
      for (var i = 0; i < cls.length; i++) {
        var v = primeiroVerbo(palavras(frases[i]), 4);
        if (cls[i].parte === 'F' && v && FAMILIA[v]) { cls[i] = { parte: 'T' }; temClasseT = true; break; }
      }
    }
    var iT = -1;
    for (i = 0; i < cls.length; i++) if (cls[i].parte === 'T') { iT = i; break; }
    var fraseT = iT >= 0 ? frases[iT] : '';
    var verbo = null;
    if (iT >= 0) {
      var mt = norm(fraseT).match(/\btarefa(?: principal)? (?:e|sera) (?:(?:executar|fazer|realizar) )?([a-z]+)/);
      verbo = (mt && VERBOS[mt[1]]) ? mt[1] : verboDeTarefa(palavras(fraseT));
    }
    var pergunta = PERGUNTA_INI.test(n) || /\?\s*$/.test(texto.trim());
    var temTarefa = !!verbo || pergunta || porCat.T.length > 0;

    // ---------- partes (cartas primeiro, depois o texto) ----------
    var temPersona = porCat.P.length > 0 || mencaoCat.P.length > 0 || PERSONA_RE.test(n);
    var ctxFraco = casaUnicos(CTX_FRACO, n), temPublico = PUBLICO_RE.test(n);
    var ctxF = (porCat.C.length || mencaoCat.C.length) ? 1 :
      clamp((CTX_FORTE.test(n) ? 0.7 : 0) + 0.3 * Math.min(2, ctxFraco) + (temPublico ? 0.3 : 0), 0, 1);
    var nFmt = casaUnicos(FORMATO_RE, n), quant = casaUnicos(QUANT_RE, n), nRestr = casaUnicos(RESTR_RE, n);
    var fmtF = porCat.F.length ? 1 : (nFmt > 0 || quant > 0) ? 1 : nRestr >= 2 ? 1 : nRestr === 1 ? 0.6 : 0;
    var partes = { P: temPersona ? 1 : 0, C: ctxF, T: temTarefa ? 1 : 0, F: fmtF };
    var nPartes = CATS.filter(function (k) { return partes[k] >= 0.6; }).length;
    var mult = nD < 5 ? 0.6 : nD < 9 ? 0.85 : 1; // pouca informação pesa em tudo

    // ===== 1. CLAREZA DAS INSTRUÇÕES (13) =====
    var objN = 0;
    cls.forEach(function (c, j) { // o objeto mais bem definido entre as frases de tarefa
      if (c.parte !== 'T') return;
      var Pt = palavras(frases[j]), v = verboDeTarefa(Pt), iv = v ? Pt.indexOf(v) : -1;
      var conta = Pt.slice(iv + 1, iv + 13).filter(function (w) { return w.length > 2 && !STOP[w] && !VERBOS[w]; }).length;
      objN = Math.max(objN, conta);
    });
    if (!objN && pergunta) objN = P.filter(function (w) { return w.length > 2 && !STOP[w]; }).length;
    var vagos = casaUnicos(VAGO_RE, n) + casaUnicos(VAGO_ADJ_RE, n);
    var tamFr = frases.map(function (f) { return palavras(f).length; });
    var media = tamFr.length ? tamFr.reduce(function (a, b) { return a + b; }, 0) / tamFr.length : 0;
    var clareza = [
      sub('Ação pedida com um verbo claro', verbo ? 3 : pergunta ? 2.2 : 0, 3,
        'Peça a ação com um verbo: "Crie…", "Explique…", "Planeje…" ou use uma carta de Tarefa.'),
      sub('O que deve ser feito está definido', Math.min(4, objN), 4,
        'Logo depois do verbo, diga exatamente sobre o quê é a tarefa, com termos concretos.'),
      sub('Sem palavras vagas', vagos === 0 ? 3 : vagos === 1 ? 1.8 : vagos === 2 ? 0.8 : 0, 3,
        'Troque palavras vagas ("coisa", "algo", "isso", "texto bom") por detalhes concretos.'),
      sub('Frases de tamanho adequado', nP < 8 ? 3 * nP / 8 : media <= 32 ? 3 : media <= 45 ? 2 : 1, 3,
        'Use frases completas e não muito longas (até umas 30 palavras cada).')
    ];

    // ===== 2. ORGANIZAÇÃO E ESTRUTURA (8) =====
    function pos(k) { for (var j = 0; j < cls.length; j++) if (cls[j].parte === k) return j; return -1; }
    var pP = pos('P'), pC = pos('C'), pT = pos('T'), pF = pos('F'), pares = [];
    if (pT >= 0) {
      if (pP >= 0) pares.push(pP <= pT);
      if (pC >= 0) pares.push(pC <= pT);
      if (pF >= 0) pares.push(pF >= pT);
    }
    var ordem = pares.length ? 3 * pares.filter(Boolean).length / pares.length : (nPartes >= 2 ? 2.2 : 0.8);
    var linhas = texto.split('\n').filter(function (l) { return l.trim(); }).length;
    var marcadores = (texto.match(/^\s*([-*•]|\d+[.)])\s+/gm) || []).length;
    var rotulos = (texto.match(/^\s*[A-Za-zÀ-ú ]{3,24}:/gm) || []).length;
    var separacao = (frases.length >= 3 || linhas >= 3 || rotulos >= 2 || marcadores >= 2) ? 3 : (frases.length === 2 || linhas === 2) ? 2.2 : (nP <= 30 ? 1.5 : 0.5);
    var tamanho = nP < 8 ? 0.5 : nP < 15 ? 1.2 : nP <= 260 ? 2 : nP <= 350 ? 1.4 : 0.8;
    var organizacao = [
      sub('Ordem lógica (persona e contexto → tarefa → formato)', ordem * mult, 3,
        'Siga a ordem do tabuleiro: Persona e Contexto primeiro, depois a Tarefa, por último Formato e Restrições.'),
      sub('Partes separadas em frases ou linhas', separacao * mult, 3,
        'Coloque cada parte em uma frase ou linha própria.'),
      sub('Tamanho equilibrado', tamanho, 2,
        nP > 260 ? 'O prompt ficou longo: corte o que se repete.' : 'Escreva um pouco mais: um bom prompt tem várias informações.')
    ];

    // ===== 3. COMPLETUDE DAS INFORMAÇÕES (13) =====
    function dicaCarta(k, extra) { return 'Falta ' + D.categorias[k].nome + ': ' + extra; }
    var completude = [
      sub('Tarefa', temTarefa ? 4 : 0, 4, dicaCarta('T', 'use uma carta de Tarefa ou diga a ação que a IA deve fazer.')),
      sub('Persona', partes.P * 3 * mult, 3, dicaCarta('P', 'diga quem a IA deve ser ("Atue como…").')),
      sub('Contexto (situação e público)', partes.C * 3 * mult, 3, dicaCarta('C', 'diga o cenário, para que é e para quem é.')),
      sub('Formato e restrições', partes.F * 3 * mult, 3, dicaCarta('F', 'diga como a resposta deve vir (tabela, tópicos, tamanho, tom).'))
    ];

    // ===== 4. COERÊNCIA ENTRE AS PARTES (9) =====
    var nTam = n.replace(NAO_TAMANHO, ' ');
    var contra = [];
    CONTRADICOES.forEach(function (c) { if (c[0].test(nTam) && c[1].test(nTam)) contra.push(c[2]); });
    var porUnidade = {}, qm, qre = /\b(\d+)\s+(topicos|itens|paragrafos|linhas|frases|passos|exemplos|palavras|questoes|perguntas)\b/g;
    while ((qm = qre.exec(n)) !== null) { (porUnidade[qm[2]] = porUnidade[qm[2]] || {})[qm[1]] = 1; }
    Object.keys(porUnidade).forEach(function (u) { if (Object.keys(porUnidade[u]).length > 1) contra.push('quantidades diferentes de ' + u); });
    var idades = {}, im, ire = /\b(alun[oa]s|estudantes|jovens|criancas|adolescentes|leitores|publico)\b[^.\n]{0,25}?\b(\d{1,2}) anos\b/g;
    while ((im = ire.exec(n)) !== null) idades[im[2]] = 1;
    if (Object.keys(idades).length > 1 && !/\bentre \d{1,2} e \d{1,2} anos\b|\bde \d{1,2} a \d{1,2} anos\b/.test(n)) contra.push('públicos de idades diferentes');
    var codsUsadas = usadas.map(function (c) { return c.cod; });
    var conflitoCod = {};
    var jaContado = { 'FMT-06': 'quantidades diferentes de palavras', 'FMT-15': 'públicos de idades diferentes' };
    CONFLITOS.forEach(function (cf) {
      if (codsUsadas.indexOf(cf[0]) < 0 || codsUsadas.indexOf(cf[1]) < 0) return;
      conflitoCod[cf[0]] = conflitoCod[cf[1]] = 1;
      if (contra.indexOf(jaContado[cf[0]]) < 0) contra.push(cf[2]); // não conta duas vezes o mesmo conflito
    });
    contra = unicos(contra);
    var combina;
    if (catsCartas.length >= 2) {
      var soma = 0, np = 0;
      usadas.forEach(function (a) { usadas.forEach(function (b) {
        if (a.cod < b.cod && a.cat !== b.cat) { soma += pareamento(a.cod, b.cod); np++; }
      }); });
      combina = 3 * (0.3 + 0.7 * (np ? soma / np : 1));
    } else combina = nPartes >= 2 ? 3 : 1;
    var freq = {}; S.forEach(function (s) { freq[s] = (freq[s] || 0) + 1; });
    var maxF = 0; Object.keys(freq).forEach(function (k) { if (freq[k] > maxF) maxF = freq[k]; });
    var vistas = {}, dupFrase = false;
    frases.forEach(function (f) { var k = palavras(f).join(' '); if (k.split(' ').length >= 3) { if (vistas[k]) dupFrase = true; vistas[k] = 1; } });
    var enchimento = (maxF >= 5 && nP < 80) || maxF >= 9 || dupFrase;
    var seguidas = /\b([a-z]{3,})\s+\1\b/.test(n);
    var ttr = S.length >= 12 ? nD / S.length : 1;
    var rep = 2 - (enchimento ? 1.5 : 0) - (ttr < 0.45 && S.length >= 10 ? 0.5 : 0) - (seguidas ? 0.5 : 0);
    var coerencia = [
      sub('Sem instruções que se contradizem', (4 - 2 * contra.length) * mult, 4,
        contra.length ? 'Há instruções que se contradizem (' + contra.join('; ') + '). Fique com uma delas.' : 'Escreva mais para mostrar que as partes combinam.'),
      sub('As partes combinam entre si', combina * mult, 3,
        'Escolha cartas que conversem entre si (persona, cenário e tarefa do mesmo assunto).'),
      sub('Sem repetição desnecessária', rep, 2, 'Evite repetir palavras e frases: cada trecho deve trazer algo novo.')
    ];

    // ===== 5. ADEQUAÇÃO AO OBJETIVO SECRETO (30) =====
    var objetivo = null, aderencia = null;
    if (obj) {
      var ps = Dst, comboPts = 0, faltaCombo = [];
      CATS.forEach(function (k) {
        var p;
        if (obj.livre) p = (porCat[k].length || partes[k] >= 0.6) ? 3 : 0;
        else {
          var rec = obj.o.combo[k] || [];
          var noCombo = porCat[k].some(function (c) { return rec.indexOf(c.cod) >= 0; }) ||
                        mencaoCat[k].some(function (c) { return rec.indexOf(c.cod) >= 0; });
          if (noCombo) p = 3;
          else if (porCat[k].some(function (c) { return CORINGA[c.cod]; })) p = 1.5;
          else if (porCat[k].length || partes[k] >= 0.6) p = 0.5; // tem a parte, mas não é a carta do objetivo
          else p = 0;
          if (p < 3) faltaCombo.push(D.categorias[k].nome + ': ' + rec.map(function (c) { return POR_COD[c].titulo + ' (' + c + ')'; }).join(' ou '));
        }
        comboPts += p;
      });
      var ct = coberturaTema(obj.tTit, ps), cd = coberturaTema(obj.tDes, ps);
      var temaFrac = obj.tDes.length ? 0.65 * ct.frac + 0.35 * Math.min(1, 1.6 * cd.frac) : ct.frac;
      var famPrompt = {};
      if (verbo && FAMILIA[verbo]) famPrompt[FAMILIA[verbo]] = 1;
      porCat.T.forEach(function (c) { var f = familiaDe(c.verbo); if (f) famPrompt[f] = 1; });
      var tarefaCombo = !obj.livre && porCat.T.some(function (c) { return (obj.o.combo.T || []).indexOf(c.cod) >= 0; });
      var famPrincipal = obj.acoes.some(function (f) { return famPrompt[f]; });
      var famSecundaria = obj.secundarias.some(function (f) { return famPrompt[f]; });
      var cartaTForaCombo = !obj.livre && porCat.T.length > 0 && !tarefaCombo;
      var acao;
      if (tarefaCombo) acao = 6;
      else if (obj.livre) acao = (famPrincipal || famSecundaria) ? 6 : temTarefa ? 4 : 0;
      else if (cartaTForaCombo) acao = famPrincipal ? 2.5 : 0.5; // carta de Tarefa que não é a do objetivo
      else acao = famPrincipal ? 6 : famSecundaria ? 4 : temTarefa ? 2 : 0;
      var faltamTema = ct.faltam.concat(cd.faltam).slice(0, 5);
      objetivo = [
        sub(obj.livre ? 'Uma carta (ou parte) de cada categoria' : 'Cartas do combo recomendado', comboPts, 12,
          obj.livre ? 'Use Persona, Contexto, Tarefa e Formato: uma de cada.' :
            'Cartas recomendadas para o seu objetivo → ' + faltaCombo.join(' · ') + '.'),
        sub('Tema do objetivo aparece no prompt', 12 * temaFrac, 12,
          faltamTema.length ? 'Escreva uma frase com o tema do seu objetivo. Faltam palavras como: ' + faltamTema.join(', ') + '.' : 'Escreva uma frase dizendo o tema do seu objetivo.'),
        sub('A ação pedida é a do objetivo', acao, 6,
          'A tarefa do prompt deve ser a ação do objetivo (' + obj.acoes.join(', ') + ').')
      ];
    }

    // ===== 6. QUALIDADE DA RESPOSTA ESPERADA (9) =====
    var estrutura = /\b(tabela|lista|topicos|passo a passo|etapas|colunas|roteiro|quiz|dialogo|historia|cronograma)\b/.test(n);
    var nQual = casaUnicos(QUALIDADE_RE, n), nCuid = casaUnicos(CUIDADO_RE, n);
    var qualidade = [
      sub('Quantidades ou limites com números', quant > 0 ? 2.5 : estrutura ? 1.3 : 0, 2.5,
        'Use números: "5 itens", "até 150 palavras", "3 perguntas".'),
      sub('Pede profundidade (exemplos, etapas, critérios)', nQual >= 3 ? 2.5 : nQual === 2 ? 2 : nQual === 1 ? 1.2 : 0, 2.5,
        'Peça exemplos, etapas, justificativas, critérios ou pontos fortes e fracos.'),
      sub('Diz para quem é a resposta', temPublico ? 2 : 0, 2,
        'Diga para quem é a resposta: idade, turma ou tipo de público.'),
      sub('Define cuidados e limites', nCuid >= 2 ? 2 : nCuid === 1 ? 1.2 : 0, 2,
        'Diga o que evitar ou cuidar: "evite termos técnicos", "com segurança", "se não souber, diga".')
    ];

    // ===== 7. CRIATIVIDADE (9) =====
    var nCria = casaUnicos(CRIATIVO_RE, n);
    var criatividade = [
      sub('Combina as quatro partes', [0, 0.6, 1.5, 2.3, 3][nPartes], 3,
        'Combine as quatro partes: Persona, Contexto, Tarefa e Formato.'),
      sub('Recursos criativos', nCria === 0 ? 0 : nCria === 1 ? 2 : nCria === 2 ? 3 : 4, 4,
        'Use um recurso criativo: analogia, história, desafio, cenário imaginário ou quiz.'),
      sub('Vocabulário variado', S.length < 12 ? 0.5 : ttr >= 0.75 ? 2 : ttr >= 0.6 ? 1.4 : ttr >= 0.45 ? 0.7 : 0, 2,
        'Varie as palavras e traga ideias diferentes em cada trecho.')
    ];

    // ===== 8. EFICIÊNCIA NO USO DAS CARTAS (9) =====
    var eficiencia;
    if (usadas.length) {
      var vistasCat = {}, util = 0;
      usadas.slice().sort(function (a, b) {
        var ra = obj && !obj.livre && (obj.o.combo[a.cat] || []).indexOf(a.cod) >= 0 ? 0 : 1;
        var rb = obj && !obj.livre && (obj.o.combo[b.cat] || []).indexOf(b.cod) >= 0 ? 0 : 1;
        return ra - rb;
      }).forEach(function (c) {
        var primeira = !vistasCat[c.cat]; vistasCat[c.cat] = 1;
        var u;
        if (conflitoCod[c.cod]) u = 0;
        else if (obj && !obj.livre) {
          var noC = (obj.o.combo[c.cat] || []).indexOf(c.cod) >= 0;
          u = noC ? 1 : CORINGA[c.cod] ? (primeira ? 0.75 : 0.3) : (primeira ? 0.5 : 0.25);
        } else u = primeira ? 1 : 0.5;
        util += u;
      });
      var nCatU = catsCartas.length, mediaPts = usadas.reduce(function (a, c) { return a + c.pts; }, 0) / usadas.length;
      eficiencia = [
        sub('Cada carta soma ao prompt', 4 * util / usadas.length, 4,
          obj && !obj.livre ? 'Use cartas do combo do seu objetivo e deixe de fora as que não ajudam.' : 'Use uma carta de cada categoria; cartas repetidas da mesma categoria somam pouco.'),
        sub('Variedade de categorias por carta', 3 * (nPartes / 4) * (nCatU / usadas.length), 3,
          'Menos cartas e mais categorias: o ideal é uma carta de cada um dos 4 quadrantes.'),
        sub('Força das cartas usadas', clamp(1 + (mediaPts - 15) / 15, 0, 2), 2,
          'Cartas com mais pontos (+25, +30) trazem instruções mais ricas.')
      ];
    } else {
      var dens = nP ? nD / nP : 0;
      eficiencia = [
        sub('Informação em cada palavra', (dens >= 0.55 ? 4 : dens >= 0.45 ? 3 : dens >= 0.35 ? 2 : 1) * Math.min(1, nD / 12), 4,
          'Corte palavras que não acrescentam e troque por detalhes úteis.'),
        sub('Partes cobertas', 0.75 * nPartes, 3, 'Cubra as quatro partes do prompt.'),
        sub('Tamanho enxuto', nP < 15 ? 2 * nP / 15 : nP <= 160 ? 2 : nP <= 260 ? 1.5 : 1, 2, 'Seja direto: diga tudo o que importa, sem enrolar.')
      ];
    }

    // ---------- soma e escala ----------
    var criterios = [
      { id: 'clareza', nome: 'Clareza das instruções', subs: clareza },
      { id: 'organizacao', nome: 'Organização e estrutura', subs: organizacao },
      { id: 'completude', nome: 'Completude das informações', subs: completude },
      { id: 'coerencia', nome: 'Coerência entre as partes', subs: coerencia }
    ];
    if (objetivo) criterios.push({ id: 'objetivo', nome: 'Adequação ao objetivo secreto', subs: objetivo });
    criterios.push({ id: 'qualidade', nome: 'Qualidade da resposta esperada', subs: qualidade });
    criterios.push({ id: 'criatividade', nome: 'Criatividade', subs: criatividade });
    criterios.push({ id: 'eficiencia', nome: usadas.length ? 'Eficiência no uso das cartas' : 'Eficiência (sem cartas: economia de palavras)', subs: eficiencia });
    criterios.forEach(function (c) {
      c.pts = r1(c.subs.reduce(function (t, s) { return t + s.pts; }, 0));
      c.max = c.subs.reduce(function (t, s) { return t + s.max; }, 0);
    });
    var total = criterios.reduce(function (t, c) { return t + c.pts; }, 0);
    var totalMax = criterios.reduce(function (t, c) { return t + c.max; }, 0);
    var nota = 100 * total / totalMax;
    // o gabarito do objetivo vale 100: a nota é medida em relação a ele
    var bruta = r1(nota), referencia = null;
    if (obj && !opcoes._bruto) {
      referencia = notaBrutaGabarito(obj.cod);
      if (referencia) nota = Math.min(100, nota * 100 / referencia);
    }
    if (objetivo) aderencia = r1(100 * criterios.filter(function (c) { return c.id === 'objetivo'; })[0].pts / 30);

    // ---------- tetos ----------
    var letras = (n.match(/[a-z]/g) || []).length, semEsp = n.replace(/\s/g, '').length || 1;
    var semVogal = P.filter(function (w) { return w.length >= 4 && !/[aeiou]/.test(w) && !/^\d+$/.test(w); }).length;
    var semSentido = (letras / semEsp < 0.6) || (nP && semVogal / nP >= 0.3);
    var maiusc = (texto.match(/[A-ZÀ-Ú]/g) || []).length, minusc = (texto.match(/[a-zà-ú]/g) || []).length;
    if (nP < 5) { nota = Math.min(nota, 15); avisos.push('Prompt muito curto: nota limitada a 15.'); }
    if (!temTarefa) { nota = Math.min(nota, 40); avisos.push('Nenhuma tarefa identificada: nota limitada a 40.'); }
    if (semSentido) { nota = Math.min(nota, 20); avisos.push('Texto sem sentido aparente: nota limitada a 20.'); }
    if (nP > 3 && maiusc / Math.max(1, maiusc + minusc) > 0.7) { nota = Math.max(0, nota - 5); avisos.push('Texto quase todo em maiúsculas: −5 pontos.'); }
    if (contra.length >= 2) { nota = Math.min(nota, 59); }
    if (contra.length) avisos.push('Instruções contraditórias (' + contra.join('; ') + '): o prompt não pode ser considerado claro.');
    if (enchimento) avisos.push('Repetição excessiva de palavras ou frases.');
    if (nP > 350) avisos.push('Prompt muito longo (mais de 350 palavras): prefira ser direto.');

    // ---------- avisos sobre as regras de cartas ----------
    CATS.forEach(function (k) {
      if (porCat[k].length > 2) avisos.push('Você usou ' + porCat[k].length + ' cartas de ' + D.categorias[k].nome + ': o limite do jogo é 2 por categoria.');
    });
    if (usadas.length > 8) avisos.push('Mais de 8 cartas: só vale com a carta Dupla Criatividade (SOR-06), que permite até 10.');
    det.naoAchadas.forEach(function (c) { avisos.push('A carta ' + c.cod + ' (' + c.titulo + ') foi marcada, mas o texto dela não aparece no prompt: não foi contada.'); });

    nota = r1(clamp(nota, 0, 100));
    var clarezaC = criterios[0];
    var claro = nota >= 60 && clarezaC.pts >= 0.6 * clarezaC.max && contra.length === 0;
    var faixa = nota >= 90 ? 'Excelente' : nota >= 75 ? 'Muito bom' : nota >= 60 ? 'Bom' : nota >= 40 ? 'Regular' : 'Fraco';

    var dicas = [];
    criterios.forEach(function (c) {
      c.subs.forEach(function (s) {
        var perda = (s.max - s.pts) * (c.id === 'objetivo' ? 1.2 : 1);
        if (s.max - s.pts >= 0.8 && s.dica) dicas.push({ perda: perda, texto: s.dica, crit: c.nome });
      });
    });
    dicas.sort(function (a, b) { return b.perda - a.perda; });
    if (nota >= 100) dicas = [];

    return {
      nota: nota, faixa: faixa, claro: claro, criterios: criterios, avisos: unicos(avisos), dicas: dicas.slice(0, 4),
      bruta: bruta, referencia: referencia,
      aderencia: aderencia, comObjetivo: !!obj, objetivo: obj ? { cod: obj.cod, titulo: obj.titulo } : null,
      cartas: usadas.map(function (c) { return { cod: c.cod, titulo: c.titulo, cat: c.cat, pts: c.pts }; }),
      categorias: catsCartas.length
    };
  }

  // monta o texto do prompt a partir das cartas, na ordem do tabuleiro
  function montarPrompt(cods) {
    return CATS.map(function (k) {
      return cods.map(function (c) { return POR_COD[c]; }).filter(function (c) { return c && c.cat === k; })
        .map(function (c) { return c.texto; }).join('\n');
    }).filter(Boolean).join('\n');
  }

  // gabarito do professor: prompt-modelo de nota máxima do objetivo (frase do tema antes da Tarefa).
  // A pontuação do gabarito é a referência que vale 100 para aquele objetivo.
  var cacheGab = {}, cacheBruta = {};
  function textoGabarito(g) {
    var linhas = montarPrompt(g.cartas).split('\n'), iT = -1;
    linhas.forEach(function (l, i) { if (iT < 0 && CARTAS.some(function (c) { return c.cat === 'T' && c.texto === l; })) iT = i; });
    linhas.splice(iT < 0 ? linhas.length : iT, 0, g.frase);
    return linhas.join('\n');
  }
  function notaBrutaGabarito(cod) {
    var g = (D.gabaritos || {})[cod];
    if (!g) return null;
    if (!(cod in cacheBruta)) cacheBruta[cod] = avaliar(textoGabarito(g), { objetivo: cod, temaProfessor: g.tema, _bruto: true }).nota;
    return cacheBruta[cod];
  }
  function gabarito(cod) {
    var g = (D.gabaritos || {})[cod];
    if (!g) return null;
    if (cacheGab[cod]) return cacheGab[cod];
    var texto = textoGabarito(g);
    var r = avaliar(texto, { objetivo: cod, temaProfessor: g.tema });
    cacheGab[cod] = { cod: cod, cartas: g.cartas, frase: g.frase, tema: g.tema || null, texto: texto, nota: r.nota, faixa: r.faixa, aderencia: r.aderencia };
    return cacheGab[cod];
  }

  return {
    avaliar: avaliar, detectarCartas: detectarCartas, montarPrompt: montarPrompt, gabarito: gabarito,
    cartas: CARTAS, porCodigo: POR_COD, objetivos: D.objetivos, pesos: PESOS, _interno: { classificar: classificar, frasesDe: frasesDe, norm: norm }
  };
})(typeof PROMPT_AGIL !== 'undefined' ? PROMPT_AGIL : require('./cartas.js'));
if (typeof module !== 'undefined') module.exports = Validador;
