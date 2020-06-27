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

const getLatestRelease = async (repo) => {
  const api = `https://api.github.com/repos/${repo}/releases/latest`

  const response = await axios.get(api)

  return response.data
}

const downloadLinuxBinary = async (release) => {
  if (release && release.assets) {
    const asset = release.assets.find((item) => item.name.endsWith('linux_amd64.tar.gz'))

    if (asset) {
      console.log('Downloading asset:', asset)

      execute('mkdir -p downloads')
      execute(`wget -c ${asset.browser_download_url} -O - | tar -xvz --directory downloads`)
    } else {
      console.log('Error: could not find an matching asset')
    }
  } else {
    console.log('Error: current release does not have any assets')
  }
}

(async () => {
  try {
    const release = await getLatestRelease('kubernetes-sigs/kustomize')
    if (release) {
      let version = release.tag_name.replace('kustomize/v', '')
      version = '3.5.5'
      console.log('Latest Kustomize Verion:', version)

      console.log('Versions on Snapscraft')
      const result = execute('snap info kustomize')

      if (result.includes(version)) {
        console.log('Skipping as current version already published')
      } else {
        console.log('Publishing a new version')

        console.log('Generating new snapcraft.yaml')
        execute(`sed 's/{{version}}/${version}/' snap/snapcraft.template.yaml > snapcraft.yaml`)
        execute('cat snapcraft.yaml')

        exec('snapcraft')
      }
    } else {
      console.log('Error: could not get latest release')
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
