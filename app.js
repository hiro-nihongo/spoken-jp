/* New System Spoken Japanese — 画面のうごき */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // {漢字|よみ} → ふりがな、[[文字]] → 強調
  function fmt(s) {
    return esc(s).replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>').replace(/\[\[(.+?)\]\]/g, '<em class="pt">$1</em>');
  }
  // 更新したファイルが古いまま残らないように、版の番号を付けて読む
  function withV(u) { return u + (u.indexOf('?') < 0 ? '?' : '&') + 'v=' + (window.SJ_V || ''); }
  function plain(s) { return String(s || '').replace(/\{([^|{}]+)\|[^{}]+\}/g, '$1').replace(/\[\[|\]\]/g, ''); }

  var IC = {
    left: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    set: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    chat: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    card: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    box: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    stop: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>',
    full: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    small: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    sound: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>'
  };
  $$('[data-ic]').forEach(function (e) { e.innerHTML = IC[e.getAttribute('data-ic')] || ''; });

  /* ---------- みやすさ設定（この端末におぼえる） ---------- */
  var DEF = { size: 1, theme: 'cream', em: true, ruby: false, calm: false, speed: 2 };
  var prefs;
  try { prefs = Object.assign({}, DEF, JSON.parse(localStorage.getItem('sj_prefs') || '{}')); }
  catch (e) { prefs = Object.assign({}, DEF); }
  function save() { try { localStorage.setItem('sj_prefs', JSON.stringify(prefs)); } catch (e) { } }
  function apply() {
    H.setAttribute('data-theme', prefs.theme);
    H.setAttribute('data-size', prefs.size);
    H.setAttribute('data-em', prefs.em ? '1' : '0');
    H.setAttribute('data-ruby', prefs.ruby ? '1' : '0');
    H.setAttribute('data-calm', prefs.calm ? '1' : '0');
  }
  apply();

  var dlg;
  function buildSettings() {
    dlg = D.createElement('dialog');
    dlg.className = 'set';
    dlg.setAttribute('aria-label', 'みやすさ設定');
    var themes = [['cream', 'クリーム', '#F6F5F1', '#1A1A1A'], ['white', 'しろ', '#FFFFFF', '#1A1A1A'], ['dark', 'くろ', '#2B2B2B', '#F0F0F0'], ['contrast', 'くっきり', '#000000', '#FFD24A']];
    var sizes = [['ちいさい', 14], ['ふつう', 18], ['おおきい', 22], ['とても おおきい', 28]];
    var sws = [['em', 'よ・ね・な を めだたせる', 'เน้นคำลงท้าย'], ['ruby', 'かんじに ふりがな', 'ฟุริงานะบนคันจิ'], ['calm', 'うごきを へらす', 'ลดการเคลื่อนไหว']];
    dlg.innerHTML =
      '<div class="sethead"><h2>みやすさ設定<small lang="th">ตั้งค่าการแสดงผล</small></h2><button type="button" class="ok" data-close>OK</button></div>' +
      '<div class="setbody">' +
      '<div class="box sample"><div class="no">みほん <span lang="th">ตัวอย่าง</span></div><p class="ja">{今日|きょう}は はやく ねよう[[ね]]。</p><p class="th" lang="th">วันนี้นอนเร็วๆ กันนะ</p></div>'.replace(/<p class="ja">(.*?)<\/p>/, function (m, t) { return '<p class="ja">' + fmt(t) + '</p>'; }) +
      '<div class="box"><h3>もじの おおきさ <span lang="th">ขนาดตัวอักษร</span></h3><div class="sizes">' +
      sizes.map(function (s, i) { return '<button type="button" data-size="' + i + '" aria-label="' + s[0] + '" style="font-size:' + s[1] + 'px">あ</button>'; }).join('') + '</div></div>' +
      '<div class="box"><h3>いろ <span lang="th">สีพื้นหลัง</span></h3><div class="themes">' +
      themes.map(function (t) { return '<button type="button" data-theme="' + t[0] + '" style="background:' + t[2] + ';color:' + t[3] + '"><b>あ</b>' + t[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="box">' + sws.map(function (s) { return '<div class="sw"><div>' + s[1] + '<small lang="th">' + s[2] + '</small></div><button type="button" class="switch" role="switch" data-sw="' + s[0] + '" aria-label="' + s[1] + '"><i>✓</i></button></div>'; }).join('') + '</div>' +
      '<button type="button" class="reset" data-reset>もとに もどす <span lang="th">รีเซ็ต</span></button>' +
      '</div>';
    D.body.appendChild(dlg);
    dlg.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (ev.target === dlg) { closeSet(); return; }
      if (!b) return;
      if (b.hasAttribute('data-close')) { closeSet(); return; }
      if (b.hasAttribute('data-size')) prefs.size = +b.getAttribute('data-size');
      else if (b.hasAttribute('data-theme')) prefs.theme = b.getAttribute('data-theme');
      else if (b.hasAttribute('data-sw')) { var k = b.getAttribute('data-sw'); prefs[k] = !prefs[k]; }
      else if (b.hasAttribute('data-reset')) { var sp = prefs.speed; prefs = Object.assign({}, DEF); prefs.speed = sp; }
      apply(); save(); syncSet();
    });
  }
  function syncSet() {
    $$('[data-size]', dlg).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-size') === prefs.size)); });
    $$('[data-theme]', dlg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme') === prefs.theme)); });
    $$('[data-sw]', dlg).forEach(function (b) { b.setAttribute('aria-checked', String(!!prefs[b.getAttribute('data-sw')])); });
  }
  function openSet() { if (!dlg) buildSettings(); syncSet(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  function closeSet() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  var ob = $('#openSet');
  if (ob) { ob.innerHTML = IC.set + '<span lang="th">ตั้งค่า</span>'; ob.setAttribute('aria-label', 'みやすさ設定'); ob.addEventListener('click', openSet); }

  /* ---------- かの いちらん ---------- */
  if (D.body.getAttribute('data-page') === 'index') {
    var list = $('#list');
    (window.SJ_LESSONS || []).forEach(function (l) {
      var a = D.createElement('a');
      a.className = 'lesson';
      a.href = 'lesson.html?id=' + encodeURIComponent(l.id);
      var pic = l.cover ? '<img class="thumb" src="' + esc(withV(l.cover)) + '" alt="" loading="lazy" decoding="async">' : (l.icon ? '<span class="thumb ico" aria-hidden="true">' + esc(l.icon) + '</span>' : '');
      a.innerHTML = pic + '<span class="n">' + esc(l.no) + '</span><span class="t">' + fmt(l.title) + (l.th ? '<small lang="th">' + esc(l.th) + '</small>' : '') + '</span>' + IC.right;
      list.appendChild(a);
    });
    return;
  }

  /* ---------- かの ページ ---------- */
  var back = $('#back'); if (back) back.innerHTML = IC.left;
  var id = (new URLSearchParams(location.search).get('id') || '').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) { fail('かが えらばれていません。'); return; }
  var sc = D.createElement('script');
  sc.src = 'lessons/' + id + '.js?v=' + (window.SJ_V || '');
  sc.onload = function () { if (window.SJ_LESSON) initLesson(window.SJ_LESSON); else fail('この かは まだ ありません。'); };
  sc.onerror = function () { fail('この かは まだ ありません。'); };
  D.head.appendChild(sc);

  function fail(msg) {
    var n = $('#notice'); n.hidden = false;
    n.innerHTML = esc(msg) + ' <a href="index.html">かの いちらんへ</a>';
  }

  function initLesson(L) {
    var app = $('#app');
    var REG = { P: ['ていねい', 'สุภาพ'], N: ['ふつう', 'กันเอง'], R: ['もっとていねい', 'สุภาพมาก'] };
    var SPEEDS = [0.5, 0.75, 1], SPLBL = ['0.5×', '0.75×', '1.0×'];
    var st = { t: 0, cur: 0, rd: (L.lesson || 99) <= 2, th: false, mode: 'none', audioOk: true };
    var audio = new Audio(); audio.preload = 'none'; var curSrc = '';
    function useSrc(u) { if (curSrc !== u) { curSrc = u; audio.src = withV(u); } }
    function lineSrc(t, i) { var n = String(i + 1); if (n.length < 2) n = '0' + n; return t.lines[i].audio || (t.lineAudio ? t.lineAudio.replace('{n}', n) : ''); }
    var chat = $('#chat'), notice = $('#notice');
    function talk() { return L.talks[st.t]; }
    function sp(i) { return (talk().speakers || L.speakers)[i] || { name: '?', ini: '?' }; }
    function calm() { return prefs.calm || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

    D.title = L.no + ' ' + plain(L.title) + ' | Spoken Japanese';
    $('#no').textContent = L.no;
    $('#title').innerHTML = fmt(L.title);

    // ていねい／ふつう／もっとていねい（2つ以上あるときだけ出す）
    var regs = $('#regs');
    if (L.talks.length > 1) {
      regs.hidden = false;
      regs.className = 'seg ' + (L.talks.length === 2 ? 'seg2' : 'seg3');
      regs.innerHTML = L.talks.map(function (t, i) {
        var r = REG[t.key] || [t.key, ''];
        return '<button type="button" data-t="' + i + '">' + esc(t.label || r[0]) + '<small lang="th">' + esc(r[1]) + '</small></button>';
      }).join('');
      regs.addEventListener('click', function (ev) {
        var b = ev.target.closest('button'); if (!b) return;
        stop(); st.t = +b.getAttribute('data-t'); st.cur = 0; loadTalk();
      });
    }

    function showNotice(kind) {
      if (!kind) { notice.hidden = true; return; }
      notice.hidden = false;
      notice.innerHTML = kind === 'line'
        ? '1文ずつの おんせいは じゅんびちゅう です。「ぜんぶ きく」は つかえます。 <span lang="th">เสียงทีละประโยคยังไม่พร้อม</span>'
        : 'おんせいが まだ ありません。 <span lang="th">ยังไม่มีไฟล์เสียง</span>';
    }

    function loadTalk() {
      var t = talk();
      $$('button', regs).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-t') === st.t)); });
      st.audioOk = !!(t.audio || t.lineAudio);
      showNotice(st.audioOk ? null : 'none');
      curSrc = '';
      var hasRd = t.lines.some(function (l) { return l.rd; }), hasTh = t.lines.some(function (l) { return l.th; });
      $('#tRd').hidden = !hasRd; $('#tTh').hidden = !hasTh;
      renderChat(); select(st.cur, false); ui();
    }

    // 行の番号：台本のセリフ番号（turn）と、その中の何文目か（sub）。例 2-1、2-2
    function lab(l, i) { return l.turn ? (l.sub ? l.turn + '-' + l.sub : String(l.turn)) : String(i + 1); }

    function renderChat() {
      var t = talk(), h = '';
      if (L.cover) h += '<img class="cover" src="' + esc(withV(L.cover)) + '" alt="" decoding="async">';
      if (L.scene) h += '<div class="scene">' + esc(L.scene.ja || '') + (L.scene.th ? ' <span lang="th">' + esc(L.scene.th) + '</span>' : '') + '</div>';
      t.lines.forEach(function (l, i) {
        var p = sp(l.w), prev = t.lines[i - 1], next = t.lines[i + 1];
        // 同じ人の同じセリフが1文ずつに分かれているとき：2文目からは名前とアイコンを省いて、つづきに見せる
        var cont = !!(l.turn && prev && prev.turn === l.turn);
        var more = !!(l.turn && next && next.turn === l.turn);
        if (l.gap) h += '<hr class="gap">';
        h += '<div class="row s' + l.w + (cont ? ' cont' : '') + (more ? ' more' : '') + '" data-i="' + i + '">' +
          '<div class="av" aria-hidden="true">' + esc(p.ini || p.name.charAt(0)) + '</div>' +
          '<div class="col"><div class="nm">' + esc(p.name) + ' ・' + esc(lab(l, i)) + '</div>' +
          (cont ? '<div class="sub">' + esc(lab(l, i)) + '</div>' : '') +
          '<button type="button" class="bub" aria-label="' + esc(lab(l, i)) + ' ' + esc(p.name) + '：' + esc(plain(l.ja)) + '">' +
          '<span class="l1"><span class="ja">' + fmt(l.ja) + '</span>' + IC.sound + '</span>' +
          (l.rd ? '<span class="rd" lang="th">' + fmt(l.rd) + '</span>' : '') + '</button>' +
          (l.th ? '<div class="th" lang="th">' + esc(l.th) + '</div>' : '') +
          (l.note ? '<div class="note">' + esc(l.note) + '</div>' : '') +
          '</div></div>';
      });
      chat.innerHTML = h;
    }

    function select(i, scroll) {
      var t = talk(), n = t.lines.length;
      st.cur = Math.max(0, Math.min(n - 1, i));
      var l = t.lines[st.cur], p = sp(l.w);
      $$('.row', chat).forEach(function (r) {
        var on = +r.getAttribute('data-i') === st.cur;
        r.classList.toggle('cur', on);
        if (on && scroll && r.scrollIntoView) r.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
      });
      var av = $('#cAv'); av.className = 'av s' + l.w; av.textContent = p.ini || p.name.charAt(0);
      $('#cName').textContent = p.name + ' ・' + lab(l, st.cur);
      $('#cJa').innerHTML = fmt(l.ja);
      var rd = $('#cRd'); rd.innerHTML = fmt(l.rd || ''); rd.hidden = !l.rd;
      var th = $('#cTh'); th.textContent = l.th || ''; th.hidden = !l.th;
      var nt = $('#cNote'); nt.textContent = l.note || ''; nt.hidden = !l.note;
      $('#cPos').textContent = (st.cur + 1) + ' / ' + n;
      $('#cBar').style.width = Math.round((st.cur + 1) / n * 100) + '%';
      $('#prev').disabled = st.cur === 0;
      $('#next').disabled = st.cur === n - 1;
    }

    function ui() {
      app.setAttribute('data-rd', st.rd ? '1' : '0');
      app.setAttribute('data-th', st.th ? '1' : '0');
      $('#tRd').setAttribute('aria-pressed', String(st.rd));
      $('#tTh').setAttribute('aria-pressed', String(st.th));
      $('#speedV').textContent = SPLBL[prefs.speed];
      // スマホの「ぜんぶ みる」では下のボタンが1つなので、1文の再生中はそれを「とめる」にする
      var lineOnAll = st.mode === 'line' && !st.paused && !navShown();
      $('#playAll').innerHTML = (st.mode === 'all' && !st.paused) || lineOnAll ? IC.stop + 'とめる' : (st.mode === 'all' ? IC.play + 'つづきを きく' : IC.play + 'ぜんぶ きく');
      $('#playLine').innerHTML = st.mode === 'line' ? (st.paused ? IC.play + 'つづきを きく' : IC.stop + 'とめる') : IC.play + 'この文を きく';
    }

    /* ---- 音声 ---- */
    // stop = やめる（つぎは頭から）、pause = 一時停止（つぎは続きから）
    function navShown() { return getComputedStyle($('.fnav')).display !== 'none'; }
    function stop() { audio.pause(); st.mode = 'none'; st.paused = false; ui(); }
    function pause() { audio.pause(); st.paused = true; ui(); }
    function resume() { st.paused = false; start(); }
    function start() {
      audio.playbackRate = SPEEDS[prefs.speed];
      var p = audio.play();
      if (p && p.catch) p.catch(function (e) { if (e && e.name === 'AbortError') return; st.audioOk = false; st.mode = 'none'; st.paused = false; ui(); showNotice('none'); });
      ui(); requestAnimationFrame(tick);
    }
    function tick() {
      if (st.mode === 'none' || st.paused) return;
      var c = talk().cues, t = audio.currentTime;
      if (c) {
        if (st.mode === 'line' && st.cueLine && t >= c[st.cur][1] - 0.02) { stop(); return; }
        if (st.mode === 'all') {
          for (var i = 0; i < c.length; i++) { if (t >= c[i][0] && t < c[i][1]) { if (i !== st.cur) select(i, true); break; } }
        }
      }
      requestAnimationFrame(tick);
    }
    // ふきだしをタップ → いつも その文の頭から
    function playLine(i) {
      if (st.mode !== 'none') stop();
      select(i, false);
      if (!st.audioOk) { showNotice('none'); return; }
      var t = talk(), c = t.cues, f = lineSrc(t, i);
      st.mode = 'line';
      if (f) { st.cueLine = false; useSrc(f); try { audio.currentTime = 0; } catch (e) { } }
      else if (t.audio && c && c[i]) { st.cueLine = true; useSrc(t.audio); try { audio.currentTime = c[i][0]; } catch (e) { } }
      else { st.mode = 'none'; showNotice('line'); return; }
      start();
    }
    // 下の「この文を きく」→ 再生中なら一時停止、止まっていたら続きから
    function toggleLine() {
      if (st.mode === 'line') { if (st.paused) resume(); else pause(); return; }
      playLine(st.cur);
    }
    function playAll() {
      if (st.mode === 'all') { if (st.paused) resume(); else pause(); return; }
      if (st.mode === 'line' && !st.paused && !navShown()) { stop(); return; }
      if (st.mode !== 'none') stop();
      if (!st.audioOk || !talk().audio) { showNotice('none'); return; }
      st.mode = 'all';
      useSrc(talk().audio);
      try { audio.currentTime = 0; } catch (e) { }
      if (talk().cues) select(0, true);
      start();
    }
    audio.addEventListener('ended', function () { st.mode = 'none'; st.paused = false; ui(); });
    audio.addEventListener('error', function () { st.audioOk = false; st.mode = 'none'; st.paused = false; ui(); showNotice('none'); });

    /* ---- ボタン ---- */
    chat.addEventListener('click', function (ev) {
      var b = ev.target.closest('.bub'); if (!b) return;
      playLine(+b.closest('.row').getAttribute('data-i'));
    });
    $('#views').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var v = b.getAttribute('data-view');
      app.setAttribute('data-view', v);
      $$('button', $('#views')).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (v === 'chat') select(st.cur, true);
      ui();
    });
    $('#tRd').addEventListener('click', function () { st.rd = !st.rd; ui(); });
    $('#tTh').addEventListener('click', function () { st.th = !st.th; ui(); });
    $('#speed').addEventListener('click', function () {
      prefs.speed = (prefs.speed + 1) % SPEEDS.length; save();
      audio.playbackRate = SPEEDS[prefs.speed]; ui();
    });
    $('#playAll').addEventListener('click', playAll);
    $('#playLine').addEventListener('click', toggleLine);
    $('#prev').addEventListener('click', function () { if (st.mode !== 'none') stop(); select(st.cur - 1, true); });
    $('#next').addEventListener('click', function () { if (st.mode !== 'none') stop(); select(st.cur + 1, true); });

    /* ---- 全画面（集中モード）：上のバーをたたんで、会話だけにする ---- */
    var fBtn = $('#focusBtn'), fExit = $('#focusExit');
    fBtn.innerHTML = IC.full + '<span lang="th">เต็มจอ</span>'; fBtn.setAttribute('aria-label', 'ぜんがめんに する');
    fExit.innerHTML = IC.small + '<span lang="th">ย่อจอ</span>'; fExit.setAttribute('aria-label', 'ぜんがめんを やめる');
    function setFocus(on) {
      app.setAttribute('data-focus', on ? '1' : '0');
      fExit.hidden = !on;
      try {
        if (on && H.requestFullscreen && !D.fullscreenElement) { var p = H.requestFullscreen(); if (p && p.catch) p.catch(function () { }); }
        if (!on && D.fullscreenElement && D.exitFullscreen) { var q = D.exitFullscreen(); if (q && q.catch) q.catch(function () { }); }
      } catch (e) { }
      (on ? fExit : fBtn).focus();
    }
    fBtn.addEventListener('click', function () { setFocus(true); });
    fExit.addEventListener('click', function () { setFocus(false); });

    window.addEventListener('resize', ui);

    loadTalk();
  }
})();
