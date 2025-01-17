<template>
  <q-page padding>
    <q-card v-if="loading">
      <q-card-section>
        <q-spinner size="50px" />
        <div>Loading...</div>
      </q-card-section>
    </q-card>

    <q-card v-else-if="error">
      <q-card-section>
        <div class="text-negative">Failed to load inventory item: {{ error }}</div>
      </q-card-section>
    </q-card>

    <q-card v-else>
      <q-card-section v-if="inventoryItem && inventoryItem.rental">
        <div class="text-h6">{{ inventoryItem.rental.name }}</div>
        <q-img :src="inventoryItem.rental.imageUrl" alt="Item Image" width="300px" />
        <div>Description: {{ inventoryItem.rental.description }}</div>
        <div>Weight: {{ inventoryItem.rental.weight }} kg</div>
        <div>Stock Level: {{ inventoryItem.rental.stockLevel }}</div>
        <div>Daily Rate: {{ inventoryItem.rental.dailyRate }}</div>
        <div>Value: {{ inventoryItem.rental.value }}</div>
        <div>Article Number: {{ inventoryItem.rental.articleNumber }}</div>
        <div>Tenant: {{ inventoryItem.rental.tenant }}</div>
        <div>Updated At: {{ new Date(inventoryItem.rental.updated_at).toLocaleString() }}</div>
        <div>Created At: {{ new Date(inventoryItem.rental.created_at).toLocaleString() }}</div>
      </q-card-section>
    </q-card>

    <q-card
      v-if="inventoryItem && inventoryItem.activePackLists && inventoryItem.activePackLists.length"
    >
      <q-card-section>
        <div class="text-h6">Active Pack Lists</div>
        <q-list bordered>
          <q-item v-for="packList in inventoryItem.activePackLists" :key="packList.packListId">
            <q-item-section>
              <div>Pack List Name: {{ packList.packListName }}</div>
              <div>Job Name: {{ packList.jobName }}</div>
              <div>Quantity: {{ packList.quantity }}</div>
              <div>Start Date: {{ packList.startDate }}</div>
              <div>End Date: {{ packList.endDate }}</div>
              <div>Status: {{ packList.jobStatus }}</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-card
      v-if="
        inventoryItem && inventoryItem.archivedPackLists && inventoryItem.archivedPackLists.length
      "
    >
      <q-card-section>
        <div class="text-h6">Archived Pack Lists</div>
        <q-list bordered>
          <q-item v-for="packList in inventoryItem.archivedPackLists" :key="packList.packListId">
            <q-item-section>
              <div>Pack List Name: {{ packList.packListName }}</div>
              <div>Job Name: {{ packList.jobName }}</div>
              <div>Quantity: {{ packList.quantity }}</div>
              <div>Start Date: {{ packList.startDate }}</div>
              <div>End Date: {{ packList.endDate }}</div>
              <div>Status: {{ packList.jobStatus }}</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRoute } from 'vue-router'
import axios from 'axios'

const loginStore = useLoginStore()
const route = useRoute()
const inventoryItem = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchInventoryItem = async () => {
  const inventoryId = route.params.inventoryid
  const userId = route.params.userid

  console.log('User ID from route:', userId)
  console.log('Login store contents:', loginStore.logins)

  // Ensure userId is a string for comparison
  const userIdStr = String(userId)

  // Find the corresponding login
  const login = loginStore.logins.find((login) => String(login.id) === userIdStr)

  if (!login) {
    console.error('Login not found for userId:', userId)
    return
  }
  try {
    const response = await axios.get(`/api/rentals/${inventoryId}`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
      },
    })
    console.info('Fetched inventoryItem:', response.data)
    inventoryItem.value = response.data
  } catch (error) {
    error.value = error.message
    console.error('Failed to fetch inventoryItem:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInventoryItem()
})
</script>
