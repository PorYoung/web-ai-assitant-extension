// 会话存储管理类
class ChatStorage {
  constructor() {
    this.storageKey = 'ai_chat_sessions';
    this.migrateOldData(); // 迁移旧数据
  }

  // 迁移旧的数据结构到新的数据结构
  migrateOldData() {
    const sessions = this.getSessions();
    let hasChanges = false;

    sessions.forEach(session => {
      if (session.messages && session.messages.length > 0 && !session.messages[0].roundId) {
        const newMessages = [];
        for (let i = 0; i < session.messages.length; i += 2) {
          const userMessage = session.messages[i];
          const aiMessage = session.messages[i + 1];
          if (userMessage && userMessage.role === 'user') {
            newMessages.push({
              roundId: Date.now().toString() + i,
              userMessage,
              aiMessage: aiMessage || null
            });
          }
        }
        session.messages = newMessages;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveSessions(sessions);
    }
  }

  // 获取所有会话
  getSessions() {
    const sessions = localStorage.getItem(this.storageKey);
    return sessions ? JSON.parse(sessions) : [];
  }

  // 获取指定会话的消息，支持分页
  getSessionMessages(sessionId, lastMessageId = null, pageSize = 10) {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return [];
    
    const messages = session.messages;
    if (messages.length === 0) return [];

    if (lastMessageId === null) {
      // 首次加载，返回最新的消息
      const start = Math.max(0, messages.length - pageSize);
      return messages.slice(start);
    } else {
      // 找到最后一条消息的索引
      const lastIndex = messages.findIndex(msg => msg.roundId === lastMessageId);
      if (lastIndex === -1) return [];
      
      // 获取这条消息之前的消息
      const start = Math.max(0, lastIndex - pageSize);
      return messages.slice(start, lastIndex);
    }
  }

  // 获取会话的总消息数
  getSessionMessageCount(sessionId) {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.messages.length : 0;
  }

  // 保存所有会话
  saveSessions(sessions) {
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  // 创建新会话
  createSession(title = '新会话') {
    const sessions = this.getSessions();
    const newSession = {
      id: Date.now().toString(),
      title,
      messages: [],
      createTime: new Date().toISOString()
    };
    sessions.push(newSession);
    this.saveSessions(sessions);
    return newSession;
  }

  // 删除会话
  deleteSession(sessionId) {
    const sessions = this.getSessions().filter(session => session.id !== sessionId);
    this.saveSessions(sessions);
  }

  // 更新会话消息
  updateSessionMessages(sessionId, messages) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].messages = messages;
      this.saveSessions(sessions);
    }
  }

  // 添加新的对话轮次
  addMessageRound(sessionId, userMessage) {
    const sessions = this.getSessions();
    const session = sessions.find(session => session.id === sessionId);
    if (session) {
      const newRound = {
        roundId: Date.now().toString(),
        userMessage: {
          id: Date.now().toString(),
          role: 'user',
          content: userMessage.content,
          references: userMessage.references,
          timestamp: new Date().toISOString()
        },
        aiMessage: null
      };
      session.messages.push(newRound);
      this.saveSessions(sessions);
      return newRound;
    }
    return null;
  }

  // 更新AI回复
  updateAIResponse(sessionId, roundId, aiResponse) {
    const sessions = this.getSessions();
    const session = sessions.find(session => session.id === sessionId);
    if (session) {
      const round = session.messages.find(msg => msg.roundId === roundId);
      if (round) {
        round.aiMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        };
        this.saveSessions(sessions);
      }
    }
  }

  // 删除对话轮次
  deleteMessageRound(sessionId, roundId) {
    const sessions = this.getSessions();
    const session = sessions.find(session => session.id === sessionId);
    if (session) {
      session.messages = session.messages.filter(msg => msg.roundId !== roundId);
      this.saveSessions(sessions);
    }
  }
  // 清空会话消息
  clearSessionMessages(sessionId) {
    const sessions = this.getSessions();
    const session = sessions.find(session => session.id === sessionId);
    if (session) {
      session.messages = [];
      this.saveSessions(sessions);
    }
  }
}

export const chatStorage = new ChatStorage();