class MoodFlowApp {
    constructor() {
        this.apiUrl = window.location.origin; // Автоматически берём текущий URL
        this.wsUrl = this.apiUrl.replace('http', 'ws'); // WebSocket URL
        
        this.emojis = {
            '😀': { label: 'Отличное', color: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF50, #45a049)' },
            '🙂': { label: 'Хорошее', color: '#8BC34A', gradient: 'linear-gradient(135deg, #8BC34A, #7CB342)' },
            '😐': { label: 'Нормальное', color: '#FFC107', gradient: 'linear-gradient(135deg, #FFC107, #FFB300)' },
            '🙁': { label: 'Плохое', color: '#FF9800', gradient: 'linear-gradient(135deg, #FF9800, #F57C00)' },
            '😢': { label: 'Ужасное', color: '#F44336', gradient: 'linear-gradient(135deg, #F44336, #E53935)' }
        };
        
        this.stats = {
            today: null,
            yesterday: null
        };
        
        this.ws = null;
        this.viewersCount = 0;
        
        this.init();
    }
    
    async init() {
        await this.loadStats();
        this.setupWebSocket();
        this.setupEventListeners();
    }
    
    async loadStats() {
        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiUrl}/api/stats`);
            const data = await response.json();
            
            this.stats = data;
            this.updateTodayStats(data.today);
            this.updateYesterdayStats(data.yesterday);
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showLoading(false);
        }
    }
    
    setupWebSocket() {
        try {
            // Подключаемся к WebSocket для реального времени
            this.ws = new WebSocket(`${this.wsUrl}/ws`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.sendViewerCount();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'new_mood') {
                    // Новое настроение от кого-то в мире!
                    this.handleNewMood(data.mood);
                } else if (data.type === 'stats_update') {
                    // Обновление статистики
                    this.stats.today = data.stats;
                    this.updateTodayStats(data.stats);
                } else if (data.type === 'viewers_count') {
                    // Обновление счётчика зрителей
                    this.updateViewersCount(data.count);
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected, reconnecting...');
                setTimeout(() => this.setupWebSocket(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('WebSocket setup error:', error);
            // Если WebSocket недоступен, используем поллинг
            this.setupPolling();
        }
    }
    
    setupPolling() {
        // Резервный вариант - опрос каждые 5 секунд
        setInterval(() => {
            this.loadStats();
        }, 5000);
    }
    
    handleNewMood(mood) {
        // Создаём падающий эмодзи
        this.createFallingEmoji(mood.emoji);
        
        // Показываем уведомление
        this.showNotification(`Новое настроение: ${this.emojis[mood.emoji].label}!`);
        
        // Обновляем статистику
        this.updateStatsWithNewMood(mood);
        
        // Анимируем кружок
        this.animateMoodCircle('today', mood.emoji);
    }
    
    updateStatsWithNewMood(mood) {
        const today = this.stats.today;
        
        // Обновляем общее количество
        today.count++;
        
        // Обновляем распределение
        today.distribution[mood.emoji] = (today.distribution[mood.emoji] || 0) + 1;
        
        // Пересчитываем самый популярный эмодзи
        let mostCommon = '😐';
        let maxCount = 0;
        
        for (const [emoji, count] of Object.entries(today.distribution)) {
            if (count > maxCount) {
                mostCommon = emoji;
                maxCount = count;
            }
        }
        
        today.mostCommonEmoji = mostCommon;
        today.percentage = Math.round((maxCount / today.count) * 100);
        
        // Обновляем UI
        this.updateTodayStats(today);
    }
    
    updateTodayStats(stats) {
        const emoji = stats.mostCommonEmoji || '😐';
        const percentage = stats.percentage || 0;
        const count = stats.count || 0;
        
        // Обновляем кружок
        document.getElementById('today-emoji').textContent = emoji;
        document.getElementById('today-percentage').textContent = `${percentage}%`;
        document.getElementById('today-total').textContent = `${count} ответов`;
        document.getElementById('today-label').textContent = this.emojis[emoji]?.label || 'Нормальное настроение';
        
        // Обновляем распределение
        this.updateDistribution(stats.distribution, count);
        
        // Обновляем время
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Обновляем последний ответ
        if (stats.lastResponse) {
            const lastEmoji = stats.lastResponse.emoji;
            const timeAgo = this.timeAgo(stats.lastResponse.timestamp);
            document.getElementById('last-response').textContent = `${this.emojis[lastEmoji].label} (${timeAgo})`;
        }
        
        // Обновляем фон кружка
        const circle = document.getElementById('today-circle');
        circle.style.background = this.emojis[emoji]?.gradient || 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    updateYesterdayStats(stats) {
        const emoji = stats.mostCommonEmoji || '😐';
        const percentage = stats.percentage || 0;
        const count = stats.count || 0;
        
        document.getElementById('yesterday-emoji').textContent = emoji;
        document.getElementById('yesterday-percentage').textContent = `${percentage}%`;
        document.getElementById('yesterday-total').textContent = `${count} ответов`;
        document.getElementById('yesterday-label').textContent = this.emojis[emoji]?.label || 'Нормальное настроение';
        
        // Создаём график
        this.createChart(stats.distribution);
        
        // Сравнение с сегодня
        this.updateComparison(stats);
    }
    
    updateDistribution(distribution, total) {
        for (const [emoji, count] of Object.entries(distribution)) {
            const percentage = Math.round((count / total) * 100);
            const item = document.getElementById(`dist-${emoji}`);
            
            if (item) {
                const bar = item.querySelector('.bar');
                const value = item.querySelector('.bar-value');
                
                bar.style.width = `${percentage}%`;
                value.textContent = `${percentage}%`;
            }
        }
    }
    
    createChart(distribution) {
        const ctx = document.getElementById('yesterday-chart').getContext('2d');
        
        // Удаляем старый график если есть
        if (this.yesterdayChart) {
            this.yesterdayChart.destroy();
        }
        
        const labels = Object.keys(distribution).map(e => this.emojis[e]?.label || e);
        const data = Object.values(distribution);
        const colors = Object.keys(distribution).map(e => this.emojis[e]?.color || '#9E9E9E');
        
        this.yesterdayChart = new Chart(ctx, {
            type: 'doughnut',
             {
                labels: labels,
                datasets: [{
                     data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${percentage}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                },
                cutout: '65%'
            }
        });
    }
    
    updateComparison(yesterdayStats) {
        const todayStats = this.stats.today;
        
        if (!todayStats || !yesterdayStats) return;
        
        const todayCount = todayStats.count;
        const yesterdayCount = yesterdayStats.count;
        
        let trendText = '';
        let trendIcon = '📊';
        
        if (todayCount > yesterdayCount) {
            const diff = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
            trendText = `Сегодня на ${diff}% больше ответов!`;
            trendIcon = '📈';
        } else if (todayCount < yesterdayCount) {
            const diff = Math.round(((yesterdayCount - todayCount) / yesterdayCount) * 100);
            trendText = `Сегодня на ${diff}% меньше ответов`;
            trendIcon = '📉';
        } else {
            trendText = 'Столько же ответов, как вчера';
        }
        
        document.querySelector('.trend-icon').textContent = trendIcon;
        document.getElementById('comparison-text').textContent = trendText;
    }
    
    animateMoodCircle(period, newEmoji) {
        const circle = document.getElementById(`${period}-circle`);
        const emojiDisplay = document.getElementById(`${period}-emoji`);
        
        // Добавляем класс для драматичной анимации
        circle.classList.add('dramatic-change');
        
        // Меняем градиент
        circle.style.background = this.emojis[newEmoji]?.gradient || 'linear-gradient(135deg, #667eea, #764ba2)';
        
        // Анимируем эмодзи
        emojiDisplay.style.transform = 'scale(1.3)';
        emojiDisplay.style.opacity = '0.5';
        
        setTimeout(() => {
            emojiDisplay.textContent = newEmoji;
            emojiDisplay.style.transform = 'scale(1)';
            emojiDisplay.style.opacity = '1';
            
            // Убираем класс анимации
            setTimeout(() => {
                circle.classList.remove('dramatic-change');
            }, 1000);
        }, 300);
    }
    
    createFallingEmoji(emoji) {
        const emojiRain = document.getElementById('emoji-rain');
        
        const element = document.createElement('div');
        element.className = 'falling-emoji';
        element.textContent = emoji;
        element.style.left = `${Math.random() * 100}%`;
        element.style.animationDuration = `${2 + Math.random() * 2}s`;
        element.style.fontSize = `${2 + Math.random() * 1}em`;
        
        emojiRain.appendChild(element);
        
        // Удаляем эмодзи после анимации
        setTimeout(() => {
            element.remove();
        }, 3000);
    }
    
    showNotification(message) {
        const toast = document.getElementById('notification-toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    showLoading(show) {
        const indicator = document.getElementById('refresh-indicator');
        if (show) {
            indicator.classList.add('active');
        } else {
            setTimeout(() => {
                indicator.classList.remove('active');
            }, 500);
        }
    }
    
    updateViewersCount(count) {
        this.viewersCount = count;
        document.getElementById('viewers-count').textContent = count;
    }
    
    sendViewerCount() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'viewer_joined',
                timestamp: Date.now()
            }));
        }
    }
    
    timeAgo(timestamp) {
        const now = Date.now();
        const diff = now - new Date(timestamp).getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (seconds < 60) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        return `${Math.floor(hours / 24)} д назад`;
    }
    
    setupEventListeners() {
        // Обновление при фокусе вкладки
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadStats();
            }
        });
        
        // Обновление по клику на кружок
        document.getElementById('today-circle').addEventListener('click', () => {
            this.loadStats();
            this.showNotification('Статистика обновлена! ✨');
        });
    }
}

// Запуск приложения когда страница загрузится
document.addEventListener('DOMContentLoaded', () => {
    window.moodFlowApp = new MoodFlowApp();
});