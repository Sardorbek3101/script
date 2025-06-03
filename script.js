(() => {
  let lastRightClick = 0;
  const RAPIDAPI_KEY = "e46117ae21msh918b1b8b54d4e47p1c1623jsnbfc839744a88";

  document.addEventListener("mousedown", async (e) => {
    if (e.button !== 2) return;

    const now = Date.now();
    if (now - lastRightClick < 400) {
      const active = document.querySelector(".test-table.active.in");
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
          background: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 14px;
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
        const res = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "chatgpt-42.p.rapidapi.com"
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: prompt }
            ],
            web_access: false
          })
        });

        const data = await res.json();
        const text = data.result?.trim() || "❓ Нет ответа";
        cloud.textContent = "✅ Ответ: " + text;
      } catch (err) {
        cloud.textContent = "⚠️ Ошибка подключения.";
        console.error(err);
      }
    }

    lastRightClick = now;
  });
})();
