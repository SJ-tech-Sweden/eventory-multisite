<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>Eventory multisite</q-toolbar-title>
        <q-btn
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
        />
      </q-toolbar>
    </q-header>

    <!-- Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
    >
      <q-list>
        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable to="/calendar">
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>
          <q-item-section>Calendar</q-item-section>
        </q-item>

        <q-item clickable to="/inventory">
          <q-item-section avatar>
            <q-icon name="warehouse" />
          </q-item-section>
          <q-item-section>Inventory</q-item-section>
        </q-item>

        <q-item clickable to="/checkin">
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>Warehouse check in</q-item-section>
        </q-item>

        <q-item clickable to="/checkout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Warehouse check out</q-item-section>
        </q-item>

        <q-item clickable to="/login-manager">
          <q-item-section avatar>
            <q-icon name="manage_accounts" />
          </q-item-section>
          <q-item-section>Login Manager</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Page Container -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
const leftDrawerOpen = ref(false)
</script>
