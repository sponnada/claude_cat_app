import { useState, useEffect } from 'react'
import './App.css'

const DEFAULT_TASKS = [
  { id: 'breakfast', name: 'Breakfast', emoji: '🍳', reminderTime: '08:00', category: 'feeding' },
  { id: 'snacks', name: 'Snacks', emoji: '🐟', reminderTime: '14:00', category: 'feeding' },
  { id: 'dinner', name: 'Dinner', emoji: '🍖', reminderTime: '18:00', category: 'feeding' },
  { id: 'omega3', name: 'Omega 3 Supplement', emoji: '💊', reminderTime: '09:00', category: 'health' },
  { id: 'brush-hair', name: 'Brush Hair', emoji: '✨', reminderTime: '10:00', category: 'grooming' },
  { id: 'brush-teeth', name: 'Brush Teeth', emoji: '🦷', reminderTime: '20:00', category: 'grooming' },
  { id: 'exercise', name: 'Exercise (1 hour)', emoji: '🏃', reminderTime: '16:00', category: 'activity' },
]

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('lunaTasks')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date === getToday()) {
        return parsed.tasks
      }
    }
    return DEFAULT_TASKS.map(t => ({ ...t, completed: false, completedAt: null }))
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true'
  })

  const [reminderTimes, setReminderTimes] = useState(() => {
    const saved = localStorage.getItem('reminderTimes')
    if (saved) {
      return JSON.parse(saved)
    }
    return DEFAULT_TASKS.reduce((acc, task) => {
      acc[task.id] = task.reminderTime
      return acc
    }, {})
  })

  useEffect(() => {
    localStorage.setItem('lunaTasks', JSON.stringify({
      date: getToday(),
      tasks: tasks
    }))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('reminderTimes', JSON.stringify(reminderTimes))
  }, [reminderTimes])

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled)
  }, [notificationsEnabled])

  useEffect(() => {
    if (!notificationsEnabled) return

    const checkReminders = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      tasks.forEach(task => {
        if (!task.completed && reminderTimes[task.id] === currentTime) {
          sendNotification(task)
        }
      })
    }

    const interval = setInterval(checkReminders, 60000)
    checkReminders()

    return () => clearInterval(interval)
  }, [tasks, notificationsEnabled, reminderTimes])

  const sendNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Luna needs: ${task.name}! ${task.emoji}`, {
        body: `Don't forget to ${task.name.toLowerCase()} for Luna!`,
        icon: '/cat-icon.png',
        tag: task.id,
        requireInteraction: true
      })
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        new Notification('Notifications enabled! 🐱', {
          body: "You'll be reminded to take care of Luna!"
        })
      }
    }
  }

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : null
        }
      }
      return task
    }))
  }

  const updateReminderTime = (taskId, time) => {
    setReminderTimes(prev => ({
      ...prev,
      [taskId]: time
    }))
  }

  const resetDay = () => {
    setTasks(DEFAULT_TASKS.map(t => ({ ...t, completed: false, completedAt: null })))
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progress = (completedCount / tasks.length) * 100

  const categories = {
    feeding: { name: 'Feeding', color: '#ff9f43' },
    health: { name: 'Health', color: '#ee5a5a' },
    grooming: { name: 'Grooming', color: '#5f9ea0' },
    activity: { name: 'Activity', color: '#9b59b6' }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🐱 Luna's Care Tracker</h1>
        <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-text">
          {completedCount} of {tasks.length} tasks completed
          {completedCount === tasks.length && ' 🎉'}
        </p>
      </div>

      <div className="notification-section">
        {!notificationsEnabled ? (
          <button className="notification-btn" onClick={requestNotificationPermission}>
            🔔 Enable Reminders
          </button>
        ) : (
          <p className="notifications-active">🔔 Reminders are active</p>
        )}
      </div>

      <div className="tasks-container">
        {Object.entries(categories).map(([catKey, catInfo]) => {
          const categoryTasks = tasks.filter(t => t.category === catKey)
          if (categoryTasks.length === 0) return null

          return (
            <div key={catKey} className="category-section">
              <h2 className="category-title" style={{ borderColor: catInfo.color }}>
                {catInfo.name}
              </h2>
              {categoryTasks.map(task => (
                <div
                  key={task.id}
                  className={`task-card ${task.completed ? 'completed' : ''}`}
                  style={{ '--category-color': catInfo.color }}
                >
                  <label className="task-label">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="task-checkbox"
                    />
                    <span className="task-emoji">{task.emoji}</span>
                    <span className="task-name">{task.name}</span>
                  </label>
                  <div className="task-reminder">
                    <label className="reminder-label">
                      ⏰
                      <input
                        type="time"
                        value={reminderTimes[task.id]}
                        onChange={(e) => updateReminderTime(task.id, e.target.value)}
                        className="reminder-input"
                      />
                    </label>
                  </div>
                  {task.completed && task.completedAt && (
                    <span className="completed-time">
                      ✓ {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <button className="reset-btn" onClick={resetDay}>
        Reset Day
      </button>

      <footer className="footer">
        <p>Made with ❤️ for Luna</p>
      </footer>
    </div>
  )
}

export default App
