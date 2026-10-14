(function () {
  const chatLog = document.getElementById("chat-log");
  const emptyState = document.getElementById("empty-state");
  const form = document.getElementById("ask-form");
  const input = document.getElementById("question-input");
  const submitBtn = document.getElementById("ask-submit");
  const identifiersRemoved = document.getElementById("identifiers-removed");
  const newConversation = document.getElementById("new-conversation");
  const questionCount = document.getElementById("question-count");

  let history = [];

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function addMessage(role, text) {
    emptyState.style.display = "none";
    const div = document.createElement("div");
    div.className = "msg msg-" + role;
    div.textContent = text;
    chatLog.appendChild(div);
    newConversation.hidden = false;
    div.scrollIntoView({ behavior: "smooth", block: "end" });
    return div;
  }

  function addAssistantMessage(answer, sources) {
    emptyState.style.display = "none";
    const div = document.createElement("div");
    div.className = "msg msg-assistant";

    const answerP = document.createElement("div");
    answerP.textContent = answer;
    div.appendChild(answerP);

    if (sources && sources.length) {
      const sourcesDiv = document.createElement("div");
      sourcesDiv.className = "msg-sources";
      const label = document.createElement("span");
      label.className = "msg-sources-label";
      label.textContent = "Sources to verify";
      sourcesDiv.appendChild(label);

      sources.forEach(function (src) {
        if (src.url) {
          const a = document.createElement("a");
          a.className = "msg-source";
          a.href = src.url;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = src.filename + " · " + (src.date || "date unknown") + " (" + (src.date_basis || "date basis unknown") + ")";
          sourcesDiv.appendChild(a);
        } else {
          const span = document.createElement("span");
          span.className = "msg-source no-link";
          span.textContent = src.filename + " · " + (src.date || "date unknown") + " (" + (src.date_basis || "date basis unknown") + ")";
          sourcesDiv.appendChild(span);
        }
      });
      div.appendChild(sourcesDiv);
    }

    const actions = document.createElement("div");
    actions.className = "msg-actions";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "msg-copy";
    copy.textContent = "Copy answer";
    copy.addEventListener("click", async function () {
      try { await navigator.clipboard.writeText(answer); copy.textContent = "Copied"; }
      catch (_) { copy.textContent = "Copy unavailable"; }
      window.setTimeout(function () { copy.textContent = "Copy answer"; }, 1800);
    });
    actions.appendChild(copy);
    div.appendChild(actions);

    chatLog.appendChild(div);
    newConversation.hidden = false;
    div.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function addTypingIndicator() {
    const div = document.createElement("div");
    div.className = "msg typing-indicator";
    div.textContent = "Thinking…";
    chatLog.appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });
    return div;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    if (!identifiersRemoved.checked) {
      identifiersRemoved.focus();
      return;
    }

    input.value = "";
    questionCount.textContent = "0 / 2000";
    submitBtn.disabled = true;
    addMessage("user", question);
    const typingEl = addTypingIndicator();

    try {
      const resp = await fetch("/clinical-assistant/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          conversation_history: history,
          identifiers_removed: true,
        }),
      });

      typingEl.remove();

      const data = await resp.json();
      if (!resp.ok) {
        addMessage("error", data.error || "Something went wrong.");
        return;
      }

      addAssistantMessage(data.answer, data.sources);
      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: data.answer });
      identifiersRemoved.checked = false;
    } catch (err) {
      typingEl.remove();
      addMessage("error", "Couldn't reach the assistant. Try again in a moment.");
    } finally {
      submitBtn.disabled = false;
      renderIcons();
    }
  }

  form.addEventListener("submit", handleSubmit);
  input.addEventListener("input", function () { questionCount.textContent = input.value.length + " / 2000"; });
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  newConversation.addEventListener("click", function () {
    history = [];
    chatLog.replaceChildren();
    emptyState.style.display = "";
    identifiersRemoved.checked = false;
    newConversation.hidden = true;
    input.focus();
  });
  renderIcons();
})();
