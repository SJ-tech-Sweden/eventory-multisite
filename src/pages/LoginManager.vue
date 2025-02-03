<template>
  <q-page padding>
    <q-card>
      <q-banner v-if="message" :class="bannerClass" dense>
        {{ message }}
      </q-banner>
      <q-card-section>
        <div class="text-h6">Add New Login</div>
        <q-input
          v-model="username"
          label="Username"
          outlined
          class="q-mb-sm"
          hint="Use your eventory login credentials"
        />
        <q-input v-model="password" label="Password" type="password" outlined class="q-mb-sm" />
        <q-input
          filled
          v-model="color"
          :rules="['anyColor']"
          hint="Click the color icon to select a color"
          class="my-input"
        >
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color v-model="color" default-view="palette" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn label="Add Login" color="primary" @click="addLogin" />
      </q-card-section>
    </q-card>

    <q-separator spaced />

    <q-card>
      <q-card-section>
        <div class="text-h6">Saved Logins</div>
        <q-list bordered>
          <q-item v-for="login in logins" :key="login.id" clickable>
            <q-item-section avatar>
              <q-avatar size="40px">
                <q-img :src="login.organisationLogo" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <div>{{ login.username }}</div>
              <div class="text-caption">{{ login.organisation }}</div>
            </q-item-section>
            <q-item-section side>
              <div
                :style="{
                  backgroundColor: login.color,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                }"
              ></div>
            </q-item-section>
            <q-item-section side>
              <q-btn flat icon="refresh" @click.stop="setActiveLogin(login.id)" />
              <q-btn flat icon="delete" color="negative" @click.stop="removeLogin(login.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'

// Define reactive variables and references
const loginStore = useLoginStore()
const username = ref('')
const password = ref('')
const color = ref('')
const bannerClass = ref('')
const message = ref('')

// Refresh login tokens
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// Function to generate a random color
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Set the default color to a random color
color.value = generateRandomColor()

// Function to add a new login
const addLogin = async () => {
  if (username.value && password.value) {
    const result = await loginStore.addLogin(username.value, password.value, color.value)
    message.value = result.message
    bannerClass.value = result.success ? 'bg-green-4 text-white' : 'bg-red-4 text-white'
    username.value = ''
    password.value = ''
    color.value = generateRandomColor() // Reset to a new random color
  }
}

// Function to remove a login
const removeLogin = (id) => {
  loginStore.removeLogin(id)
}

// Function to set the active login or right now only refreshes the token and ogranisation info
const setActiveLogin = (id) => {
  loginStore.setActiveLogin(id)
}

const logins = loginStore.logins
</script>

<style scoped>
.q-card {
  max-width: 400px;
  margin: 0 auto 20px auto;
}

.bg-green-4 {
  background-color: positive !important;
}

.bg-red-4 {
  background-color: negative !important;
}
</style>
