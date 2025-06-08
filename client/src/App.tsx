import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Routes, Route } from 'react-router-dom'
import SleepTracker from './components/SleepTracker'

interface Sleep {
  id: string;
  startTime: string;
  endTime: string;
  note?: string;
}

function App() {
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSleeps();
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
      resetForm();
    } catch (error) {
      console.error('수면 기록 저장에 실패했습니다:', error);
      setError(error instanceof Error ? error.message : '수면 기록 저장에 실패했습니다.');
    }
  };

  const handleEdit = (sleep: Sleep) => {
    setStartTime(sleep.startTime);
    setEndTime(sleep.endTime);
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
