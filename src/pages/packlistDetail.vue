<template>
  <q-page padding>
    <q-card class="full-width">
      <q-card-section class="relative-position">
        <div class="text-h6">Packlist Details</div>

        <div v-if="packlist">
          <!-- Display packlist details -->
          <q-avatar class="responsive-avatar" size="100px">
            <q-img :src="login.organisationLogo"></q-img>
          </q-avatar>
          <div class="text-subtitle1">{{ packlist.name }}</div>
          <div class="text-caption">Full Price: {{ packlist.fullPrice }}</div>
          <div class="text-caption">Charge Days: {{ packlist.chargeDays }}</div>
          <div class="text-caption">Price: {{ packlist.price }}</div>
          <div class="text-caption">Price with VAT: {{ packlist.priceWithVat }}</div>
          <div class="text-caption">Weight: {{ packlist.weight }} kg</div>
          <div class="text-caption">Note: {{ packlist.note }}</div>

          <div class="q-pa-md q-gutter-sm">
            <q-btn color="primary" label="Toggle everything" @click="toggleEverything" />
            <q-btn label="Add Rental" color="primary" @click="showAddItemDialog = true" />
            <q-btn label="Add Consumable" color="primary" @click="showAddConsumableDialog = true" />
          </div>

          <!-- Dialog for adding items to the packlist -->
          <q-dialog v-model="showAddItemDialog" full-width>
            <q-card>
              <q-card-section>
                <div class="text-h6">Add rentals to Packlist</div>
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
                <q-btn :label="expandAllLabel" @click="toggleExpandAll" class="q-mt-md" />
                <div class="tree-container">
                  <!-- Tree view for inventory items -->
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
                        </q-item-section>
                        <q-item-section>
                          <q-input
                            v-if="!scope.node.children"
                            v-model="scope.node.quantity"
                            type="number"
                            min="0"
                          />
                        </q-item-section>
                        <!-- Only show tickbox if node is tickable -->
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
                                console.log('tickedRentals after update:', tickedRentals)
                              }
                            "
                            @click.stop
                          />
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-tree>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" v-close-popup />
                <q-btn flat label="Add rentals" color="primary" @click="addRental()" />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Dialog for adding consumables to the packlist -->
          <q-dialog v-model="showAddConsumableDialog" full-width>
            <q-card>
              <q-card-section>
                <div class="text-h6">Add consumables to Packlist</div>
                <q-input ref="consumableFilterRef" filled v-model="consumableFilter" label="Filter">
                  <template v-slot:append>
                    <q-icon
                      v-if="consumableFilter !== ''"
                      name="clear"
                      class="cursor-pointer"
                      @click="resetConsumableFilter"
                    />
                  </template>
                </q-input>
                <q-btn
                  :label="consumableExpandAllLabel"
                  @click="toggleConsumableExpandAll"
                  class="q-mt-md"
                />
                <div class="tree-container">
                  <q-tree
                    :nodes="filteredConsumablesWithTickable"
                    node-key="id"
                    :filter-method="filterMethod"
                    ref="consumableInventoryTree"
                    v-model:expanded="expandedKeysConsumableInventory"
                    @update:expanded="handleConsumableExpandedKeys"
                    v-model:ticked="tickedConsumables"
                    tick-strategy="none"
                    full-width
                  >
                    <template v-slot:default-header="scope">
                      <q-item>
                        <q-item-section>
                          {{ scope.node.name }} - {{ scope.node.organisation }}
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
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" v-close-popup />
                <q-btn flat label="Add consumables" color="primary" @click="addConsumable()" />
              </q-card-actions>
            </q-card>
          </q-dialog>
          <!-- Rentals section -->
          <div class="text-h6">Rentals</div>
          <!-- Table for displaying packlist items -->
          <TreeTable
            :value="packlist.rentalsTree"
            tableStyle="min-width: 50rem"
            scrollable
            :resizableColumns="true"
            dataKey="id"
            autoLayout
            :expandedKeys="expandedKeys"
            class="q-table highlight striped-odd"
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
            <Column field="actions" header="Actions" sortable>
              <template v-slot:body="slotProps">
                <q-item>
                  <q-item-section>
                    <!-- Add any custom content here if needed -->
                  </q-item-section>
                  <q-item-section
                    side
                    v-if="!slotProps.node.children || slotProps.node.children.length === 0"
                  >
                    <q-btn
                      icon="delete"
                      color="negative"
                      flat
                      @click="deletePacklistItem(slotProps.node, '/api/pack-list-rentals')"
                      label="Delete"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </Column>
          </TreeTable>

          <div class="text-h6">Consumables</div>
          <TreeTable
            :value="packlist.consumablesTree"
            tableStyle="min-width: 50rem"
            scrollable
            :resizableColumns="true"
            dataKey="id"
            autoLayout
            :expandedKeys="expandedKeys"
            class="q-table highlight striped-odd"
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
            <Column field="actions" header="Actions" sortable>
              <template v-slot:body="slotProps">
                <q-item>
                  <q-item-section>
                    <!-- Add any custom content here if needed -->
                  </q-item-section>
                  <q-item-section
                    side
                    v-if="!slotProps.node.children || slotProps.node.children.length === 0"
                  >
                    <q-btn
                      icon="delete"
                      color="negative"
                      flat
                      @click="deletePacklistItem(slotProps.node, '/api/pack-list-consumables')"
                      label="Delete"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </Column>
          </TreeTable>

          <div class="text-h6">Internal subrentals</div>
          <TreeTable
            :value="packlist.internalSubrentalsTree"
            tableStyle="min-width: 50rem"
            scrollable
            :resizableColumns="true"
            dataKey="id"
            autoLayout
            :expandedKeys="expandedKeys"
            class="q-table highlight striped-odd"
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="supplier" header="Supplier" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
            <Column field="actions" header="Actions" sortable>
              <template v-slot:body="slotProps">
                <q-item>
                  <q-item-section>
                    <!-- Add any custom content here if needed -->
                  </q-item-section>
                  <q-item-section
                    side
                    v-if="!slotProps.node.children || slotProps.node.children.length === 0"
                  >
                    <q-btn
                      icon="delete"
                      color="negative"
                      flat
                      @click="deletePacklistItem(slotProps.node, '/api/pack-list-subrentals')"
                      label="Delete"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </Column>
          </TreeTable>

          <div class="text-h6">External subrentals</div>
          <TreeTable
            :value="packlist.externalSubrentals"
            tableStyle="min-width: 50rem"
            scrollable
            :resizableColumns="true"
            dataKey="id"
            autoLayout
            :expandedKeys="expandedKeys"
            class="q-table highlight striped-odd"
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="supplier" header="Supplier" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
            <Column field="actions" header="Actions" sortable>
              <template v-slot:body="slotProps">
                <q-item>
                  <q-item-section>
                    <!-- Add any custom content here if needed -->
                  </q-item-section>
                  <q-item-section
                    side
                    v-if="!slotProps.node.children || slotProps.node.children.length === 0"
                  >
                    <q-btn
                      icon="delete"
                      color="negative"
                      flat
                      @click="deletePacklistItem(slotProps.node, '/api/pack-list-subrentals')"
                      label="Delete"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </Column>
          </TreeTable>
        </div>
        <div v-else>Loading...</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref, onMounted, computed, watch } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'

