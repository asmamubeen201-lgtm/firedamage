/* ============================================================
   [Brand] Assistant — floating chat widget.
   Vanilla JS, zero dependencies. Include on any page with:
     <script src="/assets/chat-widget.js" data-chat-city="houston-tx"></script>
   Optional attributes on the <script> tag:
     data-chat-city — city slug for local context (or omit = null)
     data-chat-api  — API endpoint (default "/api/chat")
   The widget NEVER invents answers: it only displays what the
   API returns. On any API failure it shows the professional
   fallback + a call button.
   ============================================================ */
(function () {
  'use strict';

  var PHONE = '(800) 555-0147';
  var PHONE_RAW = '18005550147';
  var FALLBACK = "I don't have verified info on that — and I won't guess when your home is at stake. Would you like a specialist to call you?";
  var CONFIRM_LINE = 'What I can confirm: our team offers 24/7 emergency fire damage response and a free on-site assessment.';

  var scriptEl = document.currentScript || document.querySelector('script[src*="chat-widget"]');
  var CITY = (scriptEl && scriptEl.getAttribute('data-chat-city')) || document.body.getAttribute('data-chat-city') || null;
  var API_URL = (scriptEl && scriptEl.getAttribute('data-chat-api')) || '/api/chat';

  /* ---------- Styles (scoped under .ba- prefix) ---------- */
  var css = [
    '.ba-btn{position:fixed;right:16px;bottom:76px;width:56px;height:56px;border-radius:50%;border:none;background:#b91c1c;color:#fff;font-size:26px;cursor:pointer;z-index:1000;box-shadow:0 4px 14px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center}',
    '.ba-btn:hover{background:#991b1b}',
    '.ba-panel{position:fixed;right:16px;bottom:144px;width:min(360px,calc(100vw - 32px));height:min(520px,70vh);background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.28);z-index:1000;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
    '.ba-panel.open{display:flex}',
    '.ba-head{background:#b91c1c;color:#fff;padding:12px 16px;font-weight:700;font-size:15px;display:flex;justify-content:space-between;align-items:center}',
    '.ba-head button{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}',
    '.ba-safety{background:#fef2f2;color:#991b1b;font-size:12px;font-weight:700;padding:8px 14px;text-align:center}',
    '.ba-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.5}',
    '.ba-msg{max-width:88%;padding:10px 12px;border-radius:12px;white-space:pre-wrap;word-break:break-word}',
    '.ba-msg.user{align-self:flex-end;background:#111827;color:#fff}',
    '.ba-msg.bot{align-self:flex-start;background:#f3f4f6;color:#1a1a1a}',
    '.ba-msg.typing{color:#6b7280;font-style:italic}',
    '.ba-call{display:inline-block;margin-top:8px;background:#b91c1c;color:#fff;font-weight:700;font-size:14px;padding:8px 14px;border-radius:8px;text-decoration:none}',
    '.ba-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}',
    '.ba-chip{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:16px;padding:6px 12px;font-size:12px;cursor:pointer}',
    '.ba-input{display:flex;border-top:1px solid #e5e7eb}',
    '.ba-input input{flex:1;border:none;padding:13px 14px;font-size:15px;font-family:inherit;outline:none}',
    '.ba-input button{background:#b91c1c;color:#fff;border:none;padding:0 18px;font-weight:700;font-size:15px;cursor:pointer}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- DOM ---------- */
  var btn = document.createElement('button');
  btn.className = 'ba-btn';
  btn.setAttribute('aria-label', 'Chat with [Brand] Assistant');
  btn.textContent = '💬';

  var panel = document.createElement('div');
  panel.className = 'ba-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', '[Brand] Assistant chat');

  var head = document.createElement('div');
  head.className = 'ba-head';
  var headTitle = document.createElement('span');
  headTitle.textContent = '[Brand] Assistant';
  var closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close chat');
  head.appendChild(headTitle);
  head.appendChild(closeBtn);

  var safety = document.createElement('div');
  safety.className = 'ba-safety';
  safety.textContent = 'Active fire? Call 911 first.';

  var msgs = document.createElement('div');
  msgs.className = 'ba-msgs';

  var chips = document.createElement('div');
  chips.className = 'ba-chips';
  var CHIP_QS = [
    'How much does soot removal cost?',
    'Will insurance cover fire damage in Texas?',
    'What do I do right after a house fire?'
  ];
  CHIP_QS.forEach(function (q) {
    var chip = document.createElement('button');
    chip.className = 'ba-chip';
    chip.textContent = q;
    chip.addEventListener('click', function () { send(q); });
    chips.appendChild(chip);
  });

  var inputRow = document.createElement('div');
  inputRow.className = 'ba-input';
  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Ask about fire damage costs, insurance…';
  input.setAttribute('aria-label', 'Type your message');
  input.maxLength = 500;
  var sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);

  panel.appendChild(head);
  panel.appendChild(safety);
  panel.appendChild(msgs);
  panel.appendChild(chips);
  panel.appendChild(inputRow);
  document.body.appendChild(btn);
  document.body.appendChild(panel);

  /* ---------- Helpers (textContent only — no HTML injection) ---------- */
  function addMsg(text, who) {
    var d = document.createElement('div');
    d.className = 'ba-msg ' + who;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function addCallButton() {
    var a = document.createElement('a');
    a.className = 'ba-call';
    a.href = 'tel:' + PHONE_RAW;
    a.textContent = '📞 Call ' + PHONE;
    msgs.appendChild(a);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function showFallback() {
    addMsg(FALLBACK + '\n\n' + CONFIRM_LINE, 'bot');
    addCallButton();
  }
  function addBotReply(answer, answered) {
    if (!answered || !answer) { showFallback(); return; }
    addMsg(answer, 'bot');
    addCallButton();
  }

  var opened = false;
  function openPanel() {
    panel.classList.add('open');
    if (!opened) {
      opened = true;
      addMsg('Hi — I can answer questions about fire damage costs, cleanup, and Texas insurance claims, using only our verified site data. What happened at your home?', 'bot');
      addCallButton();
    }
    input.focus();
  }
  btn.addEventListener('click', function () {
    panel.classList.contains('open') ? panel.classList.remove('open') : openPanel();
  });
  closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });

  /* ---------- Send ---------- */
  var sending = false;
  function send(text) {
    var msg = (text || input.value || '').trim();
    if (!msg || sending) return;
    input.value = '';
    addMsg(msg, 'user');

    var typing = addMsg('Typing…', 'bot typing');
    sending = true;

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, city: CITY }),
      signal: controller.signal
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        typing.remove();
        sending = false;
        if (!data || typeof data.answer !== 'string') { showFallback(); return; }
        addBotReply(data.answer, data.answered !== false);
      })
      .catch(function () {
        clearTimeout(timer);
        typing.remove();
        sending = false;
        showFallback();
      });
  }
  sendBtn.addEventListener('click', function () { send(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
})();
