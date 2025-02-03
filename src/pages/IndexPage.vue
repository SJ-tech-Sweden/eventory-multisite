<template>
  <q-page class="q-pa-md">
    <q-card v-for="login in loginStore.logins" :key="login.id" class="q-mb-md">
      <q-card-section class="row items-center">
        <q-avatar size="140px">
          <q-img :src="login.organisationLogo" />
        </q-avatar>
        <div class="q-ml-md flex-grow-1">
          <div class="text-h6">{{ login.organisation }}</div>
          <div class="text-subtitle1">{{ login.username }}</div>
          <div class="text-subtitle1">{{ login.firstName }} {{ login.lastName }}</div>
          <div
            :style="{
              backgroundColor: login.color,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
            }"
          ></div>
        </div>
        <div class="q-ml-md">
          <q-badge color="blue" class="q-mt-sm q-ml-md bigger-badge">
            Inventory rentals: {{ inventoryCounts[login.organisation]?.rentals ?? 'Loading...' }}
          </q-badge>
          <q-badge color="green" class="q-mt-sm q-ml-md bigger-badge">
            Inventory consumables:
            {{ inventoryCounts[login.organisation]?.consumables ?? 'Loading...' }}
          </q-badge>
          <q-badge color="orange" class="q-mt-sm q-ml-md bigger-badge">
            Customers: {{ inventoryCounts[login.organisation]?.customers ?? 'Loading...' }}
          </q-badge>
          <q-badge color="red" class="q-mt-sm q-ml-md bigger-badge">
            Jobs: {{ inventoryCounts[login.organisation]?.jobs ?? 'Loading...' }}
          </q-badge>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { useLoginStore } from 'src/stores/loginStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const loginStore = useLoginStore()
const router = useRouter()

const inventoryCounts = ref({})

const fetchInventories = async () => {
  const counts = {}
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const [rentalsResponse, consumablesResponse, customersResponse, jobsResponse] =
          await Promise.all([
            axios.get('/api/inventory-rentals', {
              headers: {
                Authorization: `Bearer ${login.access_token}`,
              },
            }),
            axios.get('/api/inventory-consumables', {
              headers: {
                Authorization: `Bearer ${login.access_token}`,
              },
            }),
            axios.get('/api/customers/list', {
              headers: {
                Authorization: `Bearer ${login.access_token}`,
              },
            }),
            axios.get('/api/jobs/list', {
              headers: {
                Authorization: `Bearer ${login.access_token}`,
              },
            }),
          ])

        counts[login.organisation] = {
          rentals: countTotalItems(rentalsResponse.data),
          consumables: countTotalItems(consumablesResponse.data),
          customers: customersResponse.data.length,
          jobs: jobsResponse.data.length,
        }
      } catch (error) {
        console.error(`Error fetching data for ${login.organisation}:`, error)
        counts[login.organisation] = {
          rentals: 'Error',
          consumables: 'Error',
          customers: 'Error',
          jobs: 'Error',
        }
      }
    }
  }
  inventoryCounts.value = counts
}

// Recursively count inventory items
const countTotalItems = (items) => {
  let count = 0
  items.forEach((item) => {
    count++ // Count the item itself
    if (item.children) {
      count += countTotalItems(item.children) // Count the children items
    }
  })
  return count
}

const redirectToLoginManager = () => {
  router.push('/login-manager')
}

onMounted(() => {
  if (loginStore.logins.length === 0) {
    redirectToLoginManager()
  } else {
    fetchInventories()
  }
})
</script>

<style scoped>
.q-responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.q-card-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.q-avatar {
  flex-shrink: 0;
}

.flex-grow-1 {
  flex-grow: 1;
}

.q-badge {
  margin-top: 0;
  margin-left: auto;
  margin: 0.2em;
}

.bigger-badge {
  font-size: 1.2em; /* Adjust the size as needed */
  padding: 0.5em 1em; /* Adjust the padding as needed */
}
</style>