// Define reactive variables and references
const $q = useQuasar()
const loginStore = useLoginStore()
const route = useRoute()
const packlist = ref(null)
const expandedKeys = ref({})
const showAddItemDialog = ref(false)
const login = ref(null)

// Adding rentals popup
const inventory = ref([])
const filter = ref('')
const filterRef = ref(null)
const inventoryTree = ref(null)
const isExpanded = ref(false)
const expandedKeysInventory = ref([])
const tickedRentals = ref([])

// Adding consumables popup
const showAddConsumableDialog = ref(false)
const consumablesInventory = ref([])
const consumableFilter = ref('')
const consumableFilterRef = ref(null)
const consumableInventoryTree = ref(null)
const isConsumableExpanded = ref(false)
const expandedKeysConsumableInventory = ref([])
const tickedConsumables = ref([])

// Refresh login tokens
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// Transform the tree data
const transformData = (nodes) => {
  return nodes.map((node) => {
    const { id, children, ...data } = node
    return {
      id,
      data,
      children: children ? transformData(children) : [],
    }
  })
}

// Fetch packlist and inventory data on component mount
const fetchPacklist = async () => {
  const packlistId = route.params.packlistid
  const userId = route.params.userid

  console.log('User ID from route:', userId)
  console.log('Login store contents:', loginStore.logins)

  // Ensure userId is a string for comparison
  const userIdStr = String(userId)

  console.log('User ID from route:', userId)
  console.log('Login store contents:', loginStore.logins)

  // Find the corresponding login
  login.value = loginStore.logins.find((login) => String(login.id) === userIdStr)

  if (!login.value) {
    console.error('Login not found for userId:', userId)
    return
  }

  try {
    const response = await axios.get(`/api/pack-lists/details/${packlistId}`, {
      headers: {
        Authorization: `Bearer ${login.value.access_token}`,
      },
    })
    console.info('Fetched packlist:', response.data)
    packlist.value = {
      ...response.data,
      rentalsTree: transformData(response.data.rentalsTree),
      consumablesTree: transformData(response.data.consumablesTree),
      internalSubrentalsTree: transformData(response.data.internalSubrentalsTree),
      externalSubrentals: transformData(response.data.externalSubrentals),
    }
    // Expand all rows by default
    expandedKeys.value = getAllKeys(packlist.value.rentalsTree)
    expandedKeys.value = { ...expandedKeys.value, ...getAllKeys(packlist.value.consumablesTree) }
    expandedKeys.value = {
      ...expandedKeys.value,
      ...getAllKeys(packlist.value.internalSubrentalsTree),
    }
  } catch (error) {
    console.error('Failed to fetch packlist:', error)
  }
}

