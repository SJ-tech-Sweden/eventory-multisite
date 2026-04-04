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

      <!-- Keyboard / Manual scanner (always visible) -->
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">
          <q-icon name="keyboard" class="q-mr-xs" />Keyboard / Manual
        </div>
        <q-input
          ref="keyboardInputRef"
          v-model="keyboardInput"
          label="Scan or type barcode then press Enter"
          outlined
          clearable
          :loading="scanning"
          @keyup.enter="onKeyboardEnter"
          autofocus
        >
          <template v-slot:append>
            <q-btn
              flat
              round
              icon="send"
              :disable="!keyboardInput || scanning"
              @click="onKeyboardEnter"
            />
          </template>
        </q-input>
      </q-card-section>

      <!-- Camera scanner (if supported) -->
      <q-card-section v-if="cameraSupported">
        <div class="text-subtitle1 q-mb-sm">
          <q-icon name="photo_camera" class="q-mr-xs" />Camera Scanner
        </div>

        <!-- Camera selector when multiple cameras are available -->
        <q-select
          v-if="cameras.length > 1"
          v-model="selectedCamera"
          :options="cameras"
          option-label="label"
          option-value="deviceId"
          emit-value
          map-options
          label="Select camera"
          dense
          outlined
          class="q-mb-sm"
          @update:model-value="onCameraChange"
        />

        <div class="camera-container q-mb-sm">
          <video
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="camera-video"
            :class="{ 'camera-active': cameraActive }"
          />
          <div v-if="cameraActive" class="camera-overlay">
            <div class="scan-line" />
          </div>
          <div v-if="!cameraActive && !cameraLoading" class="camera-placeholder">
            <q-icon name="photo_camera" size="48px" color="grey-5" />
            <div class="text-grey-6 q-mt-sm">Camera off</div>
          </div>
          <q-inner-loading :showing="cameraLoading">
            <q-spinner size="40px" color="primary" />
          </q-inner-loading>
        </div>

        <q-btn
          :label="cameraActive ? 'Stop Camera' : 'Start Camera'"
          :color="cameraActive ? 'negative' : 'primary'"
          :icon="cameraActive ? 'videocam_off' : 'videocam'"
          @click="toggleCamera"
          :loading="cameraLoading"
        />
      </q-card-section>

      <!-- NFC scanner (if supported) -->
      <q-card-section v-if="nfcSupported">
        <div class="text-subtitle1 q-mb-sm">
          <q-icon name="nfc" class="q-mr-xs" />NFC Scanner
        </div>
        <div class="row items-center q-gutter-sm">
          <q-btn
            :label="nfcActive ? 'Stop NFC' : 'Start NFC Scan'"
            :color="nfcActive ? 'negative' : 'primary'"
            :icon="nfcActive ? 'nfc' : 'nfc'"
            @click="toggleNfc"
            :loading="nfcLoading"
          />
          <q-chip v-if="nfcActive" color="green" text-color="white" icon="nfc">
            Waiting for NFC tag...
          </q-chip>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useQuasar } from 'quasar'
import axios from 'axios'

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
const activeLogin = computed(() => loginStore.logins.find((l) => l.id === selectedLogin.value))

// ── Scan direction ──────────────────────────────────────────────────────────
const scanDirection = ref('in')

// ── Shared state ────────────────────────────────────────────────────────────
const scanning = ref(false)
const scanResult = ref(null)

// ── Call the scan API ────────────────────────────────────────────────────────
const performScan = async (code) => {
  if (!code || scanning.value) return
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

// ── Keyboard / Manual input ─────────────────────────────────────────────────
const keyboardInput = ref('')
const keyboardInputRef = ref(null)

const onKeyboardEnter = async () => {
  const code = keyboardInput.value?.trim()
  if (!code) return
  keyboardInput.value = ''
  await performScan(code)
  keyboardInputRef.value?.focus()
}

// ── Camera scanner ──────────────────────────────────────────────────────────
const cameraSupported = ref(false)
const cameraActive = ref(false)
const cameraLoading = ref(false)
const cameras = ref([])
const selectedCamera = ref(null)
const videoRef = ref(null)

const SCAN_DEBOUNCE_MS = 3000

let barcodeDetector = null
let cameraStream = null
let scanAnimationId = null
let lastScannedCode = null
let lastScanTime = 0

const startCameraScanning = () => {
  if (!barcodeDetector || !videoRef.value) return
  const scanFrame = async () => {
    if (!cameraActive.value || !videoRef.value) return
    try {
      const barcodes = await barcodeDetector.detect(videoRef.value)
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue
        const now = Date.now()
        // Debounce: ignore same code within SCAN_DEBOUNCE_MS
        if (code !== lastScannedCode || now - lastScanTime > SCAN_DEBOUNCE_MS) {
          lastScannedCode = code
          lastScanTime = now
          await performScan(code)
        }
      }
    } catch (error) {
      // BarcodeDetector may throw if the video frame is not ready; log unexpected errors
      if (!(error instanceof DOMException)) {
        console.warn('BarcodeDetector error:', error)
      }
    }
    scanAnimationId = requestAnimationFrame(scanFrame)
  }
  scanAnimationId = requestAnimationFrame(scanFrame)
}

