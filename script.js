(() => {
  let lastRightClick = 0;
  let lastMousePos = { x: 0, y: 0 };
  const RAPIDAPI_KEY = "e46117ae21msh918b1b8b54d4e47p1c1623jsnbfc839744a88";

  // ✅ Показываем "success" при первом подключении
  document.addEventListener("mousemove", function showSuccessOnce(e) {
    document.removeEventListener("mousemove", showSuccessOnce);
    lastMousePos = { x: e.pageX, y: e.pageY };
    const cloud = document.createElement("div");
    cloud.textContent = "success";
    Object.assign(cloud.style, {
      position: "absolute",
      background: "rgba(200, 255, 200, 0.9)",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px",
      color: "#222",
      fontFamily: "sans-serif",
      pointerEvents: "none",
      zIndex: 9999,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: "opacity 0.3s ease",
      left: e.pageX + 10 + "px",
      top: e.pageY - 30 + "px"
    });
    document.body.appendChild(cloud);
    setTimeout(() => {
      cloud.style.opacity = "0";
      setTimeout(() => cloud.remove(), 300);
    }, 3000);
  });

  document.addEventListener("mousemove", (e) => {
    lastMousePos = { x: e.pageX, y: e.pageY };
  });

  // 🔥 Общий обработчик (используется для клика и клавиши)
  async function triggerAIResponse(e) {
    // 🧠 Ищем вопрос — текст с вопросительным знаком
    const textNodes = [...document.querySelectorAll("p, div, span, h1, h2, h3, h4, h5")];
    const visibleNodes = textNodes.filter(el =>
      el.offsetParent !== null && /\?\s*$/.test(el.innerText.trim())
    );
    const questionEl = visibleNodes[0];
    if (!questionEl) return;

    const questionText = questionEl.innerText.trim();

    // 🔍 Ищем блок с вариантами рядом
    let options = [];
    let container = questionEl.parentElement;
    for (let i = 0; i < 5 && container; i++) {
      const candidates = [...container.querySelectorAll("li, p, div")]
        .filter(el => el.offsetParent !== null && el.innerText.trim().length > 0)
        .map((el, idx) => {
          const text = el.innerText.trim();
          const key = text.match(/^[A-Za-zА-Яа-я0-9]\)?/)?.[0] || String.fromCharCode(65 + idx);
          return `${key}) ${text}`;
        });

      if (candidates.length >= 2 && candidates.length <= 6) {
        options = candidates;
        break;
      }
      container = container.parentElement;
    }

    if (!questionText || options.length === 0) return;

    const prompt = `Выбери правильный ответ. Вопрос:\n${questionText}\nВарианты:\n${options.join("\n")}\nОтвет (только буква):`;

    // ☁️ Показываем ответ
    let cloud = document.querySelector("#ai-answer-cloud");
    if (!cloud) {
      cloud = document.createElement("div");
      cloud.id = "ai-answer-cloud";
      Object.assign(cloud.style, {
        position: "absolute",
        background: "rgba(255, 255, 255, 0.85)",
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#222",
        fontFamily: "sans-serif",
        pointerEvents: "none",
        zIndex: 9999,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "opacity 0.3s ease"
      });
      document.body.appendChild(cloud);
    }

    cloud.style.opacity = "1";
    cloud.textContent = "Думаю...";
    cloud.style.left = lastMousePos.x + 10 + "px";
    cloud.style.top = lastMousePos.y - 30 + "px";

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
          messages: [{ role: "user", content: prompt }],
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

  // 🖱 Двойной правый клик
  document.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return;
    const now = Date.now();
    if (now - lastRightClick < 400) {
      triggerAIResponse(e);
    }
    lastRightClick = now;
  });

  // 🎹 Ctrl + M (горячая клавиша)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "m") {
      triggerAIResponse(e);
    }
  });
})();
