(() => {
  let lastRightClick = 0;
  const DEEPSEEK_API_KEY = "sk-593a1d21663a4c628251b13ff7310db9"; // 🔑 Вставь свой DeepSeek API ключ сюда

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
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          color: #000;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          z-index: 9999;
        `;
        document.body.appendChild(cloud);
      }

      cloud.textContent = "⏳ Думаю...";
      const rect = questionEl.getBoundingClientRect();
      cloud.style.left = (rect.left + window.scrollX + 20) + "px";
      cloud.style.top = (rect.top + window.scrollY - 40) + "px";

      try {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-chat", // или "deepseek-coder" для кода
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
          })
        });

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "❓ Нет ответа";
        cloud.textContent = "✅ Ответ: " + text;
      } catch (err) {
        cloud.textContent = "⚠️ Ошибка запроса.";
        console.error(err);
      }
    }
    lastRightClick = now;
  });
})();
