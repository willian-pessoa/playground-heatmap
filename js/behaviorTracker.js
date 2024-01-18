const GLOBAL_MOUSE_DATA = {}

const getSiblingIndex = (element) => {
  if (!element || !element.parentElement?.children) return 0

  let siblingIndex = 0


  for (let item of element.parentElement.children) {
    if (item.__heatmap_node_map_id__ === element.__heatmap_node_map_id__) {
      return siblingIndex
    }

    siblingIndex++
  }

  return siblingIndex
}

const getNodeName = (element) => {
  if (!element) return

  let nodeName = element.nodeName.toLowerCase()
  let siblingIndex = getSiblingIndex(element)

  return !siblingIndex ? nodeName : `${nodeName}[${siblingIndex + 1}]`
}

const getParentsElements = (element) => {
  if (!element) return

  if (element.parentElement.nodeName === "BODY") {
    return "body"
  }

  if (element.parentElement) {
    let parentNodeName = " > " + getNodeName(element.parentElement)

    return getParentsElements(element.parentElement) + parentNodeName
  } else {
    return " > "
  }
}

const getElementCssSelector = (element) => {
  if (!element) return

  let idCssSelector = ""

  let nodeName = getNodeName(element)
  let parents = getParentsElements(element)

  idCssSelector = parents + " > " + nodeName

  return idCssSelector
}

const trackMouse = () => {
  const mouseTrack = {
    user: "Teste",
    pageUrl: window.location.href,
    windowsSize: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
    startRecordAt: Date.now(),
  }

  const data = []

  // Envia as coordenadas X / Y, Timestamp e tipo de evento
  const pushEventData = (event) => {
    const { type } = event
    if (type === "click") {
      const seletor = event
      console.log(seletor)
      data.push({
        time: Date.now(),
      });
    }

    event.stopPropagation()
  };

  const body = document.querySelector("body");
  const elements = body.querySelectorAll("*");

  let countId = 1

  elements.forEach((element) => {
    element.addEventListener("click", pushEventData)
    element["__heatmap_node_map_id__"] = countId

    GLOBAL_MOUSE_DATA[countId] = {
      idCssSelector: getElementCssSelector(element),
      clicks: 0,
      data: [],
    }

    countId++
  });

  mouseTrack.data = data

  return mouseTrack
};

const plotClicks = (cordinates) => {
  let TotalX = document.body.scrollWidth
  let TotalY = document.body.scrollHeight

  cordinates.forEach(cord => {
    const dot = document.createElement("div")

    const x = TotalX * cord.posX / 100
    const y = TotalY * cord.posY / 100

    dot.className = "dot"
    dot.style.position = "absolute"
    dot.style.width = "10px"
    dot.style.height = "10px"
    dot.style.borderRadius = "50%"
    dot.style.backgroundColor = "yellow"
    dot.style.border = "1px solid black"
    dot.style.top = y + "px"
    dot.style.left = x + "px"

    document.body.appendChild(dot)
  })
}

const mouseData = trackMouse()