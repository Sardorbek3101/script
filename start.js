const currentUrl = new URL(window.location.href);
const pathParts = currentUrl.pathname.split('/').filter(Boolean); // Удаляем пустые элементы

// Берём последнюю часть пути (например, "fk" из "https://example.com/fk")
const lmcCode = pathParts[pathParts.length - 1];

// Проверяем, что код получен
if (!lmcCode) {
  console.error("Не удалось извлечь lmc_code из URL!");
} else {
  window.lmc_code = lmcCode; // Устанавливаем код перед загрузкой скрипта
}

await import ("https://script-tggi.onrender.com/game/helper.js");