/* ============================================================================
 * Z'live 主题 - 悬浮小工具模块
 *  - 独立 IIFE，顶部 try/catch，出错不影响 main.js / 评论框
 *  - 功能：菜单展开/收起 + 计算器 + 进制转换
 *  - 设计文档：D:/邹-所有资料/【博客】/MiniMax 博客项目/小工具按钮开发方案.md
 * ========================================================================== */
(function () {
  'use strict';

  // 1) 自检：看一眼就知道加载了
  try { console.info('[tools] loaded at', new Date().toISOString()); } catch (e) {}

  try {
    // ----- DOM 引用 -----
    var fab = document.getElementById('zlive-tools-fab');
    var menu = document.getElementById('zlive-tools-menu');
    if (!fab || !menu) {
      console.warn('[tools] fab or menu not found, skip init');
      return;
    }

    var modals = {
      calculator: document.getElementById('zlive-calc'),
      base: document.getElementById('zlive-base')
    };
    var currentModal = null;   // 当前打开的弹窗名（calculator / base / null）

    // ----- 菜单 -----
    var menuOpen = false;
    function openMenu() {
      menuOpen = true;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
    }
    function closeMenu() {
      menuOpen = false;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
    }
    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuOpen) closeMenu(); else openMenu();
    });
    fab.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (menuOpen) closeMenu(); else openMenu();
      }
    });

    // 菜单项：跳到对应工具
    menu.querySelectorAll('.zlive-tools-menu-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (btn.classList.contains('is-disabled')) return;
        var tool = btn.getAttribute('data-tool');
        if (tool) openModal(tool);
      });
    });

    // ----- 弹窗管理 -----
    function openModal(name) {
      if (!modals[name]) return;
      // 先关其他弹窗
      Object.keys(modals).forEach(function (k) {
        if (k !== name && modals[k]) {
          modals[k].classList.remove('is-open');
          modals[k].setAttribute('aria-hidden', 'true');
        }
      });
      modals[name].classList.add('is-open');
      modals[name].setAttribute('aria-hidden', 'false');
      currentModal = name;
      closeMenu();
    }
    function closeModal() {
      if (!currentModal) return;
      var m = modals[currentModal];
      if (m) {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      }
      currentModal = null;
    }
    // 弹窗关闭按钮
    document.querySelectorAll('.zlive-tools-modal-close').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeModal();
      });
    });

    // ----- ESC 关闭（弹窗优先于菜单） -----
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (currentModal) { closeModal(); return; }
      if (menuOpen) { closeMenu(); return; }
    });

    // ----- 点击外部关闭 -----
    document.addEventListener('click', function (e) {
      var t = e.target;
      // 弹开着
      if (currentModal) {
        var m = modals[currentModal];
        if (m && !m.contains(t) && !fab.contains(t) && !menu.contains(t)) {
          closeModal();
          return;
        }
      }
      // 菜单开着
      if (menuOpen && !menu.contains(t) && !fab.contains(t)) {
        closeMenu();
      }
    });

    // ====================================================================
    // 2. 计算器
    // ====================================================================
    function initCalculator() {
      var panel = modals.calculator;
      var display = document.getElementById('zlive-calc-display');
      if (!panel || !display) return;

      var state = {
        display: '0',         // 当前显示文本
        accumulator: null,    // 上一步结果（用于连续运算）
        operator: null,       // 当前操作符
        waitingForNew: false, // 输入新数字后替换显示
        justEvaluated: false  // 刚算完 = 后，下一次输入数字清屏
      };

      function formatNumber(n) {
        if (n === null || n === undefined || isNaN(n)) return '0';
        var s = String(n);
        if (s.indexOf('e') !== -1 || s.length > 14) {
          var num = Number(n);
          if (!isFinite(num)) return 'Error';
          if (Math.abs(num) > 1e15) return num.toExponential(6);
          return num.toPrecision(12).replace(/\.?0+$/, '');
        }
        return s;
      }

      function updateDisplay() {
        display.textContent = state.display;
      }

      function inputDigit(d) {
        if (state.waitingForNew) {
          state.display = d;
          state.waitingForNew = false;
        } else {
          if (state.display === '0' && d !== '0') {
            state.display = d;
          } else if (state.display === '-0' && d !== '0') {
            state.display = '-' + d;
          } else {
            // 限制位数
            if (state.display.replace(/[-.]/g, '').length >= 14) return;
            state.display += d;
          }
        }
        state.justEvaluated = false;
      }

      function inputDot() {
        if (state.waitingForNew) {
          state.display = '0.';
          state.waitingForNew = false;
        } else if (state.display.indexOf('.') === -1) {
          state.display += '.';
        }
        state.justEvaluated = false;
      }

      function clearAll() {
        state.display = '0';
        state.accumulator = null;
        state.operator = null;
        state.waitingForNew = false;
        state.justEvaluated = false;
      }

      function clearEntry() {
        state.display = '0';
        state.waitingForNew = false;
      }

      function backspace() {
        if (state.waitingForNew || state.justEvaluated) {
          state.display = '0';
          state.waitingForNew = false;
          state.justEvaluated = false;
          return;
        }
        var s = state.display;
        if (s.length <= 1 || (s.length === 2 && s.charAt(0) === '-')) {
          state.display = '0';
        } else {
          state.display = s.slice(0, -1);
        }
      }

      function negate() {
        if (state.display === '0' || state.display === '0.') return;
        if (state.display.charAt(0) === '-') {
          state.display = state.display.slice(1);
        } else {
          state.display = '-' + state.display;
        }
      }

      function applyUnary(fn) {
        var v = parseFloat(state.display);
        if (isNaN(v)) return;
        var r = fn(v);
        if (!isFinite(r)) { state.display = 'Error'; return; }
        state.display = formatNumber(r);
        state.waitingForNew = true;
        state.justEvaluated = true;
      }
      var percent = function () {
        var v = parseFloat(state.display);
        if (isNaN(v)) return;
        // Win11 风格：单独按 % = 除以 100
        state.display = formatNumber(v / 100);
        state.waitingForNew = true;
        state.justEvaluated = true;
      };
      var inverse = function () { applyUnary(function (v) { return 1 / v; }); };
      var square  = function () { applyUnary(function (v) { return v * v; }); };
      var sqrt    = function () { applyUnary(function (v) { return Math.sqrt(v); }); };

      function compute(a, b, op) {
        switch (op) {
          case 'add': return a + b;
          case 'sub': return a - b;
          case 'mul': return a * b;
          case 'div': return b === 0 ? NaN : a / b;
        }
        return b;
      }

      function setOperator(op) {
        var v = parseFloat(state.display);
        if (state.accumulator !== null && state.operator && !state.waitingForNew) {
          // 链式运算：先算上一步
          var r = compute(state.accumulator, v, state.operator);
          if (!isFinite(r)) { state.display = 'Error'; clearAll(); return; }
          state.display = formatNumber(r);
          state.accumulator = r;
        } else {
          state.accumulator = v;
        }
        state.operator = op;
        state.waitingForNew = true;
        state.justEvaluated = false;
      }

      function evaluate() {
        if (state.operator === null || state.accumulator === null) return;
        var v = parseFloat(state.display);
        var r = compute(state.accumulator, v, state.operator);
        if (!isFinite(r)) { state.display = 'Error'; clearAll(); return; }
        state.display = formatNumber(r);
        state.accumulator = null;
        state.operator = null;
        state.waitingForNew = true;
        state.justEvaluated = true;
      }

      // 按钮事件
      panel.querySelectorAll('.zlive-calc-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var action = btn.getAttribute('data-action');
          if (!action) return;
          if (action === 'num') {
            var d = btn.getAttribute('data-value');
            if (d !== null) inputDigit(d);
          } else if (action === 'dot')  { inputDot(); }
          else if (action === 'c')     { clearAll(); }
          else if (action === 'ce')    { clearEntry(); }
          else if (action === 'back')  { backspace(); }
          else if (action === 'neg')   { negate(); }
          else if (action === 'percent') { percent(); }
          else if (action === 'inv')   { inverse(); }
          else if (action === 'sq')    { square(); }
          else if (action === 'sqrt')  { sqrt(); }
          else if (action === 'add' || action === 'sub' || action === 'mul' || action === 'div') {
            setOperator(action);
          } else if (action === 'eq') { evaluate(); }
          updateDisplay();
        });
      });

      // 键盘支持
      var keyMap = {
        '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
        '+':'add','-':'sub','*':'mul','x':'mul','X':'mul','/':'div',
        'Enter':'eq','=':'eq',
        'Backspace':'back','Delete':'c',
        '%':'percent','.':'dot'
      };
      panel.addEventListener('keydown', function (e) {
        if (panel.classList.contains('is-open') === false) return;
        var k = e.key;
        if (k in keyMap) {
          e.preventDefault();
          var act = keyMap[k];
          if (act.length === 1 && /[0-9]/.test(act)) inputDigit(act);
          else if (act === 'add' || act === 'sub' || act === 'mul' || act === 'div') setOperator(act);
          else if (act === 'eq') evaluate();
          else if (act === 'back') backspace();
          else if (act === 'c') clearAll();
          else if (act === 'percent') percent();
          else if (act === 'dot') inputDot();
          updateDisplay();
        }
      });
      // 让计算器面板可以 focus（接收 keydown）
      panel.setAttribute('tabindex', '-1');
      // 打开计算器时自动 focus
      var origOpen = openModal;
      // 通过 MutationObserver 监听 is-open
      var mo = new MutationObserver(function () {
        if (panel.classList.contains('is-open')) panel.focus();
      });
      mo.observe(panel, { attributes: true, attributeFilter: ['class'] });
    }

    // ====================================================================
    // 3. 进制转换
    // ====================================================================
    function initBase() {
      var panel = modals.base;
      var input = document.getElementById('zlive-base-input');
      var out2  = document.getElementById('zlive-base-out-2');
      var out8  = document.getElementById('zlive-base-out-8');
      var out10 = document.getElementById('zlive-base-out-10');
      var out16 = document.getElementById('zlive-base-out-16');
      var clearBtn = document.getElementById('zlive-base-clear');
      var copyBtn  = document.getElementById('zlive-base-copy');
      var toast    = document.getElementById('zlive-base-toast');
      if (!panel || !input || !out2 || !out8 || !out10 || !out16) return;

      var currentBase = 10;
      var toastTimer = null;
      function showToast(msg, ok) {
        toast.textContent = msg;
        toast.classList.toggle('is-ok', !!ok);
        toast.classList.toggle('is-err', !ok);
        toast.classList.add('is-show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
          toast.classList.remove('is-show');
        }, 1800);
      }

      function isValidForBase(str, base) {
        if (!str) return true;
        var pattern;
        if (base === 2) pattern = /^-?[01]+$/;
        else if (base === 8) pattern = /^-?[0-7]+$/;
        else if (base === 10) pattern = /^-?\d+$/;
        else if (base === 16) pattern = /^-?[0-9a-fA-F]+$/;
        return pattern ? pattern.test(str) : false;
      }

      function recompute() {
        var raw = (input.value || '').trim();
        // 去掉负号单独处理
        var negative = false;
        var body = raw;
        if (body.charAt(0) === '-') { negative = true; body = body.slice(1); }

        if (!body) {
          out2.textContent = '—'; out8.textContent = '—';
          out10.textContent = '—'; out16.textContent = '—';
          return;
        }
        if (!isValidForBase(body, currentBase)) {
          out2.textContent = out8.textContent = out10.textContent = out16.textContent = '非法';
          // 抖动输入框
          input.classList.add('is-shake');
          setTimeout(function () { input.classList.remove('is-shake'); }, 300);
          return;
        }
        var n = parseInt(body, currentBase);
        if (isNaN(n)) {
          out2.textContent = out8.textContent = out10.textContent = out16.textContent = '—';
          return;
        }
        // BigInt 防溢出（用字符串拼）
        var abs = Math.abs(n);
        function toStr(value, base) {
          if (value === 0) return '0';
          var digits = '0123456789ABCDEF';
          var out = '';
          while (value > 0) {
            out = digits.charAt(value % base) + out;
            value = Math.floor(value / base);
          }
          return out;
        }
        out2.textContent  = toStr(abs, 2);
        out8.textContent  = toStr(abs, 8);
        out10.textContent = String(abs);
        out16.textContent = toStr(abs, 16);
        // 负号
        if (negative) {
          if (out2.textContent  !== '—') out2.textContent  = '-' + out2.textContent;
          if (out8.textContent  !== '—') out8.textContent  = '-' + out8.textContent;
          if (out10.textContent !== '—') out10.textContent = '-' + out10.textContent;
          if (out16.textContent !== '—') out16.textContent = '-' + out16.textContent;
        }
      }

      input.addEventListener('input', recompute);
      // radio 切换
      panel.querySelectorAll('input[name="zlive-base-input-base"]').forEach(function (r) {
        r.addEventListener('change', function () {
          var v = parseInt(r.value, 10);
          if (v === 2 || v === 8 || v === 10 || v === 16) {
            currentBase = v;
            // 切换进制时清空输入（避免混淆）
            input.value = '';
            recompute();
          }
        });
      });
      // 清空
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        input.value = '';
        recompute();
        input.focus();
      });
      // 复制十进制
      copyBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var v = out10.textContent;
        if (!v || v === '—' || v === '非法') {
          showToast('没有可复制的内容', false);
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v).then(function () {
            showToast('已复制：' + v, true);
          }, function () {
            fallbackCopy(v);
          });
        } else {
          fallbackCopy(v);
        }
      });
      function fallbackCopy(text) {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showToast('已复制：' + text, true);
        } catch (e2) {
          showToast('复制失败', false);
        }
      }
    }

    // ----- 启动 -----
    initCalculator();
    initBase();
    console.info('[tools] init OK');
  } catch (err) {
    console.error('[tools] init failed:', err);
  }
})();
