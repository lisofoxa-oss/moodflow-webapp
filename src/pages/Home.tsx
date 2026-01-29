import { useStats } from "@/hooks/use-stats";
import { useWebSocket } from "@/hooks/use-websocket";
import { StatsCard } from "@/components/StatsCard";
import { MoodChart } from "@/components/MoodChart";
import { EmojiRain } from "@/components/EmojiRain";
import { Loader2, Users, Activity, TrendingUp, CalendarDays, Languages } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats, isLoading, error } = useStats();
  const { viewersCount, lastMood } = useWebSocket();
  const { t, language, setLanguage } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full glass-card p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">{t('errorTitle')}</h2>
          <p className="text-muted-foreground">{t('errorDesc')}</p>
        </div>
      </div>
    );
  }

  const { today, yesterday } = stats;

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Background Effects */}
      <EmojiRain emoji={lastMood?.emoji ?? null} triggerId={lastMood?.id ?? null} />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div className="flex justify-between items-center w-full md:w-auto gap-4">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
            >
              {t('title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              {t('subtitle')}
            </motion.p>
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
              className="rounded-full bg-white/5 border border-white/10"
            >
              <span className="text-xs font-bold uppercase">{language === 'en' ? 'RU' : 'EN'}</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border-primary/20 bg-primary/10"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="font-mono font-medium text-primary-foreground">
              {viewersCount} {t('watching')}
            </span>
          </motion.div>

          <div className="hidden md:block">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
              className="rounded-full flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              <span className="font-bold uppercase">{language === 'en' ? 'Русский' : 'English'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          titleKey="mostCommonMood" 
          value={today.mostCommonEmoji}
          subtitle={`${today.percentage}% ${t('percentageSubtitle')}`}
          icon={<TrendingUp className="w-12 h-12" />}
          delay={0.1}
          className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20"
        />
        
        <StatsCard 
          titleKey="totalResponses" 
          value={today.count}
          subtitleKey="collectedToday"
          icon={<Users className="w-12 h-12" />}
          delay={0.2}
        />
        
        <StatsCard 
          titleKey="yesterdayTop" 
          value={yesterday.mostCommonEmoji}
          subtitle={`${yesterday.count} ${t('yesterdayResponses')}`}
          icon={<CalendarDays className="w-12 h-12" />}
          delay={0.3}
        />

        <StatsCard 
          titleKey="livePulse" 
          value={lastMood?.emoji || today.lastResponse?.emoji || "..."}
          subtitleKey="latestMood"
          icon={<Activity className="w-12 h-12" />}
          delay={0.4}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
        />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[400px]">
        {/* Large Chart Section */}
        <div className="lg:col-span-2 h-full">
          <MoodChart distribution={today.distribution} />
        </div>

        {/* Info / Comparison Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card rounded-2xl p-8 flex flex-col justify-center space-y-6"
        >
          <div>
            <h3 className="text-xl font-bold font-display mb-2">{t('howItWorks')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('howItWorksDesc')}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('todayVsYesterday')}</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm">{t('volume')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">{today.count}</span>
                  {today.count > yesterday.count ? (
                    <span className="text-green-400 text-xs">▲</span>
                  ) : (
                    <span className="text-red-400 text-xs">▼</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-sm">{t('dominantMood')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{today.mostCommonEmoji}</span>
                  <span className="text-xs text-muted-foreground">vs {yesterday.mostCommonEmoji}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-auto">
             <a 
               href="https://t.me/MoodFlowStatsBot" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
             >
               {t('openInTelegram')}
             </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
