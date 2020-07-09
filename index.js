const axios = require('axios')
const { execSync } = require('child_process')

const execute = (command) => {
  const result = execSync(command).toString()
  console.log(result)
  return result
}

const exec = (command) => {
  return execSync(command, { stdio: 'inherit' })
}

const getReleases = async () => {
  const res = await axios.get('https://api.github.com/repos/kubernetes-sigs/kustomize/releases')

  if (res && res.data) {
    return res.data
  } else {
    const err = new Error('Unexpected response from api')
    err.response = res

    throw err
  }
}

const getLatestVersion = async () => {
  const releases = await getReleases()

  const latestRelease = releases.find((release) => release.tag_name && release.tag_name.startsWith('kustomize/v'))

  if (latestRelease) {
    return latestRelease.tag_name.replace('kustomize/v', '')
  } else {
    throw new Error('Couldn\'t find a release')
  }
}

(async () => {
  try {
    const version = '3.7.0' // await getLatestVersion()
    if (version) {
      console.log('Latest Kustomize Verion:', version)

      console.log('Versions on Snapscraft')
      const result = execute('snap info kustomize')

      if (result.includes(version)) {
        console.log('Skipping as current version already published')
      } else {
        console.log('Publishing a new version')

        console.log('Generating new snapcraft.yaml')
        execute(`sed 's/{{version}}/${version}/' snapcraft.template.yaml > snapcraft.yaml`)
        execute('cat snapcraft.yaml')

        exec('snapcraft')
        exec('snapcraft upload --release=stable *.snap')
      }
    } else {
      throw new Error('Couldn\'t find a version')
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
