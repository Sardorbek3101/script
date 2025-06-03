(() => {
  let lastRightClick = 0;

  document.addEventListener("mousedown", async (e) => {
    if (e.button !== 2) return;

    const now = Date.now();
    if (now - lastRightClick < 400) {
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

      const prompt = `Выбери правильный ответ. Вопрос:\n${questionText}\nВарианты:\n${options}\nОтвет (только буква):`;

      let cloud = document.querySelector("#ai-answer-cloud");
      if (!cloud) {
        cloud = document.createElement("div");
        cloud.id = "ai-answer-cloud";
        cloud.style = `
          position: absolute;
          background: rgba(255, 255, 255, 0.85);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: #333;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          z-index: 9999;
        `;
        document.body.appendChild(cloud);
      }

      cloud.textContent = "⏳ Ищу ответ...";
      const rect = questionEl.getBoundingClientRect();
      cloud.style.left = (rect.left + window.scrollX + 20) + "px";
      cloud.style.top = (rect.top + window.scrollY - 40) + "px";

      try {
        const res = await fetch("https://api.binjie.fun/api/generateStream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            stream: false
          })
        });

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "❓ Нет ответа";
        cloud.textContent = "💡 " + text.trim();
      } catch (err) {
        cloud.textContent = "⚠️ Не удалось получить ответ.";
      }
    }
    lastRightClick = now;
  });
})();
