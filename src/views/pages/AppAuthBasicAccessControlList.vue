<script setup>
import FilledButton from '@/views/components/FilledButton.vue'
import PageBar from '@/views/components/PageBar.vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { useToast } from 'vue-toastification'
import { computed, ref, watch } from 'vue'
import Table from '@/views/components/Table/Table.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
import TextButton from '@/views/components/TextButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'

const toast = useToast()

const {
  result: appBasicAuthAccessControlListsRaw,
  loading: isAppBasicAuthAccessControlListsLoading,
  onError: onAppBasicAuthAccessControlListsError,
  refetch: refetchAppBasicAuthAccessControlLists
} = useQuery(
  gql`
    query {
      appBasicAuthAccessControlLists {
        id
        name
        users {
          id
          username
        }
      }
    }
  `,
  null,
  {
    pollInterval: 30000
  }
)

const appBasicAuthAccessControlLists = computed(
  () => appBasicAuthAccessControlListsRaw.value?.appBasicAuthAccessControlLists ?? []
)

onAppBasicAuthAccessControlListsError((err) => {
  toast.error(err.message)
})

// add user list
const isAddAccessControlListModalOpen = ref(false)

const openAddAccessControlListModal = () => {
  isAddAccessControlListModalOpen.value = true
}

const closeAddAccessControlListModal = () => {
  isAddAccessControlListModalOpen.value = false
}

const newACLName = ref('')

watch(isAddAccessControlListModalOpen, () => {
  newACLName.value = ''
})

const {
  mutate: addAccessControlListRaw,
  loading: isAddAccessControlListLoading,
  onError: onAddAccessControlListError,
  onDone: onAddAccessControlListDone
} = useMutation(gql`
  mutation createAppBasicAuthAccessControlList($input: AppBasicAuthAccessControlListInput!) {
    createAppBasicAuthAccessControlList(input: $input) {
      id
    }
  }
`)

const addAccessControlList = () => {
  if (
    !confirm(
      `This operation can take 5~6 seconds to apply.\nDon't leave this page until the request is completed.\n\nAre you sure you want to continue?`
    )
  ) {
    return
  }
  addAccessControlListRaw({
    input: {
      name: newACLName.value
    }
  })
}

onAddAccessControlListError((err) => {
  toast.error(err.message)
})

onAddAccessControlListDone(() => {
  toast.success('New ACL Userlist added successfully')
  refetchAppBasicAuthAccessControlLists()
  isAddAccessControlListModalOpen.value = false
})

// delete user list
const isDeleteAccessControlListModalOpen = ref(false)
const selectedACLForDeletion = ref(null)

const openDeleteAccessControlListModal = (acl) => {
  selectedACLForDeletion.value = acl
  isDeleteAccessControlListModalOpen.value = true
}

const closeDeleteAccessControlListModal = () => {
  isDeleteAccessControlListModalOpen.value = false
  selectedACLForDeletion.value = null
}

const {
  mutate: deleteAccessControlListRaw,
  loading: isDeleteAccessControlListLoading,
  onError: onDeleteAccessControlListError,
  onDone: onDeleteAccessControlListDone
} = useMutation(gql`
  mutation deleteAppBasicAuthAccessControlList($id: Uint!) {
    deleteAppBasicAuthAccessControlList(id: $id)
  }
`)

const deleteAccessControlList = () => {
  if (
    !confirm(
      `This operation can take 5~6 seconds to apply.\nDon't leave this page until the request is completed.\n\nAre you sure you want to continue?`
    )
  ) {
    return
  }
  deleteAccessControlListRaw({
    id: selectedACLForDeletion.value.id
  })
}

onDeleteAccessControlListError((err) => {
  toast.error(err.message)
})

onDeleteAccessControlListDone((res) => {
  if (res.data.deleteAppBasicAuthAccessControlList) {
    toast.success('User list deleted successfully')
  } else {
    toast.error('User list deletion failed')
  }
  refetchAppBasicAuthAccessControlLists()
  closeDeleteAccessControlListModal()
})
</script>

