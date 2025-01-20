<template>
  <q-page padding>
    <q-card>
      <q-banner v-if="message" :class="bannerClass" dense>
        {{ message }}
      </q-banner>
      <q-card-section>
        <div class="text-h6">Add New Login</div>
        <q-input v-model="username" label="Username" outlined class="q-mb-sm" />
        <q-input v-model="password" label="Password" type="password" outlined class="q-mb-sm" />
        <q-input
          filled
          v-model="color"
          :rules="['anyColor']"
          hint="With validation"
          class="my-input"
        >
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color v-model="color" />
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
            <q-item-section>{{ login.username }}</q-item-section>
            <q-item-section side>
              <q-btn flat icon="login" @click.stop="setActiveLogin(login.id)" />
              <q-btn flat icon="delete" color="negative" @click.stop="removeLogin(login.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'

const loginStore = useLoginStore()
const username = ref('')
const password = ref('')
const color = ref('')
const bannerClass = ref('')
const message = ref('')

const addLogin = async () => {
  if (username.value && password.value) {
    const result = await loginStore.addLogin(username.value, password.value, color.value)
    message.value = result.message
    bannerClass.value = result.success ? 'bg-green-4 text-white' : 'bg-red-4 text-white'
    username.value = ''
    password.value = ''
    color.value = ''
  }
}

const removeLogin = (id) => {
  loginStore.removeLogin(id)
}

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
  background-color: #4caf50 !important;
}

.bg-red-4 {
  background-color: #f44336 !important;
}
</style>
