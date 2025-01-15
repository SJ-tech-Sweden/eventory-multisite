<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Event Calendar</div>
        <q-date
          v-model="selectedDate"
          minimal
          range
          @update:model-value="filterEventsByDateRange"
          mask="YYYY-MM-DD"
          :events="dateEvents"
          :event-color="getEventColor"
          first-day-of-week="1"
        />
        <div class="button-wrapper">
          <q-btn color="primary" label="Show All Events" @click="showAllEvents" />
        </div>
      </q-card-section>
    </q-card>

    <q-separator spaced />

    <q-card v-if="filteredEvents.length">
      <q-card-section>
        <div class="text-h6" v-if="showingAllEvents">All events</div>
        <div class="text-h6" v-else-if="selectedDate.from">
          Events from {{ selectedDate.from }} to {{ selectedDate.to }}
        </div>
        <div class="text-h6" v-else>Events on {{ selectedDate }}</div>

        <q-card v-for="event in filteredEvents" :key="event.id">
          <q-item-section>
            <div class="avatar-wrapper">
              <q-avatar>
                <q-img
                  :color="event.color"
                  :text-color="event.color"
                  :src="event.organisationLogo"
                ></q-img>
              </q-avatar>
            </div>
            <div class="text-subtitle1">{{ event.name }}</div>
            <div class="text-caption">
              Status: {{ event.status }} <q-icon :name="getIcon(event.status)" />
            </div>
            <div class="text-caption">Start Date: {{ event.startDate }}</div>
            <div class="text-caption">organisation: {{ event.organisation }}</div>
          </q-item-section>
          <q-item-label header>Pack Lists</q-item-label>
          <q-list>
            <q-item v-for="packList in event.packLists" :key="packList.id">
              <q-item-section avatar>
                <q-icon name="checklist" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Name:</q-item-label>
                <q-item-label caption>{{ packList.name }}</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-icon :name="packList.hasItemsOut ? 'arrow_forward' : 'check'" />
              </q-item-section>
              <q-item-section>
                <q-btn
                  color="primary"
                  label="Open"
                  @click="navigateToPackList(packList.id, event.userid)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-card-section>
    </q-card>

    <q-card v-else>
      <q-card-section v-if="selectedDate.from">
        No events found from {{ selectedDate.from }} to {{ selectedDate.to }}
      </q-card-section>
      <q-card-section v-else> No events found for {{ selectedDate }} </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRouter } from 'vue-router'
import axios from 'axios'
const router = useRouter()

const loginStore = useLoginStore()
const selectedDate = ref(new Date().toISOString().substr(0, 10))
const events = ref([])
const filteredEvents = ref([])
const showingAllEvents = ref(false) // New state variable

const fetchEvents = async () => {
  events.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/jobs/list', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
        })
        console.info(
          `Fetched ${response.data.length} events for ${login.username} - ${login.organisation}`,
        )

        // Add organisation field to each event
        const fetchedEvents = response.data.map((event) => ({
          ...event, // Spread existing event properties
          organisation: login.organisation, // Add organisation property
          color: login.color,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }))

        // Sort events by startDate
        fetchedEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        events.value.push(...fetchedEvents)
        console.info(`Total events: ${JSON.stringify(events.value)}`)
        console.log(`dateEvents: ${JSON.stringify(dateEvents.value)}`)
      } catch (error) {
        console.error(`Failed to fetch events for ${login.username}:`, error)
      }
    }
  }
}

const dateEvents = computed(() => {
  const datesWithEvents = new Set(events.value.map((event) => event.startDate.replace(/-/g, '/')))
  return Array.from(datesWithEvents)
})

const getEventColor = (date) => {
  console.info(`Date: ${date}`)
  const formattedDate = date.replace(/\//g, '-') // Format input date if needed
  console.info(`formattedDate: ${formattedDate}`)
  const matchingEvent = events.value.find((event) => event.startDate === formattedDate)
  console.info(`Matching events: ${JSON.stringify(matchingEvent.color)}`)
  return matchingEvent.color || 'primary'
}

const filterEventsByDateRange = (range) => {
  console.info(`Filtering events by date range: ${JSON.stringify(range)}`)
  showingAllEvents.value = false // Reset showingAllEvents when filtering by date range

  if (range.from && range.to) {
    // Handle date range
    const { from, to } = range
    console.info(`Filtering events between ${from} and ${to}`)
    filteredEvents.value = events.value.filter((event) => {
      const eventDate = new Date(event.startDate)
      return eventDate >= new Date(from) && eventDate <= new Date(to)
    })
  } else {
    // Handle single date
    const date = range
    console.info(`Filtering events for date: ${date}`)
    filteredEvents.value = events.value.filter((event) => event.startDate === date)
  }
}

const showAllEvents = () => {
  filteredEvents.value = [...events.value]
  showingAllEvents.value = true // Set showingAllEvents to true when showing all events
}

onMounted(() => {
  fetchEvents()
})

function navigateToPackList(packListId, userid) {
  router.push(`/packlist/${packListId}/${userid}`)
}
function getIcon(status) {
  switch (status) {
    case 'confirmed':
      return 'done'
    case 'returned':
      return 'arrow_back'
    case 'quotation':
      return 'question_mark'
    case 'canceled':
      return 'close' // Use 'close' instead of 'X' for better compatibility
    case 'checked_out':
      return 'arrow_forward'
    case 'completed':
      return 'done_all' // Use 'check_circle' for double checkmarks
    default:
      return 'help' // Default to a help icon if the status is unknown
  }
}
</script>

<style scoped>
.q-card {
  max-width: 600px;
  margin: 0 auto 20px auto;
}

.avatar-wrapper {
  position: absolute;
  top: 10px;
  right: 10px;
}
.button-wrapper {
  margin: 16px; /* Adjust the value as needed */
}
</style>
