// src/stores/loginStore.js
// Import the required functions
import { defineStore } from 'pinia'
import axios from 'axios'
import { useBackendStore } from './backendStore'

// Define the store
export const useLoginStore = defineStore('loginStore', {
  state: () => ({
    logins: JSON.parse(localStorage.getItem('logins')) || [],
    activeLogin: null,
    refreshIntervalId: null,
  }),
  actions: {
    async addLogin(username, password, color) {
      const newLogin = {
        id: Date.now(),
        username,
        password,
        access_token: null,
        color,
        organisation: null,
        firstName: null,
        lastName: null,
      }
      const result = await this.authenticateLogin(newLogin)
      if (result.success) {
        this.logins.push(newLogin)
        await this._persistLogin(newLogin)
        this.saveToLocalStorage()
      }
      return result
    },

    // Persist a login to the backend (no-op when backend is not configured)
    async _persistLogin(login) {
      const backend = useBackendStore()
      if (!backend.isConfigured || !backend.isLoggedIn) return
      try {
        const payload = {
          label: login.organisation || login.username,
          username: login.username,
          password: login.password,
          color: login.color,
        }
        const response = await axios.post(`${backend.backendUrl}/logins`, payload, {
          headers: backend.authHeaders(),
        })
        // Store the backend ID so we can update/delete it later
        login.backendId = response.data.id
      } catch (error) {
        console.warn('Could not persist login to backend:', error)
      }
    },

    // Load logins from the backend (falls back to localStorage when unavailable)
    async loadLoginsFromBackend() {
      const backend = useBackendStore()
      if (!backend.isConfigured || !backend.isLoggedIn) return false
      try {
        const response = await axios.get(`${backend.backendUrl}/logins`, {
          headers: backend.authHeaders(),
        })
        // Merge backend logins: keep runtime auth state for any already in memory
        const merged = response.data.map((bl) => {
          const existing = this.logins.find((l) => l.backendId === bl.id)
          return existing
            ? existing
            : {
                // Generate a unique frontend ID separate from the backend ID
                id: Date.now() + Math.random(),
                backendId: bl.id,
                username: bl.username,
                password: bl.password,
                color: bl.color,
                access_token: null,
                organisation: null,
                firstName: null,
                lastName: null,
              }
        })
        this.logins = merged
        this.saveToLocalStorage()
        return true
      } catch (error) {
        console.warn('Could not load logins from backend:', error)
        return false
      }
    },

    // This function authenticates a login and fetches the user information
    async authenticateLogin(login) {
      console.info('Authenticating login:', login.username)
      try {
        let data = new FormData()
        data.append('username', login.username)
        data.append('password', login.password)

        const response = await axios.post('api/login-json', data)
        login.access_token = response.data.access_token

        const respnonseUser = await axios.get('/api/user-info', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
        })
        login.organisation = respnonseUser.data.organizationName
        login.firstName = respnonseUser.data.firstName
        login.lastName = respnonseUser.data.lastName

        // Fetch the logo image
        const responseLogo = await axios.get('/api/logo', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
          responseType: 'blob', // Ensure the response is a Blob
        })

        console.info('Logo:', responseLogo.data)

        // Convert the Blob to a base64-encoded string
        const reader = new FileReader()
        reader.readAsDataURL(responseLogo.data)
        reader.onloadend = () => {
          const base64data = reader.result
          console.log('Logo:', base64data)
          login.organisationLogo = base64data // Store the base64-encoded string
          this.saveToLocalStorage()
        }
        this.saveToLocalStorage()
        return { success: true, message: 'Authentication successful' }
      } catch (error) {
        console.error('Authentication failed for:', login.username, error)
        return { success: false, message: 'Authentication failed' }
      }
    },

    removeLogin(id) {
      const login = this.logins.find((l) => l.id === id)
      this.logins = this.logins.filter((login) => login.id !== id)
      console.info('Removed login:', id)
      this.saveToLocalStorage()

      // Remove from backend if available
      if (login?.backendId) {
        const backend = useBackendStore()
        if (backend.isConfigured && backend.isLoggedIn) {
          axios
            .delete(`${backend.backendUrl}/logins/${login.backendId}`, {
              headers: backend.authHeaders(),
            })
            .catch((err) => console.warn('Could not delete login from backend:', err))
        }
      }
    },

    setActiveLogin(id) {
      this.activeLogin = this.logins.find((login) => login.id === id) || null
      if (this.activeLogin) {
        this.authenticateLogin(this.activeLogin)
      }
    },

    startTokenRefresh(intervalMinutes = 15) {
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId)
      }
      this.refreshIntervalId = setInterval(
        () => {
          this.logins.forEach((login) => {
            this.authenticateLogin(login)
          })
          this.updateLastRefreshTime()
        },
        intervalMinutes * 60 * 1000,
      )
      this.updateLastRefreshTime()
    },

    stopTokenRefresh() {
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId)
        this.refreshIntervalId = null
      }
    },

    updateLastRefreshTime() {
      const now = new Date().toISOString()
      this.lastRefreshTime = now
      localStorage.setItem('lastRefreshTime', now)
    },

    checkAndRefreshTokens() {
      const now = new Date().getTime()
      const lastRefresh = new Date(this.lastRefreshTime).getTime()
      const intervalMinutes = 15
      const intervalMillis = intervalMinutes * 60 * 1000

      if (now - lastRefresh > intervalMillis) {
        this.logins.forEach((login) => {
          this.authenticateLogin(login)
        })
        this.updateLastRefreshTime()
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('logins', JSON.stringify(this.logins))
    },

    loadLogins() {
      this.logins = JSON.parse(localStorage.getItem('logins')) || []
      if (this.logins.length > 0) {
        this.startTokenRefresh()
      }
    },

    clearAllLogins() {
      this.logins = []
      this.activeLogin = null
      localStorage.removeItem('logins')
      this.stopTokenRefresh()
    },
  },
  persist: true,
})
