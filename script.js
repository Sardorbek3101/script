// === AI помощник для тестов (без API ключей) ===
class TestAIAssistant {
  constructor() {
    this.currentQuestion = null;
    this.init();
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    console.log('AI помощник инициализирован');
  }

  createUI() {
    // Удаляем старые элементы, если есть
    this.removeUI();

    // Главное окно
    this.answerWindow = document.createElement('div');
    this.answerWindow.id = 'ai-helper-window';
    this.answerWindow.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 350px;
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
        <button id="ai-get-answer" style="padding: 8px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; margin-top: 5px; width: 100%;">
          Получить ответ (через ИИ)
        </button>
        <button id="ai-smart-search" style="padding: 8px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; margin-top: 5px; width: 100%;">
          Найти ответ в интернете
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
      background: #2196F3;
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
    
    // Получение ответа через ИИ (если доступен WebView API)
    document.getElementById('ai-get-answer').addEventListener('click', () => {
      this.getAIAnswer(this.currentQuestion);
    });

    // Умный поиск в интернете (если нет доступа к ИИ)
    document.getElementById('ai-smart-search').addEventListener('click', () => {
      this.smartSearchAnswer(this.currentQuestion);
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

    this.showMessage("Ищу ответ через ИИ...", 'info');

    // Попробуем использовать WebView API (если доступно)
    if (window.hasOwnProperty('webkit') && window.webkit.messageHandlers) {
      try {
        window.webkit.messageHandlers.getAIAnswer.postMessage(question);
        this.showMessage("Запрос отправлен в WebView. Ждем ответа...", 'info');
      } catch (e) {
        this.showMessage("Ошибка WebView: " + e.message, 'error');
      }
      return;
    }

    // Если WebView недоступен, попробуем Smart Search
    this.smartSearchAnswer(question);
  }

  async smartSearchAnswer(question) {
    if (!question) {
      this.showMessage('Сначала выберите вопрос', 'error');
      return;
    }

    this.showMessage("Ищу ответ в интернете...", 'info');

    try {
      // Используем Google Custom Search или аналоги (если доступно)
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(question)}`;
      
      // В идеале - использовать fetch + прокси, но это требует бекенда
      // Вместо этого покажем ссылку
      this.showMessage(
        `🔍 Ответ не найден в локальной базе.\n\n` +
        `Попробуйте поискать вручную: ` +
        `<a href="${searchUrl}" target="_blank" style="color: #2196F3;">открыть поиск Google</a>`,
        'warning'
      );
    } catch (e) {
      this.showMessage("Ошибка поиска: " + e.message, 'error');
    }
  }

  adaptToSite() {
    setTimeout(() => {
      const questions = document.querySelectorAll('.test-question, .question-text, [class*="question"], .q-text');
      
      questions.forEach(q => {
        q.style.cursor = 'pointer';
        q.title = 'Нажмите, чтобы использовать этот вопрос';
        
        q.addEventListener('click', () => {
          this.currentQuestion = q.innerText.trim();
          this.showMessage(`Вопрос выбран: "${this.currentQuestion}"`, 'success');
        });
      });
      
      if (questions.length > 0) {
        this.showMessage(`Найдено ${questions.length} вопросов. Кликните по вопросу, чтобы выбрать его.`, 'info');
      } else {
        this.showMessage('Вопросы не найдены автоматически. Выделите текст вопроса вручную.', 'warning');
      }
    }, 1000);
  }
}

// Автоматическая инициализация
new TestAIAssistant();