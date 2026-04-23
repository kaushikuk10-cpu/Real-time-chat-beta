import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Chat({ token, username, onLogout }) {
    const [rooms, setRooms] = useState([])
    const [currentRoom, setCurrentRoom] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [newRoomName, setNewRoomName] = useState('')
    const [onlineCount, setOnlineCount] = useState(0)
    const ws = useRef(null)
    const messagesEnd = useRef(null)

    const headers = { Authorization: `Bearer ${token}` }

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (!currentRoom) return
        fetchMessages(currentRoom.id)
        connectWebSocket(currentRoom.id)
        return () => ws.current?.close()
    }, [currentRoom])

    const fetchRooms = async () => {
        const res = await axios.get(`${API}/api/rooms/`, { headers })
        setRooms(res.data)
    }

    const fetchMessages = async (roomId) => {
        const res = await axios.get(`${API}/api/rooms/${roomId}/messages`, { headers })
        setMessages(res.data)
    }

    const connectWebSocket = (roomId) => {
        if (ws.current) ws.current.close()
        ws.current = new WebSocket(`ws://localhost:8000/api/ws/${roomId}/${username}`)
        ws.current.onopen = () => setOnlineCount(c => c + 1)
        ws.current.onmessage = (e) => {
            const data = JSON.parse(e.data)
            setMessages(prev => [...prev, {
                id: data.id || Date.now(),
                content: data.content,
                sender_username: data.username,
                created_at: data.created_at || new Date().toISOString(),
                type: data.type
            }])
        }
        ws.current.onclose = () => setOnlineCount(c => Math.max(0, c - 1))
    }

    const sendMessage = (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !ws.current) return
        ws.current.send(JSON.stringify({ content: newMessage }))
        setNewMessage('')
    }

    const createRoom = async (e) => {
        e.preventDefault()
        if (!newRoomName.trim()) return
        await axios.post(`${API}/api/rooms/`, { name: newRoomName, description: '' }, { headers })
        setNewRoomName('')
        fetchRooms()
    }

    const joinRoom = async (roomId) => {
        try {
            await axios.post(`${API}/api/rooms/${roomId}/join`, {}, { headers })
        } catch {}
        setCurrentRoom(rooms.find(r => r.id === roomId))
    }

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2 style={styles.appName}>💬 ChatApp</h2>
                    <span style={styles.userBadge}>{username}</span>
                </div>

                <form onSubmit={createRoom} style={styles.createRoom}>
                    <input style={styles.roomInput} placeholder="New room name..."
                           value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                    <button style={styles.createBtn} type="submit">+</button>
                </form>

                <div style={styles.roomList}>
                    {rooms.map(room => (
                        <div key={room.id} style={{...styles.roomItem, ...(currentRoom?.id === room.id ? styles.activeRoom : {})}}
                             onClick={() => joinRoom(room.id)}>
                            <span style={styles.roomHash}>#</span>
                            <span style={styles.roomName}>{room.name}</span>
                            {room.online_users > 0 && <span style={styles.onlineDot}>{room.online_users}</span>}
                        </div>
                    ))}
                </div>

                <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
            </div>

            {/* Chat Area */}
            <div style={styles.chatArea}>
                {currentRoom ? (
                    <>
                        <div style={styles.chatHeader}>
                            <h3># {currentRoom.name}</h3>
                            <span style={styles.onlineCount}>🟢 {onlineCount} online</span>
                        </div>
                        <div style={styles.messages}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{...styles.message, ...(msg.type === 'system' ? styles.systemMsg : {})}}>
                                    {msg.type !== 'system' && (
                                        <>
                                            <div style={{...styles.avatar, background: stringToColor(msg.sender_username)}}>
                                                {msg.sender_username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={styles.msgMeta}>
                                                    <span style={styles.msgUsername}>{msg.sender_username}</span>
                                                    <span style={styles.msgTime}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                                                </div>
                                                <div style={styles.msgContent}>{msg.content}</div>
                                            </div>
                                        </>
                                    )}
                                    {msg.type === 'system' && <em style={styles.systemText}>{msg.content}</em>}
                                </div>
                            ))}
                            <div ref={messagesEnd} />
                        </div>
                        <form onSubmit={sendMessage} style={styles.inputArea}>
                            <input style={styles.msgInput} placeholder={`Message #${currentRoom.name}`}
                                   value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                            <button style={styles.sendBtn} type="submit">Send ➤</button>
                        </form>
                    </>
                ) : (
                    <div style={styles.emptyState}>
                        <h2>👈 Select a room to start chatting</h2>
                        <p>Or create a new room in the sidebar</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const stringToColor = (str = '') => {
    let hash = 0
    for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash)
    return `hsl(${hash % 360}, 60%, 50%)`
}

const styles = {
    container: { display: 'flex', height: '100vh', background: '#f0f2f5' },
    sidebar: { width: '260px', background: '#1a1d2e', display: 'flex', flexDirection: 'column', color: 'white' },
    sidebarHeader: { padding: '1.25rem', borderBottom: '1px solid #2d3148' },
    appName: { fontSize: '1.2rem', marginBottom: '0.25rem' },
    userBadge: { fontSize: '0.8rem', color: '#8b8fa8', background: '#2d3148', padding: '2px 8px', borderRadius: '10px' },
    createRoom: { display: 'flex', padding: '0.75rem', gap: '0.5rem', borderBottom: '1px solid #2d3148' },
    roomInput: { flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#2d3148', color: 'white', fontSize: '0.85rem' },
    createBtn: { padding: '0.5rem 0.75rem', background: '#667eea', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' },
    roomList: { flex: 1, overflowY: 'auto', padding: '0.5rem' },
    roomItem: { display: 'flex', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', transition: 'background 0.15s' },
    activeRoom: { background: '#2d3148' },
    roomHash: { color: '#8b8fa8', marginRight: '0.5rem', fontWeight: 700 },
    roomName: { flex: 1, fontSize: '0.9rem' },
    onlineDot: { background: '#43b581', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem' },
    logoutBtn: { margin: '1rem', padding: '0.6rem', background: '#e74c3c', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    onlineCount: { fontSize: '0.85rem', color: '#43b581' },
    messages: { flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    message: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 },
    msgMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' },
    msgUsername: { fontWeight: 600, fontSize: '0.9rem' },
    msgTime: { color: '#999', fontSize: '0.75rem' },
    msgContent: { fontSize: '0.95rem', lineHeight: 1.5 },
    systemMsg: { justifyContent: 'center' },
    systemText: { color: '#999', fontSize: '0.85rem' },
    inputArea: { padding: '1rem 1.5rem', background: 'white', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '0.75rem' },
    msgInput: { flex: 1, padding: '0.75rem 1rem', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' },
    sendBtn: { padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', gap: '0.5rem' }
}