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
          <q-card-section class="relative-position">
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
          <q-card-actions>
            <q-btn
              color="primary"
              label="View Pack List"
              @click="navigateToPackList(packlist.id, packlist.login.id)"
            />
            <q-btn
              color="secondary"
              label="Add Extra"
              @click="openAddExtraDialog(packlist)"
            />
          </q-card-actions>
          <q-card-section>
            <div class="text-h6">Rentals</div>
            <q-table
              :rows="packlist.mappedRentals"
              :columns="rentalColumns"
              row-key="id"
              :rows-per-page-options="[0]"
              :grid="$q.screen.xs"
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
              <template v-slot:item="props">
                <q-card class="nested-card">
                  <q-card-section>
                    <div class="text-subtitle">{{ props.row.name }}</div>
                  </q-card-section>
                  <q-card-section>
                    <div class="text-caption">Quantity: {{ props.row.quantity }}</div>
                    <div class="text-caption">Out: {{ props.row.out }}</div>
                    <div class="text-caption">
                      Checkout:
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
                    </div>
                  </q-card-section>
                </q-card>
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
              :grid="$q.screen.xs"
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
              <template v-slot:item="props">
                <q-card class="nested-card">
                  <q-card-section>
                    <div class="text-subtitle">{{ props.row.name }}</div>
                  </q-card-section>
                  <q-card-section>
                    <div class="text-caption">Quantity: {{ props.row.quantity }}</div>
                    <div class="text-caption">Out: {{ props.row.out }}</div>
                    <div class="text-caption">
                      Checkout:
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
                    </div>
                  </q-card-section>
                </q-card>
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
              :grid="$q.screen.xs"
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
              <template v-slot:item="props">
                <q-card class="nested-card">
                  <q-card-section>
                    <div class="text-subtitle">{{ props.row.name }}</div>
                  </q-card-section>
                  <q-card-section>
                    <div class="text-caption">Quantity: {{ props.row.quantity }}</div>
                    <div class="text-caption">Out: {{ props.row.out }}</div>
                    <div class="text-caption">
                      Checkout:
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
                    </div>
                    <div class="text-caption">Supplier: {{ props.row.supplier }}</div>
                    <div class="text-caption">
                      Rent:
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
                        />
                        <q-btn icon="add" @click="props.row.rent++" />
                        <q-btn icon="arrow_downward" @click="rentItem(props.row, packlist.login)" />
                      </div>
                    </div>
                    <div class="text-caption">Rented Units: {{ props.row.rentedUnits }}</div>
                  </q-card-section>
                </q-card>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>

    <!-- Dialog for adding extra items to a packlist -->
    <q-dialog v-model="showAddExtraDialog" full-width>
      <q-card>
        <q-card-section>
          <div class="text-h6">Add extras to Packlist</div>
          <q-input ref="filterRef" filled v-model="filter" label="Filter">
            <template v-slot:append>
              <q-icon
                v-if="filter !== ''"
                name="clear"
                class="cursor-pointer"
                @click="resetFilter"
              />
            </template>
          </q-input>
          <div v-if="loadingAvailability" class="q-mt-sm text-caption text-grey-7">
            <q-spinner size="xs" />
            Loading availability<template v-if="currentPacklist"
              > for {{ currentPacklist.startDate }}
              <template v-if="currentJobEndDate"> – {{ currentJobEndDate }}</template></template
            >...
          </div>
        </q-card-section>
        <q-tabs v-model="activeTab" dense align="left">
          <q-tab name="rentals" label="Rentals" />
          <q-tab name="consumables" label="Consumables" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="activeTab" animated>
          <q-tab-panel name="rentals">
            <q-btn :label="expandAllLabel" @click="toggleExpandAll" class="q-mb-md" />
            <div class="tree-container">
              <q-tree
                :nodes="filteredInventoryWithTickable"
                node-key="id"
                :filter-method="filterMethod"
                ref="inventoryTree"
                v-model:expanded="expandedKeysInventory"
                @update:expanded="handleExpandedKeys"
                v-model:ticked="tickedRentals"
                tick-strategy="none"
                full-width
              >
                <template v-slot:default-header="scope">
                  <q-item>
                    <q-item-section>
                      {{ scope.node.name }} - {{ scope.node.organisation }}
                      <q-badge
                        v-if="
                          scope.node.tickable &&
                          inventoryAvailability[scope.node.id] !== undefined
                        "
                        :color="availabilityColor(inventoryAvailability[scope.node.id])"
                        :label="`Available: ${inventoryAvailability[scope.node.id]}`"
                        class="q-ml-sm"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-input
                        v-if="!scope.node.children"
                        v-model="scope.node.quantity"
                        type="number"
                        min="0"
                      />
                    </q-item-section>
                    <q-item-section v-if="scope.node.tickable" side>
                      <q-checkbox
                        :model-value="tickedRentals.includes(scope.node.id)"
                        @update:model-value="
                          (val) => {
                            if (val) {
                              if (!tickedRentals.includes(scope.node.id)) {
                                tickedRentals.push(scope.node.id)
                              }
                            } else {
                              const idx = tickedRentals.indexOf(scope.node.id)
                              if (idx !== -1) {
                                tickedRentals.splice(idx, 1)
                              }
                            }
                          }
                        "
                        @click.stop
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </q-tree>
            </div>
          </q-tab-panel>
          <q-tab-panel name="consumables">
            <q-btn :label="expandAllLabelConsumables" @click="toggleExpandAllConsumables" class="q-mb-md" />
            <div class="tree-container">
              <q-tree
                :nodes="filteredConsumablesWithTickable"
                node-key="id"
                :filter-method="filterMethod"
                ref="consumablesTree"
                v-model:expanded="expandedKeysConsumables"
                @update:expanded="handleExpandedKeysConsumables"
                v-model:ticked="tickedConsumables"
                tick-strategy="none"
                full-width
              >
                <template v-slot:default-header="scope">
                  <q-item>
                    <q-item-section>
                      {{ scope.node.name }} - {{ scope.node.organisation }}
                      <q-badge
                        v-if="
                          scope.node.tickable &&
                          inventoryAvailability[scope.node.id] !== undefined
                        "
                        :color="availabilityColor(inventoryAvailability[scope.node.id])"
                        :label="`Available: ${inventoryAvailability[scope.node.id]}`"
                        class="q-ml-sm"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-input
                        v-if="!scope.node.children"
                        v-model="scope.node.quantity"
                        type="number"
                        min="0"
                      />
                    </q-item-section>
                    <q-item-section v-if="scope.node.tickable" side>
                      <q-checkbox
                        :model-value="tickedConsumables.includes(scope.node.id)"
                        @update:model-value="
                          (val) => {
                            if (val) {
                              if (!tickedConsumables.includes(scope.node.id)) {
                                tickedConsumables.push(scope.node.id)
                              }
                            } else {
                              const idx = tickedConsumables.indexOf(scope.node.id)
                              if (idx !== -1) {
                                tickedConsumables.splice(idx, 1)
                              }
                            }
                          }
                        "
                        @click.stop
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </q-tree>
            </div>
          </q-tab-panel>
        </q-tab-panels>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Add extras" color="primary" @click="addExtra()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref, onMounted, computed } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { getIcon } from 'src/utils/getIcon'
