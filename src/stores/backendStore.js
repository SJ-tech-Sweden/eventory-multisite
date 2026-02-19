// src/stores/backendStore.js
// Manages the optional FastAPI backend connection and user session.
import { defineStore } from 'pinia'
import axios from 'axios'

export const useBackendStore = defineStore('backendStore', {
  state: () => ({
    backendUrl: localStorage.getItem('backendUrl') || '',
    accessToken: localStorage.getItem('backendToken') || null,
    currentUser: JSON.parse(localStorage.getItem('backendUser') || 'null'),
  }),

  getters: {
    isConfigured: (state) => Boolean(state.backendUrl),
    isLoggedIn: (state) => Boolean(state.accessToken),
  },

  actions: {
    // Save backend URL (empty string disables backend mode)
    setBackendUrl(url) {
      this.backendUrl = url.replace(/\/$/, '') // strip trailing slash
      localStorage.setItem('backendUrl', this.backendUrl)
    },

    async register(username, password) {
      try {
        await axios.post(`${this.backendUrl}/auth/register`, { username, password })
        return { success: true, message: 'Registration successful' }
      } catch (error) {
        const detail = error.response?.data?.detail || 'Registration failed'
        return { success: false, message: detail }
      }
    },

    async login(username, password) {
      try {
        const form = new FormData()
        form.append('username', username)
        form.append('password', password)
        const response = await axios.post(`${this.backendUrl}/auth/login`, form)
        this.accessToken = response.data.access_token
        localStorage.setItem('backendToken', this.accessToken)
        await this.fetchMe()
        return { success: true, message: 'Login successful' }
      } catch (error) {
        const detail = error.response?.data?.detail || 'Login failed'
        return { success: false, message: detail }
      }
    },

    async fetchMe() {
      if (!this.accessToken) return
      try {
        const response = await axios.get(`${this.backendUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        this.currentUser = response.data
        localStorage.setItem('backendUser', JSON.stringify(this.currentUser))
      } catch {
        this.logout()
      }
    },

    logout() {
      this.accessToken = null
      this.currentUser = null
      localStorage.removeItem('backendToken')
      localStorage.removeItem('backendUser')
    },

    // Helper to return auth headers for protected requests
    authHeaders() {
      return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}
    },
  },
})
