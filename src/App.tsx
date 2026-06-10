import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JobList from './pages/JobList'
import CreateJob from './pages/CreateJob'
import DeadLetterQueue from './pages/DeadLetterQueue'

function Nav() {
  return (
    <nav className="border-b bg-white px-6 py-3 flex gap-6 text-sm">
      <Link to="/" className="font-semibold text-blue-600 hover:underline">Dashboard</Link>
      <Link to="/jobs" className="font-semibold text-blue-600 hover:underline">Jobs</Link>
      <Link to="/dlq" className="font-semibold text-blue-600 hover:underline">DLQ</Link>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/create" element={<CreateJob />} />
        <Route path="/dlq" element={<DeadLetterQueue />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
