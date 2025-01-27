<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Check Out Equipment</div>
        <q-btn icon="event" round color="primary">
          <q-popup-proxy
            @before-show="selectedDate"
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              v-model="selectedDate"
              range
              @update:model-value="filterJobsByDateRange"
              mask="YYYY-MM-DD"
              :events="dateJobs"
              first-day-of-week="1"
              :event-color="getJobColor"
              today-btn
              :landscape="$q.screen.gt.xs"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="OK" color="primary" flat v-close-popup />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-btn>
      </q-card-section>
      <q-card-section>
        <q-card v-for="packlist in packlists" :key="packlist.id" class="nested-card">
          <q-card-section>
            <q-avatar class="responsive-avatar" size="100px">
              <q-img :src="packlist.organisationLogo"></q-img>
            </q-avatar>
            <div class="text-h6">Pack List Name: {{ packlist.name }}</div>
            <div class="text-subtitle">Job Name: {{ packlist.jobName }}</div>
            <div class="text-subtitle">Start Date: {{ packlist.startDate }}</div>
            <div class="text-subtitle">
              Status: {{ packlist.jobStatus }} <q-icon :name="getIcon(packlist.jobStatus)" />
            </div>
            <div class="text-subtitle">Organisation: {{ packlist.organisation }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-h6">Rentals</div>
            <q-table
              :rows="packlist.mappedRentals"
              :columns="rentalColumns"
              row-key="id"
              :rows-per-page-options="[0]"
            >
              <template v-slot:body-cell-checkout="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkout = Math.max(0, props.row.checkout - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkout"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkout++" />
                    <q-btn
                      icon="logout"
                      @click="checkOutItem(props.row, 'rental', packlist.login)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
          <q-card-section v-if="packlist.mappedConsumables.length">
            <div class="text-h6">Consumables</div>
            <q-table
              :rows="packlist.mappedConsumables"
              :columns="consumableColumns"
              row-key="id"
              :rows-per-page-options="[0]"
            >
              <template v-slot:body-cell-checkout="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkout = Math.max(0, props.row.checkout - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkout"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkout++" />
                    <q-btn
                      icon="logout"
                      @click="checkOutItem(props.row, 'consumable', packlist.login)"
                    />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
          <q-card-section v-if="packlist.mappedSubrentals.length">
            <div class="text-h6">Subrentals</div>
            <q-table
              :rows="packlist.mappedSubrentals"
              :columns="subrentalColumns"
              row-key="id"
              :rows-per-page-options="[0]"
            >
              <template v-slot:body-cell-checkout="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkout = Math.max(0, props.row.checkout - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkout"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkout++" />
                    <q-btn
                      icon="logout"
                      @click="checkOutItem(props.row, 'subrental', packlist.login)"
                    />
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-rent="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.rent = Math.max(0, props.row.rent - 1)"
                    />
                    <q-input
                      v-model.number="props.row.rent"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                      class="no-spin-buttons"
                    />
                    <q-btn icon="add" @click="props.row.rent++" />
                    <q-btn icon="arrow_downward" @click="rentItem(props.row, packlist.login)" />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref, onMounted, computed } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { getIcon } from 'src/utils/getIcon'
import { closestQuasarColor } from 'src/utils/colorUtils'

// Define the login store
const loginStore = useLoginStore()
const $q = useQuasar()
const jobs = ref([])

// Sort by date
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

// Define reactive variables and references
const filteredJobs = ref([])
const packlists = ref([])

// Refresh login tokens
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// Define columns for the tables
const rentalColumns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  { name: 'quantity', align: 'center', label: 'Quantity', field: 'quantity', sortable: true },
  { name: 'checkout', align: 'center', label: 'Check out', field: 'checkout', sortable: false },
  { name: 'out', align: 'center', label: 'Out', field: 'out', sortable: true },
]

