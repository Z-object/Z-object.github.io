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
})();
