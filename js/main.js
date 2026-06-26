// ==========================================================
//  Zlive 主题 - 主脚本
//  - 滚动时 header 变毛玻璃
//  - IntersectionObserver 触发元素渐显
//  - 当前页导航高亮
// ==========================================================

(function () {
  'use strict';

  // 标记 JS 启用（激活 reveal 动画）
  document.documentElement.classList.add('js');

  // ---------- 1. Sticky header ----------
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- 2. Reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    // 老浏览器：直接全部显示
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // ---------- 3. 导航高亮当前页 ----------
  var path = window.location.pathname;
  document.querySelectorAll('.site-nav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href) return;
    if (href === '/' && (path === '/' || path === '/index.html')) {
      a.classList.add('active');
    } else if (href !== '/' && path.indexOf(href) === 0) {
      a.classList.add('active');
    }
  });

  // ---------- 4. 自制 HTML5 音频播放器 ----------
  var formatTime = function (sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  };

  document.querySelectorAll('.audio-native').forEach(function (root) {
    var audio   = root.querySelector('audio');
    var btn     = root.querySelector('.audio-btn');
    var bar     = root.querySelector('.audio-progress-bar');
    var fill    = root.querySelector('.audio-progress-fill');
    var thumb   = root.querySelector('.audio-progress-thumb');
    var tCur    = root.querySelector('.audio-time-cur');
    var tDur    = root.querySelector('.audio-time-dur');
    var iconP   = root.querySelector('.icon-play');
    var iconPa  = root.querySelector('.icon-pause');
    var vBtn    = root.querySelector('.audio-vol-btn');
    var vBar    = root.querySelector('.audio-vol-bar');
    var vFill   = root.querySelector('.audio-vol-fill');
    if (!audio) return;

    audio.volume = 0.7;
    if (vFill) vFill.style.width = (audio.volume * 100) + '%';

    var togglePlay = function () {
      if (audio.paused) {
        // 暂停页面里其他正在播放的 audio/iframe-网易云
        document.querySelectorAll('audio').forEach(function (a) { if (a !== audio) a.pause(); });
        audio.play();
      } else {
        audio.pause();
      }
    };
    btn && btn.addEventListener('click', togglePlay);

    audio.addEventListener('play', function () {
      if (iconP)  iconP.style.display  = 'none';
      if (iconPa) iconPa.style.display = '';
    });
    audio.addEventListener('pause', function () {
      if (iconP)  iconP.style.display  = '';
      if (iconPa) iconPa.style.display = 'none';
    });
    audio.addEventListener('loadedmetadata', function () {
      if (tDur) tDur.textContent = formatTime(audio.duration);
    });
    audio.addEventListener('timeupdate', function () {
      if (!isFinite(audio.duration)) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      if (fill)  fill.style.width  = pct + '%';
      if (thumb) thumb.style.left  = pct + '%';
      if (tCur)  tCur.textContent  = formatTime(audio.currentTime);
    });
    audio.addEventListener('ended', function () {
      if (fill)  fill.style.width  = '0%';
      if (thumb) thumb.style.left  = '0%';
      if (tCur)  tCur.textContent  = '0:00';
    });

    // 点击 / 拖动进度条
    if (bar) {
      var seekFromEvent = function (e) {
        if (!isFinite(audio.duration)) return;
        var rect = bar.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var pct = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = pct * audio.duration;
      };
      var dragging = false;
      bar.addEventListener('mousedown', function (e) { dragging = true; seekFromEvent(e); });
      document.addEventListener('mousemove', function (e) { if (dragging) seekFromEvent(e); });
      document.addEventListener('mouseup', function () { dragging = false; });
      bar.addEventListener('touchstart', function (e) { dragging = true; seekFromEvent(e); });
      bar.addEventListener('touchmove',  function (e) { if (dragging) seekFromEvent(e); });
      bar.addEventListener('touchend',   function () { dragging = false; });
    }

    // 音量
    if (vBar) {
      var setVol = function (e) {
        var rect = vBar.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var pct = Math.max(0, Math.min(1, x / rect.width));
        audio.volume = pct;
        if (vFill) vFill.style.width = (pct * 100) + '%';
      };
      var vDrag = false;
      vBar.addEventListener('mousedown', function (e) { vDrag = true; setVol(e); });
      document.addEventListener('mousemove', function (e) { if (vDrag) setVol(e); });
      document.addEventListener('mouseup',   function () { vDrag = false; });
    }
    if (vBtn) {
      vBtn.addEventListener('click', function () {
        audio.muted = !audio.muted;
        if (vFill) vFill.style.width = (audio.muted ? 0 : audio.volume * 100) + '%';
      });
    }
  });

  // ---------- 5. 悬浮评论框 ----------
  var fab     = document.getElementById('zlive-comment-fab');
  var panel   = document.getElementById('zlive-comment-panel');
  var closeBtn = document.getElementById('zlive-comment-close');
  var body    = document.getElementById('zlive-comment-body');

  if (fab && panel && closeBtn && body) {
    var twikooEnvId =
      (document.querySelector('meta[name="zlive-twikoo-env"]') || {}).content || '';

    var loaded = false;
    var loading = false;

    var loadTwikoo = function (cb) {
      if (loaded) { cb && cb(); return; }
      if (loading) { return; }
      loading = true;
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js';
      s.async = true;
      s.onload = function () {
        loaded = true;
        loading = false;
        if (window.twikoo && twikooEnvId) {
          window.twikoo.init({
            envId: twikooEnvId,
            el: '#zlive-comment-body',
            // region: 'ap-guangzhou'  // 如果你的 server 在国内，可解开
          });
        }
        cb && cb();
      };
      s.onerror = function () {
        loading = false;
        body.innerHTML = '<div class="zlive-comment-placeholder">评论脚本加载失败，请检查网络。</div>';
      };
      document.body.appendChild(s);
    };

    var openPanel = function () {
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      fab.classList.add('is-hidden');
      if (!loaded && twikooEnvId) {
        body.innerHTML = '<div class="zlive-comment-placeholder">评论加载中…</div>';
        loadTwikoo();
      } else if (!twikooEnvId) {
        body.innerHTML = '';
      }
    };

    var closePanel = function () {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      fab.classList.remove('is-hidden');
    };

    fab.addEventListener('click', openPanel);
    fab.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); }
    });
    closeBtn.addEventListener('click', closePanel);

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });

    // 没有配置 envId 时给个空提示文案
    if (!twikooEnvId) {
      body.innerHTML = '<div class="zlive-comment-placeholder">未配置 Twikoo 环境 ID<br><small>主题 _config.yml → twikoo.envId</small></div>';
    }
  }
})();
