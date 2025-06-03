// === Клиентский AI помощник для тестов ===
// Экспортируем главную функцию для использования через import()

// Конфигурация по умолчанию
const defaultConfig = {
  openaiApiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.3,
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
        <input type="password" id="ai-api-key" placeholder="Введите OpenAI API ключ" 
               value="${this.config.openaiApiKey}" style="width: 100%; padding: 5px; margin-bottom: 5px;">
        <button id="ai-save-key" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px;">Сохранить ключ</button>
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
    
    // Сохранение API ключа
    document.getElementById('ai-save-key').addEventListener('click', () => {
      const key = document.getElementById('ai-api-key').value.trim();
      if (key) {
        this.config.openaiApiKey = key;
        localStorage.setItem('openaiApiKey', key);
        this.showMessage('Ключ сохранен!', 'success');
      } else {
        this.showMessage('Введите API ключ', 'error');
      }
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
    if (!this.config.openaiApiKey) {
      this.showMessage('Введите и сохраните OpenAI API ключ', 'error');
      return;
    }
    
    if (!question) {
      this.showMessage('Сначала выберите вопрос', 'error');
      return;
    }
    
    if (this.isLoading) {
      this.showMessage('Уже идет запрос...', 'warning');
      return;
    }
    
    this.isLoading = true;
    this.showMessage('Запрашиваю ответ у ChatGPT...', 'info');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "Ты - помощник, который дает краткие и точные ответы на вопросы. Отвечай максимально по существу."
            },
            {
              role: "user",
              content: `Дай точный и краткий ответ на вопрос: "${question}"`
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        this.showMessage(`Ошибка: ${data.error.message}`, 'error');
      } else if (data.choices && data.choices[0]) {
        const answer = data.choices[0].message.content;
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
  // Проверяем, есть ли сохраненный ключ
  const savedKey = localStorage.getItem('openaiApiKey');
  if (savedKey) {
    config.openaiApiKey = savedKey;
  }
  
  return new TestAIAssistant(config);
}

// Автоматическая инициализация при импорте
createAIAssistant();