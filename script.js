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
    if (e.button === 1) return;

    const now = Date.now();
    if (now - lastRightClick < 400) {
      const el = e.target;
      let selector = [...el.classList].map(cls => `.${cls}`).join("");

      console.log("📌 Селектор по классам:", selector);

      let texts;
      if (selector.length > 0) {
        try {
          texts = el.querySelectorAll(`${selector} p, ${selector} span, ${selector} div, ${selector} li`);
          if (texts.length === 0) throw new Error("Ничего не найдено по селектору");
        } catch {
          texts = el.querySelectorAll("p, span, div, li");
          console.warn("⚠️ Переход к фолбэку без классов");
        }
      } else {
        texts = el.querySelectorAll("p, span, div, li");
      }

      // === OCR-функция ===
      if (!window.Tesseract) {
        await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js");
      }

      async function recognizeImageText(img) {
        try {
          const result = await Tesseract.recognize(img.src, "eng", {
            logger: m => console.log("📈 OCR:", m.status, m.progress)
          });
          return result.data.text.trim();
        } catch (err) {
          console.error("❌ Ошибка OCR:", err);
          return "";
        }
      }

      // === Получение текста вопроса ===
      let questionCandidates = [...texts].filter(t => t.innerText?.replace(/\s+/g, " ").trim().length > 20);

      if (questionCandidates.length === 0) {
        const imgInBox = el.querySelector("img");
        if (imgInBox) {
          const recognized = await recognizeImageText(imgInBox);
          if (recognized.length > 10) {
            const pseudoParagraph = document.createElement("p");
            pseudoParagraph.innerText = recognized;
            questionCandidates = [pseudoParagraph];
          }
        }
      }

      // === Получение вариантов ответа, включая OCR ===
      const rawAnswers = await Promise.all(
        [...texts].map(async (t) => {
          const raw = t.innerText?.trim() || "";
          if (raw.match(/^[A-ZА-Я]\)?\s+/)) return t;

          const imgs = t.querySelectorAll("img");
          if (imgs.length > 0) {
            let combinedText = "";
            for (const img of imgs) {
              const ocrText = await recognizeImageText(img);
              combinedText += " " + ocrText;
            }
            if (combinedText.match(/^[A-ZА-Я]\)?\s+/)) {
              const clone = t.cloneNode(true);
              clone.innerText = combinedText.trim();
              return clone;
            }
          }

          return null;
        })
      );

      const answerCandidates = rawAnswers.filter(Boolean);

      if (questionCandidates.length > 0 && answerCandidates.length >= 2) {
        const questionText = questionCandidates[0].innerText.trim();

        const seen = new Set();
        const options = answerCandidates
          .map(a => a.innerText.trim())
          .filter(opt => {
            if (seen.has(opt)) return false;
            seen.add(opt);
            return true;
          })
          .join("\n");

        const prompt = `Ответь на вопрос, выбери правильный вариант и обоснуй решение.\nВопрос:\n${questionText}\n\nВарианты:\n${options}`;

        let cloud = document.querySelector("#ai-answer-cloud");
        if (!cloud) {
          cloud = document.createElement("div");
          cloud.id = "ai-answer-cloud";
          cloud.style = `
            position: absolute;
            background: rgba(255, 255, 255, 0.06);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            color: #222;
            font-family: sans-serif;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.3s ease;
          `;
          document.body.appendChild(cloud);
        }

        cloud.style.opacity = "1";
        cloud.textContent = "...";
        cloud.style.left = (e.pageX + 10) + "px";
        cloud.style.top = (e.pageY - 30) + "px";

        if (cloud.hideTimeout) clearTimeout(cloud.hideTimeout);

        try {
          const firstRes = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": "chatgpt-42.p.rapidapi.com"
            },
            body: JSON.stringify({
              messages: [{ role: "user", content: prompt }],
              web_access: false
            })
          });

          const firstData = await firstRes.json();
          const fullAnswer = firstData.result?.trim() || "";

          const secondRes = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": "chatgpt-42.p.rapidapi.com"
            },
            body: JSON.stringify({
              messages: [
                { role: "user", content: `Вот решение задачи:\n${fullAnswer}\n\nТеперь скажи только букву правильного варианта ответа (A, B, C или D). Без пояснений.` }
              ],
              web_access: false
            })
          });

          const secondData = await secondRes.json();
          const rawText = secondData.result?.trim() || "Нет ответа";
          console.log("📤 Prompt к ChatGPT:\n", `Вот решение задачи:\n${fullAnswer}\n\nТеперь скажи только букву правильного варианта ответа (A, B, C или D). Без пояснений.`);
          console.log("📥 Ответ модели (только буква):\n", rawText);
          const match = rawText.match(/\b[ABCDАБВГ]\b/i);
          const answerLetter = match ? match[0].toUpperCase() : "❓";

          cloud.textContent = answerLetter;

          cloud.hideTimeout = setTimeout(() => {
            cloud.style.opacity = "0";
            setTimeout(() => cloud.remove(), 300);
          }, 3000);
        } catch (err) {
          cloud.textContent = "Ошибка запроса";
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
        el.style.outline = "rgb(106 112 117 / 15%) solid 1.7px";
        el.style.outlineOffset = "-2px";
        lastHovered = el;
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "q") {
      highlightEnabled = !highlightEnabled;
      highlightEnabled ? enableHighlight() : disableHighlight();
      console.log("Подсветка (Ctrl+Q): " + (highlightEnabled ? "ВКЛ" : "ВЫКЛ"));
    }
  });

  // Включение подсветки по клику: левая → правая → левая
  let clickSequence = [];
  let lastClickTime = 0;
  const sequenceTimeout = 1500;

  document.addEventListener("mousedown", (e) => {
    const currentTime = Date.now();

    if (currentTime - lastClickTime > sequenceTimeout) {
      clickSequence = [];
    }

    clickSequence.push(e.button);
    if (clickSequence.length > 3) clickSequence.shift();

    lastClickTime = currentTime;

    const sequenceStr = clickSequence.join(",");

    if (sequenceStr === "0,2,0" || sequenceStr === "0,0,0") {
      highlightEnabled = !highlightEnabled;
      highlightEnabled ? enableHighlight() : disableHighlight();
      console.log("Подсветка (мышь): " + (highlightEnabled ? "ВКЛ" : "ВЫКЛ"));
      clickSequence = [];
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      console.log("🔁 Ctrl + Z: Перезагрузка страницы");
      location.reload();
    }
  });
})();
