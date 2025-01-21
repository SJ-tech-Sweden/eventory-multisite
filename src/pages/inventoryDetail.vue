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
      <q-card-section v-if="inventoryItem && inventoryItem.rental" class="relative-position">
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
        <q-avatar class="responsive-avatar" size="100px">
          <q-img :src="login.organisationLogo"></q-img>
        </q-avatar>
      </q-card-section>
    </q-card>

    <q-card v-if="!loading">
      <q-card-section>
        <div class="text-h6">Calendar View</div>
        <div class="q-gutter-sm">
          <q-btn label="Today" @click="goToToday" />
          <q-btn label="Previous Month" @click="goToPreviousMonth" />
          <q-btn label="Next Month" @click="goToNextMonth" />
        </div>
        <div style="display: flex; justify-content: center; align-items: center; flex-wrap: nowrap">
          <div style="font-size: 2em">{{ formattedMonth }}</div>
        </div>
        <q-calendar-month
          ref="calendar"
          v-model="calendarDate"
          :events="calendarEvents"
          :weekdays="[1, 2, 3, 4, 5, 6, 0]"
          :day-min-height="40"
          date-align="right"
          animated
          bordered
          use-navigation
        >
          <template v-slot:day="{ scope }">
            <div
              v-for="event in getEventsForDate(scope.timestamp.date)"
              :key="event.id"
              class="event"
              :style="{ backgroundColor: event.color }"
            >
              <div>{{ event.title }}</div>
            </div>
          </template>
        </q-calendar-month>
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
// Import necessary modules and components
import { ref, onMounted, computed } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar'

// Define reactive variables and references
const loginStore = useLoginStore()
const route = useRoute()
const inventoryItem = ref(null)
const loading = ref(true)
const error = ref(null)
const login = ref(null)
const calendarDate = ref(new Date().toISOString().substr(0, 10))
const calendarEvents = ref([])
const calendar = ref(null)

// Refresh login tokens
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// Fetch the inventory item
const fetchInventoryItem = async () => {
  const inventoryId = route.params.inventoryid
  const userId = route.params.userid

  console.log('User ID from route:', userId)
  console.log('Login store contents:', loginStore.logins)

  // Ensure userId is a string for comparison
  const userIdStr = String(userId)

  // Find the corresponding login
  login.value = loginStore.logins.find((login) => String(login.id) === userIdStr)

  if (!login.value) {
    console.error('Login not found for userId:', userId)
    return
  }
  try {
    const response = await axios.get(`/api/rentals/${inventoryId}`, {
      headers: {
        Authorization: `Bearer ${login.value.access_token}`,
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

// Computed property to format the month
const formattedMonth = computed(() => {
  const date = new Date(calendarDate.value)
  const formatter = monthFormatter()
  return formatter ? formatter.format(date) + ' ' + date.getFullYear() : ''
})

// Function to format the month
function monthFormatter() {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      timeZone: 'UTC',
    })
  } catch {
    //
  }
}

// Function to move the calendar to today
function goToToday() {
  if (calendar.value) {
    calendar.value.moveToToday()
  }
}

// Function to move the calendar to the previous month
function goToPreviousMonth() {
  if (calendar.value) {
    calendar.value.prev()
  }
}

// Function to move the calendar to the next month
function goToNextMonth() {
  if (calendar.value) {
    calendar.value.next()
  }
}

// Function to get the events for a specific date
const getEventsForDate = (date) => {
  const dateStr = date
  let quantity = inventoryItem.value.rental.stockLevel
  // Check if the date is within a active pack list
  inventoryItem.value.activePackLists.forEach((packList) => {
    if (dateStr >= packList.startDate && dateStr <= packList.endDate) {
      quantity -= packList.quantity
    }
  })
  // Check if the date is within a archived pack list
  inventoryItem.value.archivedPackLists.forEach((packList) => {
    if (dateStr >= packList.startDate && dateStr <= packList.endDate) {
      quantity -= packList.quantity
    }
  })
  const eventForDay = []
  // Calculate the stockLevel
  const stockLevel = {
    title: `Available: ${quantity}`,
    date: date,
    color: quantity > 0 ? 'green' : quantity === 0 ? 'orange' : 'red',
  }
  // Check if the date is within a active pack list
  inventoryItem.value.activePackLists.forEach((packList) => {
    if (dateStr >= packList.startDate && dateStr <= packList.endDate) {
      eventForDay.push({
        id: packList.packListId,
        title: `${packList.jobName} - ${packList.packListName} (${packList.quantity})`,
        start: packList.startDate,
        end: packList.endDate,
        color: 'blue',
      })
    }
  })
  // Check if the date is within a archived pack list
  inventoryItem.value.archivedPackLists.forEach((packList) => {
    if (dateStr >= packList.startDate && dateStr <= packList.endDate) {
      eventForDay.push({
        id: packList.packListId,
        title: `${packList.jobName} - ${packList.packListName} (${packList.quantity})`,
        start: packList.startDate,
        end: packList.endDate,
        color: 'grey',
      })
    }
  })

  eventForDay.push(stockLevel)
  console.info(eventForDay)

  return eventForDay
}

// Fetcching the inventory item on mounted
onMounted(() => {
  fetchInventoryItem()
})
</script>

<style scoped>
.relative-position {
  position: relative;
}

.responsive-avatar {
  position: absolute;
  top: 20px;
  right: 20px;
}

@media (max-width: 600px) {
  .responsive-avatar {
    top: auto;
    bottom: 20px;
    right: 20px;
  }
}
</style>