const consumableColumns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  { name: 'quantity', align: 'center', label: 'Quantity', field: 'quantity', sortable: true },
  { name: 'checkout', align: 'center', label: 'Check out', field: 'checkout', sortable: false },
  { name: 'out', align: 'right', label: 'Out', field: 'out', sortable: true },
]

const subrentalColumns = [
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left',
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  { name: 'quantity', align: 'center', label: 'Quantity', field: 'quantity', sortable: true },
  { name: 'out', align: 'center', label: 'Out', field: 'out', sortable: true },
  { name: 'checkout', align: 'center', label: 'Check out', field: 'checkout', sortable: false },
  { name: 'supplier', align: 'left', label: 'Supplier', field: 'supplier', sortable: true },
  { name: 'rent', align: 'center', label: 'Rent', field: 'rent', sortable: false },
  {
    name: 'rentedUnits',
    align: 'center',
    label: 'Rented Units',
    field: 'rentedUnits',
    sortable: true,
  },
]

// Function to fetch jobs from the API
const fetchJobs = async () => {
  jobs.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/jobs/list', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
        })
        console.info(
          `Fetched ${response.data.length} jobs for ${login.username} - ${login.organisation}`,
        )

        // Add organisation field to each event
        const fetchedJobs = response.data.map((event) => ({
          ...event, // Spread existing event properties
          organisation: login.organisation, // Add organisation property
          color: login.color,
          organisationLogo: login.organisationLogo,
          login: login,
        }))

        // Sort jobs by startDate
        fetchedJobs.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        jobs.value.push(...fetchedJobs)
        // console.info(`Total jobs: ${JSON.stringify(jobs.value)}`)
        console.log(`dateJobs: ${JSON.stringify(dateJobs.value)}`)
        filterJobsByDateRange(selectedDate.value) // Filter jobs after fetching
      } catch (error) {
        console.error(`Failed to fetch jobs for ${login.username}:`, error)
      }
    }
  }
}

const dateJobs = computed(() => {
  const datesWithJobs = new Set(jobs.value.map((event) => event.startDate.replace(/-/g, '/')))
  return Array.from(datesWithJobs)
})

