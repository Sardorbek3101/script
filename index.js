(() => {
  let lastRightClick = 0;
  const RAPIDAPI_KEY = "e46117ae21msh918b1b8b54d4e47p1c1623jsnbfc839744a88";

  document.addEventListener("mousemove", function showSuccessOnce(e) {
    document.removeEventListener("mousemove", showSuccessOnce);

    const cloud = document.createElement("div");
    cloud.id = "script-loaded-cloud";
    cloud.textContent = "success";
    cloud.style = `
      position: absolute;
      background: rgba(255, 255, 255, 0.85);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      color: #222;
      font-family: sans-serif;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: opacity 0.3s ease;
    `;
    cloud.style.left = (e.pageX + 10) + "px";
    cloud.style.top = (e.pageY - 30) + "px";

    document.body.appendChild(cloud);

    setTimeout(() => {
      cloud.style.opacity = "0";
      setTimeout(() => cloud.remove(), 300);
    }, 3000);
  });

  document.addEventListener("mousedown", async (e) => {
    if (e.button !== 2) return;

    const now = Date.now();
    if (now - lastRightClick < 400) {
      const container = e.target.closest(".test-table");
      if (!container) return;

      const questionEl = container.querySelector(".test-question");
      const answersEls = [...container.querySelectorAll(".test-answers li")];
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
          color: #222;
          font-family: sans-serif;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: opacity 0.3s ease;
        `;
        document.body.appendChild(cloud);
      }

      cloud.style.opacity = "1";
      cloud.textContent = "Думаю...";
      cloud.style.left = (e.pageX + 10) + "px";
      cloud.style.top = (e.pageY - 30) + "px";

      clearTimeout(cloud.hideTimeout);
      cloud.hideTimeout = setTimeout(() => {
        cloud.style.opacity = "0";
        setTimeout(() => cloud.remove(), 300);
      }, 3000);

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
        const text = data.result?.trim() || "Нет ответа";
        cloud.textContent = text;

        clearTimeout(cloud.hideTimeout);
        cloud.hideTimeout = setTimeout(() => {
          cloud.style.opacity = "0";
          setTimeout(() => cloud.remove(), 300);
        }, 3000);
      } catch (err) {
        cloud.textContent = "Ошибка подключения.";
        console.error(err);
      }
    }

    lastRightClick = now;
  });
})();