const getAllKeys = (nodes) => {
  let keys = {}
  nodes.forEach((node) => {
    keys[node.id] = true
    if (node.children) {
      keys = { ...keys, ...getAllKeys(node.children) }
    }
  })
  return keys
}

const toggleEverything = () => {
  let _expandedKeys = { ...expandedKeys.value }

  if (Object.keys(_expandedKeys).length) {
    _expandedKeys = {}
  } else {
    _expandedKeys = getAllKeys(packlist.value.rentalsTree)
    _expandedKeys = { ..._expandedKeys, ...getAllKeys(packlist.value.consumablesTree) }
    _expandedKeys = { ..._expandedKeys, ...getAllKeys(packlist.value.internalSubrentalsTree) }
  }

  expandedKeys.value = _expandedKeys
}
// Add properties to the inventory tree
const addPropertiesToTree = (nodes, properties) => {
  return nodes.map((node) => {
    const updatedNode = {
      ...node,
      ...properties,
    }
    if (node.children) {
      updatedNode.children = addPropertiesToTree(node.children, properties)
    }
    return updatedNode
  })
}

// Get inventory data for all logins
const fetchInventory = async () => {
  inventory.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/inventory-rentals', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
        })
        console.info(`Fetched inventory for ${login.username} - ${login.organisation}`)
        const properties = {
          organisation: login.organisation,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }
        const fetchedInventory = addPropertiesToTree(response.data, properties)
        inventory.value.push(...fetchedInventory)
      } catch (error) {
        console.error(`Failed to fetch inventory for ${login.username}:`, error)
      }
    }
  }
}

// Get consumables inventory data for all logins
const fetchConsumablesInventory = async () => {
  consumablesInventory.value = []
  for (const login of loginStore.logins) {
    if (login.access_token) {
      try {
        const response = await axios.get('/api/inventory-consumables', {
          headers: {
            Authorization: `Bearer ${login.access_token}`,
          },
        })
        console.info(`Fetched consumables for ${login.username} - ${login.organisation}`)
        const properties = {
          organisation: login.organisation,
          organisationLogo: login.organisationLogo,
          userid: login.id,
        }
        const fetchedConsumables = addPropertiesToTree(response.data, properties)
        consumablesInventory.value.push(...fetchedConsumables)
      } catch (error) {
        console.error(`Failed to fetch consumables for ${login.username}:`, error)
      }
    }
  }
}

