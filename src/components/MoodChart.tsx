import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

interface MoodChartProps {
  distribution: Record<string, number>;
}

const COLORS = {
  '😀': '#4ade80', // green-400
  '🙂': '#60a5fa', // blue-400
  '😐': '#9ca3af', // gray-400
  '🙁': '#fbbf24', // amber-400
  '😢': '#f87171', // red-400
};

export function MoodChart({ distribution }: MoodChartProps) {
  const { t } = useLanguage();
  const data = Object.entries(distribution)
    .map(([emoji, count]) => ({ name: emoji, value: count }))
    .filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground glass-card rounded-2xl">
        <span className="text-4xl mb-2">😴</span>
        <p>{t('noData')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-2xl p-6 h-full flex flex-col"
    >
      <h3 className="text-lg font-bold font-display mb-6">{t('moodMix')}</h3>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} 
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(20, 20, 25, 0.9)', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'var(--font-sans)'
              }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-4 mt-4 flex-wrap">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="text-xl">{entry.name}</span>
            <span className="text-sm font-medium text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