import { closestQuasarColor } from 'src/utils/colorUtils'

// Define the login store
const loginStore = useLoginStore()
const $q = useQuasar()
const router = useRouter()
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
      packlistData.jobId = job.id
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

// Function to navigate to the pack list detail page
const navigateToPackList = (packlistId, userId) => {
  router.push(`/packlist/${packlistId}/${userId}`)
}

// Add Extra dialog state
const showAddExtraDialog = ref(false)
const activeTab = ref('rentals')
const currentPacklist = ref(null)
const currentJobEndDate = ref(null)
const inventory = ref([])
const consumablesInventory = ref([])
const filter = ref('')
const filterRef = ref(null)
const inventoryTree = ref(null)
const consumablesTree = ref(null)
const isExpanded = ref(false)
const isExpandedConsumables = ref(false)
const expandedKeysInventory = ref([])
const expandedKeysConsumables = ref([])
const tickedRentals = ref([])
const tickedConsumables = ref([])
const inventoryAvailability = ref({})
const loadingAvailability = ref(false)

const addPropertiesToTree = (nodes, properties) => {
  return nodes.map((node) => {
    const updatedNode = { ...node, ...properties }
    if (node.children) {
      updatedNode.children = addPropertiesToTree(node.children, properties)
    }
    return updatedNode
  })
}

const fetchInventory = async () => {
  inventory.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/inventory-rentals', {
          headers: { Authorization: `Bearer ${login.access_token}` },
        })
        const properties = {
          organisation: login.organisation,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }
        inventory.value.push(...addPropertiesToTree(response.data, properties))
      } catch (error) {
        console.error(`Failed to fetch inventory for ${login.username}:`, error)
      }
    }
  }
}

const fetchConsumables = async () => {
  consumablesInventory.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/inventory-consumables', {
          headers: { Authorization: `Bearer ${login.access_token}` },
        })
        const properties = {
          organisation: login.organisation,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }
        consumablesInventory.value.push(...addPropertiesToTree(response.data, properties))
      } catch (error) {
        console.error(`Failed to fetch consumables for ${login.username}:`, error)
      }
    }
  }
}