const stopCameraScanning = () => {
  if (scanAnimationId) {
    cancelAnimationFrame(scanAnimationId)
    scanAnimationId = null
  }
}

const stopCameraStream = () => {
  stopCameraScanning()
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop())
    cameraStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  cameraActive.value = false
}

const startCamera = async (deviceId) => {
  cameraLoading.value = true
  try {
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
    }
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
    videoRef.value.srcObject = cameraStream

    // Enumerate cameras after first getUserMedia (permissions are granted now)
    if (cameras.value.length === 0) {
      await enumerateCameras()
    }

    await new Promise((resolve) => {
      videoRef.value.onloadedmetadata = resolve
    })
    cameraActive.value = true
    startCameraScanning()
  } catch (error) {
    $q.notify({ message: `Camera error: ${error.message}`, color: 'red' })
  } finally {
    cameraLoading.value = false
  }
}

const toggleCamera = async () => {
  if (cameraActive.value) {
    stopCameraStream()
  } else {
    await startCamera(selectedCamera.value)
  }
}

const onCameraChange = async (deviceId) => {
  if (cameraActive.value) {
    stopCameraStream()
    await startCamera(deviceId)
  }
}

const enumerateCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputs = devices.filter((d) => d.kind === 'videoinput')
    cameras.value = videoInputs.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${i + 1}`,
    }))
    if (!selectedCamera.value && cameras.value.length > 0) {
      selectedCamera.value = cameras.value[0].deviceId
    }
  } catch (error) {
    console.error('Failed to enumerate cameras:', error)
    cameras.value = []
  }
}

// ── NFC scanner ─────────────────────────────────────────────────────────────
const nfcSupported = ref(false)
const nfcActive = ref(false)
const nfcLoading = ref(false)

let nfcReader = null

const toggleNfc = async () => {
  if (nfcActive.value) {
    nfcActive.value = false
    nfcReader = null
    return
  }

  nfcLoading.value = true
  try {
    nfcReader = new window.NDEFReader()
    await nfcReader.scan()
    nfcReader.addEventListener('reading', async ({ message }) => {
      if (!nfcActive.value) return
      for (const record of message.records) {
        if (record.recordType === 'text') {
          const decoder = new TextDecoder(record.encoding || 'utf-8')
          const code = decoder.decode(record.data)
          await performScan(code)
          break
        } else if (record.recordType === 'url') {
          const decoder = new TextDecoder()
          const code = decoder.decode(record.data)
          await performScan(code)
          break
        } else {
          // For other record types, try to decode as utf-8 text
          try {
            const decoder = new TextDecoder()
            const code = decoder.decode(record.data)
            if (code) await performScan(code)
          } catch {
            // ignore
          }
          break
        }
      }
    })
    nfcReader.addEventListener('readingerror', () => {
      $q.notify({ message: 'NFC read error', color: 'red' })
    })
    nfcActive.value = true
  } catch (error) {
    $q.notify({ message: `NFC error: ${error.message}`, color: 'red' })
    nfcReader = null
  } finally {
    nfcLoading.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Check camera support: requires both getUserMedia and BarcodeDetector
  if (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window
  ) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats()
      if (supported.length > 0) {
        barcodeDetector = new window.BarcodeDetector({ formats: supported })
        cameraSupported.value = true
      }
    } catch {
      cameraSupported.value = false
    }
  }

  // Check NFC support
  if (typeof window !== 'undefined' && 'NDEFReader' in window) {
    nfcSupported.value = true
  }
})

onUnmounted(() => {
  stopCameraStream()
  nfcActive.value = false
  nfcReader = null
})
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  min-height: 180px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: auto;
  display: block;
}

.camera-video:not(.camera-active) {
  display: none;
}

.camera-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.scan-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: rgba(25, 118, 210, 0.8);
  box-shadow: 0 0 6px rgba(25, 118, 210, 0.9);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 10%;
  }
  50% {
    top: 85%;
  }
  100% {
    top: 10%;
  }
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
</style>