<template>
  <section class="mx-auto w-full max-w-7xl">
    <!-- Top Page bar   -->
    <PageBar>
      <template v-slot:title>Basic Authentication ACL</template>
      <template v-slot:subtitle> Manage access control list for Basic Authentication</template>
      <template v-slot:buttons>
        <FilledButton type="primary" :click="openAddAccessControlListModal">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Add New ACL
        </FilledButton>
        <FilledButton type="ghost" :click="refetchAppBasicAuthAccessControlLists">
          <font-awesome-icon
            icon="fa-solid fa-arrows-rotate"
            :class="{
              'animate-spin ': isAppBasicAuthAccessControlListsLoading
            }" />&nbsp;&nbsp; Refresh List
        </FilledButton>
      </template>
    </PageBar>

    <!-- Table -->
    <Table class="mt-8">
      <template v-slot:header>
        <TableHeader align="left">Name</TableHeader>
        <TableHeader align="center">Registered Users</TableHeader>
        <TableHeader align="right">Actions</TableHeader>
      </template>
      <template v-if="appBasicAuthAccessControlLists.length === 0" v-slot:message>
        <TableMessage>
          No Basic Authentication ACL found.<br />
          Click on the <b>Add New ACL</b> to add ACL.
        </TableMessage>
      </template>
      <template v-slot:body>
        <tr
          v-for="appBasicAuthAccessControlList in appBasicAuthAccessControlLists"
          v-bind:key="appBasicAuthAccessControlList.id">
          <TableRow align="left">
            <div class="text-sm font-medium text-gray-900">
              {{ appBasicAuthAccessControlList.name }}
            </div>
          </TableRow>
          <TableRow align="center" flex>
            <div class="flex w-full flex-wrap items-center justify-center gap-1">
              <div>
                <FilledButton type="primary" slim>
                  <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
                  Add User
                </FilledButton>
              </div>
              <div
                v-for="user in appBasicAuthAccessControlList.users"
                v-bind:key="user.id"
                class="flex w-min flex-row items-center justify-center gap-2.5 rounded-md border px-2 py-1 text-sm">
                <p>{{ user.username }}</p>
                <TextButton slim class="has-tooltip">
                  <span class="tooltip">Change Password</span>
                  <font-awesome-icon icon="fa-solid fa-key" />
                </TextButton>
                <TextButton slim type="danger" class="has-tooltip">
                  <span class="tooltip">Delete User</span>
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </TextButton>
              </div>
            </div>
          </TableRow>
          <TableRow align="right">
            <TextButton type="danger" :click="() => openDeleteAccessControlListModal(appBasicAuthAccessControlList)">
              Delete
            </TextButton>
          </TableRow>
        </tr>
      </template>
    </Table>

    <!--  Create new ACL modal  -->
    <ModalDialog :close-modal="closeAddAccessControlListModal" :is-open="isAddAccessControlListModalOpen">
      <template v-slot:header>Create New User List</template>
      <template v-slot:body>
        Enter a name for the new user list. <br />Try to provide a unique name.
        <form @submit.prevent="">
          <!--  Name Field   -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700" for="name"> User List Name </label>
            <div class="mt-1">
              <input
                id="name"
                v-model="newACLName"
                autocomplete="off"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="i.e. My Family Group"
                type="text" />
            </div>
          </div>
        </form>
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="addAccessControlList"
          :loading="isAddAccessControlListLoading"
          :disabled="!newACLName"
          type="primary"
          class="w-full"
          >Confirm & Register
        </FilledButton>
      </template>
    </ModalDialog>

    <!--  Delete ACL modal  -->
    <ModalDialog :close-modal="closeDeleteAccessControlListModal" :is-open="isDeleteAccessControlListModalOpen">
      <template v-slot:header>Delete ACL User List</template>
      <template v-slot:body>
        Are you sure you want to delete <b>{{ selectedACLForDeletion?.name ?? '' }}</b> user list ?
      </template>
      <template v-slot:footer>
        <FilledButton
          :click="deleteAccessControlList"
          :loading="isDeleteAccessControlListLoading"
          type="primary"
          class="w-full"
          >Confirm & Delete ACL
        </FilledButton>
      </template>
    </ModalDialog>
  </section>
</template>

<style scoped></style>
