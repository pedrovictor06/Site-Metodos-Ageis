/* Prompt Ágil – navegação, validador e placar (funciona 100% offline) */
(function () {
  // ---------- Navegação por abas ----------
  var secoes = document.querySelectorAll('main section');
  var botoesNav = document.querySelectorAll('nav button[data-go]');
  var ORDEM = Array.prototype.map.call(botoesNav, function (b) { return b.dataset.go; });
  var navEl = document.getElementById('abas'), navWrap = document.getElementById('navwrap');
  var setaEsq = document.getElementById('setaEsq'), setaDir = document.getElementById('setaDir');
  secoes.forEach(function (s) { s.setAttribute('role', 'tabpanel'); });
 
  function rotulo(id) {
    var r = document.querySelector('nav button[data-go="' + id + '"] .rot');
    return r ? r.textContent : id;
  }
  function atualizaSetas() {
    var max = navEl.scrollWidth - navEl.clientWidth;
    setaEsq.hidden = !(navEl.scrollLeft > 4);
    setaDir.hidden = !(navEl.scrollLeft < max - 4);
  }
  function rolar(dx) {
    if (navEl.scrollBy) navEl.scrollBy({ left: dx, behavior: 'smooth' }); else navEl.scrollLeft += dx;
  }
  setaEsq.onclick = function () { rolar(-Math.max(160, navEl.clientWidth * 0.6)); };
  setaDir.onclick = function () { rolar(Math.max(160, navEl.clientWidth * 0.6)); };
  navEl.addEventListener('scroll', atualizaSetas);
  window.addEventListener('resize', atualizaSetas);
 
  function centraAba(b) {
    var alvo = b.offsetLeft - (navEl.clientWidth - b.offsetWidth) / 2;
    if (navEl.scrollTo) navEl.scrollTo({ left: alvo, behavior: 'smooth' }); else navEl.scrollLeft = alvo;
  }
  function desenharPassos(id) {
    var i = ORDEM.indexOf(id), ant = ORDEM[i - 1], prox = ORDEM[i + 1];
    document.getElementById('passos').innerHTML =
      (ant ? '<button class="btn secondary" data-go="' + ant + '">← ' + rotulo(ant) + '</button>' : '<span></span>') +
      '<span class="pos">Aba ' + (i + 1) + ' de ' + ORDEM.length + '</span>' +
      (prox ? '<button class="btn" data-go="' + prox + '">' + rotulo(prox) + ' →</button>' : '<span></span>');
  }
  function ir(id, doHistorico, semFoco) {
    if (ORDEM.indexOf(id) < 0) return;
    secoes.forEach(function (s) { s.classList.toggle('active', s.id === id); });
    botoesNav.forEach(function (b) {
      var ativo = b.dataset.go === id;
      b.setAttribute('aria-selected', ativo ? 'true' : 'false');
      if (ativo) { b.setAttribute('aria-current', 'page'); centraAba(b); } else b.removeAttribute('aria-current');
    });
    desenharPassos(id);
    window.scrollTo(0, 0);
    if (!semFoco) {
      var h = document.querySelector('#' + id + ' h2');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    if (id === 'placar') desenharPlacar();
    if (!doHistorico) { try { history.pushState(null, '', '#' + id); } catch (e) {} }
    setTimeout(atualizaSetas, 350);
  }
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-go]');
    if (alvo) ir(alvo.dataset.go);
  });
  // setas do teclado entre as abas
  navEl.addEventListener('keydown', function (e) {
    var i = ORDEM.indexOf(document.querySelector('main section.active').id), n = null;
    if (e.key === 'ArrowRight') n = Math.min(ORDEM.length - 1, i + 1);
    else if (e.key === 'ArrowLeft') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = ORDEM.length - 1;
    if (n === null) return;
    e.preventDefault(); ir(ORDEM[n]); botoesNav[n].focus();
  });
  // botão Voltar/Avançar do navegador e links com #aba
  window.addEventListener('popstate', function () {
    var id = location.hash.slice(1);
    ir(ORDEM.indexOf(id) >= 0 ? id : 'inicio', true);
  });
 
  // ---------- Acessibilidade ----------
  var tam = 18;
  function aplicaTam() { document.documentElement.style.setProperty('--fs', tam + 'px'); }
  document.getElementById('aMais').onclick = function () { tam = Math.min(26, tam + 2); aplicaTam(); };
  document.getElementById('aMenos').onclick = function () { tam = Math.max(14, tam - 2); aplicaTam(); };
  var btnC = document.getElementById('contraste');
  btnC.onclick = function () {
    var on = document.body.classList.toggle('contrast');
    btnC.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
 
  /*ENGINE-START*/
  // =====================================================================
  //  MOTOR DE AVALIAÇÃO (offline, determinístico)
  // =====================================================================
  var STOP = {};
  ('a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sobre entre ate ao aos e ou mas que se como mais menos ' +
   'muito muita muitos muitas ser estar ter ha foi sao seu sua seus suas meu minha meus minhas isso isto esse essa esses essas este esta ' +
   'estes estas ele ela eles elas eu voce voces nos me te lhe pelo pela pelos pelas num numa quando onde qual quais ja tambem so apenas').split(' ')
    .forEach(function (w) { STOP[w] = 1; });
 
  function norm(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function palavras(t) { return norm(t).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean); }
  var SUF = ['coes', 'cao', 'mente', 'idades', 'idade', 'ando', 'endo', 'indo', 'ados', 'adas', 'ado', 'ada', 'idos', 'idas', 'ido', 'ida', 'ar', 'er', 'ir', 'es', 's'];
  function radical(w) {
    for (var i = 0; i < SUF.length; i++) {
      var s = SUF[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) return w.slice(0, -s.length);
    }
    return w;
  }
  function stems(t) {
    return palavras(t).filter(function (w) { return w.length > 2 && !STOP[w]; }).map(radical);
  }
  function igual(a, b) {
    if (a === b) return true;
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i >= 5 || (n >= 5 && i >= n - 1 && i >= 4);
  }
  function unicos(arr) { var o = {}; arr.forEach(function (x) { o[x] = 1; }); return Object.keys(o); }
  function conta(res, n) { return res.filter(function (r) { return r.test(n); }).length; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
 
  // verbos de ação por categoria (formas normalizadas)
  var CATV = {
    criar: 'crie criar elabore elaborar gere gerar monte montar desenvolva desenvolver escreva escrever redija redigir produza produzir construa construir planeje planejar projete projetar proponha propor componha compor',
    explicar: 'explique explicar ensine ensinar descreva descrever defina definir esclareca esclarecer detalhe detalhar apresente apresentar ilustre ilustrar',
    resumir: 'resuma resumir sintetize sintetizar condense condensar',
    comparar: 'compare comparar diferencie diferenciar contraste contrastar',
    analisar: 'analise analisar avalie avaliar examine examinar diagnostique critique criticar identifique identificar classifique classificar',
    corrigir: 'corrija corrigir reescreva reescrever melhore melhorar ajuste ajustar edite editar revise revisar',
    traduzir: 'traduza traduzir converta converter transforme transformar',
    listar: 'liste listar enumere enumerar sugira sugerir recomende recomendar indique indicar',
    calcular: 'calcule calcular resolva resolver estime estimar',
    simular: 'simule simular atue atuar interprete interpretar finja',
    outros: 'faca fazer fale falar diga dizer conte contar mostre mostrar responda responder ajude ajudar escolha escolher ordene ordenar organize organizar priorize priorizar estruture estruturar simplifique simplificar expanda expandir amplie ampliar reduza reduzir otimize otimizar teste testar valide validar verifique verificar implemente implementar programe programar'
  };
  // substantivos que indicam a mesma intenção (ex.: "plano", "resumo")
  var CATN = {
    criar: 'plano roteiro', explicar: 'explicacao', resumir: 'resumo sintese', comparar: 'comparacao',
    analisar: 'analise', corrigir: 'correcao', traduzir: 'traducao', listar: 'lista', calcular: 'calculo', simular: 'simulacao'
  };
  var VERBOS = {}, CATMAP = [];
  Object.keys(CATV).forEach(function (c) {
    CATV[c].split(' ').forEach(function (v) { VERBOS[v] = 1; CATMAP.push([v, c]); });
  });
  Object.keys(CATN).forEach(function (c) { CATN[c].split(' ').forEach(function (v) { CATMAP.push([v, c]); }); });
 
  function categorias(t) {
    var achou = {};
    palavras(t).forEach(function (w) {
      if (w.length < 4) return;
      var s = radical(w);
      CATMAP.forEach(function (p) {
        if (p[1] !== 'outros' && (w === p[0] || (p[0].length >= 5 && igual(s, radical(p[0]))))) achou[p[1]] = 1;
      });
    });
    return Object.keys(achou);
  }
 
  // detectores de componentes (sobre texto normalizado)
  var PERSONA_RE = /\b(atue como|aja como|haja como|voce e (um|uma|o|a)|assuma (o )?papel|no papel de|na pele de|seja (um|uma)|como (um|uma) (professor|professora|especialista|analista|consultor|consultora|engenheiro|engenheira|medico|medica|advogado|advogada|cientista|redator|redatora|tutor|tutora|mentor|mentora|chef|desenvolvedor|desenvolvedora|designer|historiador|historiadora|jornalista|psicologo|psicologa|economista|escritor|escritora|revisor|revisora|programador|programadora)|persona|finja ser|interprete (um|uma|o|a)|simule (um|uma|o|a))\b/;
  var CTX = [
    /\b(estou|estamos)\b/, /\b(sou|somos)\b/, /\b(preciso|precisamos|quero|queremos|gostaria)\b/,
    /\b(meu|minha|meus|minhas|nosso|nossa|nossos|nossas)\b/,
    /\b(projeto|trabalho|prova|aula|curso|disciplina|faculdade|escola|empresa|cliente|apresentacao|reuniao|site|aplicativo|app|sistema|jogo)\b/,
    /\b(contexto|situacao|cenario|considerando|dado que|levando em conta|a seguir|abaixo|texto|dados|trecho|documento)\b/,
    /\b(porque|pois|para que|para poder|com o objetivo|com a finalidade|objetivo)\b/
  ];
  var CTX_ORDEM = /\b(estou|estamos|sou|somos|preciso|precisamos|quero|queremos|meu|minha|nosso|nossa|projeto|contexto|situacao|cenario|considerando)\b/;
  var PUBLICO_RE = /\b(para (um|uma|o|a|os|as) (iniciante|leigo|leiga|crianca|adolescente|aluno|aluna|estudante|professor|professora|especialista|executivo|cliente|usuario|usuaria|idoso|jovem|publico|leitor|equipe|time|gerente|diretor|profissional|turma|candidato)s?|publico alvo|audiencia|leitores?|iniciantes?|leigos?|criancas?|adolescentes?|alunos?|estudantes?|nivel (basico|iniciante|intermediario|avancado)|\d+ anos|ensino (fundamental|medio|superior)|ingressantes|calouros)\b/;
  var FORMATO_RE = /\b(topicos?|lista|tabela|paragrafos?|passos?|etapas?|passo a passo|json|csv|markdown|codigo|esquema|roteiro|checklist|bullets?|itens|titulos?|subtitulos?|numerad[oa]s?|formato|estrutura|mapa mental|fluxograma|slides?|email|carta|poema|resumo|quiz|perguntas|questoes|colunas|linhas|frases|palavras|caracteres|gabarito)\b/g;
  var QUANT_RE = /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|doze|quinze|vinte|trinta)\s+(palavras|linhas|frases|topicos|itens|paragrafos|passos|exemplos|opcoes|minutos|semanas|dias|anos|questoes|perguntas|etapas|dicas|ideias|slides|pontos|caracteres|horas|meses|alternativas|bullets|sugestoes|titulos)\b|\b(ate|no maximo|no minimo|maximo de|minimo de|exatamente)\s+\d+\b/g;
  var RESTR = [
    /\b(tom|linguagem|formal|informal|simples|didatic[oa]|objetiv[oa]|conciso|concisa|criativ[oa]|tecnic[oa]|amigavel|serio|descontraid[oa]|motivador|empatic[oa]|neutro|profissional)\b/,
    /\b(ate \d+|no maximo|no minimo|exatamente \d+|limite|limitad[oa] a)\b/,
    /\b(evite|nao use|nao inclua|sem (jargoes?|termos tecnicos|girias|exemplos|copiar|plagio)|nunca|proibido)\b/,
    /\b(apenas|somente|use somente|baseie-se|mantenha|preserve|nao invente)\b/,
    /\b(em (portugues|ingles|espanhol)|portugues do brasil)\b/
  ];
  var VAGAS = {};
  'coisa coisas algo isso isto aquilo tudo qualquer bom boa legal massa etc interessante bonito bonita bacana normal tipo negocio trem'.split(' ')
    .forEach(function (w) { VAGAS[w] = 1; });
  var VAGAS_MULTI = /\b(mais ou menos|sei la|alguma coisa|um pouco|do jeito que)\b/g;
  var QUALIDADE = [
    /\b(justifique|justificativa|explique (por que|o porque)|por que)\b/,
    /\b(com base em|baseado em|baseando-se|fundamente|evidencias?|fontes?|referencias?|cite)\b/,
    /\b(exemplos? (praticos?|concretos?|reais|do dia a dia)|analogia|exemplo)\b/,
    /\b(passo a passo|etapa por etapa|em etapas)\b/,
    /\b(vantagens|desvantagens|pros e contras|criterios|compare|comparando)\b/,
    /\b(verifique|valide|confira|revise (sua|a) resposta|autoavalie|checklist)\b/,
    /\b(gabarito|resposta correta|solucao)\b/
  ];
  var GUARDA = [
    /\b(evite|nao use|nao inclua|nunca|proibido|nao repita|sem (jargoes?|termos tecnicos|girias|rodeios|enrolacao))\b/,
    /\b(apenas|somente|use apenas|limite-se|restrinja-se|mantenha|preserve|respeite)\b/,
    /\b(nao invente|nao assuma|nao suponha)\b/
  ];
  var INCERTEZA = /\b(se nao (souber|tiver certeza|houver|encontrar)|nao invente|indique (a )?(incerteza|duvida)|diga quando|admita|apenas (com base|no texto|nos dados)|somente (com base|no texto|nos dados)|baseie-se|fontes?|cite)\b/;
  var CRIATIVO = /\b(analogia|metafora|imagine|cenario|historia|narrativa|como se|personagem|desafio|gamifi\w+|jogo|mnemonico|rima|humor|inesperad[oa]|criativ[oa]|original|inovador|inovadora|storytelling|dialogo|simulacao|simule|role ?play|quiz|charada|enigma|desafie)\b/g;
  var CONTRADICOES = [
    [/\b(curto|curta|curtos|curtas|breve|resumid[oa]|conciso|concisa|sucinto|sucinta)\b/, /\b(detalhad[oa]|extens[oa]|completo|completa|aprofundad[oa]|longo|longa)\b/, 'curto x detalhado'],
    [/\b(formal)\b/, /\b(informal|descontraid[oa]|coloquial|giria)\b/, 'formal x informal'],
    [/\bsem exemplos?\b/, /\b(com exemplos?|inclua exemplos?|de exemplos?)\b/, 'sem exemplos x com exemplos'],
    [/\bsem codigo\b/, /\b(inclua|com|escreva|mostre) codigo\b/, 'sem código x com código']
  ];
 
  function ptsFmt(x) { return Math.round(x * 10) / 10; }
  function sub(nome, pts, max, dica) { return { nome: nome, pts: clamp(pts, 0, max), max: max, dica: dica }; }
  function soma(subs) { return subs.reduce(function (t, s) { return t + s.pts; }, 0); }
  function somaMax(subs) { return subs.reduce(function (t, s) { return t + s.max; }, 0); }
 
  // ---- aderência ao objetivo secreto (0 a 100) ----
  function aderenciaObjetivo(prompt, objetivo) {
    var oAll = palavras(objetivo).filter(function (w) { return w.length > 2 && !STOP[w]; });
    var oSem = oAll.filter(function (w) { return !VERBOS[w]; });
    var oTok = unicos((oSem.length ? oSem : oAll).map(radical));
    var pAll = unicos(stems(prompt));
    var peso = function (w) { return w.length >= 7 ? 2 : 1; };
    var tot = 0, ach = 0, faltam = [];
    oTok.forEach(function (o) {
      tot += peso(o);
      if (pAll.some(function (p) { return igual(o, p); })) ach += peso(o); else faltam.push(o);
    });
    var cobertura = tot ? ach / tot : 0;
    var co = categorias(objetivo), cp = categorias(prompt);
    var temCat = co.length > 0;
    var categoria = temCat ? (co.some(function (c) { return cp.indexOf(c) >= 0; }) ? 1 : 0) : 0.6;
    var todosO = unicos(oAll.map(radical));
    var casados = pAll.filter(function (p) { return todosO.some(function (o) { return igual(o, p); }); }).length;
    var foco = pAll.length ? clamp((casados / pAll.length) / 0.2, 0, 1) : 0;
    var acao = categoria * (0.25 + 0.75 * Math.min(1, cobertura * 2));
    var pct = 100 * (0.7 * cobertura + 0.15 * acao + 0.15 * foco);
    return { pct: pct, cobertura: cobertura, categoria: categoria, acao: acao, foco: foco, faltam: faltam, temCategoria: temCat };
  }
 
  function avaliar(texto, objetivo) {
    var n = norm(texto), P = palavras(texto), nP = P.length;
    var S = stems(texto), D = unicos(S), nD = D.length;
    var comObj = !!(objetivo && stems(objetivo).length >= 2);
    var avisos = [];
 
    // --- tarefa ---
    var idxV = -1;
    for (var i = 0; i < P.length; i++) { if (VERBOS[P[i]]) { idxV = i; break; } }
    var pergunta = /^\s*(como|qual|quais|quem|onde|quando|por que|porque|o que|quanto|quantos|quantas)\b/.test(n) || /\?\s*$/.test(texto.trim());
    var temTarefa = idxV >= 0 || pergunta;
 
    // ===== 1. CLAREZA (20) =====
    var apos = idxV >= 0 ? P.slice(idxV + 1, idxV + 13) : P.slice(0, 12);
    var objN = apos.filter(function (w) { return w.length > 2 && !STOP[w] && !VAGAS[w] && !VERBOS[w]; }).length;
    var vagas = P.filter(function (w) { return VAGAS[w]; }).length + (n.match(VAGAS_MULTI) || []).length;
    var frases = texto.split(/[.!?\n;]+/).map(function (f) { return palavras(f).length; }).filter(function (x) { return x > 0; });
    var media = frases.length ? frases.reduce(function (a, b) { return a + b; }, 0) / frases.length : 0;
    var cl = [
      sub('Verbo de ação claro', idxV >= 0 ? (idxV <= 5 ? 5 : idxV <= 15 ? 4 : 3) : (pergunta ? 3 : 0), 5,
          'Comece pela ação, com um verbo no imperativo: "Explique…", "Crie…", "Compare…".'),
      sub('Objeto da tarefa definido', Math.min(7, objN * 1.75), 7,
          'Diga exatamente sobre o quê é a tarefa, com pelo menos quatro termos concretos logo após o verbo.'),
      sub('Sem termos vagos', vagas === 0 ? 4 : vagas === 1 ? 2.5 : vagas === 2 ? 1 : 0, 4,
          'Troque palavras vagas ("coisa", "algo", "isso", "bom", "legal") por detalhes concretos.'),
      sub('Frases de tamanho adequado', media === 0 ? 0 : nP < 8 ? 4 * nP / 8 : media <= 28 ? 4 : media <= 40 ? 2.5 : 1, 4,
          'Use frases completas, com até 28 palavras. Prompts muito curtos não dão informação suficiente.')
    ];
 
    // ===== 2. COMPLETUDE (20) =====
    var temPersona = PERSONA_RE.test(n);
    var ctxN = conta(CTX, n), ctxF = ctxN >= 3 ? 1 : ctxN === 2 ? 0.75 : ctxN === 1 ? 0.4 : 0;
    var temPublico = PUBLICO_RE.test(n);
    var fm = unicos(n.match(FORMATO_RE) || []).length, quant = unicos(n.match(QUANT_RE) || []);
    var fmtF = (quant.length > 0 || fm >= 2) ? 1 : fm === 1 ? 0.6 : 0;
    var rN = conta(RESTR, n), rF = rN >= 3 ? 1 : rN === 2 ? 0.7 : rN === 1 ? 0.4 : 0;
    var mult = nD < 5 ? 0.6 : nD < 9 ? 0.85 : 1;
    var co = [
      sub('Tarefa', temTarefa ? 4 : 0, 4, 'Peça uma ação clara à IA.'),
      sub('Contexto', 4 * ctxF * mult, 4, 'Explique a situação: quem você é, para que precisa e o material de partida.'),
      sub('Persona', temPersona ? 3 * mult : 0, 3, 'Diga quem a IA deve ser: "Atue como um professor de…".'),
      sub('Público', temPublico ? 3 * mult : 0, 3, 'Diga para quem é a resposta: idade, nível ou função.'),
      sub('Formato', 3 * fmtF * mult, 3, 'Peça o formato e o tamanho: "em tabela", "em 5 tópicos", "até 80 palavras".'),
      sub('Restrições e tom', 3 * rF * mult, 3, 'Defina tom, limites ou o que evitar: "linguagem simples", "evite jargões".')
    ];
 
    // ===== 3. COERÊNCIA (15) =====
    var iPer = n.search(PERSONA_RE), iCtx = n.search(CTX_ORDEM);
    var iPc = [iPer, iCtx].filter(function (x) { return x >= 0; }).sort(function (a, b) { return a - b; })[0];
    var iTar = idxV >= 0 ? n.search(new RegExp('\\b' + P[idxV] + '\\b')) : -1;
    var fMatch = n.search(new RegExp(FORMATO_RE.source));
    var pares = [];
    if (iPc !== undefined && iTar >= 0) pares.push(iPc <= iTar);
    if (iTar >= 0 && fMatch >= 0) pares.push(iTar <= fMatch || fMatch < 0);
    var ordem = pares.length ? 5 * pares.filter(Boolean).length / pares.length : 3;
    var linhas = texto.split('\n').filter(function (l) { return l.trim(); }).length;
    var marcadores = (texto.match(/^\s*([-*•]|\d+[.)])\s+/gm) || []).length;
    var rotulos = (texto.match(/^\s*[A-Za-zÀ-ú ]{3,24}:/gm) || []).length;
    var nFrases = frases.length;
    var estr = (rotulos >= 2 || marcadores >= 2 || linhas >= 3) ? 4 : (nFrases >= 2 || linhas >= 2) ? 2.5 : (media <= 30 ? 2.5 : 0.5);
    var contra = [];
    CONTRADICOES.forEach(function (c) { if (c[0].test(n) && c[1].test(n)) contra.push(c[2]); });
    var porUnidade = {};
    var qm, qre = /\b(\d+)\s+(topicos|itens|paragrafos|linhas|frases|passos|exemplos|palavras|questoes|perguntas)\b/g;
    while ((qm = qre.exec(n)) !== null) { (porUnidade[qm[2]] = porUnidade[qm[2]] || {})[qm[1]] = 1; }
    Object.keys(porUnidade).forEach(function (u) { if (Object.keys(porUnidade[u]).length > 1) contra.push('quantidades diferentes de ' + u); });
    var freq = {}; S.forEach(function (s) { freq[s] = (freq[s] || 0) + 1; });
    var maxF = 0; Object.keys(freq).forEach(function (k) { if (freq[k] > maxF) maxF = freq[k]; });
    var enchimento = (maxF >= 5 && nP < 80) || maxF >= 8;
    var ttr = S.length >= 12 ? nD / S.length : 1;
    var seguidas = /\b([a-z]{3,})\s+\1\b/.test(n);
    var vistas = {}, dupFrase = false;
    texto.split(/[.!?\n;]+/).forEach(function (f) { var k = palavras(f).join(' '); if (k.split(' ').length >= 3) { if (vistas[k]) dupFrase = true; vistas[k] = 1; } });
    if (dupFrase) enchimento = true;
    var rep = 3 - (enchimento ? 2 : 0) - (ttr < 0.5 && S.length >= 10 ? 1 : 0) - (seguidas ? 1 : 0);
    var prolixo = nP > 300;
    var ch = [
      sub('Ordem lógica (contexto, tarefa, formato)', ordem, 5, 'Organize assim: persona e contexto primeiro, depois a tarefa, por último formato e restrições.'),
      sub('Separação visual', estr - (prolixo ? 1 : 0), 4, 'Separe as partes em linhas, marcadores ou rótulos ("Contexto:", "Tarefa:", "Formato:").'),
      sub('Sem contradições', 3 - 1.5 * contra.length, 3, contra.length ? 'Há instruções que se contradizem (' + contra.join('; ') + '). Escolha uma.' : ''),
      sub('Sem repetição excessiva', rep, 3, 'Evite repetir as mesmas palavras. Cada frase deve trazer informação nova.')
    ];
 
    // ===== 5. POTENCIAL (15) =====
    var qN = conta(QUALIDADE, n), gN = conta(GUARDA, n);
    var po = [
      sub('Quantidades e limites mensuráveis', quant.length === 0 ? 0 : quant.length === 1 ? 2.5 : 4, 4,
          'Use números: "5 perguntas", "até 80 palavras", "em 4 semanas".'),
      sub('Critério de qualidade ou profundidade', qN === 0 ? 0 : qN === 1 ? 2 : qN === 2 ? 3.2 : 4, 4,
          'Peça justificativa, exemplos práticos, fontes, passo a passo ou comparação.'),
      sub('Limites e proibições claros', gN === 0 ? 0 : gN === 1 ? 2 : 3, 3,
          'Diga o que evitar ou o que manter: "evite jargões", "use apenas o texto abaixo".'),
      sub('Tratamento de incerteza', INCERTEZA.test(n) ? 2 : 0, 2,
          'Peça para a IA não inventar: "se não souber, diga" ou "cite as fontes".'),
      sub('Informação específica suficiente', nD >= 18 ? 2 : nD >= 12 ? 1.4 : nD >= 8 ? 0.8 : nD >= 5 ? 0.3 : 0, 2,
          'Acrescente detalhes concretos: nomes, temas, restrições e exemplos.')
    ];
 
    // ===== 6. CRIATIVIDADE (10) =====
    var comps = (temPersona ? 1 : 0) + (ctxF > 0 ? 1 : 0) + (temPublico ? 1 : 0) + (fmtF > 0 ? 1 : 0) + (rF > 0 ? 1 : 0);
    var cr = unicos(n.match(CRIATIVO) || []).length;
    var cria = [
      sub('Combinação de componentes distintos', [0, 0, 1.5, 3, 4.2, 5][comps], 5,
          'Combine mais elementos: persona, contexto, público, formato e restrições.'),
      sub('Recursos criativos', cr === 0 ? 0 : cr === 1 ? 1.8 : 3, 3,
          'Experimente uma analogia, um cenário, uma história ou um desafio para a IA.'),
      sub('Diversidade de vocabulário', S.length < 12 ? 0.5 : ttr >= 0.8 ? 2 : ttr >= 0.65 ? 1.4 : ttr >= 0.5 ? 0.7 : 0, 2,
          'Varie as palavras e traga ideias diferentes em cada trecho.')
    ];
 
    // ===== 4. ADEQUAÇÃO AO OBJETIVO (20) =====
    var ad = null, adeq = null;
    if (comObj) {
      ad = aderenciaObjetivo(texto, objetivo);
      adeq = [
        sub('Cobertura dos temas do objetivo', 14 * ad.cobertura, 14,
            ad.faltam.length ? 'Faltam no prompt temas do objetivo (radicais): ' + ad.faltam.slice(0, 5).join(', ') + '.' : ''),
        sub('Ação pedida compatível com o objetivo', 3 * ad.acao, 3, 'A ação do prompt (criar, resumir, comparar…) deve ser a mesma do objetivo.'),
        sub('Foco no objetivo', 3 * ad.foco, 3, 'Boa parte do prompt deve tratar do objetivo, sem desvios.')
      ];
    }
 
    var criterios = [
      { id: 'clareza', nome: 'Clareza das instruções', subs: cl },
      { id: 'completude', nome: 'Completude das informações', subs: co },
      { id: 'coerencia', nome: 'Coerência e organização', subs: ch }
    ];
    if (adeq) criterios.push({ id: 'objetivo', nome: 'Adequação ao objetivo secreto', subs: adeq });
    criterios.push({ id: 'potencial', nome: 'Potencial de resposta útil, precisa e relevante', subs: po });
    criterios.push({ id: 'criatividade', nome: 'Criatividade na combinação', subs: cria });
    criterios.forEach(function (c) { c.pts = soma(c.subs); c.max = somaMax(c.subs); });
 
    var total = criterios.reduce(function (t, c) { return t + c.pts; }, 0);
    var totalMax = criterios.reduce(function (t, c) { return t + c.max; }, 0);
    var nota = 100 * total / totalMax;
 
    // ---- tetos e penalidades ----
    var letras = (n.match(/[a-z]/g) || []).length, semEsp = n.replace(/\s/g, '').length || 1;
    var semVogal = P.filter(function (w) { return w.length >= 4 && !/[aeiou]/.test(w); }).length;
    var semSentido = (letras / semEsp < 0.7) || (nP && semVogal / nP >= 0.3);
    var maiusc = (texto.match(/[A-ZÀ-Ú]/g) || []).length, minusc = (texto.match(/[a-zà-ú]/g) || []).length;
    if (nP < 5) { if (nota > 15) { nota = 15; } avisos.push('Prompt muito curto: nota limitada a 15.'); }
    if (!temTarefa) { if (nota > 40) { nota = 40; } avisos.push('Nenhuma tarefa identificada: nota limitada a 40.'); }
    if (semSentido) { if (nota > 20) { nota = 20; } avisos.push('Texto sem sentido aparente: nota limitada a 20.'); }
    if (nP > 3 && maiusc / Math.max(1, maiusc + minusc) > 0.7) { nota = Math.max(0, nota - 5); avisos.push('Texto quase todo em maiúsculas: −5 pontos.'); }
    if (enchimento) avisos.push('Repetição excessiva de palavras detectada.');
    if (prolixo) avisos.push('Prompt muito longo (mais de 300 palavras): prefira ser direto.');
    nota = ptsFmt(clamp(nota, 0, 100));
 
    if (contra.length >= 2 && nota > 59) { nota = 59; }
    if (contra.length) avisos.push('Instruções contraditórias (' + contra.join('; ') + '): o prompt não pode ser considerado claro.');
    var clareza = criterios[0];
    var claro = nota >= 60 && clareza.pts >= 0.6 * clareza.max && contra.length === 0;
    var faixa = nota >= 90 ? 'Excelente' : nota >= 75 ? 'Muito bom' : nota >= 60 ? 'Bom' : nota >= 40 ? 'Regular' : 'Fraco';
 
    var dicas = [];
    criterios.forEach(function (c) {
      c.subs.forEach(function (s) { if (s.max - s.pts >= 1 && s.dica) dicas.push({ perda: s.max - s.pts, texto: s.dica, crit: c.nome }); });
    });
    dicas.sort(function (a, b) { return b.perda - a.perda; });
 
    return {
      nota: nota, faixa: faixa, claro: claro, criterios: criterios, avisos: avisos, dicas: dicas.slice(0, 4),
      aderencia: ad ? ptsFmt(ad.pct) : null, comObjetivo: comObj, escalado: !comObj
    };
  }
  /*ENGINE-END*/
 
  // =====================================================================
  //  INTERFACE DO VALIDADOR
  // =====================================================================
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  var ultima = null;
 
  $('modoJogo').onchange = function () {
    var on = this.checked;
    $('camposJogo').hidden = !on;
    $('objDica').textContent = on ? '(obrigatório no modo jogo)' : '(opcional no modo livre; usado para medir a aderência)';
  };
  $('verObj').onclick = function () {
    var oculto = $('objetivo').type === 'password';
    $('objetivo').type = oculto ? 'text' : 'password';
    this.textContent = oculto ? 'Ocultar' : 'Mostrar';
    this.setAttribute('aria-pressed', oculto ? 'true' : 'false');
  };
 
  function desenharResultado(r, jogo) {
    var h = '<div class="nota"><span class="num">' + fmt(r.nota) + '</span><span class="de">de 100 · ' + esc(r.faixa) + '</span>' +
      (r.aderencia !== null ? '<span class="de">· aderência ao objetivo: <strong>' + fmt(r.aderencia) + '%</strong></span>' : '') + '</div>';
    h += '<div class="veredito ' + (r.claro ? 'good' : 'bad') + '">' + (r.claro ? '✅ Seu prompt está claro' : '💡 Seu prompt pode melhorar') + '</div>';
    r.avisos.forEach(function (a) { h += '<p class="why">⚠ ' + esc(a) + '</p>'; });
    if (r.escalado) h += '<p class="why">Sem objetivo informado: a adequação não foi medida e os outros cinco critérios foram reescalados para 100.</p>';
    r.criterios.forEach(function (c) {
      var pct = c.max ? Math.round(100 * c.pts / c.max) : 0;
      h += '<div class="crit"><div class="crit-topo"><span>' + esc(c.nome) + '</span><span>' + fmt(c.pts) + ' / ' + c.max + '</span></div>' +
        '<div class="barra" role="img" aria-label="' + pct + '% dos pontos"><i style="width:' + pct + '%"></i></div>' +
        '<details><summary>Ver detalhes</summary><ul class="subs">';
      c.subs.forEach(function (s) {
        var cheio = s.pts >= s.max - 0.05, vazio = s.pts < 0.05;
        h += '<li><span class="' + (cheio ? 'ok' : vazio ? 'no' : 'meio') + '">' + (cheio ? '✔' : vazio ? '✖' : '◐') + '</span> ' + esc(s.nome) +
          ' <span class="why">(' + fmt(s.pts) + '/' + s.max + ')</span>' + (!cheio && s.dica ? '<span class="tip">' + esc(s.dica) + '</span>' : '') + '</li>';
      });
      h += '</ul></details></div>';
    });
    if (r.dicas.length) {
      h += '<div class="dicas"><strong>Como subir a nota</strong><ul>' +
        r.dicas.map(function (d) { return '<li>' + esc(d.texto) + '</li>'; }).join('') + '</ul></div>';
    }
    if (jogo) h += '<div class="acoes"><button class="btn" id="registrar">Registrar no placar</button></div>';
    return h;
  }
 
  $('validar').onclick = function () {
    var texto = $('entrada').value, obj = $('objetivo').value.trim(), jogo = $('modoJogo').checked, erros = [], meta = null;
    if (jogo) {
      var nome = $('nome').value.trim(), cartas = Number($('cartas').value), mov = Number($('mov').value);
      if (!nome) erros.push('Informe o nome do jogador.');
      if ($('cartas').value === '' || !Number.isInteger(cartas) || cartas < 1 || cartas > 8) erros.push('Cartas utilizadas: informe um número inteiro de 1 a 8 (limite do jogo).');
      if ($('mov').value === '' || !Number.isInteger(mov) || mov < 0 || mov > 16) erros.push('Movimentos restantes sem coleta: informe um número inteiro de 0 a 16.');
      if (stems(obj).length < 2) erros.push('Informe o objetivo secreto, com pelo menos duas palavras.');
      meta = { nome: nome, cartas: cartas, mov: mov };
    }
    if (!texto.trim()) erros.push('Escreva um prompt.');
    if (erros.length) {
      $('resultado').innerHTML = '<div class="erros"><strong>Confira antes de avaliar:</strong><ul>' + erros.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
      ultima = null; return;
    }
    var r = avaliar(texto, obj);
    ultima = { r: r, meta: meta };
    $('resultado').innerHTML = desenharResultado(r, jogo);
  };
  $('limpar').onclick = function () {
    $('entrada').value = ''; $('resultado').innerHTML = ''; ultima = null; $('entrada').focus();
  };
 
  // =====================================================================
  //  PLACAR (com critérios de desempate da regra 14)
  // =====================================================================
  var CHAVE = 'promptAgilPlacar', memoria = [];
  function lerPlacar() {
    try { var t = localStorage.getItem(CHAVE); if (t) return JSON.parse(t); } catch (e) {}
    return memoria;
  }
  function gravarPlacar(lista) {
    memoria = lista;
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (e) {}
  }
  function comparar(a, b) { // negativo se "a" fica acima de "b"
    if (b.nota !== a.nota) return b.nota - a.nota;
    if (b.aderencia !== a.aderencia) return b.aderencia - a.aderencia;
    if (a.cartas !== b.cartas) return a.cartas - b.cartas;
    if (b.mov !== a.mov) return b.mov - a.mov;
    return 0;
  }
  function motivo(a, b) {
    if (a.nota !== b.nota) return 'Nota';
    if (a.aderencia !== b.aderencia) return 'Aderência ao objetivo';
    if (a.cartas !== b.cartas) return 'Menos cartas utilizadas';
    if (a.mov !== b.mov) return 'Mais movimentos sem coleta';
    return 'Empate total';
  }
  function desenharPlacar() {
    var lista = lerPlacar().slice().sort(comparar);
    if (!lista.length) {
      $('bannerPlacar').innerHTML = '';
      $('tabelaPlacar').innerHTML = '<div class="card">Nenhum jogador registrado ainda. Use o Validador no modo jogo e clique em "Registrar no placar".</div>';
      return;
    }
    var topo = lista.filter(function (p) { return comparar(lista[0], p) === 0; });
    $('bannerPlacar').innerHTML = '<div class="banner">' + (topo.length > 1
      ? '🏆 Vitória compartilhada: ' + topo.map(function (p) { return esc(p.nome); }).join(' e ')
      : '🏆 Vencedor: ' + esc(topo[0].nome) + ' com ' + fmt(topo[0].nota) + ' pontos') + '</div>';
    var h = '<table><tr><th>#</th><th>Jogador</th><th>Nota</th><th>Aderência</th><th>Cartas</th><th>Mov. sem coleta</th><th>Separado do de cima por</th><th></th></tr>';
    lista.forEach(function (p, i) {
      var lider = comparar(lista[0], p) === 0;
      h += '<tr class="' + (lider ? 'lider' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(p.nome) + '</td><td>' + fmt(p.nota) + '</td><td>' + fmt(p.aderencia) + '%</td><td>' +
        p.cartas + '</td><td>' + p.mov + '</td><td>' + (i === 0 ? '—' : esc(motivo(lista[i - 1], p))) + '</td>' +
        '<td><button class="btn secondary pequeno" data-rem="' + esc(p.nome) + '" aria-label="Remover ' + esc(p.nome) + '">Remover</button></td></tr>';
    });
    $('tabelaPlacar').innerHTML = h + '</table>';
  }
  document.addEventListener('click', function (e) {
    if (e.target.id === 'registrar') {
      if (!ultima || !ultima.meta) return;
      var m = ultima.meta, r = ultima.r, lista = lerPlacar().slice();
      var idx = -1;
      lista.forEach(function (p, i) { if (p.nome.toLowerCase() === m.nome.toLowerCase()) idx = i; });
      if (idx >= 0 && !window.confirm('Já existe um resultado para "' + m.nome + '". Substituir?')) return;
      var reg = { nome: m.nome, nota: r.nota, aderencia: r.aderencia, cartas: m.cartas, mov: m.mov };
      if (idx >= 0) lista[idx] = reg; else lista.push(reg);
      gravarPlacar(lista);
      e.target.disabled = true; e.target.textContent = 'Registrado ✔';
      return;
    }
    var rem = e.target.getAttribute && e.target.getAttribute('data-rem');
    if (rem) {
      gravarPlacar(lerPlacar().filter(function (p) { return p.nome !== rem; }));
      desenharPlacar();
    }
  });
  $('limparPlacar').onclick = function () {
    if (window.confirm('Apagar todos os resultados do placar?')) { gravarPlacar([]); desenharPlacar(); }
  };
 
  // ---------- PWA ----------
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  desenharPlacar();
  var inicial = location.hash.slice(1);
  ir(ORDEM.indexOf(inicial) >= 0 ? inicial : 'inicio', true, true);
  atualizaSetas();
})();
