import moment from 'moment'

const cleanupGitRepoUrl = (gitRepoUrl) => {
  if (gitRepoUrl.endsWith('.git')) {
    gitRepoUrl = gitRepoUrl.slice(0, -4)
  }
  gitRepoUrl = gitRepoUrl.replace('https://', '')
  gitRepoUrl = gitRepoUrl.replace('http://', '')
  if (gitRepoUrl.endsWith('/')) {
    gitRepoUrl = gitRepoUrl.slice(0, -1)
  }
  return gitRepoUrl
}

const getGitProvideFromGitRepoUrl = (gitRepoUrl) => {
  gitRepoUrl = cleanupGitRepoUrl(gitRepoUrl)
  if (gitRepoUrl.includes('github')) {
    return 'github'
  } else if (gitRepoUrl.includes('gitlab')) {
    return 'gitlab'
  } else {
    return null
  }
}

const getGitRepoOwnerFromGitRepoUrl = (gitRepoUrl) => {
  gitRepoUrl = cleanupGitRepoUrl(gitRepoUrl)
  const gitRepoUrlParts = gitRepoUrl.split('/')
  if (gitRepoUrlParts.length < 2) {
    return null
  }
  return gitRepoUrlParts[gitRepoUrlParts.length - 2]
}

const getGitRepoNameFromGitRepoUrl = (gitRepoUrl) => {
  gitRepoUrl = cleanupGitRepoUrl(gitRepoUrl)
  const gitRepoUrlParts = gitRepoUrl.split('/')
  if (gitRepoUrlParts.length < 2) {
    return null
  }
  return gitRepoUrlParts[gitRepoUrlParts.length - 1]
}

const getGraphQlHttpBaseUrl = () => {
  if (import.meta.env.VITE_GRAPHQL_HTTP_BASE_URL) {
    return import.meta.env.VITE_GRAPHQL_HTTP_BASE_URL
  }
  return window.location.origin
}

const getGraphQlWsBaseUrl = () => {
  if (import.meta.env.VITE_GRAPHQL_WS_BASE_URL) {
    return import.meta.env.VITE_GRAPHQL_WS_BASE_URL
  }
  let protocol = 'ws'
  if (window.location.protocol === 'https:') {
    protocol = 'wss'
  }
  return `${protocol}://${window.location.host}`
}

const getHttpBaseUrl = () => {
  if (import.meta.env.VITE_HTTP_BASE_URL) {
    return import.meta.env.VITE_HTTP_BASE_URL
  }
  return window.location.origin
}

const preventSpaceInput = (event) => {
  if (event.keyCode === 32 || event.keyCode === 9 || event.keyCode === 13) {
    event.preventDefault()
  }
}

function humanizeMemoryGB(value) {
  /**
   * Convert a float value representing gigabytes (GB) to a human-readable format.
   * If the value is less than 1, it returns the value in megabytes (MB).
   * Otherwise, it returns the value in gigabytes (GB).
   */
  if (value < 1) {
    const mbValue = value * 1024
    return `${mbValue.toFixed(2)} MB`
  } else {
    return `${value.toFixed(2)} GB`
  }
}

function humanizeMemoryMB(value) {
  /**
   * Convert a float value representing megabytes (MB) to a human-readable format.
   * If the value is less than 1, it returns the value in kilobytes (KB).
   * If the value is greater than 1024, it returns the value in gigabytes (GB).
   * Otherwise, it returns the value in megabytes (MB).
   */
  if (value < 1) {
    const kbValue = value * 1024
    return `${kbValue.toFixed(2)} KB`
  } else {
    if (value > 1024) {
      const gbValue = value / 1024
      return `${gbValue.toFixed(2)} GB`
    } else {
      return `${value.toFixed(2)} MB`
    }
  }
}

function humanizeDiskGB(value) {
  /**
   * Convert a float value representing gigabytes (GB) to a human-readable format.
   * If the value is less than 1, it returns the value in megabytes (MB).
   * Otherwise, it returns the value in gigabytes (GB).
   */
  if (value < 1) {
    const mbValue = value * 1024
    return `${mbValue.toFixed(2)} MB`
  } else {
    return `${value.toFixed(2)} GB`
  }
}

function humanizeNetworkSpeed(kbps) {
  /**
   * Convert a float value representing network speed in kilobits per second (kbps)
   * to a human-readable format (kbps, Mbps, or Gbps).
   */
  if (kbps < 1000) {
    return `${kbps.toFixed(2)} kbps`
  } else if (kbps < 1000000) {
    const mbps = kbps / 1000
    return `${mbps.toFixed(2)} Mbps`
  } else {
    const gbps = kbps / 1000000
    return `${gbps.toFixed(2)} Gbps`
  }
}

function formatTimestampHumannize(timestamp) {
  /**
   * Convert a timestamp to a human-readable date and time string.
   */
  return moment(new Date(timestamp)).format('Do MMMM YYYY - h:mm:ss a')
}

const maxColorSamples = 4

function getRandomBackgroundAndBorderColourClass(indexProvided = null) {
  // bg-color-<index>
  let index
  if (indexProvided === null) {
    index = Math.floor(Math.random() * (maxColorSamples - 1)) + 1
  } else {
    index = (indexProvided % maxColorSamples) + 1
  }
  return [`bg-color-${index}`, `border-color-${index}`]
}

export {
  getGitProvideFromGitRepoUrl,
  getGitRepoOwnerFromGitRepoUrl,
  getGitRepoNameFromGitRepoUrl,
  getGraphQlHttpBaseUrl,
  getGraphQlWsBaseUrl,
  getHttpBaseUrl,
  preventSpaceInput,
  humanizeMemoryMB,
  humanizeMemoryGB,
  humanizeNetworkSpeed,
  humanizeDiskGB,
  formatTimestampHumannize,
  getRandomBackgroundAndBorderColourClass
}
