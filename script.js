// ========================================
// MOODFLOW - Логика фронтенда
// ========================================

class MoodFlowApp {
    constructor() {
        // URL бэкенда (меняй на свой)
        this.API_URL = 'moodflow-backend-production.up.railway.app'; // ЗАМЕНИ НА СВОЙ!
        this.WS_URL = this.API_URL.replace('http', 'ws');
        
        // Эмодзи и их данные
        this.emojis = {
            '😀': { label: 'Отличное', color: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF50, #45a049)' },
            '🙂': { label: 'Хорошее', color: '#8BC34A', gradient: 'linear-gradient(135deg, #8BC34A, #7CB342)' },
            '😐': { label: 'Нормальное', color: '#FFC107', gradient: 'linear-gradient(135deg, #FFC107, #FFB300)' },
            '🙁': { label: 'Плохое', color: '#FF9800', gradient: 'linear-gradient(135deg, #FF9800, #F57C00)' },
            '😢': { label: 'Ужасное', color: '#F44336', gradient: 'linear-gradient(135deg, #F44336, #E53935)' }
        };
        
        // Переводы
        this.translations = {
            ru: {
                mostCommonMood: 'Самое частое настроение',
                percentageSubtitle: 'ответов',
                totalResponses: 'Всего ответов',
                collectedToday: 'получено сегодня',
                yesterdayTop: 'Вчера было',
                yesterdayResponses: 'ответов',
                livePulse: 'Прямой эфир',
                latestMood: 'последнее настроение',
                howItWorks: 'Как это работает',
                howItWorksDesc: 'Люди со всего мира отвечают на простой вопрос о своём настроении. Их ответы создают эту глобальную карту счастья в реальном времени.',
                todayVsYesterday: 'Сегодня vs Вчера',
                volume: 'Объём',
                dominantMood: 'Доминирующее настроение',
                openInTelegram: 'Открыть в Telegram',
                loading: 'Загрузка статистики...',
                errorTitle: 'Ошибка',
                errorDesc: 'Не удалось загрузить статистику. Пожалуйста, попробуйте позже.'
            },
            en: {
                mostCommonMood: 'Most Common Mood',
                percentageSubtitle: 'of responses',
                totalResponses: 'Total Responses',
                collectedToday: 'collected today',
                yesterdayTop: 'Yesterday\'s Top',
                yesterdayResponses: 'responses',
                livePulse: 'Live Pulse',
                latestMood: 'Latest mood',
                howItWorks: 'How It Works',
                howItWorksDesc: 'People around the world answer a simple question about their mood. Their responses create this global happiness map in real-time.',
                todayVsYesterday: 'Today vs Yesterday',
                volume: 'Volume',
                dominantMood: 'Dominant Mood',
                openInTelegram: 'Open in Telegram',
                loading: 'Loading statistics...',
                errorTitle: 'Error',
                errorDesc: 'Failed to load statistics. Please try again later.'
            }
        };
        
        this.currentLang = 'ru';
        this.stats = null;
        this.ws = null;
        this.chart = null;
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.setupWebSocket();
        this.setupLanguageToggle();
        this.hideLoading();
    }
    
    // Загрузка статистики
    async loadStats() {
        try {
            const response = await fetch(`${this.API_URL}/api/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            const data = await response.json();
            this.stats = data;
            this.updateUI(data);
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showError();
        }
    }
    
    // Настройка WebSocket
    setupWebSocket() {
        try {
            this.ws = new WebSocket(this.WS_URL);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.ws.send(JSON.stringify({
                    type: 'viewer_joined',
                    timestamp: Date.now()
                }));
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'new_mood' && data.mood) {
                    this.handleNewMood(data.mood);
                }
                
                if (data.type === 'stats_update' && data.stats) {
                    this.updateTodayStats(data.stats);
                }
                
                if (data.type === 'viewers_count') {
                    this.updateViewersCount(data.count || 0);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                // Переподключение через 3 секунды
                setTimeout(() => this.setupWebSocket(), 3000);
            };
            
        } catch (error) {
            console.error('WebSocket setup error:', error);
            // Если не удалось подключиться, используем поллинг
            setInterval(() => this.loadStats(), 5000);
        }
    }
    
    // Обработка нового настроения
    handleNewMood(mood) {
        // Создаём падающий эмодзи
        this.createFallingEmoji(mood.emoji);
        
        // Обновляем последнее настроение
        document.getElementById('latest-mood').textContent = mood.emoji;
        
        // Перезагружаем статистику
        this.loadStats();
    }
    
    // Создание падающего эмодзи
    createFallingEmoji(emoji) {
        const rain = document.getElementById('emoji-rain');
        const element = document.createElement('div');
        element.className = 'falling-emoji';
        element.textContent = emoji;
        element.style.left = `${Math.random() * 100}%`;
        element.style.animationDuration = `${2 + Math.random() * 2}s`;
        
        rain.appendChild(element);
        
        setTimeout(() => {
            element.remove();
        }, 3000);
    }
    
    // Обновление интерфейса
    updateUI(data) {
        this.updateTodayStats(data.today);
        this.updateYesterdayStats(data.yesterday);
        this.updateChart(data.today.distribution);
        this.updateComparison(data.today, data.yesterday);
    }
    
    // Обновление статистики за сегодня
    updateTodayStats(stats) {
        document.getElementById('today-mood').textContent = stats.mostCommonEmoji || '😐';
        document.getElementById('today-percentage').textContent = stats.percentage || 0;
        document.getElementById('today-count').textContent = stats.count || 0;
        
        // Обновляем последнее настроение если есть
        if (stats.lastResponse) {
            document.getElementById('latest-mood').textContent = stats.lastResponse.emoji || '...';
        }
    }
    
    // Обновление статистики за вчера
    updateYesterdayStats(stats) {
        document.getElementById('yesterday-mood').textContent = stats.mostCommonEmoji || '😐';
        document.getElementById('yesterday-count').textContent = stats.count || 0;
        document.getElementById('yesterday-dominant').textContent = stats.mostCommonEmoji || '😐';
    }
    
    // Обновление диаграммы
    updateChart(distribution) {
        const ctx = document.getElementById('mood-chart').getContext('2d');
        
        // Удаляем старую диаграмму если есть
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = [];
        const data = [];
        const colors = [];
        const borderColors = [];
        
        // Сортируем эмодзи для консистентности
        const emojiOrder = ['😀', '🙂', '😐', '🙁', '😢'];
        
        emojiOrder.forEach(emoji => {
            const count = distribution[emoji] || 0;
            if (count > 0) {
                labels.push(`${this.emojis[emoji].label} (${count})`);
                data.push(count);
                colors.push(this.emojis[emoji].color);
                borderColors.push(this.emojis[emoji].color);
            }
        });
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
             {
                labels: labels,
                datasets: [{
                     data,
                    backgroundColor: colors.map(c => c + '80'), // 50% прозрачность
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${percentage}%`;
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
        
        // Обновляем легенду
        this.updateChartLegend(distribution);
    }
    
    // Обновление легенды диаграммы
    updateChartLegend(distribution) {
        const legend = document.getElementById('chart-legend');
        legend.innerHTML = '';
        
        const emojiOrder = ['😀', '🙂', '😐', '🙁', '😢'];
        
        emojiOrder.forEach(emoji => {
            const count = distribution[emoji] || 0;
            if (count > 0) {
                const item = document.createElement('div');
                item.className = 'chart-legend-item';
                
                const color = document.createElement('div');
                color.className = 'chart-legend-color';
                color.style.backgroundColor = this.emojis[emoji].color;
                
                const label = document.createElement('span');
                label.textContent = `${emoji} ${this.emojis[emoji].label}: ${count}`;
                
                item.appendChild(color);
                item.appendChild(label);
                legend.appendChild(item);
            }
        });
    }
    
    // Обновление сравнения
    updateComparison(today, yesterday) {
        const todayCount = today.count || 0;
        const yesterdayCount = yesterday.count || 0;
        
        document.getElementById('comparison-count').textContent = todayCount;
        
        // Тренд
        const trend = document.getElementById('comparison-trend');
        if (todayCount > yesterdayCount) {
            trend.textContent = '▲';
            trend.style.color = '#4CAF50';
        } else if (todayCount < yesterdayCount) {
            trend.textContent = '▼';
            trend.style.color = '#F44336';
        } else {
            trend.textContent = '─';
            trend.style.color = '#FFC107';
        }
        
        // Доминирующее настроение
        document.getElementById('comparison-mood').textContent = today.mostCommonEmoji || '😐';
    }
    
    // Обновление счётчика зрителей
    updateViewersCount(count) {
        document.getElementById('viewers-count').textContent = count;
    }
    
    // Настройка переключения языка
    setupLanguageToggle() {
        const toggle = document.getElementById('lang-toggle');
        const label = document.getElementById('lang-label');
        
        toggle.addEventListener('click', () => {
            this.currentLang = this.currentLang === 'ru' ? 'en' : 'ru';
            label.textContent = this.currentLang.toUpperCase();
            this.updateTranslations();
        });
    }
    
    // Обновление переводов
    updateTranslations() {
        const t = this.translations[this.currentLang];
        
        // Обновляем все элементы с атрибутом data-key
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (t[key]) {
                el.textContent = t[key];
            }
        });
        
        // Обновляем кнопку телеграма
        const telegramLink = document.querySelector('.telegram-button');
        telegramLink.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
            <span class="telegram-button-text">${t.openInTelegram}</span>
        `;
    }
    
    // Скрыть лоадер
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading-overlay').classList.add('hidden');
        }, 1000);
    }
    
    // Показать ошибку
    showError() {
        document.getElementById('loading-overlay').innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${this.translations[this.currentLang].errorTitle}</h2>
                <p style="color: var(--muted-foreground); margin-top: 0.5rem;">${this.translations[this.currentLang].errorDesc}</p>
                <button onclick="window.location.reload()" style="margin-top: 1.5rem; padding: 0.75rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Попробовать снова</button>
            </div>
        `;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.moodFlowApp = new MoodFlowApp();
    
    // Автообновление каждые 10 секунд
    setInterval(() => {
        window.moodFlowApp.loadStats();
    }, 10000);
});