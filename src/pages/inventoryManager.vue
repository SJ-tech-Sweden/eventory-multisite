<template>
  <q-page padding>
    <q-tree :nodes="inventory" node-key="id" default-expand-all>
      <template v-slot:default-header="scope">
        <q-item>
          <q-item-section>{{ scope.node.name }} - {{ scope.node.organisation }}</q-item-section>
        </q-item>
      </template>
    </q-tree>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useLoginStore } from 'src/stores/loginStore'

const inventory = ref([])
const loginStore = useLoginStore()

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

onMounted(() => {
  fetchInventory()
})
</script>
