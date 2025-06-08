import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'chartjs-adapter-date-fns';
import { Routes, Route } from 'react-router-dom'
import SleepTracker from './components/SleepTracker'
import { Bar, Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  TimeScale,
  ScatterController,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  TimeScale,
  ScatterController
);

interface Sleep {
  id: string;
  startTime: string;
  endTime: string;
  note?: string;
}

interface SleepStat {
  date: string;
  averageDuration: number;
  sleepCount: number;
}

interface WeeklySleepStat {
  week: string;
  totalDuration: number;
}

interface HourDistributionStat {
  hour: string;
  starts: number;
  ends: number;
}

function App() {
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sleepStats, setSleepStats] = useState<SleepStat[]>([]);
  const [weeklySleepStats, setWeeklySleepStats] = useState<WeeklySleepStat[]>([]);
  const [hourDistributionStats, setHourDistributionStats] = useState<HourDistributionStat[]>([]);

  useEffect(() => {
    fetchSleeps();
    fetchSleepStats();
    fetchWeeklySleepStats();
    fetchHourDistributionStats();
  }, []);

  const fetchSleeps = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sleep');
      const data = await response.json();
      setSleeps(data);
    } catch (error) {
      console.error('수면 기록을 불러오는데 실패했습니다:', error);
    }
  };

  const fetchSleepStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sleep/stats');
      const data = await response.json();
      setSleepStats(data);
    } catch (error) {
      console.error('수면 통계를 불러오는데 실패했습니다:', error);
    }
  };

  const fetchWeeklySleepStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sleep/stats/weekly-duration');
      const data = await response.json();
      setWeeklySleepStats(data);
    } catch (error) {
      console.error('주별 수면 통계를 불러오는데 실패했습니다:', error);
    }
  };

  const fetchHourDistributionStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sleep/stats/hour-distribution');
      const data = await response.json();
      setHourDistributionStats(data);
    } catch (error) {
      console.error('수면 시간대별 분포를 불러오는데 실패했습니다:', error);
    }
  };

  const validateTimes = () => {
    if (new Date(startTime) >= new Date(endTime)) {
      setError('수면 시작 시간은 종료 시간보다 이전이어야 합니다.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTimes()) return;

    try {
      const url = editingId 
        ? `http://localhost:8000/api/sleep/${editingId}`
        : 'http://localhost:8000/api/sleep';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startTime, endTime, note }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '수면 기록 저장에 실패했습니다.');
      }

      await fetchSleeps();
      await fetchSleepStats();
      await fetchWeeklySleepStats();
      await fetchHourDistributionStats();
      resetForm();
    } catch (error) {
      console.error('수면 기록 저장에 실패했습니다:', error);
      setError(error instanceof Error ? error.message : '수면 기록 저장에 실패했습니다.');
    }
  };

  const handleEdit = (sleep: Sleep) => {
    const formattedStartTime = new Date(sleep.startTime).toISOString().slice(0, 16);
    const formattedEndTime = new Date(sleep.endTime).toISOString().slice(0, 16);
    setStartTime(formattedStartTime);
    setEndTime(formattedEndTime);
    setNote(sleep.note || '');
    setEditingId(sleep.id);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/sleep/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('수면 기록 삭제에 실패했습니다.');
      }

      await fetchSleeps();
      await fetchSleepStats();
      await fetchWeeklySleepStats();
      await fetchHourDistributionStats();
    } catch (error) {
      console.error('수면 기록 삭제에 실패했습니다:', error);
    }
  };

  const resetForm = () => {
    setStartTime('');
    setEndTime('');
    setNote('');
    setEditingId(null);
    setError('');
  };

  const averageDurationData = {
    labels: sleepStats.map(stat => format(new Date(stat.date), 'MM/dd', { locale: ko })),
    datasets: [
      {
        label: '평균 수면 시간 (시간)',
        data: sleepStats.map(stat => stat.averageDuration.toFixed(2)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const sleepCountData = {
    labels: sleepStats.map(stat => format(new Date(stat.date), 'MM/dd', { locale: ko })),
    datasets: [
      {
        label: '수면 기록 횟수',
        data: sleepStats.map(stat => stat.sleepCount),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '주간 수면 통계',
      },
    },
  };

  const sleepCountChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '주간 수면 통계',
      },
    },
    scales: {
      y: {
        ticks: {
          stepSize: 1,
          callback: function(value: string | number) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null;
          },
        },
      },
    },
  };

  const scatterData = {
    datasets: [
      {
        label: '수면 시작 시간',
        data: sleeps.map(s => ({
          x: new Date(s.startTime).setHours(0, 0, 0, 0),
          y: new Date(s.startTime).getHours() + new Date(s.startTime).getMinutes() / 60,
          id: s.id,
          note: s.note,
        })),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 5,
      },
      {
        label: '수면 종료 시간',
        data: sleeps.map(s => ({
          x: new Date(s.endTime).setHours(0, 0, 0, 0),
          y: new Date(s.endTime).getHours() + new Date(s.endTime).getMinutes() / 60,
          id: s.id,
          note: s.note,
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5,
      },
    ],
  };

  const scatterChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '수면 시간 변동성',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const date = new Date(context.parsed.x);
            const time = context.parsed.y;
            const hours = Math.floor(time);
            const minutes = Math.round((time - hours) * 60);
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            return `${label}: ${format(date, 'yyyy-MM-dd', { locale: ko })} ${formattedTime}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd',
          displayFormats: {
            day: 'MM/dd'
          },
        } as const,
        title: {
          display: true,
          text: '날짜',
        },
      },
      y: {
        type: 'linear' as const,
        min: 0,
        max: 24,
        ticks: {
          callback: function(value: string | number) {
            const hours = Number(value);
            return `${String(hours).padStart(2, '0')}:00`;
          },
        },
        title: {
          display: true,
          text: '시간 (시)',
        },
      },
    },
  };

  const weeklyDurationData = {
    labels: weeklySleepStats.map(stat => format(new Date(stat.week), 'MM/dd', { locale: ko })),
    datasets: [
      {
        label: '주간 총 수면 시간 (시간)',
        data: weeklySleepStats.map(stat => stat.totalDuration.toFixed(2)),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const weeklyDurationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '주간 총 수면 시간 추이',
      },
    },
    scales: {
      y: {
        ticks: {
          stepSize: 1,
          callback: function(value: string | number) {
            return value + '시간';
          },
        },
        title: {
          display: true,
          text: '총 수면 시간 (시간)',
        },
      },
    },
  };

  const hourDistributionData = {
    labels: hourDistributionStats.map(stat => `${stat.hour}:00`),
    datasets: [
      {
        label: '수면 시작 횟수',
        data: hourDistributionStats.map(stat => stat.starts),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: '수면 종료 횟수',
        data: hourDistributionStats.map(stat => stat.ends),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const hourDistributionChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '수면 시작/종료 시간대별 분포',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '시간대',
        },
      },
      y: {
        ticks: {
          stepSize: 1,
          callback: function(value: string | number) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null;
          },
        },
        title: {
          display: true,
          text: '횟수',
        },
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">수면 기록</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-2">수면 시작 시간</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">수면 종료 시간</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block mb-2">특이사항</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingId ? '수정하기' : '기록하기'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              취소
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-bold mb-4">수면 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded shadow">
          <Bar data={averageDurationData} options={chartOptions} />
        </div>
        <div className="p-4 border rounded shadow">
          <Line data={sleepCountData} options={sleepCountChartOptions} />
        </div>
        <div className="p-4 border rounded shadow">
          <Scatter data={scatterData} options={scatterChartOptions} />
        </div>
        <div className="p-4 border rounded shadow">
          <Bar data={weeklyDurationData} options={weeklyDurationChartOptions} />
        </div>
        <div className="p-4 border rounded shadow">
          <Bar data={hourDistributionData} options={hourDistributionChartOptions} />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">수면 기록 목록</h2>
      <div className="space-y-4">
        {sleeps.map((sleep) => (
          <div key={sleep.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">
                  {format(new Date(sleep.startTime), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })} ~{' '}
                  {format(new Date(sleep.endTime), 'HH:mm', { locale: ko })}
                </p>
                {sleep.note && <p className="mt-2 text-gray-600">{sleep.note}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(sleep)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(sleep.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App
