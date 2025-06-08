import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SleepRecord {
  id: number;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SleepTracker() {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/api/sleep');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch sleep records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/sleep', {
        startTime,
        endTime,
        notes,
      });
      setStartTime('');
      setEndTime('');
      setNotes('');
      fetchRecords();
    } catch (error) {
      console.error('Failed to create sleep record:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/sleep/${id}`);
      fetchRecords();
    } catch (error) {
      console.error('Failed to delete sleep record:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">수면 기록</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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
        
        <div>
          <label className="block mb-2">특이사항</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          기록하기
        </button>
      </form>

      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p>시작: {new Date(record.startTime).toLocaleString()}</p>
                <p>종료: {new Date(record.endTime).toLocaleString()}</p>
                {record.notes && <p className="mt-2">특이사항: {record.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(record.id)}
                className="text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 