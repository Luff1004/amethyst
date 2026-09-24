/*
  SPECIAL minerals - one per month's event (js/data/events.js), never rolled by odds: they only come
  from that month's limited mineral crystal. Codex shelf "SP". This file: months 1-4.
  G.sp() is the shared registration helper for s1/s2/s3.
*/
(() => {
  const { E, seg, rng, clamp, lerp } = G;
  const TAU = Math.PI * 2;
  const SERIF = '"Noto Serif KR","Nanum Myeongjo","Batang",Georgia,serif';
  const SANS = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';

  G.sp = (m, o) => {
    const ev = G.data.events.find(e => e.m === m);
    G.cutscenes.register(Object.assign({
      id: 'sp_' + ev.id, name: ev.mineral[0], odds: 3e10, tier: 'special', special: true, zone: -1,
      month: m, event: ev.id, eventName: ev.name, duration: 18000, revealAt: 0.68,
    }, o));
  };
  G.sp.fonts = { SERIF, SANS };
  const cap = (a, b, ko, extra = {}) => Object.assign({ a, b, ko }, extra);

  /* ---------------- 1월 설날: first sunrise, a kite cut loose, a lucky pouch that opens ---------------- */
  {
    const ridges = [0, 1, 2, 3].map(i => { const r = rng(300 + i), pts = []; for (let k = 0; k <= 24; k++) pts.push(r()); return pts; });
    G.sp(1, {
      colors: ['#ffcf5a', '#e2233c', '#070612'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:whisper root:262 scale:major',
      captions: [
        cap(0.04, 0.2, '새해 첫 해가 산마루를 넘는다', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.22, 0.4, '묵은 액운은 연줄에 실어 멀리 보내고', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.42, 0.6, '복주머니 끈을 풀면', { pos: 'top', style: 'engrave', font: SERIF }),
        cap(0.72, 1.4, '새해 복 많이 받으세요', { style: 'engrave', font: SERIF }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const dawn = E.inOut(seg(p, 0.12, 0.6)), hz = H * 0.66;
        const sky = g.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, `rgb(${Math.round(lerp(8, 40, dawn))},${Math.round(lerp(10, 30, dawn))},${Math.round(lerp(30, 70, dawn))})`);
        sky.addColorStop(0.65, `rgb(${Math.round(lerp(20, 190, dawn))},${Math.round(lerp(16, 80, dawn))},${Math.round(lerp(50, 90, dawn))})`);
        sky.addColorStop(1, `rgb(${Math.round(lerp(30, 255, dawn))},${Math.round(lerp(20, 170, dawn))},${Math.round(lerp(50, 90, dawn))})`);
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        // the first sun of the year
        const sr = m * 0.13, sy = lerp(hz + sr * 1.2, hz - sr * 1.1, E.outCubic(seg(p, 0.28, 0.62)));
        TX.glow(g, cx, sy, m * 0.9, '#ff9a4a', 0.35 + 0.5 * dawn);
        const sg = g.createRadialGradient(cx, sy, 0, cx, sy, sr);
        sg.addColorStop(0, '#fff6d8'); sg.addColorStop(0.7, '#ffc25a'); sg.addColorStop(1, '#ff7a2a');
        g.fillStyle = sg; g.beginPath(); g.arc(cx, sy, sr, 0, TAU); g.fill();
        // ink-wash mountains with mist between the layers
        ridges.forEach((pts, i) => {
          const base = hz + i * m * 0.07, amp = m * (0.16 - i * 0.025);
          const shade = Math.round(lerp(10 + i * 6, 40 + i * 22, dawn * 0.6));
          g.fillStyle = `rgb(${shade},${Math.round(shade * 0.85)},${Math.round(shade * 1.15)})`;
          g.beginPath(); g.moveTo(0, H);
          pts.forEach((v, k) => g.lineTo(k / 24 * W, base - amp * (0.4 + 0.6 * v) * (0.6 + 0.4 * Math.sin(k * 0.5 + i))));
          g.lineTo(W, H); g.fill();
          const mg = g.createLinearGradient(0, base - amp * 0.3, 0, base + m * 0.05);
          mg.addColorStop(0, 'rgba(255,230,220,0)'); mg.addColorStop(1, `rgba(255,${Math.round(200 + 30 * dawn)},${Math.round(200 + 20 * dawn)},${0.12 + 0.1 * dawn})`);
          g.fillStyle = mg; g.fillRect(0, base - amp * 0.3, W, m * 0.2);
        });
        // snow
        const snr = rng(9); g.fillStyle = '#fff';
        for (let i = 0; i < 70; i++) {
          const x = (snr() * W + Math.sin(time * 0.0008 + i) * u * 3) % W, y = (snr() * H + time * 0.02 * (0.4 + snr())) % H;
          g.globalAlpha = 0.35 + 0.4 * snr(); g.beginPath(); g.arc(x, y, u * (0.15 + 0.25 * snr()), 0, TAU); g.fill();
        }
        g.globalAlpha = 1;
        // 방패연: flies on its string, then the string is cut and it sails away with the old year's bad luck
        const cut = E.inCubic(seg(p, 0.4, 0.6));
        if (cut < 1) {
          const kx = lerp(W * 0.3 + Math.sin(time * 0.0011) * u * 4, W * 1.1, cut), ky = lerp(H * 0.3 + Math.cos(time * 0.0013) * u * 3, -H * 0.1, cut);
          const kw = m * 0.12, kh = m * 0.16, rot = Math.sin(time * 0.0015) * 0.12 + cut * 1.5;
          if (p < 0.4) {
            g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(1, u * 0.15);
            g.beginPath(); g.moveTo(kx, ky + kh * 0.4); g.quadraticCurveTo(kx - W * 0.1, H * 0.7, -W * 0.05, H * 1.05); g.stroke();
          }
          g.save(); g.translate(kx, ky); g.rotate(rot);
          g.fillStyle = '#f6efe2'; g.fillRect(-kw / 2, -kh / 2, kw, kh);
          g.fillStyle = '#d42a3a'; g.beginPath(); g.arc(0, -kh * 0.32, kw * 0.14, 0, TAU); g.fill();
          g.fillStyle = '#1f4fa8'; g.fillRect(-kw / 2, kh * 0.36, kw, kh * 0.14);
          g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, kh * 0.02, kw * 0.2, 0, TAU); g.fill();
          g.globalCompositeOperation = 'source-over';
          g.strokeStyle = '#3a2a1a'; g.lineWidth = Math.max(1, u * 0.2);
          g.strokeRect(-kw / 2, -kh / 2, kw, kh); g.beginPath(); g.moveTo(-kw / 2, -kh / 2); g.lineTo(kw / 2, kh / 2); g.moveTo(kw / 2, -kh / 2); g.lineTo(-kw / 2, kh / 2); g.stroke();
          g.restore();
        }
        // the lucky pouch descends, opens, and the fortune rises out of it
        const drop = E.outBack(seg(p, 0.46, 0.58)), openK = E.inOut(seg(p, 0.6, 0.67)), rv = E.outCubic(seg(p, 0.64, 0.76));
        if (drop > 0) {
          const px = cx, py = lerp(-m * 0.3, cy + m * 0.12, drop) + Math.sin(time * 0.002) * u * 0.6, pw = m * 0.2 * (1 + openK * 0.1), ph = m * 0.2;
          if (rv > 0) {
            g.save(); g.font = `900 ${m * 0.62}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.globalAlpha = 0.18 * rv; g.fillStyle = '#ffcf5a'; g.fillText('福', cx, cy); g.restore();
            g.save(); g.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 18; i++) {
              const a = -Math.PI / 2 + (i / 17 - 0.5) * 1.6, l = e.R * rv;
              const bg = g.createLinearGradient(px, py - ph * 0.5, px + Math.cos(a) * l, py - ph * 0.5 + Math.sin(a) * l);
              bg.addColorStop(0, 'rgba(255,220,120,0.4)'); bg.addColorStop(1, 'rgba(255,200,80,0)');
              g.fillStyle = bg; g.beginPath(); g.moveTo(px, py - ph * 0.5); g.lineTo(px + Math.cos(a - 0.04) * l, py - ph * 0.5 + Math.sin(a - 0.04) * l); g.lineTo(px + Math.cos(a + 0.04) * l, py - ph * 0.5 + Math.sin(a + 0.04) * l); g.fill();
            }
            g.restore();
          }
          g.save(); g.translate(px, py);
          const neck = pw * lerp(0.28, 0.5, openK);
          const bgd = g.createRadialGradient(-pw * 0.2, -ph * 0.1, 0, 0, 0, pw * 0.8);
          bgd.addColorStop(0, '#ff5a6a'); bgd.addColorStop(1, '#8a0a1c');
          g.fillStyle = bgd;
          g.beginPath(); g.moveTo(-neck, -ph * 0.45);
          g.bezierCurveTo(-pw * 0.75, -ph * 0.2, -pw * 0.7, ph * 0.5, 0, ph * 0.5);
          g.bezierCurveTo(pw * 0.7, ph * 0.5, pw * 0.75, -ph * 0.2, neck, -ph * 0.45); g.closePath(); g.fill();
          // gold 福 roundel + the gathered ruffle and drawstring
          g.strokeStyle = '#ffcf5a'; g.lineWidth = Math.max(1, u * 0.3);
          g.beginPath(); g.arc(0, ph * 0.1, pw * 0.2, 0, TAU); g.stroke();
          g.fillStyle = '#ffcf5a'; g.font = `900 ${pw * 0.26}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('福', 0, ph * 0.11);
          g.fillStyle = '#c21830';
          for (let i = -3; i <= 3; i++) { g.beginPath(); g.ellipse(i * neck / 3.2, -ph * 0.5 - openK * ph * 0.05, neck * 0.2, ph * 0.08, 0, 0, TAU); g.fill(); }
          if (openK < 1) {
            g.strokeStyle = '#ffcf5a'; g.lineWidth = Math.max(1, u * 0.35);
            g.beginPath(); g.moveTo(-neck, -ph * 0.42); g.lineTo(neck, -ph * 0.42); g.stroke();
            g.globalAlpha = 1 - openK;
            for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * neck * 0.4, -ph * 0.42); g.quadraticCurveTo(sd * pw * 0.2, -ph * 0.2, sd * pw * 0.12, ph * 0.02); g.stroke(); }
            g.globalAlpha = 1;
          }
          g.restore();
          if (rv > 0) {
            const gy = lerp(py - ph * 0.4, cy - m * 0.08, rv);
            TX.gem(g, 'brilliant', cx, gy, m * 0.14 * E.outBack(rv), 42, time, { col: ['#fff4c8', '#ffb83a', '#6a1a08'], rx: 0.8 });
            g.save(); g.globalCompositeOperation = 'lighter';
            const cr = rng(Math.floor(time / 200));
            for (let i = 0; i < 12; i++) G.cine.star(g, cx + (cr() - 0.5) * m * 0.8, cy + (cr() - 0.5) * m * 0.6, m * 0.03 * cr(), '#ffe08a', rv * cr());
            g.restore();
          }
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ffd27a');
        TX.vignette(g, e, 0.55);
      },
    });
  }

  /* ---------------- 2월 발렌타인: petals, a ribbon that draws a heart, a box that opens on a ruby heart ---------------- */
  {
    const heartPt = (t, s) => [16 * Math.pow(Math.sin(t), 3) * s, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s];
    const heartPath = (s, n = 90) => { const pth = new Path2D(); for (let i = 0; i <= n; i++) { const [x, y] = heartPt(i / n * TAU, s); i ? pth.lineTo(x, y) : pth.moveTo(x, y); } pth.closePath(); return pth; };
    const petals = [], r0 = rng(410);
    for (let i = 0; i < 46; i++) petals.push({ x: r0(), y: r0(), s: 0.6 + r0() * 0.8, sp: 0.4 + r0() * 0.8, ph: r0() * 10, h: 340 + r0() * 20 });
    const petal = (g, x, y, s, rot, flip) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(flip, 1);
      g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * 0.9, -s * 0.7, s * 0.7, s * 0.6, 0, s); g.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.7, 0, -s); g.fill(); g.restore();
    };
    const rubyHeart = (g, x, y, s, t) => {
      g.save(); g.translate(x, y);
      const hp = heartPath(s), N = 16, pts = [];
      for (let i = 0; i < N; i++) pts.push(heartPt(i / N * TAU, s));
      g.save(); g.clip(hp);
      const bg = g.createRadialGradient(-s * 4, -s * 5, s, 0, 0, s * 18);
      bg.addColorStop(0, '#ff8aa0'); bg.addColorStop(0.5, '#d4102e'); bg.addColorStop(1, '#4a0010');
      g.fillStyle = bg; g.fillRect(-s * 20, -s * 20, s * 40, s * 40);
      const c0 = [Math.sin(t * 0.0009) * s * 1.5, -s * 2];
      pts.forEach((p0, i) => {
        const p1 = pts[(i + 1) % N], lit = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 0.002);
        g.fillStyle = `rgba(${i % 2 ? '255,200,210' : '60,0,10'},${i % 2 ? 0.1 + 0.25 * lit : 0.15 + 0.2 * (1 - lit)})`;
        g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,220,230,0.35)'; g.lineWidth = Math.max(0.6, s * 0.08); g.stroke();
      });
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-s * 7, -s * 6, s * 3, s * 1.4, -0.6, 0, TAU); g.fill();
      g.restore();
      g.strokeStyle = '#ffd0da'; g.lineWidth = Math.max(1, s * 0.25); g.stroke(hp);
      g.restore();
    };
    G.sp(2, {
      colors: ['#ff6a8a', '#ff2a5a', '#12020a'],
      snd: 'rise:heart hit:celesta tail:musicbox amb:whisper root:220 scale:lydian',
      captions: [
        cap(0.04, 0.2, '말로 하기엔 너무 달콤해서', { pos: 'top', style: 'fly', from: 'left', font: SANS }),
        cap(0.22, 0.4, '초콜릿 대신 준비한 것', { pos: 'top', style: 'fly', from: 'right', font: SANS }),
        cap(0.42, 0.6, '리본을 풀어봐', { pos: 'top', style: 'fly', from: 'top', font: SANS }),
        cap(0.72, 1.4, '두근거림을 담아, 너에게', { style: 'fly', from: 'bottom', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const bg = g.createRadialGradient(cx, cy, 0, cx, cy, e.R);
        bg.addColorStop(0, '#3a0618'); bg.addColorStop(1, '#0c0106');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        // bokeh
        const br = rng(5);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) {
          const x = br() * W, y = br() * H, r = m * (0.02 + br() * 0.06), a = 0.05 + 0.08 * Math.sin(time * 0.001 + i);
          const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(255,120,160,${a})`); gg.addColorStop(1, 'rgba(255,120,160,0)');
          g.fillStyle = gg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        }
        g.restore();
        // petals drifting down, tumbling
        for (const q of petals) {
          const y = ((q.y * H + time * 0.03 * q.sp) % (H * 1.1)) - H * 0.05, x = q.x * W + Math.sin(time * 0.001 * q.sp + q.ph) * m * 0.06;
          const tumble = Math.cos(time * 0.002 * q.sp + q.ph);
          g.fillStyle = `hsla(${q.h},85%,${55 + 15 * tumble}%,0.85)`;
          petal(g, x, y, m * 0.018 * q.s, time * 0.0008 * q.sp + q.ph, Math.max(0.15, Math.abs(tumble)));
        }
        const s = m * 0.017, hs = s * (1 + 0.04 * Math.pow(Math.max(0, Math.sin(time * 0.006)), 6));
        // the satin ribbon traces a heart; the heart becomes a chocolate box; the box opens
        const draw = E.inOut(seg(p, 0.12, 0.45)), boxK = E.outCubic(seg(p, 0.45, 0.55)), openK = E.inOut(seg(p, 0.58, 0.68));
        if (openK < 1) {
          g.save(); g.translate(cx, cy);
          if (boxK > 0) {
            for (const sd of [-1, 1]) {
              g.save(); g.translate(sd * openK * m * 0.35, openK * m * 0.1); g.rotate(sd * openK * 0.5); g.globalAlpha = boxK * (1 - openK);
              g.beginPath(); g.rect(sd < 0 ? -m : 0, -m, m, m * 2); g.clip();
              const hp = heartPath(hs * 1.05);
              const cg = g.createLinearGradient(0, -m * 0.2, 0, m * 0.2); cg.addColorStop(0, '#6a2a14'); cg.addColorStop(1, '#2a0c04');
              g.fillStyle = cg; g.fill(hp); g.strokeStyle = '#d8a060'; g.lineWidth = u * 0.3; g.stroke(hp);
              g.restore();
            }
          }
          if (draw > 0) {
            const N = 140, n = Math.floor(draw * N);
            g.lineCap = 'round';
            for (let i = 0; i < n; i++) {
              const [x0, y0] = heartPt(i / N * TAU, hs * 1.12), [x1, y1] = heartPt((i + 1) / N * TAU, hs * 1.12);
              const tw = Math.abs(Math.cos(i * 0.25 + time * 0.002));
              g.strokeStyle = `hsl(350,90%,${40 + 30 * tw}%)`; g.globalAlpha = 1 - openK; g.lineWidth = u * (0.4 + 1.3 * tw);
              g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
            }
            if (boxK > 0.5) {   // the bow on top
              g.fillStyle = '#ff3a6a';
              for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * m * 0.045, -hs * 5.5, m * 0.05, m * 0.025, sd * 0.4, 0, TAU); g.fill(); }
              g.beginPath(); g.arc(0, -hs * 5.5, m * 0.015, 0, TAU); g.fill();
            }
          }
          g.restore();
        }
        const rv = E.outCubic(seg(p, 0.64, 0.76));
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.55, '#ff2a5a', 0.7 * rv);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 3; k++) {
            const rr = (time * 0.05 + k * m * 0.3) % (m * 0.9);
            g.globalAlpha = 0.4 * rv * (1 - rr / (m * 0.9)); g.strokeStyle = '#ff7a9a'; g.lineWidth = u * 0.4;
            g.save(); g.translate(cx, cy); g.stroke(heartPath(s * (0.6 + rr / (m * 0.3)))); g.restore();
          }
          g.restore();
          rubyHeart(g, cx, cy, hs * 0.75 * E.outBack(rv), time);
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ff9ab0');
        TX.vignette(g, e, 0.6);
      },
    });
  }

  /* ---------------- 3월 화이트데이: star candies fill a glass jar; the cork pops; one candy becomes a star ---------------- */
  {
    const N = 110, candies = [], r0 = rng(520);
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / 11), col = i % 11;
      candies.push({ t: 0.05 + i / N * 0.42, tx: (col - 5) / 5.4 + (r0() - 0.5) * 0.06 + (row % 2) * 0.04, ty: row, sx: (r0() - 0.5) * 1.6, h: [330, 50, 190, 120, 270, 20][i % 6] + r0() * 20, rot: r0() * TAU });
    }
    const konpeito = (g, x, y, r, h, rot) => {
      g.fillStyle = `hsl(${h},80%,78%)`; g.beginPath();
      for (let k = 0; k < 20; k++) { const a = rot + k / 20 * TAU, rr = k % 2 ? r * 0.8 : r; k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, TAU); g.fill();
    };
    G.sp(3, {
      colors: ['#bff4ff', '#ff9ad8', '#0c0a1a'],
      snd: 'rise:crystalline hit:celesta tail:musicbox amb:whisper root:294 scale:major',
      captions: [
        cap(0.04, 0.2, '한 달 전의 마음에 답장을 쓴다', { pos: 'top', style: 'type', font: SANS }),
        cap(0.22, 0.4, '달콤한 별을 한 알씩 담아서', { pos: 'top', style: 'type', font: SANS }),
        cap(0.42, 0.6, '병이 가득 차면', { pos: 'top', style: 'type', font: SANS }),
        cap(0.72, 1.4, '받은 만큼, 아니 그보다 더', { style: 'type', font: SANS }),
      ],
      draw(g, e) {
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a2450'); bg.addColorStop(0.6, '#3a2c5a'); bg.addColorStop(1, '#1a1430');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        const br = rng(3);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 30; i++) {
          const x = br() * W, y = br() * H, r = m * (0.02 + br() * 0.05), hh = [190, 320, 50][i % 3];
          const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `hsla(${hh},90%,75%,${0.12 + 0.06 * Math.sin(time * 0.0012 + i)})`); gg.addColorStop(1, 'hsla(0,0%,0%,0)');
          g.fillStyle = gg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        }
        g.restore();
        // the jar
        const jw = m * 0.22, jh = m * 0.28, jx = cx, jy = cy + m * 0.1, bot = jy + jh, full = seg(p, 0.05, 0.5);
        const pop = E.outCubic(seg(p, 0.58, 0.68)), rv = E.outCubic(seg(p, 0.64, 0.76));
        const jarPath = new Path2D();
        jarPath.moveTo(jx - jw * 0.45, jy - jh * 0.95); jarPath.lineTo(jx - jw * 0.45, jy - jh * 0.8);
        jarPath.quadraticCurveTo(jx - jw, jy - jh * 0.75, jx - jw, jy - jh * 0.4); jarPath.lineTo(jx - jw, bot - jw * 0.2);
        jarPath.quadraticCurveTo(jx - jw, bot, jx - jw * 0.8, bot); jarPath.lineTo(jx + jw * 0.8, bot); jarPath.quadraticCurveTo(jx + jw, bot, jx + jw, bot - jw * 0.2);
        jarPath.lineTo(jx + jw, jy - jh * 0.4); jarPath.quadraticCurveTo(jx + jw, jy - jh * 0.75, jx + jw * 0.45, jy - jh * 0.8); jarPath.lineTo(jx + jw * 0.45, jy - jh * 0.95);
        g.fillStyle = 'rgba(200,230,255,0.08)'; g.fill(jarPath);
        TX.glow(g, jx, jy + jh * 0.4, m * 0.4, '#ffd0f0', 0.2 + 0.6 * seg(p, 0.45, 0.6));
        // candies raining into the jar and piling up
        const cr = m * 0.017;
        g.save(); g.clip(jarPath);
        for (const c of candies) {
          const k = seg(p, c.t, c.t + 0.07);
          if (k <= 0) continue;
          const tx = jx + c.tx * jw * 0.9, ty = bot - cr * 1.1 - c.ty * cr * 1.7;
          if (k >= 1) konpeito(g, tx, ty, cr, c.h, c.rot);
        }
        g.restore();
        for (const c of candies) {
          const k = seg(p, c.t, c.t + 0.07);
          if (k <= 0 || k >= 1) continue;
          const tx = jx + c.tx * jw * 0.9, ty = bot - cr * 1.1 - c.ty * cr * 1.7;
          const x = lerp(jx + c.sx * m * 0.3, tx, k), y = lerp(-cr * 2, ty, E.inQuad(k)) - Math.sin(k * Math.PI) * m * 0.05;
          konpeito(g, x, y, cr, c.h, c.rot + k * 6);
        }
        // glass highlights
        g.strokeStyle = 'rgba(230,245,255,0.55)'; g.lineWidth = Math.max(1, u * 0.3); g.stroke(jarPath);
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = u * 0.8; g.lineCap = 'round';
        g.beginPath(); g.moveTo(jx - jw * 0.8, jy - jh * 0.3); g.lineTo(jx - jw * 0.8, bot - jw * 0.4); g.stroke();
        // the cork, popping off
        g.save(); g.translate(jx + pop * m * 0.25, jy - jh * 0.98 - pop * m * 0.45); g.rotate(pop * 5);
        g.fillStyle = '#c89a6a'; g.fillRect(-jw * 0.5, -jh * 0.12, jw, jh * 0.14); g.fillStyle = '#a07a4a'; g.fillRect(-jw * 0.5, -jh * 0.02, jw, jh * 0.04);
        g.restore();
        g.globalAlpha = 1 - pop; g.strokeStyle = '#ff9ad8'; g.lineWidth = u * 0.5;
        g.beginPath(); g.moveTo(jx - jw * 0.45, jy - jh * 0.86); g.lineTo(jx + jw * 0.45, jy - jh * 0.86); g.stroke(); g.globalAlpha = 1;
        // one candy floats out and becomes a star; the rest spray out like confetti
        if (rv > 0) {
          g.save(); g.globalCompositeOperation = 'lighter';
          const sr = rng(4);
          for (let i = 0; i < 26; i++) {
            const a = -Math.PI / 2 + (sr() - 0.5) * 2.4, v = m * (0.3 + sr() * 0.5) * rv, x = jx + Math.cos(a) * v, y = jy - jh + Math.sin(a) * v + rv * rv * m * 0.3;
            konpeito(g, x, y, cr * 0.8, [330, 50, 190, 120][i % 4], time * 0.004 + i);
          }
          g.restore();
          const gy = lerp(jy - jh, cy - m * 0.08, rv);
          TX.glow(g, cx, gy, m * 0.4, '#ffd0f0', 0.7 * rv);
          TX.gem(g, 'star', cx, gy, m * 0.13 * E.outBack(rv), (time * 0.04) % 360, time, { col: ['#ffffff', G.hsl((time * 0.04) % 360, 80, 80), G.hsl((time * 0.04 + 180) % 360, 60, 35)] });
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ffe0f4');
        TX.vignette(g, e, 0.5);
      },
    });
  }

  /* ---------------- 4월 벚꽃: a tree blooms under the moon; the wind takes every petal into one stone ---------------- */
  {
    // built lazily on first draw so it doesn't depend on script order relative to js/cutscenes/tx/kit.js
    let tree = null, blossoms = null;
    const ensure = () => {
      if (tree) return;
      tree = [];
      for (let i = 0; i < 7; i++) tree.push(...G.tx.branches(700 + i, -0.03 + i * 0.01, 0.62, -Math.PI / 2 + (i - 3) * 0.3, 0.05, 12, 3, [-0.5 + i * 0.165, -0.12 + Math.abs(i - 3) * 0.06]));
      blossoms = []; const r = rng(71);
      tree.forEach(b => b.pts.forEach((pt, k) => { if (k > 2 && r() < 0.7) blossoms.push({ x: pt[0] + (r() - 0.5) * 0.05, y: pt[1] + (r() - 0.5) * 0.05, t: b.t0 * 0.5 + k / b.pts.length * 0.5, s: 0.6 + r() * 0.7, a: r() * TAU, sp: r() }); }));
    };
    const flower = (g, x, y, r, rot, a) => {
      g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a;
      g.fillStyle = '#ffd0e0';
      for (let k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); g.ellipse(0, -r * 0.55, r * 0.38, r * 0.55, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#ff6a9a'; g.beginPath(); g.arc(0, 0, r * 0.22, 0, TAU); g.fill();
      g.restore();
    };
    G.sp(4, {
      colors: ['#ffc4dc', '#ff6aa8', '#0a0816'],
      snd: 'rise:crystalline hit:celesta tail:chime amb:whisper root:247 scale:lydian',
      captions: [
        cap(0.04, 0.2, '봄바람이 가지 끝을 스치면', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.22, 0.4, '잠든 꽃눈이 하나씩 깨어난다', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.42, 0.6, '바람이 분다', { pos: 'top', style: 'fade', font: SERIF }),
        cap(0.72, 1.4, '꽃이 지는 자리에, 봄이 남는다', { style: 'fade', font: SERIF }),
      ],
      draw(g, e) {
        ensure();
        const { p, u, cx, cy, W, H, time } = e, TX = G.tx, m = Math.min(W, H);
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0a0a24'); sky.addColorStop(0.7, '#2a1a3e'); sky.addColorStop(1, '#3a1e3a');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        const st = rng(2); g.fillStyle = '#fff';
        for (let i = 0; i < 60; i++) { g.globalAlpha = 0.2 + 0.5 * st() * (0.6 + 0.4 * Math.sin(time * 0.002 + i)); g.fillRect(st() * W, st() * H * 0.6, 1.2, 1.2); }
        g.globalAlpha = 1;
        const mx = W * 0.78, my = H * 0.22, mr = m * 0.09;
        TX.glow(g, mx, my, mr * 5, '#ffe8f4', 0.35);
        g.fillStyle = '#fff4f8'; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
        // tree: branches grow, then bloom
        const sc = m * 0.95, ox = cx, oy = H * 0.3;
        const grow = E.outCubic(seg(p, 0.02, 0.24)), wind = seg(p, 0.44, 0.64);
        const sway = Math.sin(time * 0.001) * 0.01 + wind * Math.sin(time * 0.006) * 0.02;
        g.strokeStyle = '#1a0c10'; g.lineCap = 'round';
        for (const b of tree) {
          const k = clamp((grow - b.t0 * 0.6) / 0.4);
          if (k <= 0) continue;
          const pth = new Path2D(); TX.partial(pth, b.pts.map(([x, y]) => [x + sway * (0.62 - y) * 3, y]), k, sc, sc, ox, oy);
          g.lineWidth = Math.max(1, u * 2.4 * b.w); g.stroke(pth);
        }
        g.fillStyle = '#12080c'; g.fillRect(0, oy + 0.62 * sc - u, W, H);
        const bloom = seg(p, 0.14, 0.44);
        const rv = E.outCubic(seg(p, 0.64, 0.76)), gather = E.inCubic(seg(p, 0.5, 0.66));
        for (const bl of blossoms) {
          const k = E.outBack(clamp((bloom - bl.t * 0.8) / 0.2));
          if (k <= 0) continue;
          let x = ox + (bl.x + sway * (0.62 - bl.y) * 3) * sc, y = oy + bl.y * sc;
          const loose = clamp((wind - bl.sp * 0.5) * 2);
          if (loose > 0) {
            // torn loose: swept into a spiral that tightens onto the center
            const a0 = Math.atan2(y - cy, x - cx) + loose * 3 + time * 0.0015, d0 = Math.hypot(x - cx, y - cy) * (1 - gather * 0.95);
            x = lerp(x, cx + Math.cos(a0) * d0, loose); y = lerp(y, cy + Math.sin(a0) * d0 * 0.7, loose);
          }
          flower(g, x, y, m * 0.012 * bl.s * k * (1 - rv * 0.7), bl.a + loose * time * 0.004, 1 - rv * 0.6);
        }
        // loose petals everywhere once the wind rises
        const pr = rng(8);
        g.fillStyle = '#ffc4dc';
        for (let i = 0; i < 80 * Math.max(wind, 0.25); i++) {
          const x = (pr() * W + time * 0.05 * (0.5 + pr())) % W, y = (pr() * H + time * 0.02 * pr()) % H;
          g.save(); g.translate(x, y); g.rotate(time * 0.003 + i); g.globalAlpha = 0.7; g.beginPath(); g.ellipse(0, 0, u * 0.6, u * 0.35, 0, 0, TAU); g.fill(); g.restore();
        }
        g.globalAlpha = 1;
        if (rv > 0) {
          TX.glow(g, cx, cy, m * 0.5, '#ff8ab8', 0.7 * rv);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + time * 0.0008, d = m * (0.2 + 0.05 * Math.sin(time * 0.002 + i)); flower(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, m * 0.012, a, 0.7 * rv); }
          g.restore();
          TX.gem(g, 'prism', cx, cy, m * 0.14 * E.outBack(rv), 330, time);
        }
        TX.flash(g, e, 0.8 * TX.bump(p, 0.64, 0.72), '#ffd0e4');
        TX.vignette(g, e, 0.6);
      },
    });
  }
})();
