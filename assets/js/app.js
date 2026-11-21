/* global jQuery */
(function ($) {
  'use strict';

  $(function () {
    const $el = id => $('#' + id);
    const value = id => $el(id).val();
    const canvas = $el('cover')[0];
    const ctx = canvas.getContext('2d', { alpha: false });
    const state = { font: 'fallback', uploadedName: '' };
    const DEFAULT = { w: 1200, h: 900 };
    const inputIds = ['title', 'subtitle', 'bg', 'maincolor', 'subcolor', 'mainwidth', 'subwidth', 'gap', 'top'];
    let ratio = DEFAULT.w / DEFAULT.h;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const numberValue = (id, fallback) => {
      const n = Math.round(Number(value(id)));
      return Number.isFinite(n) ? clamp(n, 64, 8192) : fallback;
    };

    function setCanvasSize(width, height) {
      const w = clamp(Math.round(width), 64, 8192);
      const h = clamp(Math.round(height), 64, 8192);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      $el('dimensions').text(w + ' × ' + h);
    }

    function fontFamily() {
      switch (state.font) {
        case 'file': return '"ImportedHarabara", sans-serif';
        case 'remote': return '"Harabara", sans-serif';
        case 'local': return '"LocalHarabara", sans-serif';
        default: return '"Arial Rounded MT Bold", "Trebuchet MS", Verdana, sans-serif';
      }
    }

    function setFont(size) {
      ctx.font = (state.font === 'fallback' ? 900 : 700) + ' ' + size + 'px ' + fontFamily();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
    }

    function metrics(text, size) {
      setFont(size);
      return ctx.measureText(text);
    }

    function fit(text, maxWidth) {
      let lo = 1;
      let hi = Math.max(128, canvas.width * 1.5);
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2;
        if (metrics(text, mid).width > maxWidth) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    }

    function inkHeight(m, size) {
      return (m.actualBoundingBoxAscent || size * 0.75) + (m.actualBoundingBoxDescent || size * 0.2);
    }

    function inkAscent(m, size) {
      return m.actualBoundingBoxAscent || size * 0.75;
    }

    function updateLabels() {
      ['bg', 'maincolor', 'subcolor'].forEach(id => $el(id + 'val').text(String(value(id)).toUpperCase()));
      ['mainwidth', 'subwidth'].forEach(id => $el(id + 'val').text(value(id) + '%'));
      $el('gapval').text(value('gap') + ' px');
      $el('topval').text(value('top') + '%');
    }

    function draw() {
      const w = numberValue('width', DEFAULT.w);
      const h = numberValue('height', DEFAULT.h);
      setCanvasSize(w, h);

      ctx.fillStyle = value('bg');
      ctx.fillRect(0, 0, w, h);

      const texts = String(value('title')).replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
      const lines = texts.length ? texts : ['Admit'];
      const sub = String(value('subtitle') || '');
      const maxTitleWidth = w * Number(value('mainwidth')) / 100;

      let size = Math.min(...lines.map(line => fit(line, maxTitleWidth)));
      size = Math.min(size, h * 0.38);

      // Position text using glyph ink bounds to keep the two lines close.
      let y = h * Number(value('top')) / 100;
      ctx.fillStyle = value('maincolor');

      lines.forEach((line, i) => {
        const m = metrics(line, size);
        const ascent = inkAscent(m, size);
        const height = inkHeight(m, size);
        setFont(size);
        ctx.fillText(line, w / 2, y + ascent);
        y += height + (i === lines.length - 1 ? 0 : size * 0.035);
      });

      const subSize = Math.min(fit(sub || ' ', w * Number(value('subwidth')) / 100), size, h * 0.25);
      const subMetrics = metrics(sub || ' ', subSize);
      const referenceScale = Math.min(w / 300, h / 225);
      y += Number(value('gap')) * referenceScale;

      ctx.fillStyle = value('subcolor');
      setFont(subSize);
      ctx.fillText(sub, w / 2, y + inkAscent(subMetrics, subSize));

      updateLabels();
    }

    function syncPreset() {
      const current = value('width') + 'x' + value('height');
      const hasPreset = $el('preset').find('option').toArray().some(option => option.value === current);
      $el('preset').val(hasPreset ? current : 'custom');
    }

    function setSize(w, h) {
      $el('width').val(w);
      $el('height').val(h);
      ratio = w / h;
      syncPreset();
      draw();
    }

    $el('preset').on('change', function () {
      const selected = $(this).val();
      if (selected === 'custom') return;
      const [w, h] = selected.split('x').map(Number);
      setSize(w, h);
    });

    $el('width').on('input', function () {
      if ($(this).val() === '') return;
      const w = numberValue('width', DEFAULT.w);
      if ($el('lockRatio').prop('checked')) {
        $el('height').val(clamp(Math.round(w / ratio), 64, 8192));
      } else {
        ratio = w / numberValue('height', DEFAULT.h);
      }
      syncPreset();
      draw();
    });

    $el('height').on('input', function () {
      if ($(this).val() === '') return;
      const h = numberValue('height', DEFAULT.h);
      if ($el('lockRatio').prop('checked')) {
        $el('width').val(clamp(Math.round(h * ratio), 64, 8192));
      } else {
        ratio = numberValue('width', DEFAULT.w) / h;
      }
      syncPreset();
      draw();
    });

    $el('lockRatio').on('change', function () {
      ratio = numberValue('width', DEFAULT.w) / numberValue('height', DEFAULT.h);
    });

    $(inputIds.map(id => '#' + id).join(', ')).on('input', draw);

    $el('reset').on('click', function () {
      $el('title').val('Admit');
      $el('subtitle').val('kyo alt');
      $el('bg').val('#00152f');
      $el('maincolor').val('#f1ee95');
      $el('subcolor').val('#076a94');
      $el('mainwidth').val(55);
      $el('subwidth').val(44);
      $el('gap').val(2);
      $el('top').val(29);
      $el('lockRatio').prop('checked', true);
      setSize(1200, 900);
    });

    $el('save').on('click', function () {
      draw();
      const filename = (String(value('title')).trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'cover') + '.png';
      const $link = $('<a>').attr({ href: canvas.toDataURL('image/png'), download: filename }).appendTo('body');
      $link[0].click();
      $link.remove();
    });

    function showFontStatus(message, success) {
      $el('fontstatus').attr('class', success ? 'font-note ok' : 'font-note').text(message);
    }

    $el('fontfile').on('change', async function () {
      const file = this.files?.[0];
      if (!file) return;
      try {
        const face = new FontFace('ImportedHarabara', await file.arrayBuffer(), { weight: '700' });
        await face.load();
        document.fonts.add(face);
        state.font = 'file';
        state.uploadedName = file.name;
        showFontStatus('已使用导入字体：' + file.name, true);
        draw();
      } catch (error) {
        showFontStatus('字体导入失败，请检查文件格式。', false);
      }
    });

    async function initFont() {
      const loaded = async name => {
        try {
          const faces = await document.fonts.load('700 48px "' + name + '"');
          return faces.some(face => face.status === 'loaded' &&
            face.family.replace(/["']/g, '').toLowerCase() === name.toLowerCase());
        } catch (error) {
          return false;
        }
      };

      if (await loaded('Harabara')) {
        if (state.font !== 'file') {
          state.font = 'remote';
          showFontStatus('在线 Harabara 已加载', true);
          draw();
        }
      } else if (await loaded('LocalHarabara')) {
        if (state.font !== 'file') {
          state.font = 'local';
          showFontStatus('已使用本机 Harabara 字体', true);
          draw();
        }
      } else if (state.font !== 'file') {
        showFontStatus('未加载到 Harabara，暂用回退字体；可导入字体文件。', false);
        draw();
      }
    }

    draw();
    initFont();

    // Keep the external font optional: the editor works even if the CDN is blocked.
    $('<link>', {
      rel: 'stylesheet',
      href: 'https://fonts.cdnfonts.com/css/harabara'
    }).on('load error', function () {
      initFont();
    }).appendTo('head');
  });
})(jQuery);
