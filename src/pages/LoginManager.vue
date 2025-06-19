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
              <q-btn icon="edit" flat color="primary" @click="openEditDialog(login)" />
              <q-btn flat icon="refresh" @click.stop="setActiveLogin(login.id)" />
              <q-btn flat icon="delete" color="negative" @click.stop="removeLogin(login.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Edit Login Dialog -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width: 300px; max-width: 700px">
        <q-card-section>
          <div
            class="row q-gutter-md q-col-gutter-md"
            :class="$q.screen.gt.sm ? 'flex-row' : 'flex-column'"
          >
            <!-- Left: logo, org name, username, password -->
            <div class="col column items-start" style="min-width: 220px">
              <div class="row items-center q-mb-md">
                <q-avatar size="56px" v-if="selectedLogin?.organisationLogo" class="q-mr-md">
                  <q-img :src="selectedLogin.organisationLogo" />
                </q-avatar>
                <div>
                  <div class="text-h6">{{ selectedLogin?.organisation }}</div>
                  <div class="text-subtitle2">Edit Login</div>
                </div>
              </div>
              <q-input v-model="editedUsername" label="Username" outlined dense class="q-mb-md" />
              <q-input
                v-model="editedPassword"
                label="Password"
                type="password"
                outlined
                dense
                class="q-mb-md"
              />
            </div>
            <!-- Right: color picker -->
            <div class="col-auto flex flex-center">
              <q-color
                v-model="editedColor"
                format-model="hex"
                label="Color"
                style="width: 180px"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveLogin" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
const editDialog = ref(false)
const selectedLogin = ref(null)
const editedColor = ref('#1976d2') // Default Quasar primary
const editedUsername = ref('')
const editedPassword = ref('')

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

// Open the edit login dialog
function openEditDialog(login) {
  selectedLogin.value = login
  editedColor.value = login.color || '#1976d2'
  editedUsername.value = login.username || ''
  editedPassword.value = login.password || ''
  editDialog.value = true
}

// Save the edited login
function saveLogin() {
  if (selectedLogin.value) {
    selectedLogin.value.color = editedColor.value
    selectedLogin.value.username = editedUsername.value
    selectedLogin.value.password = editedPassword.value
    // Optionally persist changes here
  }
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