// Add selected rentals to packlist
const addRental = async () => {
  const rentalsToAdd = tickedRentals.value
    .map((id) => {
      const node = findNodeById(filteredInventoryWithTickable.value, id)
      return node
        ? {
            id: node.id,
            name: node.name,
            quantity: node.quantity,
            userid: node.userid,
          }
        : null
    })
    .filter(Boolean)

  console.log('Rentals to add:', rentalsToAdd)
  for (const rental of rentalsToAdd) {
    const payload = {
      packList_id: route.params.packlistid,
      quantity: rental.quantity,
      discountMultiplier: 1,
      out: 0,
      note: '',
    }

    if (rental.userid === login.value.id) {
      payload.rental_id = rental.id
      await axios.post('/api/pack-list-rentals', payload, {
        headers: {
          Authorization: `Bearer ${login.value.access_token}`,
        },
      })
    } else {
      const rentalLogin = loginStore.logins.find(
        (login) => String(login.id) === String(rental.userid),
      )
      console.info(`Rentallogin ${rentalLogin} found for rental ${rental.name}`)
      const response = await axios.get(`/api/rentals/${rental.id}`, {
        headers: {
          Authorization: `Bearer ${rentalLogin.access_token}`,
        },
      })
      console.info('Fetched inventoryItem:', response.data)
      payload.dailyRate = response.data.rental.dailyRate
      payload.name = rental.name
      payload.weight = response.data.rental.weight
      payload.supplier = rental.supplier
      payload.rentedUnits = 0
      await axios.post('/api/pack-list-subrentals', payload, {
        headers: {
          Authorization: `Bearer ${login.value.access_token}`,
        },
      })
    }
  }
  console.info(rentalsToAdd)
  fetchPacklist()
  $q.notify({
    message: `${rentalsToAdd.length} rentals was added.`,
    color: 'green',
  })
}

// Add selected consumables to packlist
const addConsumable = async () => {
  const consumablesToAdd = tickedConsumables.value
    .map((id) => {
      const node = findNodeById(filteredConsumablesWithTickable.value, id)
      return node
        ? {
            id: node.id,
            name: node.name,
            quantity: node.quantity,
            userid: node.userid,
          }
        : null
    })
    .filter(Boolean)

  console.log('Consumables to add:', consumablesToAdd)
  for (const consumable of consumablesToAdd) {
    const payload = {
      packList_id: route.params.packlistid,
      consumable_id: consumable.id,
      quantity: consumable.quantity,
      discountMultiplier: 1,
      note: '',
    }
    try {
      await axios.post('/api/pack-list-consumables', payload, {
        headers: {
          Authorization: `Bearer ${login.value.access_token}`,
        },
      })
    } catch (error) {
      console.error(`Failed to add consumable ${consumable.name}:`, error)
      $q.notify({
        type: 'negative',
        message: `Failed to add consumable: ${consumable.name}`,
      })
    }
  }
  showAddConsumableDialog.value = false
  fetchPacklist()
  $q.notify({
    message: `${consumablesToAdd.length} consumables were added.`,
    color: 'green',
  })
}

// Find node by ID in the inventory tree
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

const resetConsumableFilter = () => {
  consumableFilter.value = ''
  consumableFilterRef.value.focus()
}

const filterMethod = (node, filter) => {
  return node.name && node.name.toLowerCase().includes(filter.toLowerCase())
}

// Computed property to filter inventory based on the search filter
const filterNodes = (nodes, filter) => {
  return nodes
    .map((node) => {
      if (filterMethod(node, filter)) {
        return node
      }
      if (node.children) {
        const filteredChildren = filterNodes(node.children, filter)
        if (filteredChildren.length) {
          return { ...node, children: filteredChildren }
        }
      }
      return null
    })
    .filter((node) => node !== null)
}

