/**
 * MoodFlow — Premium Frontend v2
 * Real-time global mood statistics
 */

class MoodFlow {
    constructor() {
        // Backend URLs
        this.API_URL = 'https://moodflow-backend-production.up.railway.app';
        this.WS_URL = 'wss://moodflow-backend-production.up.railway.app';
        
        // Bot link for sharing
        this.BOT_LINK = 'https://t.me/MoodFlowStatsBot';
        this.WEB_APP_URL = 'https://moodflow-stats.netlify.app'; // Update with your actual URL
        
        // Mood configuration with happiness weights (0-100)
        this.moods = {
            '😀': { label: { ru: 'Отличное', en: 'Great' }, color: '#10B981', weight: 100 },
            '🙂': { label: { ru: 'Хорошее', en: 'Good' }, color: '#84CC16', weight: 75 },
            '😐': { label: { ru: 'Нормальное', en: 'Neutral' }, color: '#F59E0B', weight: 50 },
            '🙁': { label: { ru: 'Плохое', en: 'Bad' }, color: '#F97316', weight: 25 },
            '😢': { label: { ru: 'Ужасное', en: 'Terrible' }, color: '#EF4444', weight: 0 }
        };
        
        this.moodOrder = ['😀', '🙂', '😐', '🙁', '😢'];
        
        // Translations
        this.i18n = {
            ru: {
                tagline: 'Пульс настроений планеты',
                chartTitle: 'Настроения сегодня',
                responses: 'ответов',
                livePulse: 'Прямой эфир',
                waiting: 'ожидание...',
                topMood: 'Топ настроение',
                ofTotal: 'от всех',
                totalResponses: 'Всего ответов',
                today: 'сегодня',
                yesterday: 'Вчера',
                happinessIndex: 'Индекс счастья',
                outOf100: 'из 100',
                sharePrompt: 'Пригласи друзей поделиться настроением!',
                shareInTelegram: 'Отправить в Telegram',
                copyLink: 'Скопировать ссылку',
                copied: 'Скопировано!',
                footerText: 'Люди со всего мира делятся настроением каждый день',
                loading: 'Загружаем настроения мира...',
                newMood: 'Новое настроение!',
                shareText: '🌍 Присоединяйся к MoodFlow! Отслеживай настроение мира в реальном времени и делись своим каждый день!'
            },
            en: {
                tagline: 'Global mood pulse',
                chartTitle: 'Today\'s moods',
                responses: 'responses',
                livePulse: 'Live Pulse',
                waiting: 'waiting...',
                topMood: 'Top Mood',
                ofTotal: 'of total',
                totalResponses: 'Total Responses',
                today: 'today',
                yesterday: 'Yesterday',
                happinessIndex: 'Happiness Index',
                outOf100: 'out of 100',
                sharePrompt: 'Invite friends to share their mood!',
                shareInTelegram: 'Share on Telegram',
                copyLink: 'Copy link',
                copied: 'Copied!',
                footerText: 'People around the world share their mood every day',
                loading: 'Loading world moods...',
                newMood: 'New mood!',
                shareText: '🌍 Join MoodFlow! Track the world\'s mood in real-time and share yours every day!'
            }
        };
        
        // State
        this.lang = localStorage.getItem('moodflow-lang') || 'ru';
        this.theme = localStorage.getItem('moodflow-theme') || 'dark';
        this.chart = null;
        this.ws = null;
        this.wsReconnectTimeout = null;
        this.liveStreamEmojis = [];
        this.maxLiveEmojis = 8;
        this.lastDistribution = null;
        
        this.init();
    }
    
    async init() {
        // Apply saved preferences
        this.applyTheme(this.theme);
        this.applyLanguage(this.lang);
        this.setCurrentDate();
        
        // Setup event listeners
        this.setupThemeToggle();
        this.setupLanguageToggle();
        this.setupShareButtons();
        
        // Load data and connect
        await this.loadStats();
        this.setupWebSocket();
        
        // Hide loading screen
        setTimeout(() => this.hideLoading(), 800);
        
        // Periodic refresh as fallback
        setInterval(() => this.loadStats(), 30000);
    }
    
