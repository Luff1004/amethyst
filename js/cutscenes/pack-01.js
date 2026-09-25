/*
  CUTSCENE PACK 01
  Copy any block below to add a new cutscene. Add new pack files in js/cutscenes/
  and list them in index.html (after engine.js and templates.js).
  Odds are "1 in N" per mining action. Higher odds = rarer = bigger reward.
*/
(() => {
  const R = G.cutscenes.register;

  R({ id: 'glint',   name: '반짝이는 조각', odds: 100,    zone: 0, template: 'burst',
      colors: ['#ffd98a', '#c9822b', '#0d0906'] });

  R({ id: 'vein',    name: '숨은 광맥',     odds: 400,    zone: 0, template: 'rain',
      colors: ['#8fc4ff', '#3d6fd1', '#060a14'] });

  R({ id: 'fallstar', name: '낙성',         odds: 1500,   zone: 0, template: 'meteor',
      colors: ['#7fe8ff', '#3a86ff', '#04070f'] });

  R({ id: 'gate',    name: '봉인된 문',     odds: 8000,   zone: 1, template: 'gate',
      colors: ['#c8f3ff', '#4fb7ff', '#080b12'] });

  R({ id: 'sigil',   name: '아메시스트 인장', odds: 30000, zone: 1, template: 'rings',
      colors: ['#d6a8ff', '#7a3fe0', '#07040f'] });

  R({ id: 'heart',   name: '심장 결정',     odds: 120000, zone: 2, template: 'core',
      colors: ['#ff9ec0', '#d1306a', '#0d0409'] });

  /* custom scene example: full control through draw(g, e) */
  R({ id: 'voideye', name: '공허의 눈',     odds: 500000, zone: 3,
      colors: ['#f0b8ff', '#a11fd6', '#050008'],
      draw(g, e) {
        const { p, u, cx, cy, time } = e, [A, B] = e.col;
        const { E, seg, rgba, rng } = G, fx = G.fx;
        fx.bg(g, e, 0.12 * seg(p, 0.2, 0.6));
        const open = E.outBack(seg(p, 0.1, 0.5)), W2 = u * 38, H2 = u * 15 * open;
        // tendrils
        const r = rng(4);
        g.lineWidth = u * 0.35;
        for (let i = 0; i < 26; i++) {
          const an = r() * Math.PI * 2, len = u * (30 + r() * 60) * E.outCubic(seg(p, 0.35, 0.8));
          g.strokeStyle = rgba(i % 2 ? A : B, 0.5);
          g.beginPath(); g.moveTo(cx + Math.cos(an) * W2 * 0.9, cy + Math.sin(an) * H2);
          g.quadraticCurveTo(cx + Math.cos(an + 0.4 + Math.sin(time * 0.001 + i) * 0.2) * len * 0.6, cy + Math.sin(an + 0.4) * len * 0.6, cx + Math.cos(an) * len, cy + Math.sin(an) * len);
          g.stroke();
        }
        // eye
        g.save();
        g.beginPath(); g.moveTo(cx - W2, cy);
        g.quadraticCurveTo(cx, cy - H2 * 2, cx + W2, cy);
        g.quadraticCurveTo(cx, cy + H2 * 2, cx - W2, cy); g.closePath();
        g.fillStyle = '#000'; g.fill(); g.clip();
        const look = Math.sin(time * 0.0012) * u * 5;
        const ir = g.createRadialGradient(cx + look, cy, 0, cx + look, cy, u * 14);
        ir.addColorStop(0, rgba('#ffffff', 1)); ir.addColorStop(0.25, rgba(A, 1)); ir.addColorStop(1, rgba(B, 1));
        g.fillStyle = ir; g.beginPath(); g.arc(cx + look, cy, u * 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#000';
        g.beginPath(); g.ellipse(cx + look, cy, u * 2.4 * (1 - 0.5 * seg(p, 0.55, 0.7)), u * 13, 0, 0, Math.PI * 2); g.fill();
        g.restore();
        g.strokeStyle = rgba(A, 0.9); g.lineWidth = u * 0.5;
        g.beginPath(); g.moveTo(cx - W2, cy);
        g.quadraticCurveTo(cx, cy - H2 * 2, cx + W2, cy);
        g.quadraticCurveTo(cx, cy + H2 * 2, cx - W2, cy); g.closePath(); g.stroke();
        // stare pulse
        const b = seg(p, 0.55, 1);
        if (b > 0) {
          fx.flash(g, e, 0.6 * (1 - E.outCubic(seg(b, 0, 0.15))));
          for (let i = 0; i < 3; i++) fx.ring(g, cx, cy, u * 110 * E.outExpo(Math.max(0, b - i * 0.12)), u * 1.4, A, (1 - b) * (1 - i * 0.25));
        }
      } });

  R({ id: 'birth',   name: '아메시스트의 탄생', odds: 999999, zone: 3, template: 'pillar',
      colors: ['#e7c6ff', '#9b4dff', '#06020d'] });

  R({ id: 'eclipse', name: '개기 일식',     odds: 3000000, zone: 3, template: 'eclipse',
      colors: ['#ffe27a', '#ff7a2f', '#020204'] });
})();
