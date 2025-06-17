(async () => {
  if (!window.Tesseract) {
    await import("https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/tesseract.min.js");
  }

  const { createWorker } = window.Tesseract;

  async function recognizeImageText(imageUrl) {
    console.log("📈 OCR: loading tesseract core");
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(objectURL);
      console.log("📝 Распознанный текст:", text);
      URL.revokeObjectURL(objectURL);
      await worker.terminate();
      return text.trim();
    } catch (err) {
      console.error("❌ OCR error:", err);
      return "";
    }
  }

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

      if (questionCandidates.length === 0) {
        const img = el.querySelector("img");
        if (img) {
          const ocrText = await recognizeImageText(img.src);
          if (ocrText.length > 20) {
            const node = document.createElement("div");
            node.innerText = ocrText;
            node.style.display = "none";
            el.appendChild(node);
            questionCandidates.push(node);
          }
        }
      }

      if (questionCandidates.length > 0 && answerCandidates.length < 2) {
        const imgs = el.querySelectorAll("img");
        const buffer = [];

        for (const img of imgs) {
          const ocr = await recognizeImageText(img.src);
          console.log("🖼️ OCR-ответ варианта:", ocr);
          if (ocr) buffer.push(...ocr.trim().split("\n").map(l => l.trim()).filter(Boolean));
        }

        const seen = new Set();

        for (let i = 0; i < buffer.length; i++) {
          let line = buffer[i];

          // 💡 Если строка — просто A), B), C) и т.п. — склеиваем с соседней
          if (/^[A-ZА-Я]\)?$/.test(line) && i + 1 < buffer.length) {
            line = `${line} ${buffer[i + 1]}`;
            i++; // пропускаем следующий, он уже добавлен
          }

          // 📌 Убираем совсем странные строки (одна буква, мусор и т.д.)
          if (line.length < 2 || seen.has(line)) continue;

          const opt = document.createElement("div");
          opt.innerText = line;
          opt.style.display = "none";
          el.appendChild(opt);
          answerCandidates.push(opt);
          seen.add(line);
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

  // Подсветка Ctrl+Q
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

  // Альтернативная подсветка (клики)
  let clickSequence = [];
  let lastClickTime = 0;
  const sequenceTimeout = 1500;

  document.addEventListener("mousedown", (e) => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > sequenceTimeout) clickSequence = [];
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

  // Перезагрузка Ctrl+Z
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      console.log("🔁 Ctrl + Z: Перезагрузка страницы");
      location.reload();
    }
  });
})();
