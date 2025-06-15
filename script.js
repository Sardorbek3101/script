(() => {
  let lastRightClick = 0;
  const RAPIDAPI_KEY = "e46117ae21msh918b1b8b54d4e47p1c1623jsnbfc839744a88";

  // OCR-функция
  async function recognizeImageText(img) {
    if (!window.Tesseract) {
      await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js");
    }

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    try {
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(img.src);
      const image = await loadImage(proxyUrl);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);

      const result = await Tesseract.recognize(canvas, "eng", {
        logger: (m) => console.log("📈 OCR:", m.status, m.progress),
      });

      return result.data.text.trim();
    } catch (err) {
      console.error("❌ Ошибка OCR:", err);
      return "";
    }
  }

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

      let questionCandidates = [...texts].filter(t => t.innerText?.replace(/\s+/g, " ").trim().length > 20);
      let answerCandidates = [...texts].filter(t => t.innerText?.match(/^[A-ZА-Я]\)?\s+/));

      // 🔄 Попытка извлечь текст из изображений, если вопроса нет
      if (questionCandidates.length === 0) {
        const img = el.querySelector("img");
        if (img) {
          const imgText = await recognizeImageText(img);
          if (imgText.length > 0) {
            questionCandidates = [{ innerText: imgText }];
          }
        }
      }

      // 🔄 Если есть варианты, но они пустые — попытка извлечь из изображений внутри них
      if (answerCandidates.length > 0) {
        for (const a of answerCandidates) {
          if (!a.innerText.trim()) {
            const img = a.querySelector("img");
            if (img) {
              const text = await recognizeImageText(img);
              if (text) a.innerText = text;
            }
          }
        }
      }

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

  // Подсветка
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