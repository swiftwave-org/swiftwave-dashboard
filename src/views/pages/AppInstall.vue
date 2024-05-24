<!--suppress ALL -->
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, reactive, ref, shallowRef, toRaw } from 'vue'
import { parse } from 'yaml'
import { useToast } from 'vue-toastification'
import DotLoader from '@/views/components/DotLoader.vue'
import MarkdownRenderer from '@/views/components/MarkdownRenderer.vue'
import FilledButton from '@/views/components/FilledButton.vue'
import ModalDialog from '@/views/components/ModalDialog.vue'
import PersistentVolumeSelector from '@/views/partials/PersistentVolumeSelector.vue'
import { useLazyQuery, useMutation, useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { preventSpaceInput } from '@/vendor/utils.js'
import Divider from '@/views/components/Divider.vue'
import CreateDomainModal from '@/views/partials/CreateDomainModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const stackUrl = route.query.stack
const stackDetailsYamlString = shallowRef('')
const stackDetails = ref(null)
const isLoadingStack = ref(true)
const isInstallNowModalOpen = ref(false)
const formStateRef = reactive({
  STACK_NAME: ''
}) // will be filled with stack values
const isAllIngressRulesCreationAttempted = ref(false)
const suggestedIngressRules = reactive({})
/*
{
  "${STACK_NAME}_app": {
    "5000/http" : {
     "description": "HTTP port for the application",
     "ignored": false,
     "info": {
        "protocol": "http",
        "availableProtocols": ["http"],
        "port": 443,
        "allowPortSelection": false,
        "domainId": 1,
        "status": "pending", // pending, created, failed
     }
  }
}
*/
const ignoredIngressRules = computed(() => {
  let rulesMap = {}
  for (let app in suggestedIngressRules) {
    let ingressRules = {}
    for (let ingressRuleName of Object.keys(suggestedIngressRules[app])) {
      if (suggestedIngressRules[app][ingressRuleName].ignored) {
        ingressRules[ingressRuleName] = suggestedIngressRules[app][ingressRuleName]
      }
    }
    if (Object.keys(ingressRules).length !== 0) {
      rulesMap[app] = ingressRules
    }
  }
  return rulesMap
})
const configuredIngressRules = computed(() => {
  let rulesMap = {}
  for (let app in suggestedIngressRules) {
    let ingressRules = {}
    for (let ingressRuleName of Object.keys(suggestedIngressRules[app])) {
      if (!suggestedIngressRules[app][ingressRuleName].ignored) {
        ingressRules[ingressRuleName] = suggestedIngressRules[app][ingressRuleName]
      }
    }
    if (Object.keys(ingressRules).length !== 0) {
      rulesMap[app] = ingressRules
    }
  }
  return rulesMap
})
const ignoreIngressRule = (app, ingressRuleName) => {
  suggestedIngressRules[app][ingressRuleName].ignored = true
}
const configureIngressRule = (app, ingressRuleName) => {
  suggestedIngressRules[app][ingressRuleName].ignored = false
}
const ingressRuleMutations = ref([])
const ingressRuleMutationAppIngressList = ref([])
const ingressRuleMutationIndex = ref(0)

const {
  mutate: createIngressRuleRaw,
  onDone: onIngressRuleCreateSuccess,
  onError: onIngressRuleCreateFail
} = useMutation(gql`
  mutation ($input: IngressRuleInput!) {
    createIngressRule(input: $input) {
      id
    }
  }
`)

const createIngressRule = (index) => {
  if (index >= ingressRuleMutationAppIngressList.value.length) {
    isAllIngressRulesCreationAttempted.value = true
    return
  }
  createIngressRuleRaw(ingressRuleMutations.value[index])
}

onIngressRuleCreateSuccess(() => {
  const record = ingressRuleMutationAppIngressList.value[ingressRuleMutationIndex.value]
  suggestedIngressRules[record[0]][record[1]].info.status = 'success'
  ingressRuleMutationIndex.value++
  createIngressRule(ingressRuleMutationIndex.value)
})

onIngressRuleCreateFail((err) => {
  const record = ingressRuleMutationAppIngressList.value[ingressRuleMutationIndex.value]
  suggestedIngressRules[record[0]][record[1]].info.status = 'failed'
  ingressRuleMutationIndex.value++
  createIngressRule(ingressRuleMutationIndex.value)
})

const createIngressRules = async () => {
  if (!deployedApplicationsResult.value) return
  let appNameIDMap = {}
  let deployedApplicationsResultValue = deployedApplicationsResult.value
  for (const i in deployedApplicationsResultValue) {
    appNameIDMap[deployedApplicationsResultValue[i].application.name] =
      deployedApplicationsResultValue[i].application.id
  }
  // create ingress rules
  let configuredIngressRulesValue = configuredIngressRules.value
  if (configuredIngressRulesValue.length === 0) return
  for (const app in configuredIngressRulesValue) {
    for (const ingressRuleName in configuredIngressRulesValue[app]) {
      ingressRuleMutations.value.push({
        input: {
          targetType: 'application',
          protocol: configuredIngressRulesValue[app][ingressRuleName].info.protocol,
          domainId:
            configuredIngressRulesValue[app][ingressRuleName].info.domainId == 0
              ? null
              : configuredIngressRulesValue[app][ingressRuleName].info.domainId,
          port: configuredIngressRulesValue[app][ingressRuleName].info.port,
          targetPort: ingressRuleName.split('/')[0],
          applicationId: appNameIDMap[replaceStackName(app, formStateRef.STACK_NAME)],
          externalService: ''
        }
      })
      ingressRuleMutationAppIngressList.value.push([app, ingressRuleName])
    }
  }
  createIngressRule(0)
}

const deployedApplicationsResult = ref(null)

onMounted(() => {
  if (!stackUrl) {
    router.push({ name: 'App Store' })
  }
  fetchStackDetails()
})

const fetchStackDetails = async () => {
  if (!stackUrl) return
  fetch(stackUrl.toString())
    .then((response) => response.text())
    .then((data) => {
      stackDetailsYamlString.value = data
      stackDetails.value = parse(data)
      if ('services' in stackDetails.value && 'docs' in stackDetails.value) {
        // check if `iframe_video_embed` have any `<script` tag
        if (stackDetails.value.docs.iframe_video_embed.includes('<script')) {
          throw new Error('Invalid stack file')
        }
        setupSystem()
      } else {
        throw new Error('Invalid stack file')
      }
    })
    .catch((error) => {
      console.error(error)
      toast.error('Invalid stack file')
      router.push({ name: 'App Store' })
    })
}

const setupSystem = () => {
  let variables = stackDetails.value?.docs?.variables ?? {}
  formStateRef.STACK_NAME = ''
  for (const [key, value] of Object.entries(variables)) {
    formStateRef[key] = value.default
  }
  for (const [serviceName, serviceConfig] of Object.entries(stackDetails.value?.services ?? {})) {
    if ('expose' in serviceConfig) {
      const ingressRules = serviceConfig.expose ?? []
      let rulesMap = {}
      for (const ingressRule of ingressRules) {
        let splitted = ingressRule.split('/')
        if (splitted.length !== 3) {
          continue
        }
        const port = splitted[0]
        const protocol = splitted[1]
        rulesMap[`${port}/${protocol}`] = {
          description: splitted[2],
          ignored: false,
          info: {
            protocol: protocol,
            availableProtocols: protocol === 'http' ? ['http', 'https'] : [protocol],
            port: protocol === 'http' ? 80 : port,
            allowPortSelection: true,
            domainId: 0,
            exists: false,
            status: 'pending'
          }
        }
      }
      suggestedIngressRules[serviceName] = rulesMap
    }
  }
  isLoadingStack.value = false
}

const isFormFilled = computed(() => {
  let variables = toRaw(formStateRef)
  for (const [key, value] of Object.entries(variables)) {
    if (!formStateRef[key]) {
      return false
    }
  }
  for (const app in suggestedIngressRules) {
    for (const ingressRuleName in suggestedIngressRules[app]) {
      if (!suggestedIngressRules[app][ingressRuleName].ignored) {
        if (
          (suggestedIngressRules[app][ingressRuleName].info.protocol === 'http' ||
            suggestedIngressRules[app][ingressRuleName].info.protocol === 'https') &&
          (suggestedIngressRules[app][ingressRuleName].info.domainId == 0 ||
            suggestedIngressRules[app][ingressRuleName].info.domainId === undefined ||
            suggestedIngressRules[app][ingressRuleName].info.domainId === null ||
            suggestedIngressRules[app][ingressRuleName].info.domainId === '')
        ) {
          return false
        }
      }
    }
  }
  return true
})
const replaceStackName = (originalName, stackName) => originalName.replace('{{STACK_NAME}}', stackName)

const openInstallNowModal = () => {
  isInstallNowModalOpen.value = true
}

const closeModal = () => {
  if (confirm('Are you sure you want to cancel?')) {
    isInstallNowModalOpen.value = false
    setupSystem()
  }
}

const {
  mutate: deployStack,
  loading: deployStackLoading,
  onDone: onDeployStackDone,
  onError: onDeployStackError
} = useMutation(gql`
  mutation DeployStack($input: StackInput!) {
    deployStack(input: $input) {
      success
      message
      application {
        id
        name
      }
    }
  }
`)

onDeployStackDone((res) => {
  if (!res?.data?.deployStack) return
  deployedApplicationsResult.value = res?.data?.deployStack ?? []
  isInstallNowModalOpen.value = false
  isResultModalOpen.value = true
  createIngressRules()
})

onDeployStackError((err) => {
  toast.error(err.message)
})

const deployStackHelper = async () => {
  // verify ingress rules
  const isValid = await validateIngressRules()
  if (!isValid) {
    toast.error('Please fix the ingress rules before deploying')
    return
  }
  let variablesForSubmission = []
  const stateRef = toRaw(formStateRef)
  for (const [key, value] of Object.entries(stateRef)) {
    variablesForSubmission.push({
      name: key,
      value: stateRef[key]
    })
  }
  deployStack({
    input: {
      content: stackDetailsYamlString.value,
      variables: variablesForSubmission
    }
  })
}

// Domain list
const {
  result: domainListResult,
  refetch: refetchDomainList,
  onError: onDomainListError
} = useQuery(
  gql`
    query {
      domains {
        id
        name
      }
    }
  `,
  null,
  {
    pollInterval: 10000
  }
)

onDomainListError((err) => {
  toast.error(err.message)
})

const domainList = computed(() => domainListResult.value?.domains ?? [])
const getDomainName = (domainId) => {
  for (const domain of domainList.value) {
    if (domain.id === domainId) {
      return domain.name
    }
  }
  return ''
}
const createDomainModalRef = ref(null)
const openNewDomainModal = () => {
  if (!createDomainModalRef.value?.openModal) return
  isInstallNowModalOpen.value = false
  createDomainModalRef.value.openModal()
}

const { load: validateIngressRulesRaw, refetch: refetchValidateIngressRules } = useLazyQuery(
  gql`
    query ($input: IngressRuleValidationInput!) {
      isNewIngressRuleValid(input: $input)
    }
  `,
  {},
  {
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
    initialFetchPolicy: 'no-cache',
    keepPreviousResult: false,
    enabled: true
  }
)

function validateIngressRulesQuery(val) {
  return validateIngressRulesRaw(null, val, null) || refetchValidateIngressRules(val)
}

const validateIngressRules = async () => {
  let isValidRules = true
  for (const app in suggestedIngressRules) {
    const rules = suggestedIngressRules[app]
    for (const ingressRuleName in rules) {
      if (!rules[ingressRuleName].ignored) {
        let isValid = true
        try {
          const res = await validateIngressRulesQuery({
            input: {
              domainId: rules[ingressRuleName].info.domainId == 0 ? null : rules[ingressRuleName].info.domainId,
              protocol: rules[ingressRuleName].info.protocol,
              port: rules[ingressRuleName].info.port
            }
          })
          if (res.isNewIngressRuleValid || res.data.isNewIngressRuleValid) {
            isValid = true
          } else {
            isValid = false
          }
        } catch (e) {
          console.log(e.message)
          isValid = false
        }
        isValidRules = isValidRules && isValid
        suggestedIngressRules[app][ingressRuleName].info.exists = !isValid
      }
    }
  }
  return isValidRules
}

const onChangeProtocol = (app, ingressRuleName) => {
  if (suggestedIngressRules[app][ingressRuleName].info.protocol === 'http') {
    suggestedIngressRules[app][ingressRuleName].info.port = 80
    suggestedIngressRules[app][ingressRuleName].info.allowPortSelection = true
  } else if (suggestedIngressRules[app][ingressRuleName].info.protocol === 'https') {
    suggestedIngressRules[app][ingressRuleName].info.port = 443
    suggestedIngressRules[app][ingressRuleName].info.allowPortSelection = false
  } else {
    suggestedIngressRules[app][ingressRuleName].info.allowPortSelection = true
  }
}

// Result modal
const isResultModalOpen = ref(false)
const closeResultModal = () => {
  isResultModalOpen.value = false
  setupSystem()
}

const openUrlInNewPage = (url) => {
  window.open(url)
}
</script>

<template>
  <div v-if="isLoadingStack" class="flex h-full w-full items-center justify-center">
    <DotLoader />
  </div>
  <section v-else class="relative mx-auto mt-2 flex h-full w-full max-w-7xl flex-col items-center overflow-hidden">
    <div class="scrollbox h-full w-full overflow-y-auto">
      <!--  Header  -->
      <div class="flex w-full flex-row gap-5">
        <!--      Logo -->
        <div class="h-14 w-14 rounded-md border border-primary-500 p-1.5">
          <img :src="stackDetails.docs.logo_url" class="h-full w-full" :alt="stackDetails.docs.name" />
        </div>
        <!--    Title and description    -->
        <div>
          <p class="text-xl font-semibold">{{ stackDetails.docs.name }}</p>
          <p class="text-gray-800">{{ stackDetails.docs.description }}</p>
        </div>
      </div>
      <!--  Iframe Video  -->
      <div
        class="mt-12"
        v-if="stackDetails.docs.iframe_video_embed"
        v-html="stackDetails.docs.iframe_video_embed"></div>
      <!--  Readme description  -->
      <div class="mt-12 w-full" v-if="stackDetails.docs.readme_description">
        <MarkdownRenderer :source="stackDetails.docs.readme_description" />
      </div>
      <div v-else class="mt-12 w-full">
        <p class="italic text-gray-800">No details available</p>
      </div>
    </div>
    <!--  Installation Options  -->
    <div class="absolute bottom-0 right-0">
      <div class="flex flex-row items-center justify-center gap-2 pr-20">
        <p class="font-semibold text-secondary-700">Looking for installation ?</p>
        <FilledButton type="primary" :click="openInstallNowModal"> Install Now</FilledButton>
      </div>
    </div>
  </section>
  <!-- New domain modal  -->
  <CreateDomainModal
    ref="createDomainModalRef"
    :callback-on-create="refetchDomainList"
    :callback-on-pop="openInstallNowModal" />
  <!--  Modal to create -->
  <ModalDialog
    :is-open="isInstallNowModalOpen && !isLoadingStack"
    non-cancelable
    :width="Object.keys(suggestedIngressRules).length !== 0 ? '6xl' : 'lg'">
    <template v-slot:header>Install {{ stackDetails.docs.name }}</template>
    <template v-slot:body>
      Fill all the required information
      <!--  App info    -->
      <div class="mt-4 flex w-full flex-row gap-8">
        <div class="flex w-full flex-col gap-2">
          <div>
            <label class="block text-base font-medium text-gray-700">
              <p>Application Name <span class="text-red-600"> *</span></p>
              <p class="text-sm font-normal">Provide a name for your application</p>
            </label>
            <div class="mt-1">
              <input
                v-model="formStateRef.STACK_NAME"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                type="text"
                @keydown="preventSpaceInput"
                placeholder="Anything you like..." />
            </div>
          </div>
          <div v-for="key in Object.keys(stackDetails.docs.variables)">
            <label class="block text-base font-medium text-gray-700">
              <p>{{ stackDetails.docs.variables[key].title }} <span class="text-red-600"> *</span></p>
              <p class="text-sm font-normal">{{ stackDetails.docs.variables[key].description }}</p>
            </label>
            <div class="mt-1">
              <input
                v-if="stackDetails.docs.variables[key].type === 'text'"
                v-model="formStateRef[key]"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                type="text" />
              <select
                v-if="stackDetails.docs.variables[key].type === 'options'"
                v-model="formStateRef[key]"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                <option v-for="op in stackDetails.docs.variables[key].options" :key="op.value" :value="op.value">
                  {{ op.title }}
                </option>
              </select>
              <PersistentVolumeSelector
                v-if="stackDetails.docs.variables[key].type === 'volume'"
                :on-select="(volume) => (formStateRef[key] = volume)"
                selector="name"
                show-create-link />
            </div>
          </div>
        </div>
        <!--    Ingress rule configuration    -->
        <div class="flex w-full flex-col gap-1" v-show="Object.keys(suggestedIngressRules).length !== 0">
          <p class="text-base font-bold" v-show="Object.keys(configuredIngressRules).length !== 0">
            Configure Ingress rules
          </p>
          <p class="flex items-center text-sm">
            Need to add a domain ?
            <a @click="openNewDomainModal" class="ml-1.5 cursor-pointer font-bold text-primary-600"
              >Click here to register domain</a
            >
          </p>
          <div
            v-for="(ingressRules, serviceName) in configuredIngressRules"
            :key="serviceName"
            class="flex flex-col gap-3">
            <div>
              <p class="text-base font-medium">{{ replaceStackName(serviceName, formStateRef.STACK_NAME) }}</p>
              <div class="mt-2 flex w-full flex-col gap-3">
                <div
                  class="flex flex-row justify-between"
                  v-for="(config, ingressRuleName) in ingressRules"
                  :key="ingressRuleName">
                  <div class="flex w-full flex-col">
                    <p
                      class="text-sm font-medium"
                      :class="{
                        'text-gray-700': !config.info.exists,
                        'text-red-600': config.info.exists
                      }">
                      {{ config.description }}
                    </p>
                    <div class="mt-2 flex flex-row items-center gap-2">
                      <!--   Choose protocol   -->
                      <select
                        class="block w-5/12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        v-model="config.info.protocol"
                        @change="() => onChangeProtocol(serviceName, ingressRuleName)">
                        <option :value="protocol" v-for="protocol in config.info.availableProtocols">
                          {{ protocol.toUpperCase() }}
                        </option>
                      </select>
                      <!--  Domain name   -->
                      <select
                        v-if="config.info.protocol === 'http' || config.info.protocol === 'https'"
                        v-model="config.info.domainId"
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                        <option value="0">Select a domain</option>
                        <option :value="domain.id" v-for="domain in domainList">
                          {{ domain.name }}
                        </option>
                      </select>
                      <div v-else class="block w-full text-end text-sm italic">Use proxy IP with port</div>
                      <!--   Port -->
                      <input
                        v-model="config.info.port"
                        class="block w-5/12 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Port"
                        type="number"
                        :readonly="!config.info.allowPortSelection" />
                      <!--  Arrow  -->
                      <font-awesome-icon icon="fa-solid fa-arrow-right" />
                      <!--  Info  -->
                      <p class="text-nowrap">{{ ingressRuleName }}</p>
                      <!--  Ignore button  -->
                      <FilledButton
                        type="danger"
                        class="ml-2 aspect-square"
                        :click="() => ignoreIngressRule(serviceName, ingressRuleName)">
                        <font-awesome-icon icon="fa-solid fa-xmark" class="text-lg" />
                      </FilledButton>
                    </div>
                    <p class="text-sm text-red-600" v-if="config.info.exists">
                      Ingress rule already exists, please choose different domain or port.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!--  Divider  -->
          <divider
            v-show="
              Object.keys(ignoredIngressRules).length !== 0 && Object.keys(configuredIngressRules).length !== 0
            " />
          <!--      Ignored Ingress Rules    -->
          <p class="text-base font-bold" v-show="Object.keys(ignoredIngressRules).length !== 0">
            Ignored Ingress Rules
          </p>
          <div v-for="(ingressRules, serviceName) in ignoredIngressRules" :key="serviceName">
            <p class="text-base font-medium">{{ replaceStackName(serviceName, formStateRef.STACK_NAME) }}</p>
            <div class="mt-2 flex w-full flex-col gap-2">
              <div
                class="flex flex-row justify-between"
                v-for="(config, ingressRuleName) in ingressRules"
                :key="ingressRuleName">
                <div>
                  <p class="text-base font-medium">{{ ingressRuleName }}</p>
                  <p class="w-full text-sm font-normal">{{ config.description }}</p>
                </div>
                <FilledButton
                  type="success"
                  class="aspect-square"
                  :click="() => configureIngressRule(serviceName, ingressRuleName)">
                  <font-awesome-icon icon="fa-solid fa-plus" class="text-lg" />
                </FilledButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-slot:footer>
      <div class="mt-4 flex w-full flex-row justify-between gap-2">
        <FilledButton type="danger" :click="closeModal" :disabled="deployStackLoading"
          >Cancel Installation
        </FilledButton>
        <FilledButton type="primary" :loading="deployStackLoading" :disabled="!isFormFilled" :click="deployStackHelper"
          >Install Now
        </FilledButton>
      </div>
    </template>
  </ModalDialog>

  <!--  Modal to show result    -->
  <ModalDialog :is-open="isResultModalOpen" :close-modal="closeResultModal" width="2xl">
    <template v-slot:header>🎉 Deployed Successfully</template>
    <template v-slot:body>
      <div class="flex flex-col space-y-3 pt-3">
        <div
          class="flex items-center space-x-2"
          v-for="result in deployedApplicationsResult"
          :key="result.application.id">
          <font-awesome-icon v-if="result.success" icon="fa-solid fa-circle-check" class="text-base text-success-500" />
          <font-awesome-icon v-else icon="fa-solid fa-circle-xmark" class="text-base text-danger-500" />
          <p>
            {{ result.application?.name ?? 'N/A' }}
            <span v-if="result.message !== '' && !result.success"> - {{ result.message }}</span>
          </p>
          <FilledButton
            v-if="result.success"
            type="primary"
            slim
            :click="
              () =>
                openUrlInNewPage(
                  $router.resolve({
                    name: 'Application Details Deployments',
                    params: { id: result.application.id }
                  }).href
                )
            ">
            View
          </FilledButton>
        </div>
        <div v-if="deployedApplicationsResult.length === 0" class="text-center text-gray-500">
          No applications deployed
        </div>

        <div class="flex items-center gap-2">
          <div
            v-for="(ingressRules, serviceName) in configuredIngressRules"
            :key="serviceName"
            class="flex w-full flex-col gap-2">
            <div
              v-for="(config, ingressRuleName) in ingressRules"
              :key="ingressRuleName"
              class="o flex w-full flex-row items-center gap-2">
              <font-awesome-icon
                v-if="config.info.status === 'pending'"
                icon="fa-solid fa-circle-notch"
                class="animate-spin text-base text-warning-500" />
              <font-awesome-icon
                v-else-if="config.info.status === 'success'"
                icon="fa-solid fa-circle-check"
                class="text-base text-success-500" />
              <font-awesome-icon
                v-else-if="config.info.status === 'failed'"
                icon="fa-solid fa-circle-xmark"
                class="text-base text-danger-500" />
              <p>
                {{ config.info.protocol }}://{{
                  config.info.protocol === 'http' || config.info.protocol === 'https'
                    ? getDomainName(config.info.domainId)
                    : 'server_ip'
                }}:{{ config.info.port }}
                <font-awesome-icon icon="fa-solid fa-arrow-right" class="px-2" />
                {{ replaceStackName(serviceName, formStateRef.STACK_NAME) }}:{{ ingressRuleName }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-slot:footer>
      <FilledButton
        type="warning"
        class="w-full"
        :click="() => $router.replace('/applications')"
        :disabled="!isAllIngressRulesCreationAttempted"
        >Go to Applications List
      </FilledButton>
    </template>
  </ModalDialog>
</template>

<style scoped></style>
