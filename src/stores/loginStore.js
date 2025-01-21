// src/stores/loginStore.js
// Import the required functions
import { defineStore } from 'pinia'
import axios from 'axios'

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
        this.saveToLocalStorage()
      }
      return result
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
      this.logins = this.logins.filter((login) => login.id !== id)
      console.info('Removed login:', id)
      this.saveToLocalStorage()
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
