import { useState, useEffect } from 'react'
import './App.css'

const DEFAULT_TASKS = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    emoji: '🍳',
    reminderTime: '08:00',
    category: 'feeding',
    importance: 'critical',
    impact: {
      missed: 'Luna will be hungry and may become lethargic. Cats need regular meals to maintain blood sugar levels.',
      consequence: 'Low energy, potential digestive issues',
      healthScore: -15
    }
  },
  {
    id: 'snacks',
    name: 'Snacks',
    emoji: '🐟',
    reminderTime: '14:00',
    category: 'feeding',
    importance: 'moderate',
    impact: {
      missed: 'Luna may get hungry between meals. Healthy snacks help maintain energy throughout the day.',
      consequence: 'Slight hunger, may beg for food',
      healthScore: -5
    }
  },
  {
    id: 'dinner',
    name: 'Dinner',
    emoji: '🍖',
    reminderTime: '18:00',
    category: 'feeding',
    importance: 'critical',
    impact: {
      missed: 'Luna will go to bed hungry. This can cause overnight restlessness and morning nausea.',
      consequence: 'Hunger, restless sleep, morning vomiting risk',
      healthScore: -15
    }
  },
  {
    id: 'omega3',
    name: 'Omega 3 Supplement',
    emoji: '💊',
    reminderTime: '09:00',
    category: 'health',
    importance: 'moderate',
    impact: {
      missed: 'One day won\'t hurt, but consistent misses affect Luna\'s coat shine, joint health, and cognitive function.',
      consequence: 'Long-term: dull coat, joint stiffness',
      healthScore: -8
    }
  },
  {
    id: 'brush-hair',
    name: 'Brush Hair',
    emoji: '✨',
    reminderTime: '10:00',
    category: 'grooming',
    importance: 'moderate',
    impact: {
      missed: 'Luna may develop mats and hairballs. Regular brushing prevents hairball vomiting and keeps her coat healthy.',
      consequence: 'Hairballs, matted fur, skin irritation',
      healthScore: -7
    }
  },
  {
    id: 'brush-teeth',
    name: 'Brush Teeth',
    emoji: '🦷',
    reminderTime: '20:00',
    category: 'grooming',
    importance: 'high',
    impact: {
      missed: 'Plaque builds up daily. Dental disease is painful and can lead to serious infections affecting heart and kidneys.',
      consequence: 'Bad breath, gum disease, tooth decay',
      healthScore: -10
    }
  },
  {
    id: 'exercise',
    name: 'Exercise (1 hour)',
    emoji: '🏃',
    reminderTime: '16:00',
    category: 'activity',
    importance: 'high',
    impact: {
      missed: 'Luna needs physical and mental stimulation. Lack of exercise leads to weight gain, boredom, and behavioral issues.',
      consequence: 'Weight gain, anxiety, destructive behavior',
      healthScore: -12
    }
  },
]

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
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

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('lunaHistory')
    return saved ? JSON.parse(saved) : {}
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

  const [showImpact, setShowImpact] = useState(null)
  const [activeTab, setActiveTab] = useState('today')

  // Save previous day's data when date changes
  useEffect(() => {
    const saved = localStorage.getItem('lunaTasks')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.date && parsed.date !== getToday()) {
        // Save yesterday's data to history
        setHistory(prev => {
          const updated = { ...prev, [parsed.date]: parsed.tasks }
          localStorage.setItem('lunaHistory', JSON.stringify(updated))
          return updated
        })
      }
    }
  }, [])

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

  // Calculate streaks for each task
  const calculateStreak = (taskId) => {
    let streak = 0
    const sortedDates = Object.keys(history).sort().reverse()

    for (const date of sortedDates) {
      const dayTasks = history[date]
      const task = dayTasks.find(t => t.id === taskId)
      if (task && task.completed) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  // Calculate Luna's wellbeing score
  const calculateWellbeing = () => {
    let score = 100
    const last7Days = Object.keys(history)
      .sort()
      .reverse()
      .slice(0, 7)

    last7Days.forEach(date => {
      const dayTasks = history[date]
      dayTasks.forEach(task => {
        if (!task.completed) {
          const defaultTask = DEFAULT_TASKS.find(t => t.id === task.id)
          if (defaultTask) {
            score += defaultTask.impact.healthScore
          }
        }
      })
    })

    // Also factor in today's incomplete tasks
    tasks.forEach(task => {
      if (!task.completed) {
        const now = new Date()
        const [hours, minutes] = reminderTimes[task.id].split(':').map(Number)
        const reminderDate = new Date()
        reminderDate.setHours(hours, minutes, 0, 0)

        // If reminder time has passed and task not done
        if (now > reminderDate) {
          score += task.impact.healthScore / 2 // Half impact since day isn't over
        }
      }
    })

    return Math.max(0, Math.min(100, score))
  }

  // Get missed tasks from recent history
  const getRecentMissedTasks = () => {
    const missed = []
    const last7Days = Object.keys(history)
      .sort()
      .reverse()
      .slice(0, 7)

    last7Days.forEach(date => {
      const dayTasks = history[date]
      dayTasks.forEach(task => {
        if (!task.completed) {
          missed.push({ ...task, date })
        }
      })
    })

    return missed
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progress = (completedCount / tasks.length) * 100
  const wellbeingScore = calculateWellbeing()
  const recentMissed = getRecentMissedTasks()

  const categories = {
    feeding: { name: 'Feeding', color: '#ff9f43' },
    health: { name: 'Health', color: '#ee5a5a' },
    grooming: { name: 'Grooming', color: '#5f9ea0' },
    activity: { name: 'Activity', color: '#9b59b6' }
  }

  const getWellbeingEmoji = (score) => {
    if (score >= 90) return '😸'
    if (score >= 70) return '🙂'
    if (score >= 50) return '😿'
    return '🙀'
  }

  const getWellbeingStatus = (score) => {
    if (score >= 90) return { text: 'Thriving!', color: '#00b894' }
    if (score >= 70) return { text: 'Doing well', color: '#74b9ff' }
    if (score >= 50) return { text: 'Needs attention', color: '#fdcb6e' }
    return { text: 'Urgent care needed!', color: '#e17055' }
  }

  const getLunaPhoto = (score) => {
    if (score >= 70) return '/luna-happy.jpg'
    if (score >= 50) return '/luna-okay.jpg'
    return '/luna-sad.jpg'
  }

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical': return '#e74c3c'
      case 'high': return '#e67e22'
      case 'moderate': return '#f1c40f'
      default: return '#95a5a6'
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🐱 Luna's Care Tracker</h1>
        <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      {/* Luna's Wellbeing Dashboard */}
      <div className="wellbeing-dashboard">
        <div className="luna-photo-container">
          <img
            src={getLunaPhoto(wellbeingScore)}
            alt="Luna"
            className="luna-photo"
          />
          <div className="luna-mood-badge" style={{ background: getWellbeingStatus(wellbeingScore).color }}>
            {getWellbeingEmoji(wellbeingScore)}
          </div>
        </div>
        <div className="wellbeing-info">
          <div className="wellbeing-score">
            <div className="wellbeing-number">{Math.round(wellbeingScore)}%</div>
            <div className="wellbeing-label" style={{ color: getWellbeingStatus(wellbeingScore).color }}>
              {getWellbeingStatus(wellbeingScore).text}
            </div>
          </div>
          <div className="wellbeing-bar">
            <div
              className="wellbeing-fill"
              style={{
                width: `${wellbeingScore}%`,
                background: getWellbeingStatus(wellbeingScore).color
              }}
            />
          </div>
          <p className="wellbeing-subtitle">Luna's Wellbeing (based on last 7 days)</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today's Tasks
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History & Missed
        </button>
      </div>

      {activeTab === 'today' && (
        <>
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
                  {categoryTasks.map(task => {
                    const streak = calculateStreak(task.id)
                    return (
                      <div
                        key={task.id}
                        className={`task-card ${task.completed ? 'completed' : ''}`}
                        style={{ '--category-color': catInfo.color }}
                      >
                        <div className="task-main">
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
                          <span
                            className="importance-badge"
                            style={{ background: getImportanceColor(task.importance) }}
                          >
                            {task.importance}
                          </span>
                        </div>

                        <div className="task-meta">
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
                          {streak > 0 && (
                            <span className="streak-badge">🔥 {streak} day streak</span>
                          )}
                          {task.completed && task.completedAt && (
                            <span className="completed-time">
                              ✓ {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <button
                          className="impact-toggle"
                          onClick={() => setShowImpact(showImpact === task.id ? null : task.id)}
                        >
                          {showImpact === task.id ? 'Hide impact' : 'What if I miss this?'}
                        </button>

                        {showImpact === task.id && (
                          <div className="impact-panel">
                            <div className="impact-warning">
                              <strong>⚠️ Impact on Luna:</strong>
                              <p>{task.impact.missed}</p>
                            </div>
                            <div className="impact-consequence">
                              <strong>Consequences:</strong> {task.impact.consequence}
                            </div>
                            <div className="impact-score">
                              Wellbeing impact: <span className="negative">{task.impact.healthScore} points</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <button className="reset-btn" onClick={resetDay}>
            Reset Day
          </button>
        </>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <h2 className="section-title">📅 Recent Missed Tasks</h2>

          {recentMissed.length === 0 ? (
            <div className="no-missed">
              <span className="no-missed-emoji">🌟</span>
              <p>Amazing! No missed tasks in the last 7 days!</p>
              <p className="no-missed-subtitle">Luna is getting the best care!</p>
            </div>
          ) : (
            <div className="missed-list">
              {recentMissed.map((task, index) => (
                <div key={`${task.date}-${task.id}-${index}`} className="missed-card">
                  <div className="missed-header">
                    <span className="missed-emoji">{task.emoji}</span>
                    <span className="missed-name">{task.name}</span>
                    <span className="missed-date">
                      {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="missed-impact">
                    <span className="impact-icon">⚠️</span>
                    {DEFAULT_TASKS.find(t => t.id === task.id)?.impact.consequence}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="section-title">📊 Task Streaks</h2>
          <div className="streaks-grid">
            {DEFAULT_TASKS.map(task => {
              const streak = calculateStreak(task.id)
              return (
                <div key={task.id} className="streak-card">
                  <span className="streak-emoji">{task.emoji}</span>
                  <span className="streak-name">{task.name}</span>
                  <span className={`streak-count ${streak > 0 ? 'active' : ''}`}>
                    {streak > 0 ? `🔥 ${streak} days` : 'No streak'}
                  </span>
                </div>
              )
            })}
          </div>

          <h2 className="section-title">📆 Daily History</h2>
          <div className="history-calendar">
            {Object.keys(history).length === 0 ? (
              <p className="no-history">No history yet. Complete today's tasks to start tracking!</p>
            ) : (
              Object.entries(history)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 14)
                .map(([date, dayTasks]) => {
                  const completed = dayTasks.filter(t => t.completed).length
                  const total = dayTasks.length
                  const percentage = (completed / total) * 100
                  return (
                    <div key={date} className="history-day">
                      <div className="history-date">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="history-bar">
                        <div
                          className="history-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="history-stats">
                        {completed}/{total} {percentage === 100 && '⭐'}
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Made with ❤️ for Luna</p>
      </footer>
    </div>
  )
}

export default App
