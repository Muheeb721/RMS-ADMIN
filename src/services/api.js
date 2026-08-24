export const apiConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'RMS Admin',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.rms.local/v1',
  token: import.meta.env.VITE_API_TOKEN || 'demo-admin-token',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'wss://socket.rms.local',
  endpoints: {
    properties: '/properties',
    users: '/users',
    bookings: '/bookings',
    payments: '/payments',
    dues: '/dues',
    messages: '/messages',
    chatbot: '/chatbot',
    analytics: '/analytics',
  },
}

export const apiService = {
  getConfig: () => ({ ...apiConfig }),
  request: async (endpoint, options = {}) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiConfig.token}`,
      },
      ...options,
    }

    try {
      const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, config)

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.warn(`API request to ${endpoint} failed. Using local fallback.`, error)
      return { success: true, data: [] }
    }
  },
}
