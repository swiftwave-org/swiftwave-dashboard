<script setup>
import TableMessage from '@/views/components/Table/TableMessage.vue'
import TextButton from '@/views/components/TextButton.vue'
import TableHeader from '@/views/components/Table/TableHeader.vue'
import Table from '@/views/components/Table/Table.vue'
import Badge from '@/views/components/Badge.vue'
import TableRow from '@/views/components/Table/TableRow.vue'
import { useToast } from 'vue-toastification'
import { useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'
import FilledButton from '@/views/components/FilledButton.vue'

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
      <TableHeader align="center">HTTPS Redirect</TableHeader>
      <TableHeader align="center">Recreate</TableHeader>
      <TableHeader align="right">Delete</TableHeader>
    </template>
    <template v-slot:message>
      <TableMessage v-if="ingressRules.length === 0">
        No Ingress Rules found.<br />
        Click on the "Add New" button to create a new Ingress rule.
      </TableMessage>
    </template>
    <template v-slot:body>
      <tr v-for="ingressRule in ingressRules" :key="ingressRule.id">
        <TableRow align="left">
          <div class="text-sm font-medium text-gray-900">{{ ingressRule.id }}</div>
        </TableRow>
        <TableRow align="center">
          <Badge v-if="ingressRule.status === 'pending'" type="warning">Pending</Badge>
          <Badge v-else-if="ingressRule.status === 'applied'" type="success">Applied</Badge>
          <Badge v-else-if="ingressRule.status === 'failed'" type="danger">Failed</Badge>
          <Badge v-else-if="ingressRule.status === 'deleting'" type="danger">Deleting</Badge>
        </TableRow>
        <TableRow align="center">
          <div class="text-sm text-gray-900">
            <a
              v-if="ingressRule.protocol === 'http' || ingressRule.protocol === 'https'"
              :href="ingressRule.protocol + '://' + ingressRule.domain.name + ':' + ingressRule.port.toString()"
              target="_blank"
              >{{ ingressRule.protocol }}://{{ ingressRule.domain.name }}:{{ ingressRule.port }}</a
            >
            <a v-else-if="ingressRule.protocol === 'tcp'" href="javascript:void(0);"
              >tcp://&lt;proxy-server-ip&gt;:{{ ingressRule.port }}</a
            >
            <a v-else-if="ingressRule.protocol === 'udp'" href="javascript:void(0);"
              >udp://&lt;proxy-server-ip&gt;:{{ ingressRule.port }}</a
            >
            <a v-else href="javascript:void(0);"><i>Unknown</i></a>
          </div>
        </TableRow>
        <TableRow align="center">
          <font-awesome-icon icon="fa-solid fa-arrow-right" />
        </TableRow>
        <TableRow align="center">
          <div class="text-sm text-gray-900">
            <Badge v-if="ingressRule.targetType === 'externalService'" type="warning">External Service</Badge>
            <Badge v-else-if="ingressRule.targetType === 'application'" type="success">Application</Badge>
            &nbsp;&nbsp;
            <a v-if="ingressRule.targetType === 'application'" href="javascript:void(0);"
              >{{ ingressRule.application.name }}:{{ ingressRule.targetPort }}</a
            >
            <a v-else href="javascript:void(0);">{{ ingressRule.externalService }}:{{ ingressRule.targetPort }}</a>
          </div>
        </TableRow>
        <TableRow align="center" flex v-if="ingressRule.protocol === 'https'">
          <FilledButton
            slim
            type="danger"
            v-if="ingressRule.httpsRedirect"
            :click="() => disableHttpsRedirect(ingressRule)"
            >Disable HTTPS Redirect
          </FilledButton>
          <FilledButton slim type="success" v-else :click="() => enableHttpsRedirect(ingressRule)"
            >Enable HTTPS Redirect
          </FilledButton>
        </TableRow>
        <TableRow align="center" v-else>
          <p class="text-sm font-medium italic text-gray-900">N/A</p>
        </TableRow>
        <TableRow align="center">
          <FilledButton slim :click="() => recreateIngressRuleWithConfirmation(ingressRule)" type="primary"
            >Recreate
          </FilledButton>
        </TableRow>
        <TableRow align="right">
          <TextButton :click="() => deleteIngressRulesWithConfirmation(ingressRule)" type="danger">Delete</TextButton>
        </TableRow>
      </tr>
    </template>
  </Table>
</template>

<style scoped></style>
