<template>
  <div>
    <!-- Tabs — shown only when more than one scan method is available -->
    <template v-if="availableTabs.length > 1">
      <q-tabs v-model="activeTab" dense align="left" @update:model-value="onTabChange">
        <q-tab
          v-for="tab in availableTabs"
          :key="tab.name"
          :name="tab.name"
          :icon="tab.icon"
          :label="tab.label"
        />
      </q-tabs>
      <q-separator class="q-mb-md" />
    </template>

    <!-- Keyboard input -->
    <div v-show="activeTab === 'keyboard'">
      <q-input
        ref="keyboardInputRef"
        v-model="keyboardInput"
        label="Scan or type barcode then press Enter"
        outlined
        clearable
        :loading="loading"
        @keyup.enter="onKeyboardEnter"
      >
        <template v-slot:append>
          <q-btn
            flat
            round
            icon="send"
            :disable="!keyboardInput || loading"
            @click="onKeyboardEnter"
          />
        </template>
      </q-input>
    </div>

    <!-- Camera input -->
    <div v-if="cameraSupported" v-show="activeTab === 'camera'">
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
        :loading="cameraLoading"
        @click="toggleCamera"
      />
    </div>

    <!-- NFC input -->
    <div v-if="nfcSupported" v-show="activeTab === 'nfc'">
      <div class="row items-center q-gutter-sm">
        <q-btn
          :label="nfcActive ? 'Stop NFC' : 'Start NFC Scan'"
          :color="nfcActive ? 'negative' : 'primary'"
          icon="nfc"
          :loading="nfcLoading"
          @click="toggleNfc"
        />
        <q-chip v-if="nfcActive" color="green" text-color="white" icon="nfc">
          Waiting for NFC tag...
        </q-chip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['scanned'])

const $q = useQuasar()

// ── Tab management ──────────────────────────────────────────────────────────
const cameraSupported = ref(false)
const nfcSupported = ref(false)

const availableTabs = computed(() => {
  const tabs = [{ name: 'keyboard', icon: 'keyboard', label: 'Keyboard' }]
  if (cameraSupported.value) tabs.push({ name: 'camera', icon: 'photo_camera', label: 'Camera' })
  if (nfcSupported.value) tabs.push({ name: 'nfc', icon: 'nfc', label: 'NFC' })
  return tabs
})

const activeTab = ref('keyboard')

const onTabChange = (tab) => {
  // Stop camera when leaving the camera tab
  if (tab !== 'camera' && cameraActive.value) {
    stopCameraStream()
  }
  // Abort NFC when leaving the NFC tab
  if (tab !== 'nfc' && nfcActive.value) {
    stopNfc()
  }
  // Auto-focus keyboard input when switching to keyboard tab
  if (tab === 'keyboard') {
    nextTick(() => keyboardInputRef.value?.focus())
  }
}

// ── Keyboard / Manual input ─────────────────────────────────────────────────
const keyboardInput = ref('')
const keyboardInputRef = ref(null)

const onKeyboardEnter = () => {
  const code = keyboardInput.value?.trim()
  if (!code || props.loading) return
  keyboardInput.value = ''
  emit('scanned', code)
  nextTick(() => keyboardInputRef.value?.focus())
}

// ── Camera scanner ──────────────────────────────────────────────────────────
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
let cameraStartToken = 0

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
          // Fire-and-forget: do not await so the rAF loop is never blocked by the caller's API call
          emit('scanned', code)
        }
      }
    } catch (error) {
      // BarcodeDetector may throw when the video frame is not ready; log unexpected errors
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
  cameraStartToken++ // invalidate any in-progress startCamera
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
  const token = ++cameraStartToken
  cameraLoading.value = true
  try {
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Stale startup (tab switched away or a newer start was requested) — discard the stream
    if (token !== cameraStartToken) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    cameraStream = stream
    videoRef.value.srcObject = cameraStream

    // Enumerate cameras after first getUserMedia (permissions are now granted)
    if (cameras.value.length === 0) {
      await enumerateCameras()
    }

    // Check after enumerateCameras in case the startup became stale during the await
    if (token !== cameraStartToken) {
      stopCameraStream()
      return
    }

    await new Promise((resolve) => {
      videoRef.value.onloadedmetadata = resolve
    })

    // Check again after the async waits
    if (token !== cameraStartToken) {
      stopCameraStream()
      return
    }

    cameraActive.value = true
    startCameraScanning()
  } catch (error) {
    if (token === cameraStartToken) {
      $q.notify({ message: `Camera error: ${error.message}`, color: 'red' })
    }
  } finally {
    if (token === cameraStartToken) {
      cameraLoading.value = false
    }
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
const nfcActive = ref(false)
const nfcLoading = ref(false)

let nfcAbortController = null

const stopNfc = () => {
  if (nfcAbortController) {
    nfcAbortController.abort()
    nfcAbortController = null
  }
  nfcActive.value = false
}

const toggleNfc = async () => {
  if (nfcActive.value) {
    stopNfc()
    return
  }

  nfcLoading.value = true
  try {
    const reader = new window.NDEFReader()
    nfcAbortController = new AbortController()

    // Set active BEFORE adding listeners so no read event is missed (race condition fix)
    nfcActive.value = true

    reader.addEventListener('reading', ({ message }) => {
      for (const record of message.records) {
        let code = null
        try {
          if (record.recordType === 'text') {
            code = new TextDecoder(record.encoding || 'utf-8').decode(record.data)
          } else {
            code = new TextDecoder().decode(record.data)
          }
        } catch {
          // ignore undecodable records
        }
        if (code) {
          emit('scanned', code)
          break
        }
      }
    }, { signal: nfcAbortController.signal })

    reader.addEventListener('readingerror', () => {
      $q.notify({ message: 'NFC read error', color: 'red' })
    }, { signal: nfcAbortController.signal })

    // Pass AbortController signal so the scan can be properly stopped
    await reader.scan({ signal: nfcAbortController.signal })
  } catch (error) {
    if (error.name !== 'AbortError') {
      $q.notify({ message: `NFC error: ${error.message}`, color: 'red' })
      nfcActive.value = false
    }
    nfcAbortController = null
  } finally {
    nfcLoading.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Check camera support: requires getUserMedia + BarcodeDetector
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
  stopNfc()
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