const getLeafNodes = (nodes) => {
  const leaves = []
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      leaves.push(node)
    } else {
      leaves.push(...getLeafNodes(node.children))
    }
  }
  return leaves
}

const computeMinAvailability = (stockLevel, allPackLists, startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let minAvailable = stockLevel
  for (let d = new Date(start); d <= end; d = new Date(d.setDate(d.getDate() + 1))) {
    const dateStr = d.toISOString().slice(0, 10)
    let available = stockLevel
    allPackLists.forEach((pl) => {
      if (dateStr >= pl.startDate && dateStr <= pl.endDate) {
        available -= pl.quantity
      }
    })
    if (available < minAvailable) minAvailable = available
  }
  return minAvailable
}

const fetchAvailabilityForLeaves = async (leaves, apiPath, startDate, endDate) => {
  const newAvailability = {}
  const batchSize = 6
  for (let i = 0; i < leaves.length; i += batchSize) {
    const batch = leaves.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (leaf) => {
        const loginForItem = loginStore.logins.find((l) => String(l.id) === String(leaf.userid))
        if (!loginForItem?.access_token) return null
        const response = await axios.get(`${apiPath}/${leaf.id}`, {
          headers: { Authorization: `Bearer ${loginForItem.access_token}` },
        })
        const item = response.data.rental || response.data.consumable
        const allPackLists = [
          ...(response.data.activePackLists || []),
          ...(response.data.archivedPackLists || []),
        ]
        const available =
          startDate && endDate
            ? computeMinAvailability(item.stockLevel, allPackLists, startDate, endDate)
            : item.stockLevel
        return { id: leaf.id, available }
      }),
    )
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        newAvailability[result.value.id] = result.value.available
      } else if (result.status === 'rejected') {
        console.error(`Failed to fetch availability for ${batch[index].id}`, result.reason)
      }
    })
    inventoryAvailability.value = { ...inventoryAvailability.value, ...newAvailability }
  }
}

const fetchAllAvailability = async () => {
  if (!inventory.value.length && !consumablesInventory.value.length) return
  loadingAvailability.value = true
  inventoryAvailability.value = {}
  const startDate = currentPacklist.value?.startDate
  const endDate = currentJobEndDate.value || startDate
  await Promise.all([
    fetchAvailabilityForLeaves(getLeafNodes(inventory.value), '/api/rentals', startDate, endDate),
    fetchAvailabilityForLeaves(
      getLeafNodes(consumablesInventory.value),
      '/api/consumables',
      startDate,
      endDate,
    ),
  ])
  loadingAvailability.value = false
}

const openAddExtraDialog = async (packlist) => {
  currentPacklist.value = packlist
  currentJobEndDate.value = null
  tickedRentals.value = []
  tickedConsumables.value = []
  filter.value = ''
  activeTab.value = 'rentals'
  inventoryAvailability.value = {}

  // Fetch job endDate and inventory in parallel
  const endDatePromise = axios
    .get(`/api/jobs/details/${packlist.jobId}`, {
      headers: { Authorization: `Bearer ${packlist.login.access_token}` },
    })
    .then((res) => {
      currentJobEndDate.value = res.data.endDate || packlist.startDate
    })
    .catch(() => {
      currentJobEndDate.value = packlist.startDate
    })

  await Promise.all([fetchInventory(), fetchConsumables(), endDatePromise])
  showAddExtraDialog.value = true
  fetchAllAvailability()
}

function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

const resetFilter = () => {
  filter.value = ''
  filterRef.value.focus()
}

const filterMethod = (node, filter) => {
  return node.name && node.name.toLowerCase().includes(filter.toLowerCase())
}

const filterNodes = (nodes, filter) => {
  return nodes
    .map((node) => {
      if (filterMethod(node, filter)) return node
      if (node.children) {
        const filteredChildren = filterNodes(node.children, filter)
        if (filteredChildren.length) return { ...node, children: filteredChildren }
      }
      return null
    })
    .filter((node) => node !== null)
}

const toggleExpandAll = () => {
  if (!isExpanded.value) {
    inventoryTree.value?.expandAll()
  } else {
    inventoryTree.value?.collapseAll()
  }
}

const toggleExpandAllConsumables = () => {
  if (!isExpandedConsumables.value) {
    consumablesTree.value?.expandAll()
  } else {
    consumablesTree.value?.collapseAll()
  }
}

