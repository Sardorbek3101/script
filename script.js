// === Клиентский AI помощник для тестов (без API ключей) ===

// Конфигурация по умолчанию
const defaultConfig = {
  service: 'local', // 'local', 'yandexgpt', 'llama'
  maxTokens: 150
};

// Главный класс помощника
class TestAIAssistant {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.currentQuestion = null;
    this.isLoading = false;
    this.init();
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    console.log('AI помощник инициализирован');
  }

  createUI() {
    // Удаляем старые элементы если есть
    this.removeUI();

    // Главное окно
    this.answerWindow = document.createElement('div');
    this.answerWindow.id = 'ai-helper-window';
    this.answerWindow.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 300px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 9999;
      font-family: Arial, sans-serif;
      display: none;
    `;
    
    this.answerWindow.innerHTML = `
      <div style="padding: 10px; background: #f5f5f5; border-bottom: 1px solid #ddd; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between;">
        <strong>AI Помощник</strong>
        <span id="ai-helper-close" style="cursor: pointer;">×</span>
      </div>
      <div id="ai-helper-content" style="padding: 10px; max-height: 300px; overflow-y: auto;"></div>
      <div style="padding: 10px; border-top: 1px solid #ddd;">
        <select id="ai-service-select" style="width: 100%; padding: 5px; margin-bottom: 5px;">
          <option value="local">Локальный ИИ (быстрый)</option>
          <option value="yandexgpt">Yandex GPT (требует логин)</option>
          <option value="llama">Llama 3 (через сервер)</option>
        </select>
        <button id="ai-get-answer" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; margin-top: 5px; width: 100%;">
          Получить ответ
        </button>
      </div>
    `;
    
    document.body.appendChild(this.answerWindow);
    
    // Кнопка активации
    this.triggerBtn = document.createElement('div');
    this.triggerBtn.id = 'ai-helper-trigger';
    this.triggerBtn.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 50px;
      height: 50px;
      background: #4CAF50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9998;
    `;
    this.triggerBtn.innerHTML = 'AI';
    document.body.appendChild(this.triggerBtn);
  }

  removeUI() {
    const oldWindow = document.getElementById('ai-helper-window');
    const oldTrigger = document.getElementById('ai-helper-trigger');
    if (oldWindow) oldWindow.remove();
    if (oldTrigger) oldTrigger.remove();
  }

  setupEventListeners() {
    // Открытие/закрытие окна
    this.triggerBtn.addEventListener('click', () => {
      this.answerWindow.style.display = this.answerWindow.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('ai-helper-close').addEventListener('click', () => {
      this.answerWindow.style.display = 'none';
    });
    
    // Изменение сервиса
    document.getElementById('ai-service-select').addEventListener('change', (e) => {
      this.config.service = e.target.value;
    });
    
    // Получение ответа
    document.getElementById('ai-get-answer').addEventListener('click', () => {
      this.getAIAnswer(this.currentQuestion);
    });
    
    // Автоматическое обнаружение вопросов
    this.adaptToSite();
  }

  showMessage(text, type = 'info') {
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800'
    };
    
    const content = document.getElementById('ai-helper-content');
    const message = document.createElement('div');
    message.style.cssText = `
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      background: ${colors[type] || colors.info}20;
      border-left: 3px solid ${colors[type] || colors.info};
    `;
    message.textContent = text;
    content.appendChild(message);
    content.scrollTop = content.scrollHeight;
  }

  async getAIAnswer(question) {
    if (!question) {
      this.showMessage('Сначала выберите вопрос', 'error');
      return;
    }
    
    if (this.isLoading) {
      this.showMessage('Уже идет запрос...', 'warning');
      return;
    }
    
    this.isLoading = true;
    this.showMessage(`Запрашиваю ответ (${this.config.service})...`, 'info');
    
    try {
      let answer;
      
      switch(this.config.service) {
        case 'local':
          answer = await this.getLocalAnswer(question);
          break;
        case 'yandexgpt':
          answer = await this.getYandexGPTAnswer(question);
          break;
        case 'llama':
          answer = await this.getLlamaAnswer(question);
          break;
        default:
          answer = await this.getLocalAnswer(question);
      }
      
      if (answer) {
        this.showMessage(`Ответ на вопрос "${question}":\n\n${answer}`, 'success');
      } else {
        this.showMessage('Не получилось получить ответ', 'error');
      }
    } catch (error) {
      this.showMessage(`Ошибка запроса: ${error.message}`, 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Локальный "ИИ" - простые ответы на популярные вопросы
  async getLocalAnswer(question) {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Простая база знаний
    const knowledgeBase = {
      "что такое html": "HTML (HyperText Markup Language) - это язык разметки для создания веб-страниц.",
      "что такое css": "CSS (Cascading Style Sheets) - это язык стилей для оформления HTML-документов.",
      "что такое javascript": "JavaScript - это язык программирования для создания интерактивных веб-страниц.",
      "как создать функцию в javascript": "Функция в JavaScript создается так: function myFunction(param) { ... }",
      "как изменить цвет фона в css": "Используйте свойство background-color: например, background-color: red;",
      "что такое api": "API (Application Programming Interface) - это набор методов для взаимодействия между программами.",
      "как добавить элемент в массив": "В JavaScript: array.push(element) - добавит элемент в конец массива.",
      "что такое react": "React - это JavaScript-библиотека для создания пользовательских интерфейсов.",
      "как создать компонент в react": "В React компонент можно создать как функцию: function MyComponent() { return ... }",
      "что такое git": "Git - это система контроля версий для отслеживания изменений в коде."
    };
    
    const lowerQuestion = question.toLowerCase();
    
    // Ищем точный или похожий вопрос
    for (const [q, a] of Object.entries(knowledgeBase)) {
      if (lowerQuestion.includes(q) || q.includes(lowerQuestion)) {
        return a;
      }
    }
    
    // Если вопрос не найден, возвращаем общий ответ
    return "К сожалению, у меня нет точного ответа на этот вопрос. Попробуйте использовать Yandex GPT или Llama для более сложных вопросов.";
  }

  // Используем Yandex GPT (требует авторизации в Яндексе)
  async getYandexGPTAnswer(question) {
    try {
      // Открываем новое окно с Yandex GPT
      const yandexUrl = `https://300.ya.ru/api/sharing-url`;
      const response = await fetch(`https://cors-anywhere.herokuapp.com/${yandexUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          article_url: "",
          text: question
        })
      });
      
      const data = await response.json();
      
      if (data.sharing_url) {
        window.open(data.sharing_url, '_blank');
        return "Открыл Yandex GPT в новом окне. Авторизуйтесь и получите ответ там.";
      } else {
        throw new Error("Не удалось получить ссылку на Yandex GPT");
      }
    } catch (error) {
      // Если не работает через API, просто открываем страницу Yandex GPT
      window.open('https://yandex.ru/gpt/', '_blank');
      return "Открыл Yandex GPT в новом окне. Введите вопрос там вручную.";
    }
  }

  // Используем Llama 3 через бесплатный прокси
  async getLlamaAnswer(question) {
    try {
      const response = await fetch('https://cors-anywhere.herokuapp.com/https://api.llama.ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          prompt: question,
          max_tokens: this.config.maxTokens
        })
      });
      
      const data = await response.json();
      return data.choices?.[0]?.text || "Не получилось получить ответ от Llama";
    } catch (error) {
      // Альтернатива - открыть веб-интерфейс Llama
      window.open('https://llama.ai/', '_blank');
      return "Открыл Llama в новом окне. Введите вопрос там вручную.";
    }
  }

  adaptToSite() {
    // Даем время для загрузки страницы
    setTimeout(() => {
      const questions = document.querySelectorAll('.test-question, .question-text, [class*="question"], .q-text');
      
      questions.forEach(q => {
        q.style.cursor = 'pointer';
        q.title = 'Нажмите, чтобы использовать этот вопрос';
        
        q.addEventListener('click', () => {
          this.currentQuestion = q.innerText.trim();
          this.showMessage('Вопрос сохранен. Нажмите "Получить ответ"', 'info');
        });
      });
      
      if (questions.length > 0) {
        this.showMessage(`Найдено ${questions.length} вопросов. Кликните по вопросу чтобы выбрать его.`, 'info');
      } else {
        this.showMessage('Вопросы не найдены автоматически. Скопируйте вопрос вручную.', 'warning');
      }
    }, 1000);
  }
}

// Экспортируем функцию для создания помощника
export function createAIAssistant(config = {}) {
  return new TestAIAssistant(config);
}

// Автоматическая инициализация при импорте
createAIAssistant();