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
        <q-item @click="navigateToInventoryDetail(scope.node)">
          <q-item-section avatar>
            <q-avatar :src="scope.node.organisationLogo" />
          </q-item-section>
          <q-item-section>{{ scope.node.name }} - {{ scope.node.organisation }}</q-item-section>
        </q-item>
      </template>
    </q-tree>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useLoginStore } from 'src/stores/loginStore'

const inventory = ref([])
const loginStore = useLoginStore()
const router = useRouter()
const filter = ref('')
const filterRef = ref(null)
const inventoryTree = ref(null)
const isExpanded = ref(false)
const expandedKeys = ref([])

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

const navigateToInventoryDetail = (node) => {
  if (!node.children || node.children.length === 0) {
    router.push(`/inventory-detail/${node.id}/${node.userid}`)
  }
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

onMounted(() => {
  fetchInventory()
})
</script>
