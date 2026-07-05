import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Order } from '../types';
import { Calendar, TrendingUp, BarChart2, Activity } from 'lucide-react';

Chart.register(...registerables);

interface FinancialChartsProps {
  orders: Order[];
  activeFilterType: string;
  startDate: Date;
  endDate: Date;
}

type ChartViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function FinancialCharts({
  orders,
  activeFilterType,
  startDate,
  endDate
}: FinancialChartsProps) {
  const [viewType, setChartViewType] = useState<ChartViewType>('daily');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Helper: parse date safely
  const parseOrderDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const cleanStr = dateStr.trim();
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      const timeMatch = cleanStr.match(/\s+(\d{2}):(\d{2})/);
      if (timeMatch) {
        return new Date(year, month, day, parseInt(timeMatch[1]), parseInt(timeMatch[2]));
      }
      return new Date(year, month, day, 12, 0, 0);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart to prevent canvas reuse errors
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 1. Prepare Labels and Data based on View Type
    let labels: string[] = [];
    let dataValues: number[] = [];
    let labelText = '';

    const activeOrders = orders.filter(o => o.order_status !== 'Dibatalkan');

    if (viewType === 'daily') {
      labelText = 'Pendapatan Harian (Rp)';
      // If the selected period is short (e.g. today or yesterday), show hourly intervals
      if (activeFilterType === 'hari-ini' || activeFilterType === 'kemarin') {
        labels = ['00:00 - 04:00', '04:00 - 08:00', '08:00 - 12:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'];
        dataValues = [0, 0, 0, 0, 0, 0];
        
        activeOrders.forEach(o => {
          const oDate = parseOrderDate(o.created_at);
          // Check if order date matches active start date
          const dateMatches = oDate.getDate() === startDate.getDate() && 
                              oDate.getMonth() === startDate.getMonth() && 
                              oDate.getFullYear() === startDate.getFullYear();
          if (dateMatches) {
            const hr = oDate.getHours();
            if (hr >= 0 && hr < 4) dataValues[0] += o.grand_total || 0;
            else if (hr >= 4 && hr < 8) dataValues[1] += o.grand_total || 0;
            else if (hr >= 8 && hr < 12) dataValues[2] += o.grand_total || 0;
            else if (hr >= 12 && hr < 16) dataValues[3] += o.grand_total || 0;
            else if (hr >= 16 && hr < 20) dataValues[4] += o.grand_total || 0;
            else dataValues[5] += o.grand_total || 0;
          }
        });
      } else {
        // Show day-by-day for the active range (e.g. last 7 days or current month)
        // Generate list of all dates in the range
        const datesList: Date[] = [];
        const currentTemp = new Date(startDate);
        // Limit to 31 days to avoid overcrowded chart
        let limit = 31;
        while (currentTemp <= endDate && limit > 0) {
          datesList.push(new Date(currentTemp));
          currentTemp.setDate(currentTemp.getDate() + 1);
          limit--;
        }

        labels = datesList.map(d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        dataValues = datesList.map(d => {
          let daySum = 0;
          activeOrders.forEach(o => {
            const oDate = parseOrderDate(o.created_at);
            if (oDate.getDate() === d.getDate() && 
                oDate.getMonth() === d.getMonth() && 
                oDate.getFullYear() === d.getFullYear()) {
              daySum += o.grand_total || 0;
            }
          });
          return daySum;
        });
      }

    } else if (viewType === 'weekly') {
      labelText = 'Pendapatan Mingguan (Rp)';
      // Divide the active range or last 6 weeks into weekly chunks
      labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'];
      dataValues = [0, 0, 0, 0, 0];

      activeOrders.forEach(o => {
        const oDate = parseOrderDate(o.created_at);
        // Basic grouping: based on day of month
        const dayOfMonth = oDate.getDate();
        if (dayOfMonth <= 7) dataValues[0] += o.grand_total || 0;
        else if (dayOfMonth <= 14) dataValues[1] += o.grand_total || 0;
        else if (dayOfMonth <= 21) dataValues[2] += o.grand_total || 0;
        else if (dayOfMonth <= 28) dataValues[3] += o.grand_total || 0;
        else dataValues[4] += o.grand_total || 0;
      });

    } else if (viewType === 'monthly') {
      labelText = 'Pendapatan Bulanan (Rp)';
      // 12 Months of the current year
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      dataValues = Array(12).fill(0);

      activeOrders.forEach(o => {
        const oDate = parseOrderDate(o.created_at);
        // Only include current year orders
        if (oDate.getFullYear() === startDate.getFullYear()) {
          const monthIndex = oDate.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            dataValues[monthIndex] += o.grand_total || 0;
          }
        }
      });

    } else if (viewType === 'yearly') {
      labelText = 'Pendapatan Tahunan (Rp)';
      // Render last 3 years: 2024, 2025, 2026
      labels = ['2024', '2025', '2026'];
      dataValues = [0, 0, 0];

      activeOrders.forEach(o => {
        const oDate = parseOrderDate(o.created_at);
        const yr = oDate.getFullYear();
        if (yr === 2024) dataValues[0] += o.grand_total || 0;
        else if (yr === 2025) dataValues[1] += o.grand_total || 0;
        else if (yr === 2026) dataValues[2] += o.grand_total || 0;
      });
    }

    // 2. Setup Gradient and Chart Settings
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.45)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.00)');

    chartInstanceRef.current = new Chart(ctx, {
      type: viewType === 'weekly' ? 'bar' : 'line',
      data: {
        labels,
        datasets: [{
          label: labelText,
          data: dataValues,
          borderColor: '#7C3AED',
          borderWidth: 3,
          backgroundColor: viewType === 'weekly' ? '#8B5CF6' : gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#FFF',
          pointBorderColor: '#7C3AED',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderRadius: viewType === 'weekly' ? 6 : 0,
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
            backgroundColor: '#1F1147',
            titleColor: '#FFF',
            bodyColor: '#F3F4F6',
            bodyFont: {
              family: 'Inter, sans-serif',
              weight: 'bold',
              size: 11
            },
            padding: 10,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                let value = context.parsed.y || 0;
                return ` Rp ${value.toLocaleString('id-ID')}`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: 'rgba(241, 245, 249, 1)',
            },
            ticks: {
              color: '#94A3B8',
              font: {
                family: 'JetBrains Mono, monospace',
                size: 9
              },
              callback: function(value) {
                if (Number(value) >= 1000000) {
                  return 'Rp ' + (Number(value) / 1000000).toFixed(1) + 'M';
                } else if (Number(value) >= 1000) {
                  return 'Rp ' + (Number(value) / 1000).toFixed(0) + 'K';
                }
                return 'Rp ' + value;
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#94A3B8',
              font: {
                family: 'Inter, sans-serif',
                size: 10,
                weight: 'normal'
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [orders, viewType, activeFilterType, startDate, endDate]);

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-purple-600" />
            Visualisasi Grafis Pendapatan
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Klik pilihan tab di bawah untuk melihat tren pendistribusian dana</p>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
          {[
            { id: 'daily', label: 'Harian' },
            { id: 'weekly', label: 'Mingguan' },
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setChartViewType(tab.id as ChartViewType)}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                viewType === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Plotting Workspace */}
      <div className="relative h-64 w-full bg-slate-50/40 rounded-2xl border border-slate-100 p-3">
        <canvas ref={canvasRef} />
      </div>

      {/* Dynamic Summary Note */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1 font-mono">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          Rentang: {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="text-purple-600 font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
          Sistem Online
        </span>
      </div>
    </div>
  );
}
