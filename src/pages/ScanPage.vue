<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Scan Equipment</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row q-gutter-sm items-center">
          <!-- Organisation selector -->
          <q-select
            v-model="selectedLogin"
            :options="loginOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Organisation"
            dense
            outlined
            style="min-width: 200px"
          />

          <!-- Scan direction toggle -->
          <q-btn-toggle
            v-model="scanDirection"
            :options="[
              { label: 'Check In', value: 'in', icon: 'login' },
              { label: 'Check Out', value: 'out', icon: 'logout' },
            ]"
            rounded
            unelevated
            color="white"
            text-color="primary"
            toggle-color="primary"
          />
        </div>
      </q-card-section>

      <q-card-section>
        <ScanPanel :loading="scanning" @scanned="onScanned" />
      </q-card-section>

      <!-- Scan result -->
      <q-card-section v-if="scanResult">
        <q-separator class="q-mb-md" />
        <div class="text-subtitle1 q-mb-sm">Last Scan Result</div>
        <q-banner
          :class="scanResult.success ? 'bg-green-1 text-green-9' : 'bg-red-1 text-red-9'"
          rounded
        >
          <template v-slot:avatar>
            <q-icon :name="scanResult.success ? 'check_circle' : 'error'" />
          </template>
          <div class="text-subtitle2">{{ scanResult.message }}</div>
          <div v-if="scanResult.code" class="text-caption q-mt-xs">Code: {{ scanResult.code }}</div>
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useQuasar } from 'quasar'
import axios from 'axios'
import ScanPanel from 'src/components/ScanPanel.vue'

const loginStore = useLoginStore()
const $q = useQuasar()

// Refresh tokens on mount
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// ── Login selector ──────────────────────────────────────────────────────────
const loginOptions = computed(() =>
  loginStore.logins.map((l) => ({
    label: l.organisation || l.username,
    value: l.id,
  })),
)
const selectedLogin = ref(loginStore.logins[0]?.id ?? null)
watch(
  () => loginStore.logins,
  (logins) => {
    if (selectedLogin.value === null && logins.length > 0) {
      selectedLogin.value = logins[0].id
    } else if (!logins.find((l) => l.id === selectedLogin.value)) {
      selectedLogin.value = logins[0]?.id ?? null
    }
  },
)
const activeLogin = computed(() => loginStore.logins.find((l) => l.id === selectedLogin.value))

// ── Scan direction ──────────────────────────────────────────────────────────
const scanDirection = ref('in')

// ── Scan state ───────────────────────────────────────────────────────────────
const scanning = ref(false)
const scanResult = ref(null)

const onScanned = async (code) => {
  if (scanning.value) return
  if (!activeLogin.value?.access_token) {
    $q.notify({ message: 'No organisation selected or not logged in', color: 'red' })
    return
  }

  scanning.value = true
  scanResult.value = null

  try {
    const response = await axios.post(
      '/api/scan',
      { code, direction: scanDirection.value },
      { headers: { Authorization: `Bearer ${activeLogin.value.access_token}` } },
    )
    scanResult.value = {
      success: true,
      message: response.data?.message ?? `Successfully scanned: ${code}`,
      code,
    }
    $q.notify({ message: scanResult.value.message, color: 'green' })
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      `Failed to scan code: ${code}`
    scanResult.value = { success: false, message, code }
    $q.notify({ message, color: 'red' })
  } finally {
    scanning.value = false
  }
}
</script>
