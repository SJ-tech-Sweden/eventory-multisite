<template>
  <q-page padding>
    <!-- Backend URL card -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Backend connection</div>
        <p class="text-body2 text-grey-7 q-mb-md">
          Enter the URL of your optional FastAPI backend. Leave blank to use the default
          browser-only mode where credentials are stored in localStorage.
        </p>
        <q-input
          v-model="backendUrl"
          label="Backend URL"
          placeholder="http://localhost:8000"
          outlined
          clearable
          class="q-mb-sm"
          hint="e.g. http://localhost:8000 or https://your-backend.example.com"
        />
        <q-btn label="Save URL" color="primary" @click="saveUrl" />
      </q-card-section>

      <q-card-section v-if="backendStore.isConfigured">
        <q-banner
          :class="backendStore.isLoggedIn ? 'bg-green-2 text-green-9' : 'bg-orange-2 text-orange-9'"
          dense
          rounded
        >
          <template v-slot:avatar>
            <q-icon :name="backendStore.isLoggedIn ? 'check_circle' : 'warning'" />
          </template>
          <span v-if="backendStore.isLoggedIn">
            Logged in as <strong>{{ backendStore.currentUser?.username }}</strong>
          </span>
          <span v-else>Backend configured but not logged in</span>
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- Auth card (only shown when backend is configured) -->
    <q-card v-if="backendStore.isConfigured">
      <q-banner v-if="message" :class="bannerClass" dense>{{ message }}</q-banner>

      <!-- Already logged in -->
      <q-card-section v-if="backendStore.isLoggedIn">
        <div class="text-h6">Account</div>
        <p class="text-body2">
          Signed in as <strong>{{ backendStore.currentUser?.username }}</strong>
        </p>
        <q-btn label="Sign out" color="negative" outline @click="logout" />
      </q-card-section>

      <!-- Login / Register tabs -->
      <template v-else>
        <q-tabs v-model="tab" dense class="text-primary">
          <q-tab name="login" label="Login" />
          <q-tab name="register" label="Register" />
        </q-tabs>
        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="login">
            <q-input
              v-model="username"
              label="Username"
              outlined
              dense
              class="q-mb-sm"
              @keyup.enter="login"
            />
            <q-input
              v-model="password"
              label="Password"
              type="password"
              outlined
              dense
              class="q-mb-sm"
              @keyup.enter="login"
            />
            <q-btn label="Login" color="primary" :loading="loading" @click="login" />
          </q-tab-panel>

          <q-tab-panel name="register">
            <q-input
              v-model="username"
              label="Username"
              outlined
              dense
              class="q-mb-sm"
              @keyup.enter="register"
            />
            <q-input
              v-model="password"
              label="Password"
              type="password"
              outlined
              dense
              class="q-mb-sm"
              @keyup.enter="register"
            />
            <q-btn label="Register" color="secondary" :loading="loading" @click="register" />
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useBackendStore } from 'src/stores/backendStore'
import { useLoginStore } from 'src/stores/loginStore'

const backendStore = useBackendStore()
const loginStore = useLoginStore()

const backendUrl = ref(backendStore.backendUrl)
const tab = ref('login')
const username = ref('')
const password = ref('')
const loading = ref(false)
const message = ref('')
const bannerClass = ref('')

function setMessage(result) {
  message.value = result.message
  bannerClass.value = result.success ? 'bg-green-4 text-white' : 'bg-red-4 text-white'
}

function saveUrl() {
  backendStore.setBackendUrl(backendUrl.value || '')
  message.value = backendUrl.value
    ? `Backend URL saved: ${backendStore.backendUrl}`
    : 'Backend disabled – using localStorage mode'
  bannerClass.value = 'bg-blue-4 text-white'
}

async function login() {
  if (!username.value || !password.value) return
  loading.value = true
  const result = await backendStore.login(username.value, password.value)
  loading.value = false
  setMessage(result)
  if (result.success) {
    username.value = ''
    password.value = ''
    // Sync logins from backend
    await loginStore.loadLoginsFromBackend()
  }
}

async function register() {
  if (!username.value || !password.value) return
  loading.value = true
  const result = await backendStore.register(username.value, password.value)
  loading.value = false
  setMessage(result)
  if (result.success) {
    // Auto-login after successful registration
    const loginResult = await backendStore.login(username.value, password.value)
    if (loginResult.success) {
      username.value = ''
      password.value = ''
      await loginStore.loadLoginsFromBackend()
    }
  }
}

function logout() {
  backendStore.logout()
  message.value = 'Signed out'
  bannerClass.value = 'bg-blue-4 text-white'
}
</script>

<style scoped>
.q-card {
  max-width: 480px;
  margin: 0 auto 20px auto;
}
</style>
