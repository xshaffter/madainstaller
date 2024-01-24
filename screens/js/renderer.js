const $ = selector => document.querySelector(selector)

const installBtn = $('#install-btn')
const modpackList = $('#modpack-list')
const progressBar = $('#progress-bar')
const progressSection = $('.progress-section')
const progressText = $('#progress-text')

let responseData = {};

const MOD_PACKS_URL = 'https://ubz56eqtqgxajh3ngmjcrdti3u0puzim.lambda-url.us-east-1.on.aws/'
const MOD_PACK_DETAIL_URL = 'https://bi4fw5o4tmimmhknj2aow3whhm0tswhq.lambda-url.us-east-1.on.aws/'

function clear(element) {
  let child = element.lastElementChild;
  while (child) {
    element.removeChild(child);
    child = element.lastElementChild;
  }
}


function loadMods () {

  fetch(MOD_PACK_DETAIL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "mod_pack": modpackList.value
    })
  }).then(text => text.json()).then(json_response => {
    responseData = json_response;
    installBtn.removeAttribute('disabled')
  })
}

fetch(MOD_PACKS_URL).then(text => text.json()).then(json_response => {
  clear(modpackList)
  for (let modpack of json_response) {
    let option = document.createElement("option");
    option.text = modpack.replace("_", " ");
    option.value = modpack;
    modpackList.appendChild(option);
  }
  loadMods()
})

modpackList.addEventListener('change', () => {
  installBtn.setAttribute('disabled', 'disabled')
  loadMods()
})

setTimeout(() => {
  functions.updateProgress(progressBar, progressText);
}, 20)

function installWrapper() {
  progressSection.style = null
  functions.downloadMods(responseData);
  functions.forceProgress0(progressBar, progressText);
}