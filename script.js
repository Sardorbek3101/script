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
              background: rgba(255, 255, 255, 0.95);
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

          // Удалим старый таймер, если был
          if (cloud.hideTimeout) {
            clearTimeout(cloud.hideTimeout);
          }

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
                  {
                    role: "user",
                    content: prompt + "\nОтвет только в формате: A, B, C или D. Без пояснений, только буква."
                  }
                ],
                web_access: false
              })
            });

            const data = await res.json();
            const rawText = data.result?.trim() || "Нет ответа";

            // Извлекаем только первую подходящую букву ответа
            const match = rawText.match(/\b[ABCDАБВГ]\b/i);
            const answerLetter = match ? match[0].toUpperCase() : "Нет ответа";

            cloud.textContent = answerLetter;

            cloud.hideTimeout = setTimeout(() => {
              cloud.style.opacity = "0";
              setTimeout(() => cloud.remove(), 300);
            }, 5000);
          } catch (err) {
            cloud.textContent = "Ошибка подключения.";
            console.error(err);
          }

          break;
        }

        el = el.parentElement;
      }
    }

    lastRightClick = now;
  });
})();

(() => {
  let lastHoveredElement = null;
  let highlightEnabled = false;

  const highlightStyle = "2px solid rgba(0, 150, 255, 0.2)";
  const highlightOffset = "-2px";

  // Подсветка элемента под курсором, если включено
  document.addEventListener("mousemove", (e) => {
    if (!highlightEnabled) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);

    if (el && el !== lastHoveredElement) {
      if (lastHoveredElement) {
        lastHoveredElement.style.outline = "";
        lastHoveredElement.style.outlineOffset = "";
      }

      if (el.tagName !== "HTML" && el.tagName !== "BODY") {
        el.style.outline = highlightStyle;
        el.style.outlineOffset = highlightOffset;
        lastHoveredElement = el;
      }
    }
  });

  // Убираем подсветку при выходе курсора за пределы окна
  document.addEventListener("mouseout", () => {
    if (lastHoveredElement) {
      lastHoveredElement.style.outline = "";
      lastHoveredElement.style.outlineOffset = "";
      lastHoveredElement = null;
    }
  });

  // Горячая клавиша: Ctrl + Tab переключает режим
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Tab") {
      e.preventDefault(); // предотвращаем переключение вкладки
      highlightEnabled = !highlightEnabled;

      if (!highlightEnabled && lastHoveredElement) {
        lastHoveredElement.style.outline = "";
        lastHoveredElement.style.outlineOffset = "";
        lastHoveredElement = null;
      }

      console.log("Подсветка: " + (highlightEnabled ? "включена" : "выключена"));
    }
  });
})();

