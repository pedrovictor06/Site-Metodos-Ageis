/* Prompt Ágil – navegação, exemplos, validador e placar (funciona 100% offline).
   Dados: cartas.js (PROMPT_AGIL) · Motor de nota: validador.js (Validador) */
(function () {
  var D = PROMPT_AGIL, V = Validador;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',').replace(',0', ''); }
  var CLASSE = { P: 'persona', C: 'contexto', T: 'tarefa', F: 'formato' };

  // =====================================================================
  //  Navegação por abas
  // =====================================================================
  var secoes = document.querySelectorAll('main section');
  var botoesNav = document.querySelectorAll('nav button[data-go]');
  var ORDEM = Array.prototype.map.call(botoesNav, function (b) { return b.dataset.go; });
  var navEl = $('abas'), setaEsq = $('setaEsq'), setaDir = $('setaDir');
  secoes.forEach(function (s) { s.setAttribute('role', 'tabpanel'); });

  function rotulo(id) { var r = document.querySelector('nav button[data-go="' + id + '"] .rot'); return r ? r.textContent : id; }
  function atualizaSetas() {
    var max = navEl.scrollWidth - navEl.clientWidth;
    setaEsq.hidden = !(navEl.scrollLeft > 4);
    setaDir.hidden = !(navEl.scrollLeft < max - 4);
  }
  function rolar(dx) { if (navEl.scrollBy) navEl.scrollBy({ left: dx, behavior: 'smooth' }); else navEl.scrollLeft += dx; }
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
    $('passos').innerHTML =
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
    if (id === 'validador') desenharPlacar();
    if (!doHistorico) { try { history.pushState(null, '', '#' + id); } catch (e) {} }
    setTimeout(atualizaSetas, 350);
  }
  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-go]');
    if (alvo) ir(alvo.dataset.go);
  });
  navEl.addEventListener('keydown', function (e) {
    var i = ORDEM.indexOf(document.querySelector('main section.active').id), n = null;
    if (e.key === 'ArrowRight') n = Math.min(ORDEM.length - 1, i + 1);
    else if (e.key === 'ArrowLeft') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = ORDEM.length - 1;
    if (n === null) return;
    e.preventDefault(); ir(ORDEM[n]); botoesNav[n].focus();
  });
  function abaDoHash() {
    var h = location.hash.slice(1);
    if (h === 'placar') return 'validador';
    return ORDEM.indexOf(h) >= 0 ? h : 'inicio';
  }
  window.addEventListener('popstate', function () { ir(abaDoHash(), true); });

  // ---------- acessibilidade ----------
  var tam = 18;
  function aplicaTam() { document.documentElement.style.setProperty('--fs', tam + 'px'); }
  $('aMais').onclick = function () { tam = Math.min(26, tam + 2); aplicaTam(); };
  $('aMenos').onclick = function () { tam = Math.max(14, tam - 2); aplicaTam(); };
  $('contraste').onclick = function () {
    var on = document.body.classList.toggle('contrast');
    this.setAttribute('aria-pressed', on ? 'true' : 'false');
  };

  // =====================================================================
  //  Regras: cartas de Sorte e Azar
  // =====================================================================
  function listaCartas(id, arr) {
    $(id).innerHTML = arr.map(function (c) {
      return '<li><span class="cod">' + esc(c[0]) + '</span> <strong>' + esc(c[1]) + '</strong> – ' + esc(c[2]) + '</li>';
    }).join('');
  }
  listaCartas('listaSorte', D.sorte);
  listaCartas('listaAzar', D.azar);

  // =====================================================================
  //  Exemplos (nota calculada na hora pelo validador)
  // =====================================================================
  var EX_OBJ = 'OBJ-13';
  var EX_TEMA = D.gabaritos[EX_OBJ].frase; // o 3º exemplo é o gabarito do objetivo
  var EXEMPLOS = {
    jogo: [
      { id: 'j1', titulo: 'Cartas fora do combo', cartas: ['PER-05', 'CTX-13', 'TAR-09', 'FMT-06'],
        porque: 'O prompt é organizado, mas as cartas não têm nada a ver com um videogame educativo.' },
      { id: 'j2', titulo: 'Cartas do combo recomendado', cartas: ['PER-02', 'CTX-08', 'TAR-01', 'FMT-13'],
        porque: 'Uma carta de cada quadrante, todas do combo da carta de objetivo.' },
      { id: 'j3', titulo: 'Combo + uma frase com o tema', cartas: ['PER-02', 'CTX-08', 'TAR-01', 'FMT-13'], tema: EX_TEMA,
        porque: 'A frase diz o que deve ser criado e para quem. É o que leva à nota máxima.' }
    ],
    bons: [
      { id: 'b1', t: 'Atue como um professor de ciências didático. Estou preparando uma aula para alunos de 13 anos que acham a fotossíntese difícil. Explique como a fotossíntese funciona em até 120 palavras, com uma analogia do dia a dia e linguagem simples. No final, crie 3 perguntas de múltipla escolha com gabarito.',
        porque: 'Tem as quatro partes: persona, contexto com público, tarefa clara e formato com limite de tamanho.' },
      { id: 'b2', t: 'Atue como um organizador de eventos experiente. Minha turma do 9º ano vai fazer um campeonato de games na escola, com 8 equipes e apenas um sábado livre. Planeje o campeonato em uma tabela com horário, partida e responsável, e inclua 5 regras de fair play. Evite custos com prêmios caros.',
        porque: 'Situação real com números, formato de tabela e uma restrição clara.' },
      { id: 'b3', t: 'Atue como um jornalista esportivo imparcial. Estou escrevendo para o jornal da escola sobre a final do torneio de vôlei entre o 8º A e o 8º B. Escreva uma notícia de no máximo 150 palavras, com título, um parágrafo de abertura e uma frase de cada técnico. Use linguagem simples e não invente placares.',
        porque: 'Diz quem escreve, para onde, o tamanho, a estrutura e o que não pode inventar.' }
    ],
    ruins: [
      { id: 'r1', t: 'Fale sobre história.', porque: 'Amplo demais: qual época? Para quem? De que tamanho?' },
      { id: 'r2', t: 'Faz isso pra mim.', porque: '"Isso" não diz nada. A IA não sabe qual é a tarefa.' },
      { id: 'r3', t: 'Escreva um texto bom sobre tecnologia.', porque: '"Bom" é vago, e faltam persona, contexto, público e tamanho.' }
    ]
  };
  function textoJogo(ex) {
    var linhas = V.montarPrompt(ex.cartas).split('\n');
    if (ex.tema) linhas.splice(2, 0, ex.tema); // depois de Persona e Contexto, antes da Tarefa
    return linhas.join('\n');
  }
  function selo(r) {
    var cls = r.nota >= 75 ? 'alta' : r.nota >= 60 ? 'media' : 'baixa';
    return '<span class="selo ' + cls + '">' + fmt(r.nota) + ' · ' + esc(r.faixa) + '</span>';
  }
  function promptColorido(texto) {
    return texto.split('\n').map(function (linha) {
      var c = null;
      V.cartas.some(function (k) { if (k.texto === linha) { c = k; return true; } return false; });
      return c ? '<mark class="' + CLASSE[c.cat] + '" title="' + esc(D.categorias[c.cat].nome + ' · ' + c.cod) + '">' + esc(linha) + '</mark>'
               : '<mark class="tema" title="Frase do jogador">' + esc(linha) + '</mark>';
    }).join(' ');
  }
  var TESTES = {};
  function desenharExemplos() {
    var o = V.objetivos.filter(function (x) { return x.cod === EX_OBJ; })[0];
    $('exObjetivo').innerHTML = 'Objetivo secreto <strong>' + o.cod + ' · ' + esc(o.titulo) + '</strong>.<br><span class="why">Combo recomendado: ' + esc(o.comboTexto) + '.</span>';
    $('escada').innerHTML = EXEMPLOS.jogo.map(function (ex, i) {
      var t = textoJogo(ex), r = V.avaliar(t, { objetivo: EX_OBJ });
      TESTES[ex.id] = { t: t, obj: EX_OBJ };
      return '<div class="degrau"><div class="degrau-topo"><strong>' + (i + 1) + '. ' + esc(ex.titulo) + '</strong>' + selo(r) + '</div>' +
        '<div class="mini-cartas">' + ex.cartas.map(function (cod) { var c = V.porCodigo[cod]; return '<span class="chip ' + CLASSE[c.cat] + '">' + esc(c.titulo) + '</span>'; }).join('') +
        (ex.tema ? '<span class="chip tema">+ frase do tema</span>' : '') + '</div>' +
        '<p class="why">' + esc(ex.porque) + ' Aderência ao objetivo: ' + fmt(r.aderencia) + '%.</p>' +
        '<details><summary>Ver o prompt</summary><p class="junto">' + promptColorido(t) + '</p></details>' +
        '<button class="btn secondary pequeno" data-testar="' + ex.id + '">Testar no validador</button></div>';
    }).join('');
    function cartoes(lista, tipo) {
      return lista.map(function (ex) {
        var r = V.avaliar(ex.t, {});
        TESTES[ex.id] = { t: ex.t, obj: '' };
        return '<div class="card item ' + tipo + '"><div class="degrau-topo"><span class="tag ' + tipo + '">' + (tipo === 'good' ? '✔ Bom' : '✖ Ruim') + '</span>' + selo(r) + '</div>' +
          '<div class="prompt">' + esc(ex.t) + '</div><p class="why">' + esc(ex.porque) + '</p>' +
          '<button class="btn secondary pequeno" data-testar="' + ex.id + '">Testar no validador</button></div>';
      }).join('');
    }
    $('exBons').innerHTML = cartoes(EXEMPLOS.bons, 'good');
    $('exRuins').innerHTML = cartoes(EXEMPLOS.ruins, 'bad');
  }

  // =====================================================================
  //  Validador: objetivo, montagem com cartas e resultado
  // =====================================================================
  var mostrarNomes = false, marcadas = [];
  function rotuloObjetivo(o) { return mostrarNomes ? o.cod + ' · ' + o.titulo : (o.professor ? 'OBJ-M1, M2 ou M3 (Desafio do professor)' : o.cod); }
  function preencherObjetivos() {
    var sel = $('objetivo'), atual = sel.value;
    sel.innerHTML = '<option value="">Sem objetivo (avaliação livre)</option>' +
      V.objetivos.map(function (o) { return '<option value="' + o.cod + '">' + esc(rotuloObjetivo(o)) + '</option>'; }).join('');
    sel.value = atual;
  }
  function objAtual() { var v = $('objetivo').value; return v ? V.objetivos.filter(function (o) { return o.cod === v; })[0] : null; }
  function atualizaObjetivo() {
    var o = objAtual();
    $('temaProf').hidden = !(o && o.professor);
    $('objInfo').innerHTML = !o ? 'Sem objetivo, o validador avalia só a qualidade do prompt.' :
      mostrarNomes ? '<strong>' + esc(o.titulo) + '</strong> · Combo: ' + esc(o.comboTexto) + '.' :
      'Objetivo escolhido. Toque em "Mostrar" para ver o título, o combo e o gabarito.';
    desenharGabarito(o);
  }
  // gabarito do professor: só aparece com os nomes revelados
  function desenharGabarito(o) {
    var g = o ? V.gabarito(o.cod) : null, box = $('gabProf');
    box.hidden = !(g && mostrarNomes);
    if (box.hidden) { box.open = false; return; }
    $('gabConteudo').innerHTML =
      '<p class="why">' + (o.professor ? 'Exemplo para o tema "' + esc(g.tema) + '". No seu desafio, troque a frase pelo seu tema.' :
        'Prompt-modelo que vale 100: as cartas do combo + uma frase com o tema, antes da Tarefa.') + '</p>' +
      '<div class="degrau-topo"><div class="mini-cartas">' + g.cartas.map(function (cod) { var c = V.porCodigo[cod]; return '<span class="chip ' + CLASSE[c.cat] + '">' + c.cod + ' ' + esc(c.titulo) + '</span>'; }).join('') +
      '<span class="chip tema">+ frase do tema</span></div>' + selo(g) + '</div>' +
      '<p class="frase-gab">“' + esc(g.frase) + '”</p>' +
      '<details><summary>Ver o prompt completo</summary><p class="junto">' + promptColorido(g.texto) + '</p></details>' +
      '<button type="button" class="btn secondary pequeno" id="testarGab">Testar o gabarito no validador</button>';
  }
  document.addEventListener('click', function (e) {
    if (e.target.id !== 'testarGab') return;
    var o = objAtual(), g = o && V.gabarito(o.cod); if (!g) return;
    if ($('entrada').value.trim() && !window.confirm('Trocar o texto atual pelo gabarito?')) return;
    if (g.tema) $('temaTexto').value = g.tema;
    marcadas = []; desenharGrade();
    $('entrada').value = g.texto;
    avaliarAgora();
    $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('objetivo').onchange = atualizaObjetivo;
  $('verObj').onclick = function () {
    mostrarNomes = !mostrarNomes;
    this.textContent = mostrarNomes ? 'Ocultar' : 'Mostrar';
    this.setAttribute('aria-pressed', mostrarNomes ? 'true' : 'false');
    preencherObjetivos(); atualizaObjetivo();
  };

  function desenharGrade() {
    $('grade').innerHTML = ['P', 'C', 'T', 'F'].map(function (k) {
      var cat = D.categorias[k], doGrupo = V.cartas.filter(function (c) { return c.cat === k; });
      var n = marcadas.filter(function (cod) { return V.porCodigo[cod].cat === k; }).length;
      return '<fieldset class="grupo ' + cat.classe + '"><legend>' + cat.icone + ' ' + esc(cat.nome) + ' <span class="conta">' + n + ' de 2</span></legend>' +
        doGrupo.map(function (c) {
          var on = marcadas.indexOf(c.cod) >= 0;
          return '<button type="button" class="carta ' + cat.classe + '" data-carta="' + c.cod + '" aria-pressed="' + on + '" title="' + esc(c.texto) + '">' +
            '<span class="cod">' + c.cod + '</span> ' + esc(c.titulo) + '</button>';
        }).join('') + '</fieldset>';
    }).join('');
  }
  $('grade').addEventListener('click', function (e) {
    var b = e.target.closest('[data-carta]'); if (!b) return;
    var cod = b.dataset.carta, i = marcadas.indexOf(cod);
    if (i >= 0) marcadas.splice(i, 1); else marcadas.push(cod);
    desenharGrade();
    var nova = document.querySelector('[data-carta="' + cod + '"]'); if (nova) nova.focus();
  });
  $('desmarcar').onclick = function () { marcadas = []; desenharGrade(); };
  $('colocar').onclick = function () {
    if (!marcadas.length) { window.alert('Toque primeiro nas cartas que você coletou.'); return; }
    var ent = $('entrada');
    if (ent.value.trim() && !window.confirm('Trocar o texto atual pelo texto das cartas escolhidas?')) return;
    ent.value = V.montarPrompt(marcadas);
    $('montar').open = false;
    $('resultado').innerHTML = '<p class="dica-montagem">💡 Agora escreva, antes da Tarefa, uma frase com o tema do seu objetivo e para quem é a resposta. Depois toque em Avaliar.</p>';
    ent.focus();
  };

  $('modoJogo').onchange = function () { $('camposJogo').hidden = !this.checked; };

  var ultima = null;
  function desenharResultado(r, meta) {
    var bonus = meta && meta.genio ? 15 : 0;
    var h = '<div class="nota"><span class="num">' + fmt(r.nota) + '</span><span class="de">de 100 · ' + esc(r.faixa) + '</span>' +
      (r.aderencia !== null ? '<span class="de">· aderência ao objetivo: <strong>' + fmt(r.aderencia) + '%</strong></span>' : '') + '</div>';
    if (bonus) h += '<p class="bonus">🧠 Gênio dos Prompts: ' + fmt(r.nota) + ' + 15 = <strong>' + fmt(r.nota + bonus) + '</strong> pontos na nota final.</p>';
    h += '<div class="veredito ' + (r.claro ? 'good' : 'bad') + '">' + (r.claro ? '✅ Seu prompt está claro' : '💡 Seu prompt pode melhorar') + '</div>';
    h += '<div class="reconhecidas"><strong>Cartas reconhecidas (' + r.cartas.length + ')</strong> ' +
      (r.cartas.length ? r.cartas.map(function (c) { return '<span class="chip ' + CLASSE[c.cat] + '">' + c.cod + ' ' + esc(c.titulo) + '</span>'; }).join(' ')
        : '<span class="why">nenhuma carta do jogo no texto' + (r.comObjetivo ? '. Monte com as cartas ou marque as que você adaptou.' : '.') + '</span>') + '</div>';
    r.avisos.forEach(function (a) { h += '<p class="aviso">⚠ ' + esc(a) + '</p>'; });
    if (!r.comObjetivo) h += '<p class="why">Sem objetivo: a adequação não foi medida e os outros sete critérios foram reescalados para 100.</p>';
    var oG = objAtual(), gab = oG && !oG.professor ? V.gabarito(oG.cod) : null;
    if (gab) h += '<p class="ref-gab">🔑 O gabarito deste objetivo vale <strong>100</strong>' +
      (r.nota >= 100 ? ' · seu prompt chegou lá!' : ' · faltam ' + fmt(100 - r.nota) + ' pontos para alcançá-lo.') + '</p>';
    if (r.dicas.length) h += '<div class="dicas"><strong>Como subir a nota</strong><ul>' + r.dicas.map(function (d) { return '<li>' + esc(d.texto) + '</li>'; }).join('') + '</ul></div>';
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
    if (meta) h += '<div class="acoes"><button class="btn" id="registrar">Registrar no placar</button></div>';
    return h;
  }

  function avaliarAgora() {
    var texto = $('entrada').value, o = objAtual(), jogo = $('modoJogo').checked, erros = [], meta = null;
    if (!texto.trim()) erros.push('Escreva ou monte um prompt.');
    if (o && o.professor && $('temaTexto').value.trim().split(/\s+/).length < 2) erros.push('Escreva o tema do desafio do professor.');
    if (jogo) {
      var nome = $('nome').value.trim(), rest = Number($('restantes').value);
      if (!o) erros.push('No modo partida, escolha o objetivo secreto.');
      if (!nome) erros.push('Informe o nome do jogador.');
      if ($('restantes').value === '' || !Number.isInteger(rest) || rest < 0 || rest > 16) erros.push('Cartas restantes no quadrante inicial: número inteiro de 0 a 16.');
      meta = { nome: nome, restantes: rest, genio: $('genio').checked };
    }
    if (erros.length) {
      $('resultado').innerHTML = '<div class="erros"><strong>Confira antes de avaliar:</strong><ul>' + erros.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
      ultima = null; return;
    }
    var r = V.avaliar(texto, { objetivo: o ? o.cod : null, temaProfessor: $('temaTexto').value, marcadas: marcadas });
    ultima = { r: r, meta: meta };
    $('resultado').innerHTML = desenharResultado(r, meta);
  }
  $('validar').onclick = avaliarAgora;
  $('limpar').onclick = function () { $('entrada').value = ''; $('resultado').innerHTML = ''; ultima = null; $('entrada').focus(); };

  // botão "Testar no validador" dos exemplos
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-testar]'); if (!b) return;
    var ex = TESTES[b.dataset.testar]; if (!ex) return;
    $('objetivo').value = ex.obj; atualizaObjetivo();
    $('modoJogo').checked = false; $('camposJogo').hidden = true;
    marcadas = []; desenharGrade();
    $('entrada').value = ex.t;
    ir('validador');
    avaliarAgora();
    $('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // =====================================================================
  //  Placar (regra 18 e desempate da regra 19)
  // =====================================================================
  var CHAVE = 'promptAgilPlacar2', memoria = [];
  function lerPlacar() { try { var t = localStorage.getItem(CHAVE); if (t) return JSON.parse(t); } catch (e) {} return memoria; }
  function gravarPlacar(lista) { memoria = lista; try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch (e) {} }
  function comparar(a, b) { // negativo se "a" fica acima de "b"
    if (b.nota !== a.nota) return b.nota - a.nota;
    if (b.aderencia !== a.aderencia) return b.aderencia - a.aderencia;
    if (a.cartas !== b.cartas) return a.cartas - b.cartas;
    if (b.categorias !== a.categorias) return b.categorias - a.categorias;
    if (b.restantes !== a.restantes) return b.restantes - a.restantes;
    return 0;
  }
  function motivo(a, b) {
    if (a.nota !== b.nota) return 'Nota';
    if (a.aderencia !== b.aderencia) return 'Aderência ao objetivo';
    if (a.cartas !== b.cartas) return 'Menos cartas';
    if (a.categorias !== b.categorias) return 'Mais categorias';
    if (a.restantes !== b.restantes) return 'Mais cartas no quadrante inicial';
    return 'Empate total';
  }
  function desenharPlacar() {
    var lista = lerPlacar().slice().sort(comparar);
    if (!lista.length) {
      $('bannerPlacar').innerHTML = '';
      $('tabelaPlacar').innerHTML = '<p class="why">Nenhum jogador registrado. Marque "Partida: registrar no placar", avalie e toque em "Registrar no placar".</p>';
      $('limparPlacar').hidden = true;
      return;
    }
    $('limparPlacar').hidden = false;
    var topo = lista.filter(function (p) { return comparar(lista[0], p) === 0; });
    $('bannerPlacar').innerHTML = '<div class="banner">' + (topo.length > 1
      ? '🏆 Vitória compartilhada: ' + topo.map(function (p) { return esc(p.nome); }).join(' e ')
      : '🏆 Vencedor: ' + esc(topo[0].nome) + ' com ' + fmt(topo[0].nota) + ' pontos') + '</div>';
    var h = '<table><tr><th>#</th><th>Jogador</th><th>Nota</th><th>Aderência</th><th>Cartas</th><th>Categorias</th><th>Restantes</th><th>Separado do de cima por</th><th></th></tr>';
    lista.forEach(function (p, i) {
      var lider = comparar(lista[0], p) === 0;
      h += '<tr class="' + (lider ? 'lider' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(p.nome) + '</td><td>' + fmt(p.nota) + (p.bonus ? ' <span class="why">(+15)</span>' : '') +
        '</td><td>' + fmt(p.aderencia) + '%</td><td>' + p.cartas + '</td><td>' + p.categorias + '</td><td>' + p.restantes + '</td><td>' +
        (i === 0 ? '—' : esc(motivo(lista[i - 1], p))) + '</td>' +
        '<td><button class="btn secondary pequeno" data-rem="' + esc(p.nome) + '" aria-label="Remover ' + esc(p.nome) + '">Remover</button></td></tr>';
    });
    $('tabelaPlacar').innerHTML = h + '</table>';
  }
  document.addEventListener('click', function (e) {
    if (e.target.id === 'registrar') {
      if (!ultima || !ultima.meta) return;
      var m = ultima.meta, r = ultima.r, lista = lerPlacar().slice(), idx = -1;
      lista.forEach(function (p, i) { if (p.nome.toLowerCase() === m.nome.toLowerCase()) idx = i; });
      if (idx >= 0 && !window.confirm('Já existe um resultado para "' + m.nome + '". Substituir?')) return;
      var bonus = m.genio ? 15 : 0;
      var reg = { nome: m.nome, nota: Math.round((r.nota + bonus) * 10) / 10, bonus: bonus, aderencia: r.aderencia || 0,
                  cartas: r.cartas.length, categorias: r.categorias, restantes: m.restantes };
      if (idx >= 0) lista[idx] = reg; else lista.push(reg);
      gravarPlacar(lista); desenharPlacar();
      e.target.disabled = true; e.target.textContent = 'Registrado ✔';
      return;
    }
    var rem = e.target.getAttribute && e.target.getAttribute('data-rem');
    if (rem) { gravarPlacar(lerPlacar().filter(function (p) { return p.nome !== rem; })); desenharPlacar(); }
  });
  $('limparPlacar').onclick = function () {
    if (window.confirm('Apagar todos os resultados do placar?')) { gravarPlacar([]); desenharPlacar(); }
  };

  // ---------- início ----------
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    // quando sai uma versão nova do app, recarrega uma vez para mostrá-la (só se já havia uma versão antiga ativa)
    var tinhaVersao = !!navigator.serviceWorker.controller, recarregou = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!tinhaVersao || recarregou) return;
      recarregou = true; location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then(function (reg) { reg.update(); })
        .catch(function () {});
    });
  }
  preencherObjetivos(); atualizaObjetivo(); desenharGrade(); desenharExemplos(); desenharPlacar();
  ir(abaDoHash(), true, true);
  if (location.hash === '#placar') setTimeout(function () { $('placar').scrollIntoView(); }, 50);
  atualizaSetas();
})();