const toggleExpandAll = () => {
  if (!isExpanded.value) {
    if (inventoryTree.value) {
      inventoryTree.value.expandAll()
    }
  } else {
    if (inventoryTree.value) {
      inventoryTree.value.collapseAll()
    }
  }
}

const expandAllLabel = computed(() => {
  if (isExpanded.value) {
    return 'Collapse All'
  }
  return 'Expand All'
})

// Handle expanded keys in the inventory tree
const handleExpandedKeys = () => {
  console.info('Expanded keys:', expandedKeys.value)
  isExpanded.value = Object.keys(expandedKeys.value).length > 0
  console.info('isExpanded:', isExpanded.value)
}

const filteredInventory = computed(() => {
  if (!filter.value) {
    return inventory.value
  }
  return filterNodes(inventory.value, filter.value)
})

// Mark nodes as tickable or not based on children existence
function markTickable(nodes) {
  return nodes.map((node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    return {
      ...node,
      tickable: !hasChildren,
      quantity: !hasChildren
        ? typeof node.quantity === 'number'
          ? node.quantity
          : 1 // default to 1
        : undefined,
      children: hasChildren ? markTickable(node.children) : undefined,
    }
  })
}

const filteredInventoryWithTickable = computed(() => markTickable(filteredInventory.value))

// Usage:
filteredInventory.value = markTickable(filteredInventory.value)

// When you receive or build your data:
function ensureQuantities(nodes) {
  nodes.forEach((node) => {
    if (!node.children) {
      if (typeof node.quantity !== 'number') node.quantity = 1
    } else {
      ensureQuantities(node.children)
    }
  })
}
ensureQuantities(filteredInventory.value)

const toggleConsumableExpandAll = () => {
  if (!isConsumableExpanded.value) {
    if (consumableInventoryTree.value) {
      consumableInventoryTree.value.expandAll()
    }
  } else {
    if (consumableInventoryTree.value) {
      consumableInventoryTree.value.collapseAll()
    }
  }
}

const consumableExpandAllLabel = computed(() => {
  if (isConsumableExpanded.value) {
    return 'Collapse All'
  }
  return 'Expand All'
})

// Handle expanded keys in the consumable inventory tree
const handleConsumableExpandedKeys = () => {
  isConsumableExpanded.value = expandedKeysConsumableInventory.value.length > 0
}

const filteredConsumablesInventory = computed(() => {
  if (!consumableFilter.value) {
    return consumablesInventory.value
  }
  return filterNodes(consumablesInventory.value, consumableFilter.value)
})

const filteredConsumablesWithTickable = computed(() =>
  markTickable(filteredConsumablesInventory.value),
)

// Fetch data when the component is mounted
onMounted(() => {
  fetchPacklist()
  fetchInventory()
  fetchConsumablesInventory()
})

// Watch for changes in tickedRentals
watch(tickedRentals, (newVal) => {
  console.log('tickedRentals changed:', newVal)
})

// Attach rentalLogin info to inventory items
inventory.value.forEach((item) => {
  item.rentalLogin = login // or whatever login info you want to attach
  if (item.children) {
    item.children.forEach((child) => {
      child.rentalLogin = login
      // ...and so on recursively if needed
    })
  }
})

async function deletePacklistItem(item, endpoint) {
  if (!item || !item.id || !login.value.access_token) {
    console.warn('Missing item or login info')
    return
  }
  if (!confirm('Are you sure you want to delete this item?')) return

  try {
    await axios.delete(`${endpoint}/${item.id}`, {
      headers: {
        Authorization: `Bearer ${login.value.access_token}`,
      },
    })
    fetchPacklist() // Refresh the packlist after deletion
    $q.notify({
      type: 'positive',
      message: 'Item deleted successfully!',
    })
    console.info('Item deleted:', item.id)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to delete item.',
    })
    console.error('Failed to delete item:', error)
  }
}
</script>

<style scoped>
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

<style lang="sass"></style>
