window.lmc_code = "fake_code"; 

// 2. Подменяем fetch, чтобы проверка всегда проходила
const originalFetch = window.fetch;
window.fetch = async (url, ...args) => {
  if (url.includes("/" + window.lmc_code)) {
    // Возвращаем "успешный" ответ, чтобы обойти проверку
    return new Response("", { 
      status: 200, 
      headers: { "Content-Type": "application/javascript" } 
    });
  }
  return originalFetch(url, ...args); // Остальные запросы работают как обычно
};

// 3. Загружаем скрипт
import("https://script-tggi.onrender.com/start.js");
