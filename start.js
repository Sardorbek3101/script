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
const jqueryScript = document.createElement('script');
jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
document.head.appendChild(jqueryScript);

// 2. Ждём загрузки jQuery, затем загружаем ваш скрипт
jqueryScript.onload = () => {
  import("https://script-tggi.onrender.com/start.js");
};