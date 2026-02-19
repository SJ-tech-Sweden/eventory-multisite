<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Event Calendar</div>
        <q-date
          v-model="selectedDate"
          range
          @update:model-value="filterEventsByDateRange"
          mask="YYYY-MM-DD"
          :events="dateEvents"
          first-day-of-week="1"
          :event-color="getEventColor"
          today-btn
          :landscape="$q.screen.gt.xs"
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
          <q-card-section class="relative-position">
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
          </q-card-section>
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
// Import necessary modules and components
import { ref, onMounted, computed } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { closestQuasarColor } from 'src/utils/colorUtils'
import { getIcon } from 'src/utils/getIcon'

// Define reactive variables and references
const router = useRouter()
const loginStore = useLoginStore()
const today = new Date()
const twoWeeksFromToday = new Date(today)
twoWeeksFromToday.setDate(today.getDate() + 14)

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectedDate = ref({
  from: formatDate(today),
  to: formatDate(twoWeeksFromToday),
})
const events = ref([])
const filteredEvents = ref([])
const showingAllEvents = ref(false) // New state variable

// Function to fetch events from the API and merge job details (endDate)
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

        // Add organisation fields to each event
        const fetchedEvents = response.data.map((event) => ({
          ...event,
          organisation: login.organisation,
          color: login.color,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }))

        // Fetch job details for each event to get endDate
        const detailPromises = fetchedEvents.map((event) =>
          axios
            .get(`/api/jobs/details/${event.id}`, {
              headers: {
                Authorization: `Bearer ${login.access_token}`,
              },
            })
            .then((res) => ({
              ...event,
              endDate: res.data.endDate || event.startDate, // fallback if missing
            })),
        )
        const eventsWithEndDate = await Promise.all(detailPromises)

        // Sort events by startDate
        eventsWithEndDate.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        events.value.push(...eventsWithEndDate)
        console.info(`Total events: ${JSON.stringify(events.value)}`)
        console.log(`dateEvents: ${JSON.stringify(dateEvents.value)}`)
        console.log('events for dateEvents:', events.value)
        filterEventsByDateRange(selectedDate.value)
      } catch (error) {
        console.error(`Failed to fetch events for ${login.username}:`, error)
      }
    }
  }
}

const dateEvents = computed(() => {
  const datesWithEvents = new Set()
  for (const event of events.value) {
    if (!event.startDate || !event.endDate) continue
    const current = new Date(event.startDate)
    const end = new Date(event.endDate)
    if (isNaN(current) || isNaN(end)) continue
    while (current <= end) {
      const formatted = current.toISOString().slice(0, 10).replace(/-/g, '/')
      datesWithEvents.add(formatted)
      current.setDate(current.getDate() + 1)
    }
  }
  return Array.from(datesWithEvents)
})

const getEventColor = (date) => {
  const dateStr = date.replace(/\//g, '-')
  const event = events.value.find(
    (ev) => ev.startDate && ev.endDate && dateStr >= ev.startDate && dateStr <= ev.endDate,
  )

  return event && event.color ? closestQuasarColor(event.color) : 'primary'
}

function filterEventsByDateRange(selectedRange) {
  // selectedRange: { from: 'YYYY/MM/DD', to: 'YYYY/MM/DD' }
  if (!selectedRange || !selectedRange.from || !selectedRange.to) {
    filteredEvents.value = events.value
    return
  }

  // Convert to 'YYYY-MM-DD' for comparison
  const from = selectedRange.from.replace(/\//g, '-')
  const to = selectedRange.to.replace(/\//g, '-')

  filteredEvents.value = events.value.filter((event) => {
    if (!event.startDate || !event.endDate) return false
    // Event overlaps the selected range if:
    // event starts before or on the range end, and ends after or on the range start
    return event.startDate <= to && event.endDate >= from
  })
}

const showAllEvents = () => {
  filteredEvents.value = [...events.value]
  showingAllEvents.value = true // Set showingAllEvents to true when showing all events
}

onMounted(async () => {
  await fetchEvents()
})

// Function to navigate to the pack list page
function navigateToPackList(packListId, userid) {
  router.push(`/packlist/${packListId}/${userid}`)
}
</script>

<style scoped>
.q-card {
  max-width: 600px;
  margin: 0 auto 20px auto;
}

.relative-position {
  position: relative;
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
