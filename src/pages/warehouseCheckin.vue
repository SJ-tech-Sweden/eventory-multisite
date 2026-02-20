<template>
  <q-page padding>
    <!-- Content for checking in equipment -->
    <q-card>
      <q-card-section>
        <div class="text-h6">Check In Equipment</div>
        <!-- Content for checking in equipment -->
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
          <q-card-section>
            <div class="text-h6">Rentals</div>
            <q-table
              :rows="packlist.mappedRentals"
              :columns="rentalColumns"
              row-key="id"
              :rows-per-page-options="[0]"
              :grid="$q.screen.xs"
            >
              <template v-slot:body-cell-checkin="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkin"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkin++" />
                    <q-btn icon="login" @click="checkInItem(props.row, 'rental', packlist.login)" />
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
                      Checkin:
                      <div class="row no-wrap">
                        <q-btn
                          icon="remove"
                          @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                        />
                        <q-input
                          v-model.number="props.row.checkin"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          dense
                          borderless
                          style="width: 40px"
                          standout
                        />
                        <q-btn icon="add" @click="props.row.checkin++" />
                        <q-btn
                          icon="login"
                          @click="checkInItem(props.row, 'rental', packlist.login)"
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
              <template v-slot:body-cell-checkin="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkin"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkin++" />
                    <q-btn
                      icon="login"
                      @click="checkInItem(props.row, 'consumable', packlist.login)"
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
                      Checkin:
                      <div class="row no-wrap">
                        <q-btn
                          icon="remove"
                          @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                        />
                        <q-input
                          v-model.number="props.row.checkin"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          dense
                          borderless
                          style="width: 40px"
                          standout
                        />
                        <q-btn icon="add" @click="props.row.checkin++" />
                        <q-btn
                          icon="login"
                          @click="checkInItem(props.row, 'consumable', packlist.login)"
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
              <template v-slot:body-cell-checkin="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                    />
                    <q-input
                      v-model.number="props.row.checkin"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                    />
                    <q-btn icon="add" @click="props.row.checkin++" />
                    <q-btn
                      icon="login"
                      @click="checkInItem(props.row, 'subrental', packlist.login)"
                    />
                  </div>
                </q-td>
              </template>
              <template v-slot:body-cell-return="props">
                <q-td :props="props">
                  <div class="row no-wrap">
                    <q-btn
                      icon="remove"
                      @click="props.row.return = Math.max(0, props.row.return - 1)"
                    />
                    <q-input
                      v-model.number="props.row.return"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      dense
                      borderless
                      style="width: 40px"
                      standout
                      class="no-spin-buttons"
                    />
                    <q-btn icon="add" @click="props.row.return++" />
                    <q-btn icon="arrow_upward" @click="returnItem(props.row, packlist.login)" />
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
                      Checkin:
                      <div class="row no-wrap">
                        <q-btn
                          icon="remove"
                          @click="props.row.checkin = Math.max(0, props.row.checkin - 1)"
                        />
                        <q-input
                          v-model.number="props.row.checkin"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          dense
                          borderless
                          style="width: 40px"
                          standout
                        />
                        <q-btn icon="add" @click="props.row.checkin++" />
                        <q-btn
                          icon="login"
                          @click="checkInItem(props.row, 'subrental', packlist.login)"
                        />
                      </div>
                    </div>
                    <div class="text-caption">Supplier: {{ props.row.supplier }}</div>
                    <div class="text-caption">
                      Rent:
                      <div class="row no-wrap">
                        <q-btn
                          icon="remove"
                          @click="props.row.return = Math.max(0, props.row.return - 1)"
                        />
                        <q-input
                          v-model.number="props.row.return"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          dense
                          borderless
                          style="width: 40px"
                          standout
                        />
                        <q-btn icon="add" @click="props.row.return++" />
                        <q-btn icon="arrow_upward" @click="returnItem(props.row, packlist.login)" />
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
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref, onMounted } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { getIcon } from 'src/utils/getIcon'

// Define the login store
const loginStore = useLoginStore()
const $q = useQuasar()
const jobs = ref([])
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
  { name: 'out', align: 'center', label: 'Out', field: 'out', sortable: true },
  { name: 'checkin', align: 'center', label: 'Check in', field: 'checkin', sortable: false },
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
  { name: 'out', align: 'right', label: 'Out', field: 'out', sortable: true },
  { name: 'checkin', align: 'center', label: 'Check in', field: 'checkin', sortable: false },
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
  { name: 'checkin', align: 'center', label: 'Check in', field: 'checkin', sortable: false },
  { name: 'supplier', align: 'left', label: 'Supplier', field: 'supplier', sortable: true },
  {
    name: 'rentedUnits',
    align: 'center',
    label: 'Rented Units',
    field: 'rentedUnits',
    sortable: true,
  },
  { name: 'return', align: 'center', label: 'Return', field: 'return', sortable: false },
]

