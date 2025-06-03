document.addEventListener("contextmenu", e => {
  if (e.detail === 2) handleDoubleRightClick(e);
});

async function handleDoubleRightClick(e) {
  const activeBlock = document.querySelector(".test-table.active");
  if (!activeBlock) return alert("Вопрос не найден.");

  const questionEl = activeBlock.querySelector(".test-question");
  const answersEls = activeBlock.querySelectorAll(".test-answers li");
  if (!questionEl || answersEls.length === 0) return;

  const questionText = questionEl.innerText.trim();
  const answers = [...answersEls].map(el => {
    const key = el.querySelector(".test-variant")?.innerText.trim();
    const text = el.querySelector("p")?.innerText.trim();
    return `${key}) ${text}`;
  }).join("\n");

  const prompt = `Выбери правильный вариант ответа. Вопрос: ${questionText}\nВарианты:\n${answers}\nОтвет:`;

  const replyBox = document.createElement("div");
  replyBox.style = "background: #fffbe0; border: 1px solid #888; padding: 6px 8px; margin-bottom: 5px; font-weight: bold; font-size: 1em;";
  replyBox.textContent = "⏳ Запрашиваю ответ...";
  questionEl.prepend(replyBox);

  try {
    const res = await fetch("https://llama.perplexity.gg/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: prompt, model: "llama3:8b", include_sources: false })
    });

    const data = await res.json();
    replyBox.textContent = "🧠 Ответ ИИ: " + data.answer;
  } catch (err) {
    replyBox.textContent = "Ошибка получения ответа.";
  }
}
