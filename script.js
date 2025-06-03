(() => {
  let lastRightClickTime = 0;

  document.addEventListener("mousedown", async (e) => {
    // Проверяем правую кнопку
    if (e.button !== 2) return;

    const now = Date.now();
    if (now - lastRightClickTime < 400) {
      // Двойной клик правой кнопкой
      const active = document.querySelector(".test-table.active");
      if (!active) return;

      const questionEl = active.querySelector(".test-question");
      const answersEls = [...active.querySelectorAll(".test-answers li")];

      const questionText = questionEl?.innerText.trim();
      if (!questionText || answersEls.length === 0) return;

      const options = answersEls.map(li => {
        const key = li.querySelector(".test-variant")?.innerText?.trim();
        const txt = li.querySelector("p")?.innerText?.trim();
        return `${key}) ${txt}`;
      }).join("\n");

      const prompt = `Выбери правильный ответ. Вопрос:\n${questionText}\nВарианты:\n${options}\nОтвет:`;

      // UI блок над вопросом
      let hintBox = questionEl.querySelector(".ai-answer-box");
      if (!hintBox) {
        hintBox = document.createElement("div");
        hintBox.className = "ai-answer-box";
        hintBox.style = "background:#fff7d6;padding:6px;border:1px solid #ccc;margin-bottom:5px;font-weight:bold;";
        questionEl.prepend(hintBox);
      }
      hintBox.textContent = "⏳ Запрашиваю ответ от ИИ...";

      try {
        const res = await fetch("https://llama.perplexity.gg/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: prompt,
            model: "llama3:8b",
            include_sources: false
          })
        });
        const data = await res.json();
        hintBox.textContent = "🧠 Ответ: " + data.answer;
      } catch (err) {
        hintBox.textContent = "⚠️ Ошибка при запросе ответа.";
      }
    }
    lastRightClickTime = now;
  });
})();
