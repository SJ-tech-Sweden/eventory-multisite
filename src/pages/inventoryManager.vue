<template>
  <q-page padding>
    <q-input ref="filterRef" filled v-model="filter" label="Filter">
      <template v-slot:append>
        <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
      </template>
    </q-input>
    <q-btn :label="expandAllLabel" @click="toggleExpandAll" class="q-mt-md" />
    <q-tree
      :nodes="filteredInventory"
      node-key="id"
      :key="filteredInventory.length"
      :filter-method="filterMethod"
      ref="inventoryTree"
      v-model:expanded="expandedKeys"
      @update:expanded="handleExpandedKeys"
    >
      <template v-slot:default-header="scope">
        <q-item @click="navigateToInventoryDetail(scope.node)" clickable>
          <q-item-section>{{ scope.node.name }} - {{ scope.node.organisation }}</q-item-section>
          <q-item-section
            side
            v-if="
              (!scope.node.children || !scope.node.children.length) &&
              scope.node.stockLevel !== undefined
            "
          >
            <q-badge
              :color="
                scope.node.stockLevel > 0
                  ? 'green'
                  : scope.node.stockLevel === 0
                    ? 'orange'
                    : 'red'
              "
              :label="`Available: ${scope.node.stockLevel}`"
            />
          </q-item-section>
        </q-item>
      </template>
    </q-tree>
  </q-page>
</template>

<script setup>
// Import necessary modules and components
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useLoginStore } from 'src/stores/loginStore'

// Define reactive variables and references
const inventory = ref([])
const loginStore = useLoginStore()
const router = useRouter()
const filter = ref('')
const filterRef = ref(null)
const inventoryTree = ref(null)
const isExpanded = ref(false)
const expandedKeys = ref([])

// Refresh login tokens
loginStore.checkAndRefreshTokens()
loginStore.startTokenRefresh()

// Add the properties to the inventory tree
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

// Fetch the inventory for each login
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

// Function to navigate to the inventory detail page
const navigateToInventoryDetail = (node) => {
  console.info('Navigating to inventory detail:', node)
  if (!node.children || node.children.length === 0) {
    router.push(`/inventory-detail/${node.id}/${node.userid}`)
  }
}

// Function to reset the filter
const resetFilter = () => {
  filter.value = ''
  filterRef.value.focus()
}

// Function to control the filterMethod for the tree
const filterMethod = (node, filter) => {
  return node.name && node.name.toLowerCase().includes(filter.toLowerCase())
}

// Function to filter the nodes
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

// Function to toggle expand all
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

// Computed property for the expand all label
const expandAllLabel = computed(() => {
  if (isExpanded.value) {
    return 'Collapse All'
  }
  return 'Expand All'
})

// Function to handle expanded keys
const handleExpandedKeys = () => {
  console.info('Expanded keys:', expandedKeys.value)
  isExpanded.value = Object.keys(expandedKeys.value).length > 0
  console.info('isExpanded:', isExpanded.value)
}

// Computed property for the filtered inventory
const filteredInventory = computed(() => {
  if (!filter.value) {
    return inventory.value
  }
  return filterNodes(inventory.value, filter.value)
})

// Fetch the inventory on mounted
onMounted(() => {
  fetchInventory()
})
</script>
