import moment from 'moment'

const getGitProvideFromGitRepoUrl = (gitRepoUrl) => {
  if (gitRepoUrl.includes('github')) {
    return 'github'
  } else if (gitRepoUrl.includes('gitlab')) {
    return 'gitlab'
  } else {
    return null
  }
}

const getGitRepoOwnerFromGitRepoUrl = (gitRepoUrl) => {
  const gitRepoUrlParts = gitRepoUrl.split('/')
  if (gitRepoUrlParts.length < 2) {
    return null
  }
  return gitRepoUrlParts[gitRepoUrlParts.length - 2]
}

const getGitRepoNameFromGitRepoUrl = (gitRepoUrl) => {
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

export {
  getGitProvideFromGitRepoUrl,
  getGitRepoOwnerFromGitRepoUrl,
  getGitRepoNameFromGitRepoUrl,
  getGraphQlHttpBaseUrl,
  getGraphQlWsBaseUrl,
  getHttpBaseUrl,
  preventSpaceInput,
  humanizeMemoryGB,
  humanizeNetworkSpeed,
  humanizeDiskGB,
  formatTimestampHumannize
}
