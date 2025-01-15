<template>
  <q-page padding>
    <q-card class="full-width">
      <q-card-section>
        <div class="text-h6">Packlist Details</div>
        <div v-if="packlist">
          <div class="text-subtitle1">{{ packlist.name }}</div>
          <div class="text-caption">Full Price: {{ packlist.fullPrice }}</div>
          <div class="text-caption">Charge Days: {{ packlist.chargeDays }}</div>
          <div class="text-caption">Price: {{ packlist.price }}</div>
          <div class="text-caption">Price with VAT: {{ packlist.priceWithVat }}</div>
          <div class="text-caption">Weight: {{ packlist.weight }} kg</div>
          <div class="text-caption">Note: {{ packlist.note }}</div>

          <div class="text-h6">Rentals</div>
          <q-btn color="primary" label="Toggle everything" @click="toggleEverything" />
          <TreeTable
            :value="packlist.rentalsTree"
            tableStyle="min-width: 50rem"
            scrollable
            :resizableColumns="true"
            dataKey="id"
            autoLayout
            :expandedKeys="expandedKeys"
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
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
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
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
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="supplier" header="Supplier" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
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
          >
            <Column field="name" header="Name" expander sortable></Column>
            <Column field="dailyRate" header="Daily rate" sortable></Column>
            <Column field="quantity" header="Quantity" sortable></Column>
            <Column field="weight" header="Weight" sortable></Column>
            <Column field="supplier" header="Supplier" sortable></Column>
            <Column field="note" header="Note" sortable></Column>
          </TreeTable>
        </div>
        <div v-else>Loading...</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLoginStore } from 'src/stores/loginStore'
import { useRoute } from 'vue-router'
import axios from 'axios'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'

const loginStore = useLoginStore()

const route = useRoute()
const packlist = ref(null)
const expandedKeys = ref({})

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

const fetchPacklist = async () => {
  const packlistId = route.params.packlistid
  const userId = route.params.userid

  console.log('User ID from route:', userId)
  console.log('Login store contents:', loginStore.logins)

  // Ensure userId is a string for comparison
  const userIdStr = String(userId)

  // Find the corresponding login
  const login = loginStore.logins.find((login) => String(login.id) === userIdStr)

  if (!login) {
    console.error('Login not found for userId:', userId)
    return
  }

  try {
    const response = await axios.get(`/api/pack-lists/details/${packlistId}`, {
      headers: {
        Authorization: `Bearer ${login.access_token}`,
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

// const onToggle = (event) => {
//   expandedKeys.value = event.value
// }

onMounted(() => {
  fetchPacklist()
})
</script>

<style scoped>
.q-card {
  width: 100%;
  margin: 0 auto 20px auto;
}
</style>

<style lang="sass">
.my-sticky-header-table
  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    background-color: #00b4ff

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
