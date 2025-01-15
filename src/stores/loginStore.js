// src/stores/loginStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

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
      await this.authenticateLogin(newLogin)
      this.logins.push(newLogin)
      this.saveToLocalStorage()
    },

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
      } catch (error) {
        console.error('Authentication failed for:', login.username, error)
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
        },
        intervalMinutes * 60 * 1000,
      )
    },

    stopTokenRefresh() {
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId)
        this.refreshIntervalId = null
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