// Function to fetch jobs from the API
const fetchJobs = async () => {
  jobs.value = []
  packlists.value = []
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

        // Add organisation field to each job and filter jobs with hasItemsOut
        const fetchedJobs = response.data
          .map((job) => ({
            ...job, // Spread existing job properties
            organisation: login.organisation, // Add organisation property
            color: login.color,
            organisationLogo: login.organisationLogo,
            userid: login.id,
          }))
          .filter((job) =>
            job.packLists.some((packList) => packList.hasItemsOut || packList.hasRentedItems),
          )

        // Sort jobs by startDate
        fetchedJobs.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

        jobs.value.push(...fetchedJobs)
        console.info(`Total jobs: ${JSON.stringify(jobs.value)}`)

        // Fetch packlist details for packlists with hasItemsOut
        for (const job of fetchedJobs) {
          for (const packList of job.packLists) {
            if (packList.hasItemsOut || packList.hasRentedItems) {
              const packlistResponse = await axios.get(`/api/pack-lists/details/${packList.id}`, {
                headers: {
                  Authorization: `Bearer ${login.access_token}`,
                },
              })
              const packlistData = packlistResponse.data

              // Add job data to packlist
              packlistData.jobName = job.name
              packlistData.jobStatus = job.status
              packlistData.startDate = job.startDate
              packlistData.organisation = job.organisation
              packlistData.organisationLogo = job.organisationLogo
              packlistData.login = login // Add login information to packlist

              // Map rentals, consumables, and subrentals to include names from their respective trees
              packlistData.mappedRentals =
                packlistData.rentals
                  ?.filter((rental) => rental.out > 0)
                  .map((rental) => {
                    const rentalItem = findItemInTree(packlistData.rentalsTree || [], rental.id)
                    return {
                      ...rental,
                      name: rentalItem ? rentalItem.name : '',
                      checkin: rental.out,
                    }
                  }) || []

              packlistData.mappedConsumables =
                packlistData.consumables
                  ?.filter((consumables) => consumables.out > 0)
                  .map((consumable) => {
                    const consumableItem = findItemInTree(
                      packlistData.consumablesTree || [],
                      consumable.id,
                    )
                    return {
                      ...consumable,
                      name: consumableItem ? consumableItem.name : '',
                      checkin: consumable.out,
                    }
                  }) || []

              packlistData.mappedSubrentals =
                packlistData.subrentals
                  ?.map((subrental) => {
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
                      checkin: subrental.out,
                      return: rentedUnits,
                    }
                  })
                  .filter((subrental) => subrental.out > 0 || subrental.rentedUnits > 0) || []

              packlists.value.push(packlistData)
            }
          }
        }
        console.info(`Total packlists: ${JSON.stringify(packlists.value)}`)
      } catch (error) {
        console.error(`Failed to fetch jobs for ${login.username}:`, error)
      }
    }
  }
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
const checkInItem = async (item, type, login) => {
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
      { out: item.out - item.checkin },
      {
        headers: {
          Authorization: `Bearer ${login.access_token}`,
        },
      },
    )

    $q.notify({
      message: `Successfully checked in ${item.checkin} of ${item.name}`,
      color: 'green',
    })
    item.out -= item.checkin
    item.checkin = item.out
  } catch (error) {
    console.error(`Failed to check in item: ${item.name}`, error)
    $q.notify({
      message: `Failed to check in ${item.name}`,
      color: 'red',
    })
  }
}

// Function to handle return action
const returnItem = async (item, login) => {
  console.log(`Returning item: ${JSON.stringify(item)}`)

  try {
    await axios.put(
      `/api/pack-list-subrentals/${item.id}`,
      { rentedUnits: item.rentedUnits - item.return },
      {
        headers: {
          Authorization: `Bearer ${login.access_token}`,
        },
      },
    )

    $q.notify({
      message: `Successfully returned ${item.return} of ${item.name}`,
      color: 'green',
    })
    item.rentedUnits -= item.return
    item.return = item.rentedUnits
  } catch (error) {
    console.error(`Failed to return item: ${item.name}`, error)
    $q.notify({
      message: `Failed to return ${item.name}`,
      color: 'red',
    })
  }
}

onMounted(() => {
  fetchJobs()
})
</script>

<style scoped>
/* Add any custom styles here */
.nested-card {
  margin: 16px; /* Adjust the margin as needed */
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
</style>
