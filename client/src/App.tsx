import { Routes, Route } from 'react-router-dom'
import SleepTracker from './components/SleepTracker'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<SleepTracker />} />
      </Routes>
    </div>
  )
}

export default App
