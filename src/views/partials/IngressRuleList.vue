<script setup>
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import Table from '@/views/components/Table/Table.vue'
import { useToast } from 'vue-toastification'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import IngressRuleRow from '@/views/partials/IngressRuleRow.vue'

const props = defineProps({
  applicationId: {
    type: String,
    required: false,
    default: ''
  }
})
const toast = useToast()

// Queries
const fetchAllIngressRulesQuery = gql`
  query {
    ingressRules {
      id
      status
      protocol
      domain {
        name
      }
      httpsRedirect
      port
      targetType
      externalService
      application {
        name
      }
      authenticationType
      basicAuthAccessControlListName
      targetPort
    }
  }
`
const applicationSpecificIngressRulesQuery = gql`
  query ($id: String!) {
    application(id: $id) {
      ingressRules {
        id
        status
        protocol
        domain {
          name
        }
        httpsRedirect
        port
        application {
          name
        }
        authenticationType
        basicAuthAccessControlListName
        targetType
        targetPort
      }
    }
  }
`
// Fetch ingress rules
const {
  result: ingressRulesRaw,
  refetch: refetchIngressRules,
  loading: isIngressRulesLoading,
  onError: onIngressRulesError
} = useQuery(
  props.applicationId ? applicationSpecificIngressRulesQuery : fetchAllIngressRulesQuery,
  {
    id: props.applicationId
  },
  {
    pollInterval: 10000
  }
)

const ingressRules = computed(() =>
  props.applicationId
    ? ingressRulesRaw.value?.application?.ingressRules ?? []
    : ingressRulesRaw.value?.ingressRules ?? []
)

onIngressRulesError((err) => {
  toast.error(err.message)
})

// Delete ingress rule
const {
  mutate: deleteIngressRule,
  onDone: onIngressDeleteSuccess,
  onError: onIngressRuleDeleteFail
} = useMutation(
  gql`
    mutation ($id: Uint!) {
      deleteIngressRule(id: $id)
    }
  `,
  {
    variables: {
      id: 0
    }
  }
)

const deleteIngressRulesWithConfirmation = (ingress_rule) => {
  if (confirm('Are you sure you want to delete this ingress rule ?')) {
    deleteIngressRule({
      id: ingress_rule.id
    })
  }
}

onIngressDeleteSuccess(() => {
  toast.success('Ingress Rule will be deleted shortly\nThis can take upto 5 minutes to reflect in the system')
  refetchIngressRules()
})

onIngressRuleDeleteFail((err) => {
  toast.error(err.message)
})

// Enable/Disable HTTPS Redirect
const {
  mutate: enableHttpsRedirectRaw,
  onDone: onEnableHttpsRedirectSuccess,
  onError: onEnableHttpsRedirectFail
} = useMutation(gql`
  mutation ($id: Uint!) {
    enableHttpsRedirectIngressRule(id: $id)
  }
`)

const enableHttpsRedirect = (ingress_rule) => {
  enableHttpsRedirectRaw({
    id: ingress_rule.id
  })
}

onEnableHttpsRedirectSuccess((res) => {
  if (res.data.enableHttpsRedirectIngressRule) {
    toast.success('Requested to enable HTTPS redirect. Refresh after few seconds')
  } else {
    toast.error('Failed to enable HTTPS redirect')
  }
})

onEnableHttpsRedirectFail((err) => {
  toast.error(err.message)
})

const {
  mutate: disableHttpsRedirectRaw,
  onDone: onDisableHttpsRedirectSuccess,
  onError: onDisableHttpsRedirectFail
} = useMutation(gql`
  mutation ($id: Uint!) {
    disableHttpsRedirectIngressRule(id: $id)
  }
`)

const disableHttpsRedirect = (ingress_rule) => {
  disableHttpsRedirectRaw({
    id: ingress_rule.id
  })
}

onDisableHttpsRedirectSuccess((res) => {
  if (res.data.disableHttpsRedirectIngressRule) {
    toast.success('Requested to disable HTTPS redirect. Refresh after few seconds')
  } else {
    toast.error('Failed to disable HTTPS redirect')
  }
})

onDisableHttpsRedirectFail((err) => {
  toast.error(err.message)
})

// Recreate ingress rule
const {
  mutate: recreateIngressRule,
  onDone: onRecreateIngressRuleSuccess,
  onError: onRecreateIngressRuleFail
} = useMutation(gql`
  mutation ($id: Uint!) {
    recreateIngressRule(id: $id)
  }
`)

const recreateIngressRuleWithConfirmation = (ingress_rule) => {
  if (confirm('Are you sure you want to recreate this ingress rule ?')) {
    recreateIngressRule({
      id: ingress_rule.id
    })
  }
}

onRecreateIngressRuleSuccess(() => {
  toast.success('Ingress Rule will be recreated shortly')
  refetchIngressRules()
})

onRecreateIngressRuleFail((err) => {
  toast.error(err.message)
})

defineExpose({
  refetchIngressRules,
  isIngressRulesLoading
})
</script>

<template>
  <!-- Table -->
  <Table>
    <template v-slot:header>
      <TableHeader align="left">ID</TableHeader>
      <TableHeader align="center">Status</TableHeader>
      <TableHeader align="center">Ingress</TableHeader>
      <TableHeader align="center">
        <font-awesome-icon icon="fa-solid fa-arrow-right" />
      </TableHeader>
      <TableHeader align="center">Target</TableHeader>
      <TableHeader align="center">Authentication</TableHeader>
      <TableHeader align="center">HTTPS Redirect</TableHeader>
      <TableHeader align="right">Actions</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="ingressRules.length === 0">
        No Ingress Rules found.<br />
        Click on the "Add New" button to create a new Ingress rule.
      </TableMessage>
    </template>
    <template v-slot:body>
      <IngressRuleRow
        v-for="ingressRule in ingressRules"
        :key="ingressRule.id"
        :ingress-rule="ingressRule"
        :disable-https-redirect="() => disableHttpsRedirect(ingressRule)"
        :enable-https-redirect="() => enableHttpsRedirect(ingressRule)"
        :delete-ingress-rule="() => deleteIngressRulesWithConfirmation(ingressRule)"
        :recreate-ingress-rule="() => recreateIngressRuleWithConfirmation(ingressRule)" />
    </template>
  </Table>
</template>

<style scoped></style>