const getJobColor = (date) => {
  console.info(`Date: ${date}`)
  const formattedDate = date.replace(/\//g, '-') // Format input date if needed
  console.info(`formattedDate: ${formattedDate}`)
  const matchingJob = jobs.value.find((event) => event.startDate === formattedDate)
  console.info(`Matching jobs: ${closestQuasarColor(matchingJob.color) || 'primary'}`)
  return closestQuasarColor(matchingJob.color) || 'primary'
}

const filterJobsByDateRange = (range) => {
  console.info(`Filtering jobs by date range: ${JSON.stringify(range)}`)

  if (range.from && range.to) {
    // Handle date range
    const { from, to } = range
    console.info(`Filtering jobs between ${from} and ${to}`)
    filteredJobs.value = jobs.value.filter((event) => {
      const eventDate = new Date(event.startDate)
      return eventDate >= new Date(from) && eventDate <= new Date(to)
    })
  } else {
    // Handle single date
    const date = range
    console.info(`Filtering jobs for date: ${date}`)
    filteredJobs.value = jobs.value.filter((event) => event.startDate === date)
  }
  // Fetch packlist details for filtered jobs
  fetchPacklistDetailsForFilteredJobs()
}

// Function to fetch packlist details for filtered jobs
const fetchPacklistDetailsForFilteredJobs = async () => {
  packlists.value = []
  for (const job of filteredJobs.value) {
    for (const packList of job.packLists) {
      const packlistResponse = await axios.get(`/api/pack-lists/details/${packList.id}`, {
        headers: {
          Authorization: `Bearer ${job.login.access_token}`,
        },
      })
      const packlistData = packlistResponse.data

      // Add job data to packlist
      packlistData.jobName = job.name
      packlistData.jobStatus = job.status
      packlistData.startDate = job.startDate
      packlistData.organisation = job.organisation
      packlistData.organisationLogo = job.organisationLogo
      packlistData.login = job.login // Add login information to packlist

      // Map rentals, consumables, and subrentals to include names from their respective trees
      packlistData.mappedRentals =
        packlistData.rentals?.map((rental) => {
          const rentalItem = findItemInTree(packlistData.rentalsTree || [], rental.id)
          return { ...rental, name: rentalItem ? rentalItem.name : '', checkout: rental.quantity }
        }) || []

      packlistData.mappedConsumables =
        packlistData.consumables?.map((consumable) => {
          const consumableItem = findItemInTree(packlistData.consumablesTree || [], consumable.id)
          return {
            ...consumable,
            name: consumableItem ? consumableItem.name : '',
            checkout: consumable.quantity,
          }
        }) || []

      packlistData.mappedSubrentals =
        packlistData.subrentals?.map((subrental) => {
          const internalItem = findItemInTree(
            packlistData.internalSubrentalsTree || [],
            subrental.id,
          )
          const externalItem = packlistData.externalSubrentals?.find(
            (item) => item.id === subrental.id,
          )
          const subrentalItem = internalItem || externalItem
          const name = subrentalItem ? subrentalItem.name : ''
          const supplier = subrentalItem ? subrentalItem.supplier : ''
          const rentedUnits = subrentalItem ? subrentalItem.rentedUnits : ''
          return {
            ...subrental,
            name,
            supplier,
            rentedUnits,
            checkout: subrental.quantity,
            rent: subrental.quantity,
          }
        }) || []
      console.info(`Fetched packlist details for ${JSON.stringify(packlistData)}`)
      // Check for duplicates before pushing
      if (!packlists.value.some((pl) => pl.id === packlistData.id)) {
        packlists.value.push(packlistData)
      }
    }
  }
  // Sort packlists by startDate
  packlists.value.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
}

// Helper function to find an item in a tree by ID
const findItemInTree = (tree, id) => {
  if (!Array.isArray(tree)) {
    return null
  }
  for (const node of tree) {
    if (node.id === id) {
      return node
    }
    if (node.children) {
      const found = findItemInTree(node.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

// Function to handle check-in action
const checkOutItem = async (item, type, login) => {
  console.log(`Checking in item: ${JSON.stringify(item)}`)

  let url = ''
  switch (type) {
    case 'rental':
      url = `/api/pack-list-rentals/${item.id}`
      break
    case 'consumable':
      url = `/api/pack-list-consumables/${item.id}`
      break
    case 'subrental':
      url = `/api/pack-list-subrentals/${item.id}`
      break
    default:
      console.error('Unknown item type')
      return
  }

  try {
    await axios.put(
      url,
      { out: (item.out ?? 0) + item.checkout },
      {
        headers: {
          Authorization: `Bearer ${login.access_token}`,
        },
      },
    )

    $q.notify({
      message: `Successfully checked out ${item.checkout} of ${item.name}`,
      color: 'green',
    })
    item.out = (item.out ?? 0) + item.checkout
    item.checkout = item.quantity - item.out
  } catch (error) {
    console.error(`Failed to check out item: ${item.name}`, error)
    $q.notify({
      message: `Failed to check out ${item.name}`,
      color: 'red',
    })
  }
}

// Function to handle return action
const rentItem = async (item, login) => {
  console.log(`Returning item: ${JSON.stringify(item)}`)

  try {
    await axios.put(
      `/api/pack-list-subrentals/${item.id}`,
      { rentedUnits: item.rentedUnits + item.rent },
      {
        headers: {
          Authorization: `Bearer ${login.access_token}`,
        },
      },
    )

    $q.notify({
      message: `Successfully rented ${item.rent} of ${item.name}`,
      color: 'green',
    })
    item.rentedUnits += item.rent
    item.rent = item.quantity - item.rentedUnits
  } catch (error) {
    console.error(`Failed to rent item: ${item.name}`, error)
    $q.notify({
      message: `Failed to rent ${item.name}`,
      color: 'red',
    })
  }
}

onMounted(() => {
  fetchJobs()
})
</script>
