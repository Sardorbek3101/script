(() => {
  let lastRightClick = 0;
  const RAPIDAPI_KEY = "e46117ae21msh918b1b8b54d4e47p1c1623jsnbfc839744a88";

  // Показываем "success" при движении мыши
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
      const el = e.target;

      // Собираем текстовые узлы только изнутри элемента
      const rawTexts = Array.from(el.querySelectorAll("*"))
        .flatMap(child => Array.from(child.childNodes))
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .filter(text => text.length > 1);

      const uniqueTexts = [...new Set(rawTexts)];

      const questionCandidates = uniqueTexts.filter(t => t.length > 20 && !t.includes("\n"));
      let questionText = questionCandidates[0] || "";

      const optionLines = uniqueTexts.filter(t => {
        const matches = t.match(/\b[A-ZА-Я]\s+\S+/g);
        return matches && matches.length === 1;
      });

      const seenLetters = new Set();
      const options = optionLines
        .filter(opt => {
          const letter = opt[0].toUpperCase();
          if (seenLetters.has(letter)) return false;
          seenLetters.add(letter);
          return /^[A-ZА-Я]\s+\S+/i.test(opt);
        })
        .join("\n");

      if (questionText && options.split("\n").length >= 2) {
        const prompt = `Выбери правильный ответ. Вопрос:\n${questionText}\nВарианты:\n${options}\nОтвет (только буква):`;
         console.log("🧩 Найденные элементы:");
        console.log("🔹 Вопросы:", questionCandidates.map(e => e.innerText.trim()));
        console.log("🔹 Ответы:", answerCandidates.map(e => e.innerText.trim()));


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

        if (cloud.hideTimeout) clearTimeout(cloud.hideTimeout);

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
      } else {
        console.warn("❌ Вопрос или ответы не найдены в этом элементе.");
      }
    }

    lastRightClick = now;
  });

  // === Подсветка элемента под курсором, включается по Ctrl + Q ===
  let highlightEnabled = false;
  let lastHovered = null;

  function enableHighlight() {
    document.addEventListener("mousemove", onMouseMove);
  }

  function disableHighlight() {
    document.removeEventListener("mousemove", onMouseMove);
    if (lastHovered) {
      lastHovered.style.outline = "";
      lastHovered = null;
    }
  }

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);

    if (el && el !== lastHovered) {
      if (lastHovered) lastHovered.style.outline = "";

      if (el.tagName !== "HTML" && el.tagName !== "BODY") {
        el.style.outline = "2px solid rgba(0, 150, 255, 0.15)";
        el.style.outlineOffset = "-2px";
        lastHovered = el;
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "q") {
      highlightEnabled = !highlightEnabled;
      highlightEnabled ? enableHighlight() : disableHighlight();
      console.log("Подсветка " + (highlightEnabled ? "ВКЛ" : "ВЫКЛ"));
    }
  });
})();