    // === Theme ===
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('moodflow-theme', theme);
    }
    
    setupThemeToggle() {
        const btn = document.getElementById('theme-toggle');
        btn?.addEventListener('click', () => {
            const newTheme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
        });
    }
    
    // === Language ===
    applyLanguage(lang) {
        this.lang = lang;
        localStorage.setItem('moodflow-lang', lang);
        
        // Update HTML lang attribute for font switching
        document.documentElement.setAttribute('lang', lang);
        
        const t = this.i18n[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });
        
        document.getElementById('lang-label').textContent = lang.toUpperCase();
        
        // Update chart legend if exists
        if (this.lastDistribution) {
            this.updateChartLegend(this.lastDistribution);
        }
    }
    
    setupLanguageToggle() {
        const btn = document.getElementById('lang-toggle');
        btn?.addEventListener('click', () => {
            const newLang = this.lang === 'ru' ? 'en' : 'ru';
            this.applyLanguage(newLang);
        });
    }
    
    // === Share Buttons ===
    setupShareButtons() {
        // Telegram share
        const telegramBtn = document.getElementById('share-telegram');
        telegramBtn?.addEventListener('click', () => {
            const text = encodeURIComponent(this.i18n[this.lang].shareText);
            const url = encodeURIComponent(this.BOT_LINK);
            window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
        });
        
        // Copy link
        const copyBtn = document.getElementById('copy-link');
        copyBtn?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.BOT_LINK);
                copyBtn.classList.add('copied');
                const span = copyBtn.querySelector('span');
                const originalText = span.textContent;
                span.textContent = this.i18n[this.lang].copied;
                
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    span.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    }
    
    // === Date ===
    setCurrentDate() {
        const now = new Date();
        const options = { day: 'numeric', month: 'short' };
        const dateStr = now.toLocaleDateString(this.lang === 'ru' ? 'ru-RU' : 'en-US', options);
        const dateEl = document.getElementById('chart-date');
        if (dateEl) dateEl.textContent = dateStr;
    }
    
    // === API ===
    async loadStats() {
        try {
            const response = await fetch(`${this.API_URL}/api/stats`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.updateUI(data);
            return data;
        } catch (error) {
            console.error('Failed to load stats:', error);
            return null;
        }
    }
    
    // === WebSocket ===
    setupWebSocket() {
        if (this.ws?.readyState === WebSocket.OPEN) return;
        
        try {
            this.ws = new WebSocket(this.WS_URL);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                clearTimeout(this.wsReconnectTimeout);
                
                // Register as viewer
                this.ws.send(JSON.stringify({
                    type: 'viewer_joined',
                    timestamp: Date.now()
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWSMessage(data);
                } catch (e) {
                    console.error('WS message parse error:', e);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.scheduleReconnect();
            };
            
        } catch (error) {
            console.error('WebSocket setup failed:', error);
            this.scheduleReconnect();
        }
    }
    
    scheduleReconnect() {
        clearTimeout(this.wsReconnectTimeout);
        this.wsReconnectTimeout = setTimeout(() => {
            console.log('Attempting WebSocket reconnect...');
            this.setupWebSocket();
        }, 3000);
    }
    
    handleWSMessage(data) {
        switch (data.type) {
            case 'new_mood':
                if (data.mood?.emoji) {
                    this.onNewMood(data.mood.emoji);
                }
                break;
                
            case 'stats_update':
                if (data.stats) {
                    this.updateTodayStats(data.stats);
                }
                break;
                
            case 'viewers_count':
                this.updateViewersCount(data.count ?? 0);
                break;
                
            case 'welcome':
                // Server sends viewer count on connect
                if (data.viewers !== undefined) {
                    this.updateViewersCount(data.viewers);
                }
                break;
        }
    }
    
    // === UI Updates ===
    updateUI(data) {
        if (!data) return;
        
        const today = data.today || {};
        const yesterday = data.yesterday || {};
        
        // Today stats
        this.updateTodayStats(today);
        
        // Yesterday stats
        this.updateYesterdayStats(yesterday);
        
        // Chart
        if (today.distribution) {
            this.updateChart(today.distribution);
            this.lastDistribution = today.distribution;
            
            // Calculate and update happiness index
            this.updateHappinessIndex(today.distribution);
        }
        
        // Last mood for live display
        if (today.lastResponse?.emoji) {
            this.setLiveEmoji(today.lastResponse.emoji);
        }
    }
    
    updateTodayStats(stats) {
        // Top mood
        const topMood = document.getElementById('top-mood');
        const topPercent = document.getElementById('top-mood-percent');
        if (topMood) topMood.textContent = stats.mostCommonEmoji || '😐';
        if (topPercent) topPercent.textContent = stats.percentage || 0;
        
        // Total responses
        const total = document.getElementById('total-responses');
        const chartTotal = document.getElementById('chart-total');
        if (total) total.textContent = this.formatNumber(stats.count || 0);
        if (chartTotal) chartTotal.textContent = this.formatNumber(stats.count || 0);
    }
    
    updateYesterdayStats(stats) {
        const mood = document.getElementById('yesterday-mood');
        const count = document.getElementById('yesterday-count');
        if (mood) mood.textContent = stats.mostCommonEmoji || '😐';
        if (count) count.textContent = this.formatNumber(stats.count || 0);
    }
    
    updateHappinessIndex(distribution) {
        // Calculate weighted happiness index (0-100)
        let totalWeight = 0;
        let totalCount = 0;
        
        for (const [emoji, count] of Object.entries(distribution)) {
            if (this.moods[emoji] && count > 0) {
                totalWeight += this.moods[emoji].weight * count;
                totalCount += count;
            }
        }
        
        const index = totalCount > 0 ? Math.round(totalWeight / totalCount) : 50;
        
        const el = document.getElementById('happiness-index');
        if (el) {
            el.textContent = index;
            
            // Update gradient color based on index
            const hue = (index / 100) * 120; // 0 = red, 120 = green
            el.style.background = `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 20}, 70%, 45%))`;
            el.style.webkitBackgroundClip = 'text';
            el.style.webkitTextFillColor = 'transparent';
            el.style.backgroundClip = 'text';
        }
    }
    
    updateViewersCount(count) {
        const el = document.getElementById('viewers-count');
        const pill = document.getElementById('viewers-pill');
        if (el) {
            el.textContent = count > 0 ? count : '—';
        }
        if (pill) {
            pill.classList.toggle('has-viewers', count > 0);
        }
    }
    
    // === Chart ===
    updateChart(distribution) {
        const ctx = document.getElementById('mood-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Prepare data
        const labels = [];
        const data = [];
        const colors = [];
        
        this.moodOrder.forEach(emoji => {
            const count = distribution[emoji] || 0;
            labels.push(emoji);
            data.push(count);
            colors.push(this.moods[emoji].color);
        });
        
        // Destroy old chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Create new chart
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.map(c => c + 'CC'), // 80% opacity
                    borderColor: colors,
                    borderWidth: 3,
                    hoverOffset: 12,
                    hoverBorderWidth: 4,
                    spacing: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 14,
                        cornerRadius: 12,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: (items) => {
                                const emoji = items[0]?.label || '';
                                const mood = this.moods[emoji];
                                return mood ? mood.label[this.lang] : emoji;
                            },
                            label: (item) => {
                                const total = item.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? Math.round((item.raw / total) * 100) : 0;
                                return ` ${item.raw} (${percent}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'nearest',
                    intersect: true
                }
            }
        });
        
        // Update legend
        this.updateChartLegend(distribution);
    }
    
    updateChartLegend(distribution) {
        const legend = document.getElementById('chart-legend');
        if (!legend) return;
        
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        
        legend.innerHTML = this.moodOrder.map(emoji => {
            const count = distribution[emoji] || 0;
            const mood = this.moods[emoji];
            
            return `
                <div class="legend-item" style="--legend-color: ${mood.color}">
                    <span class="legend-dot" style="background: ${mood.color}"></span>
                    <span class="legend-emoji">${emoji}</span>
                    <span class="legend-count">${count}</span>
                </div>
            `;
        }).join('');
    }
    
    // === Live Updates ===
    onNewMood(emoji) {
        // Update live emoji display
        this.setLiveEmoji(emoji);
        
        // Add to live stream
        this.addToLiveStream(emoji);
        
        // Create floating emoji
        this.createFloatingEmoji(emoji);
        
        // Show toast
        this.showToast(emoji);
        
        // Refresh stats with small delay
        setTimeout(() => this.loadStats(), 500);
    }
    
    setLiveEmoji(emoji) {
        const el = document.getElementById('live-emoji');
        if (el) {
            el.innerHTML = `<span class="emoji-pulse">${emoji}</span>`;
        }
    }
    
    addToLiveStream(emoji) {
        const stream = document.getElementById('live-stream');
        if (!stream) return;
        
        // Add new emoji
        const span = document.createElement('span');
        span.className = 'live-stream-emoji';
        span.textContent = emoji;
        stream.insertBefore(span, stream.firstChild);
        
        this.liveStreamEmojis.unshift(span);
        
        // Fade old emojis
        this.liveStreamEmojis.forEach((el, i) => {
            if (i >= 3) el.classList.add('fading');
        });
        
        // Remove excess
        while (this.liveStreamEmojis.length > this.maxLiveEmojis) {
            const old = this.liveStreamEmojis.pop();
            old?.remove();
        }
    }
    
    createFloatingEmoji(emoji) {
        const container = document.getElementById('emoji-float-container');
        if (!container) return;
        
        const el = document.createElement('div');
        el.className = 'floating-emoji';
        el.textContent = emoji;
        el.style.left = `${10 + Math.random() * 80}%`;
        el.style.animationDuration = `${2.5 + Math.random() * 1.5}s`;
        
        container.appendChild(el);
        
        setTimeout(() => el.remove(), 4000);
    }
    
    showToast(emoji) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span class="toast-emoji">${emoji}</span>
            <span class="toast-text">${this.i18n[this.lang].newMood}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // === Helpers ===
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
    
    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.classList.add('hidden');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.moodFlow = new MoodFlow();
});
