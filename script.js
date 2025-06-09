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
      let el = e.target;

      // Найти ближайший родительский элемент, содержащий вопрос и ответы
      while (el && el !== document.body) {
        const texts = el.querySelectorAll("p, span, div, li");
        const questionCandidates = [...texts].filter(t => t.innerText?.length > 20 && !t.innerText.includes("\n"));
        const answerCandidates = [...texts].filter(t => t.innerText?.length > 1 && t.innerText.match(/^[A-ZА-Я]\)?\s+/));

        if (questionCandidates.length > 0 && answerCandidates.length >= 2) {
          const questionText = questionCandidates[0].innerText.trim();
          const options = answerCandidates.map((a) => a.innerText.trim()).join("\n");

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

          break; // Прекратить обход DOM вверх
        }

        el = el.parentElement;
      }
    }

    lastRightClick = now;
  });
})();
