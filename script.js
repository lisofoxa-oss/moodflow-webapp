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
                shareText: '🌍 Присоединяйся к MoodFlow! Отслеживай настроение мира в реальном времени и делись своим каждый день!',
                people: 'чел.'
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
                shareText: '🌍 Join MoodFlow! Track the world\'s mood in real-time and share yours every day!',
                people: 'people'
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
        this.hoveredSegment = null;
        
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
        this.setupChartInteraction();
        
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
    
    // === Chart Interaction (Emoji cursor + popup) ===
    setupChartInteraction() {
        const canvas = document.getElementById('mood-chart');
        if (!canvas) return;
        
        // Create emoji popup element
        this.emojiPopup = document.createElement('div');
        this.emojiPopup.className = 'emoji-popup';
        this.emojiPopup.style.cssText = `
            position: fixed;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s, transform 0.2s;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            box-shadow: var(--shadow-md);
            transform: translateY(10px);
        `;
        document.body.appendChild(this.emojiPopup);
        
        // Create custom cursor element
        this.emojiCursor = document.createElement('div');
        this.emojiCursor.className = 'emoji-cursor';
        this.emojiCursor.style.cssText = `
            position: fixed;
            pointer-events: none;
            font-size: 32px;
            opacity: 0;
            transition: opacity 0.15s;
            z-index: 9999;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            transform: translate(-50%, -50%);
        `;
        document.body.appendChild(this.emojiCursor);
        
        // Track mouse/touch on canvas
        canvas.addEventListener('mousemove', (e) => this.handleChartHover(e));
        canvas.addEventListener('mouseleave', () => this.hideEmojiCursor());
        canvas.addEventListener('click', (e) => this.handleChartClick(e));
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleChartClick({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
    }
    
    handleChartHover(e) {
        if (!this.chart) return;
        
        const points = this.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
        
        if (points.length > 0) {
            const index = points[0].index;
            const emoji = this.moodOrder[index];
            
            // Show emoji cursor
            this.emojiCursor.textContent = emoji;
            this.emojiCursor.style.opacity = '1';
            this.emojiCursor.style.left = `${e.clientX}px`;
            this.emojiCursor.style.top = `${e.clientY - 40}px`;
            
            // Hide default cursor on canvas
            e.target.style.cursor = 'none';
            
            this.hoveredSegment = { index, emoji };
        } else {
            this.hideEmojiCursor();
            e.target.style.cursor = 'pointer';
            this.hoveredSegment = null;
        }
    }
    
    hideEmojiCursor() {
        this.emojiCursor.style.opacity = '0';
    }
    
    handleChartClick(e) {
        if (!this.chart || !this.lastDistribution) return;
        
        const canvas = document.getElementById('mood-chart');
        const rect = canvas.getBoundingClientRect();
        
        // Get click position relative to canvas
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check which segment was clicked
        const points = this.chart.getElementsAtEventForMode(
            { native: { clientX: e.clientX, clientY: e.clientY }, x, y },
            'nearest',
            { intersect: true },
            false
        );
        
        if (points.length > 0) {
            const index = points[0].index;
            const emoji = this.moodOrder[index];
            const count = this.lastDistribution[emoji] || 0;
            const total = Object.values(this.lastDistribution).reduce((a, b) => a + b, 0);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const mood = this.moods[emoji];
            
            // Show popup
            this.showEmojiPopup(e.clientX, e.clientY, {
                emoji,
                label: mood.label[this.lang],
                count,
                percent,
                color: mood.color
            });
        }
    }
    
    showEmojiPopup(x, y, data) {
        const t = this.i18n[this.lang];
        
        this.emojiPopup.innerHTML = `
            <div style="font-size: 48px; line-height: 1;">${data.emoji}</div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${data.label}</div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 20px; font-weight: 800; color: ${data.color};">${data.percent}%</span>
                <span style="font-size: 12px; color: var(--text-muted);">${data.count} ${t.people}</span>
            </div>
        `;
        
        // Position popup
        const popupRect = this.emojiPopup.getBoundingClientRect();
        let left = x - 60;
        let top = y - 120;
        
        // Keep popup in viewport
        if (left < 10) left = 10;
        if (left + 120 > window.innerWidth) left = window.innerWidth - 130;
        if (top < 10) top = y + 20;
        
        this.emojiPopup.style.left = `${left}px`;
        this.emojiPopup.style.top = `${top}px`;
        this.emojiPopup.style.opacity = '1';
        this.emojiPopup.style.transform = 'translateY(0)';
        
        // Auto-hide after 2.5s
        clearTimeout(this.popupTimeout);
        this.popupTimeout = setTimeout(() => {
            this.hideEmojiPopup();
        }, 2500);
    }
    
    hideEmojiPopup() {
        this.emojiPopup.style.opacity = '0';
        this.emojiPopup.style.transform = 'translateY(10px)';
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
            
            // Update viewers from API response too
            if (data.viewers !== undefined) {
                this.updateViewersCount(data.viewers);
            }
            
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
        
        this.updateTodayStats(today);
        this.updateYesterdayStats(yesterday);
        
        if (today.distribution) {
            this.updateChart(today.distribution);
            this.lastDistribution = today.distribution;
            this.updateHappinessIndex(today.distribution);
        }
        
        if (today.lastResponse?.emoji) {
            this.setLiveEmoji(today.lastResponse.emoji);
        }
    }
    
    updateTodayStats(stats) {
        const topMood = document.getElementById('top-mood');
        const topPercent = document.getElementById('top-mood-percent');
        if (topMood) topMood.textContent = stats.mostCommonEmoji || '😐';
        if (topPercent) topPercent.textContent = stats.percentage || 0;
        
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
            
            const hue = (index / 100) * 120;
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
        
        const labels = [];
        const data = [];
        const colors = [];
        
        this.moodOrder.forEach(emoji => {
            const count = distribution[emoji] || 0;
            labels.push(emoji);
            data.push(count);
            colors.push(this.moods[emoji].color);
        });
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.map(c => c + 'CC'),
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
                    tooltip: { enabled: false } // Отключаем стандартный tooltip
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
                },
                onHover: (event, elements) => {
                    const canvas = event.native?.target;
                    if (canvas) {
                        canvas.style.cursor = elements.length > 0 ? 'none' : 'pointer';
                    }
                }
            }
        });
        
        this.updateChartLegend(distribution);
    }
    
    updateChartLegend(distribution) {
        const legend = document.getElementById('chart-legend');
        if (!legend) return;
        
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
        this.setLiveEmoji(emoji);
        this.addToLiveStream(emoji);
        this.createFloatingEmoji(emoji);
        this.showToast(emoji);
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
        
        const span = document.createElement('span');
        span.className = 'live-stream-emoji';
        span.textContent = emoji;
        stream.insertBefore(span, stream.firstChild);
        
        this.liveStreamEmojis.unshift(span);
        
        this.liveStreamEmojis.forEach((el, i) => {
            if (i >= 3) el.classList.add('fading');
        });
        
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
