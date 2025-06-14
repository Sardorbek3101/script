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
      // Пробуем точный селектор
      try {
        texts = el.querySelectorAll(`${selector} p, ${selector} span, ${selector} div, ${selector} li`);
        if (texts.length === 0) throw new Error("Ничего не найдено по селектору");
      } catch {
        // Фолбэк
        texts = el.querySelectorAll("p, span, div, li");
        console.warn("⚠️ Переход к фолбэку без классов");
      }
    } else {
      texts = el.querySelectorAll("p, span, div, li");
    }

 const questionCandidates = [...texts].filter(t => t.innerText?.replace(/\s+/g, " ").trim().length > 20);


    const answerCandidates = [...texts].filter(t =>
      t.innerText?.match(/^[A-ZА-Я]\)?\s+/)
    );

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

      const prompt = `Выбери правильный ответ. Вопрос:\n${questionText}\nВарианты:\n${options}\nОтвет (только буква):`;


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
      cloud.textContent = "Думаю...";
      cloud.style.left = (e.pageX + 10) + "px";
      cloud.style.top = (e.pageY - 30) + "px";

      if (cloud.hideTimeout) clearTimeout(cloud.hideTimeout);

      try {
        // Первый запрос — расчёт
        const fullRes = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4", {
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
                content: `Реши задачу по формуле. Вопрос:\n${questionText}\nВарианты:\n${options}`
              }
            ],
            web_access: false
          })
        });

        const fullData = await fullRes.json();
        const fullAnswer = fullData.result?.trim() || "";

        // Второй запрос — извлечение буквы
        const shortRes = await fetch("https://chatgpt-42.p.rapidapi.com/gpt4", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "chatgpt-42.p.rapidapi.com"
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: fullAnswer
              },
              {
                role: "user",
                content: "На основе решения выше: только буква правильного варианта: A, B, C или D."
              }
            ],
            web_access: false
          })
        });

        const shortData = await shortRes.json();
        const rawText = shortData.result?.trim() || "Нет ответа";

        console.log("📥 Ответ модели (буква):\n", rawText);
        const match = rawText.match(/^[ABCD]/i);
        const answerLetter = match ? match[0].toUpperCase() : "Нет ответа";

        cloud.textContent = answerLetter;

        cloud.hideTimeout = setTimeout(() => {
          cloud.style.opacity = "0";
          setTimeout(() => cloud.remove(), 300);
        }, 3000);
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
const sequenceTimeout = 1500; // 1.5 секунды

document.addEventListener("mousedown", (e) => {
  const currentTime = Date.now();

  // Если прошло больше 1.5 секунды с последнего клика — сбросить последовательность
  if (currentTime - lastClickTime > sequenceTimeout) {
    clickSequence = [];
  }

  clickSequence.push(e.button); // 0 = левая, 2 = правая
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