const expandAllLabel = computed(() => (isExpanded.value ? 'Collapse All' : 'Expand All'))
const expandAllLabelConsumables = computed(() =>
  isExpandedConsumables.value ? 'Collapse All' : 'Expand All',
)

const handleExpandedKeys = () => {
  isExpanded.value = expandedKeysInventory.value.length > 0
}

const handleExpandedKeysConsumables = () => {
  isExpandedConsumables.value = expandedKeysConsumables.value.length > 0
}

function markTickable(nodes) {
  return nodes.map((node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    return {
      ...node,
      tickable: !hasChildren,
      quantity: !hasChildren
        ? typeof node.quantity === 'number'
          ? node.quantity
          : 1
        : undefined,
      children: hasChildren ? markTickable(node.children) : undefined,
    }
  })
}

const filteredInventory = computed(() => {
  if (!filter.value) return inventory.value
  return filterNodes(inventory.value, filter.value)
})

const filteredConsumables = computed(() => {
  if (!filter.value) return consumablesInventory.value
  return filterNodes(consumablesInventory.value, filter.value)
})

const filteredInventoryWithTickable = computed(() => markTickable(filteredInventory.value))
const filteredConsumablesWithTickable = computed(() => markTickable(filteredConsumables.value))

const availabilityColor = (count) => {
  if (count > 0) return 'green'
  if (count === 0) return 'orange'
  return 'red'
}

const addExtra = async () => {
  if (!currentPacklist.value) return
  const packlistLogin = currentPacklist.value.login
  const packlistId = currentPacklist.value.id

  const rentalsToAdd = tickedRentals.value
    .map((id) => {
      const node = findNodeById(filteredInventoryWithTickable.value, id)
      return node
        ? {
            id: node.id,
            name: node.name,
            quantity: node.quantity,
            userid: node.userid,
            supplier: node.supplier,
          }
        : null
    })
    .filter(Boolean)

  const consumablesToAdd = tickedConsumables.value
    .map((id) => {
      const node = findNodeById(filteredConsumablesWithTickable.value, id)
      return node
        ? { id: node.id, name: node.name, quantity: node.quantity, userid: node.userid }
        : null
    })
    .filter(Boolean)

  for (const item of rentalsToAdd) {
    const payload = {
      packList_id: packlistId,
      quantity: item.quantity,
      discountMultiplier: 1,
      out: 0,
      note: '',
    }
    if (item.userid === packlistLogin.id) {
      payload.rental_id = item.id
      await axios.post('/api/pack-list-rentals', payload, {
        headers: { Authorization: `Bearer ${packlistLogin.access_token}` },
      })
    } else {
      const rentalLogin = loginStore.logins.find((l) => String(l.id) === String(item.userid))
      const response = await axios.get(`/api/rentals/${item.id}`, {
        headers: { Authorization: `Bearer ${rentalLogin.access_token}` },
      })
      payload.dailyRate = response.data.rental.dailyRate
      payload.name = item.name
      payload.weight = response.data.rental.weight
      payload.supplier = item.supplier
      payload.rentedUnits = 0
      await axios.post('/api/pack-list-subrentals', payload, {
        headers: { Authorization: `Bearer ${packlistLogin.access_token}` },
      })
    }
  }

  for (const item of consumablesToAdd) {
    const payload = {
      packList_id: packlistId,
      quantity: item.quantity,
      out: 0,
      note: '',
    }
    if (item.userid === packlistLogin.id) {
      payload.consumable_id = item.id
      await axios.post('/api/pack-list-consumables', payload, {
        headers: { Authorization: `Bearer ${packlistLogin.access_token}` },
      })
    } else {
      const consumableLogin = loginStore.logins.find((l) => String(l.id) === String(item.userid))
      const response = await axios.get(`/api/consumables/${item.id}`, {
        headers: { Authorization: `Bearer ${consumableLogin.access_token}` },
      })
      payload.dailyRate = response.data.consumable.dailyRate
      payload.name = item.name
      payload.weight = response.data.consumable.weight
      payload.rentedUnits = 0
      await axios.post('/api/pack-list-subrentals', payload, {
        headers: { Authorization: `Bearer ${packlistLogin.access_token}` },
      })
    }
  }

  const totalAdded = rentalsToAdd.length + consumablesToAdd.length
  showAddExtraDialog.value = false
  $q.notify({
    message: `${totalAdded} extra(s) added to ${currentPacklist.value.name}.`,
    color: 'green',
  })
  fetchPacklistDetailsForFilteredJobs()
}

onMounted(() => {
  fetchJobs()
})
</script>

<style scoped>
.nested-card {
  margin: 16px;
}
.q-card {
  width: 100%;
  margin: 0 auto 20px auto;
}
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
.tree-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
